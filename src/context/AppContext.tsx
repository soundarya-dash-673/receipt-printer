import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import {AppState, AppStateStatus} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {uuidv4} from '../utils/uuid';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  createdAt: string;
  restaurantName: string;
  note?: string;
}

export interface Settings {
  restaurantName: string;
  taxRate: number; // percentage e.g. 8.5 means 8.5%
  address: string;
  phone: string;
  thankYouMessage: string;
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface AppContextType {
  // Menu
  menuItems: MenuItem[];
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (item: MenuItem) => void;
  deleteMenuItem: (id: string) => void;

  // Cart
  cartItems: CartItem[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartTaxAmount: number;
  cartTotal: number;

  // Orders
  orders: Order[];
  placeOrder: (note?: string) => Order;
  deleteOrder: (id: string) => void;
  clearAllOrders: () => void;

  // Settings
  settings: Settings;
  updateSettings: (s: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  restaurantName: 'My Restaurant',
  taxRate: 8.5,
  address: '123 Main Street',
  phone: '+1 (555) 000-0000',
  thankYouMessage: 'Thank you for your order!',
};

const AppContext = createContext<AppContextType | null>(null);

// ─── Keys ────────────────────────────────────────────────────────────────────
const STORAGE_KEYS = {
  MENU: '@food_receipt_menu',
  ORDERS: '@food_receipt_orders',
  SETTINGS: '@food_receipt_settings',
  /** Milliseconds since epoch when the current 7-day local retention window started */
  DATA_ANCHOR: '@food_receipt_data_anchor_ms',
};

/** Local AsyncStorage data is kept for this long, then cleared (menu, orders, settings). */
const DATA_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Sets anchor on first use. If older than DATA_RETENTION_MS, removes menu/orders/settings
 * and starts a new window. Returns whether a wipe occurred.
 */
async function applyLocalDataRetention(): Promise<boolean> {
  const now = Date.now();
  const anchorRaw = await AsyncStorage.getItem(STORAGE_KEYS.DATA_ANCHOR);
  if (anchorRaw == null) {
    await AsyncStorage.setItem(STORAGE_KEYS.DATA_ANCHOR, String(now));
    return false;
  }
  const anchor = parseInt(anchorRaw, 10);
  if (Number.isNaN(anchor) || now - anchor < DATA_RETENTION_MS) {
    return false;
  }
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.MENU,
    STORAGE_KEYS.ORDERS,
    STORAGE_KEYS.SETTINGS,
  ]);
  await AsyncStorage.setItem(STORAGE_KEYS.DATA_ANCHOR, String(now));
  return true;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AppProvider({children}: {children: ReactNode}) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  const loadPersistedState = useCallback(async () => {
    try {
      const wiped = await applyLocalDataRetention();
      if (wiped) {
        setCartItems([]);
      }

      const [menuRaw, ordersRaw, settingsRaw] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.MENU),
        AsyncStorage.getItem(STORAGE_KEYS.ORDERS),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
      ]);

      if (menuRaw) {
        setMenuItems(JSON.parse(menuRaw));
      } else if (wiped) {
        setMenuItems([]);
        await AsyncStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify([]));
      } else {
        const seed: MenuItem[] = [
          {id: uuidv4(), name: 'Margherita Pizza', price: 12.99, category: 'Mains'},
          {id: uuidv4(), name: 'Chicken Burger', price: 9.99, category: 'Mains'},
          {id: uuidv4(), name: 'Caesar Salad', price: 7.49, category: 'Starters'},
          {id: uuidv4(), name: 'French Fries', price: 3.99, category: 'Sides'},
          {id: uuidv4(), name: 'Coca Cola', price: 2.49, category: 'Drinks'},
          {id: uuidv4(), name: 'Mango Juice', price: 2.99, category: 'Drinks'},
        ];
        setMenuItems(seed);
        await AsyncStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(seed));
      }

      if (ordersRaw) {
        setOrders(JSON.parse(ordersRaw));
      } else {
        setOrders([]);
      }

      if (settingsRaw) {
        setSettings({...defaultSettings, ...JSON.parse(settingsRaw)});
      } else {
        setSettings(defaultSettings);
      }
    } catch (e) {
      console.warn('Failed to load app data', e);
    }
  }, []);

  useEffect(() => {
    loadPersistedState();
  }, [loadPersistedState]);

  const appStateRef = useRef(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        next === 'active'
      ) {
        loadPersistedState();
      }
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, [loadPersistedState]);

  // ── Persist helpers ───────────────────────────────────────────────────────
  const persistMenu = useCallback(async (items: MenuItem[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(items));
  }, []);

  const persistOrders = useCallback(async (items: Order[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(items));
  }, []);

  const persistSettings = useCallback(async (s: Settings) => {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(s));
  }, []);

  // ── Menu Actions ──────────────────────────────────────────────────────────
  const addMenuItem = useCallback((item: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = {...item, id: uuidv4()};
    setMenuItems(prev => {
      const updated = [...prev, newItem];
      persistMenu(updated);
      return updated;
    });
  }, [persistMenu]);

  const updateMenuItem = useCallback((item: MenuItem) => {
    setMenuItems(prev => {
      const updated = prev.map(m => m.id === item.id ? item : m);
      persistMenu(updated);
      return updated;
    });
    // Also update in cart if present
    setCartItems(prev =>
      prev.map(ci =>
        ci.menuItem.id === item.id ? {...ci, menuItem: item} : ci,
      ),
    );
  }, [persistMenu]);

  const deleteMenuItem = useCallback((id: string) => {
    setMenuItems(prev => {
      const updated = prev.filter(m => m.id !== id);
      persistMenu(updated);
      return updated;
    });
    setCartItems(prev => prev.filter(ci => ci.menuItem.id !== id));
  }, [persistMenu]);

  // ── Cart Actions ──────────────────────────────────────────────────────────
  const addToCart = useCallback((item: MenuItem) => {
    setCartItems(prev => {
      const existing = prev.find(ci => ci.menuItem.id === item.id);
      if (existing) {
        return prev.map(ci =>
          ci.menuItem.id === item.id
            ? {...ci, quantity: ci.quantity + 1}
            : ci,
        );
      }
      return [...prev, {menuItem: item, quantity: 1}];
    });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCartItems(prev => prev.filter(ci => ci.menuItem.id !== itemId));
  }, []);

  const updateCartQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(prev => prev.filter(ci => ci.menuItem.id !== itemId));
    } else {
      setCartItems(prev =>
        prev.map(ci =>
          ci.menuItem.id === itemId ? {...ci, quantity} : ci,
        ),
      );
    }
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // ── Cart Totals ───────────────────────────────────────────────────────────
  const cartSubtotal = cartItems.reduce(
    (sum, ci) => sum + ci.menuItem.price * ci.quantity,
    0,
  );
  const cartTaxAmount = cartSubtotal * (settings.taxRate / 100);
  const cartTotal = cartSubtotal + cartTaxAmount;

  // ── Order Actions ─────────────────────────────────────────────────────────
  const placeOrder = useCallback(
    (note?: string): Order => {
      const order: Order = {
        id: uuidv4(),
        items: cartItems,
        subtotal: cartSubtotal,
        taxRate: settings.taxRate,
        taxAmount: cartTaxAmount,
        total: cartTotal,
        createdAt: new Date().toISOString(),
        restaurantName: settings.restaurantName,
        note,
      };
      setOrders(prev => {
        const updated = [order, ...prev];
        persistOrders(updated);
        return updated;
      });
      setCartItems([]);
      return order;
    },
    [cartItems, cartSubtotal, cartTaxAmount, cartTotal, settings, persistOrders],
  );

  const deleteOrder = useCallback((id: string) => {
    setOrders(prev => {
      const updated = prev.filter(o => o.id !== id);
      persistOrders(updated);
      return updated;
    });
  }, [persistOrders]);

  const clearAllOrders = useCallback(() => {
    setOrders([]);
    persistOrders([]);
  }, [persistOrders]);

  // ── Settings Actions ──────────────────────────────────────────────────────
  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettings(prev => {
      const updated = {...prev, ...partial};
      persistSettings(updated);
      return updated;
    });
  }, [persistSettings]);

  return (
    <AppContext.Provider
      value={{
        menuItems,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        cartItems,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartSubtotal,
        cartTaxAmount,
        cartTotal,
        orders,
        placeOrder,
        deleteOrder,
        clearAllOrders,
        settings,
        updateSettings,
      }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) {throw new Error('useApp must be used within AppProvider');}
  return ctx;
}
