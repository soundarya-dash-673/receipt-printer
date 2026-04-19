import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {v4 as uuidv4} from 'uuid';
import {useAuth} from './AuthContext';
import {ensureSchema} from '../db/database';
import {migrateOrdersFromAsyncStorageIfNeeded} from '../db/migrateOrdersFromAsyncStorage';
import {
  clearAllOrders as dbClearAllOrders,
  deleteOrderById,
  loadOrders,
  insertOrder as dbInsertOrder,
} from '../db/ordersRepository';

// ─── Types ───────────────────────────────────────────────────────────────────

/** Configured on a menu item (ingredient / add-on). Price 0 = free. */
export interface MenuTopping {
  id: string;
  name: string;
  price: number;
  /** Always part of the dish; customer cannot remove (e.g. base sauce). */
  required?: boolean;
  /** Pre-checked when ordering for optional ingredients; ignored if required. */
  includedByDefault?: boolean;
}

/** Snapshot stored on cart / order lines (immutable after add). */
export type SelectedTopping = MenuTopping;

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  toppings?: MenuTopping[];
}

export interface CartItem {
  cartLineId: string;
  menuItem: MenuItem;
  quantity: number;
  selectedToppings: SelectedTopping[];
}

export type PaymentMethod = 'cash' | 'card';

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
  /** Omitted on orders saved before this field existed */
  paymentMethod?: PaymentMethod;
  /** Set when order is tied to a signed-in user (SQLite) */
  userId?: string;
}

export interface Settings {
  restaurantName: string;
  taxRate: number; // percentage e.g. 8.5 means 8.5%
  address: string;
  phone: string;
  thankYouMessage: string;
}

/** Base + selected topping prices for one unit (coerces stored/string prices safely). */
export function unitPriceForLine(
  menuItem: MenuItem,
  selected: SelectedTopping[] | undefined | null,
): number {
  const base = Number(menuItem?.price);
  const safeBase = Number.isFinite(base) ? base : 0;
  const list = selected ?? [];
  const extra = list.reduce((sum, t) => {
    const p = Number(t?.price);
    const n = Number.isFinite(p) ? Math.max(0, p) : 0;
    return sum + n;
  }, 0);
  return safeBase + extra;
}

function selectionKey(
  menuItemId: string,
  selected: SelectedTopping[] | undefined | null,
): string {
  const ids = [...(selected ?? []).map(t => t.id)].sort((a, b) => a.localeCompare(b));
  return `${menuItemId}|${ids.join(',')}`;
}

function normalizeMenuItem(m: MenuItem): MenuItem {
  const tops = (m.toppings ?? []).map(t => {
    const required = !!t.required;
    return {
      ...t,
      price: Number(t.price) || 0,
      required,
      includedByDefault: !!t.includedByDefault || required,
    };
  });
  return {...m, toppings: tops};
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
  addToCart: (item: MenuItem, selectedToppings?: SelectedTopping[]) => void;
  /** Swap toppings (and merge qty) for an existing line — used from Order → Edit toppings. */
  replaceCartLine: (
    cartLineId: string,
    menuItem: MenuItem,
    selectedToppings: SelectedTopping[],
  ) => void;
  removeFromCart: (cartLineId: string) => void;
  updateCartQuantity: (cartLineId: string, quantity: number) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartTaxAmount: number;
  cartTotal: number;

  // Orders
  orders: Order[];
  placeOrder: (note?: string, paymentMethod?: PaymentMethod) => Promise<Order>;
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
  SETTINGS: '@food_receipt_settings',
};

// ─── Provider ────────────────────────────────────────────────────────────────

export function AppProvider({children}: {children: ReactNode}) {
  const {session} = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  // ── Load persisted data on mount ──────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        ensureSchema();
        await migrateOrdersFromAsyncStorageIfNeeded();
        setOrders(await loadOrders());

        const [menuRaw, settingsRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.MENU),
          AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
        ]);

        if (menuRaw) {
          const parsed: MenuItem[] = JSON.parse(menuRaw);
          setMenuItems(parsed.map(normalizeMenuItem));
        } else {
          const sauceId = uuidv4();
          const mozzId = uuidv4();
          const cheeseExtraId = uuidv4();
          const olivesId = uuidv4();
          const pepId = uuidv4();
          const seed: MenuItem[] = [
            {
              id: uuidv4(),
              name: 'Margherita Pizza',
              price: 12.99,
              category: 'Mains',
              toppings: [
                {
                  id: sauceId,
                  name: 'Classic tomato sauce',
                  price: 0,
                  required: true,
                  includedByDefault: true,
                },
                {
                  id: mozzId,
                  name: 'Fresh mozzarella',
                  price: 0,
                  required: true,
                  includedByDefault: true,
                },
                {
                  id: cheeseExtraId,
                  name: 'Extra cheese',
                  price: 1.5,
                  includedByDefault: false,
                },
                {
                  id: olivesId,
                  name: 'Olives',
                  price: 0,
                  includedByDefault: false,
                },
                {
                  id: pepId,
                  name: 'Pepperoni',
                  price: 2.0,
                  includedByDefault: false,
                },
              ],
            },
            {id: uuidv4(), name: 'Chicken Burger', price: 9.99, category: 'Mains'},
            {id: uuidv4(), name: 'Caesar Salad', price: 7.49, category: 'Starters'},
            {id: uuidv4(), name: 'French Fries', price: 3.99, category: 'Sides'},
            {
              id: uuidv4(),
              name: 'Extra cheese (side)',
              price: 1.5,
              category: 'Toppings',
              description: 'Add to any dish',
            },
            {
              id: uuidv4(),
              name: 'Garlic dip',
              price: 1.25,
              category: 'Toppings',
              description: '2 oz cup',
            },
            {
              id: uuidv4(),
              name: 'Jalapeños',
              price: 0,
              category: 'Toppings',
              description: 'Free add-on portion',
            },
            {id: uuidv4(), name: 'Coca Cola', price: 2.49, category: 'Drinks'},
            {id: uuidv4(), name: 'Mango Juice', price: 2.99, category: 'Drinks'},
          ];
          setMenuItems(seed);
          await AsyncStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(seed));
        }

        if (settingsRaw) {setSettings({...defaultSettings, ...JSON.parse(settingsRaw)});}
      } catch (e) {
        console.warn('Failed to load app data', e);
      }
    };
    load();
  }, []);

  // ── Persist helpers ───────────────────────────────────────────────────────
  const persistMenu = useCallback(async (items: MenuItem[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(items));
  }, []);

  const persistSettings = useCallback(async (s: Settings) => {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(s));
  }, []);

  // ── Menu Actions ──────────────────────────────────────────────────────────
  const addMenuItem = useCallback((item: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = normalizeMenuItem({
      ...item,
      id: uuidv4(),
    });
    setMenuItems(prev => {
      const updated = [...prev, newItem];
      persistMenu(updated);
      return updated;
    });
  }, [persistMenu]);

  const updateMenuItem = useCallback((item: MenuItem) => {
    const normalized = normalizeMenuItem(item);
    setMenuItems(prev => {
      const updated = prev.map(m => m.id === normalized.id ? normalized : m);
      persistMenu(updated);
      return updated;
    });
    setCartItems(prev =>
      prev.map(ci =>
        ci.menuItem.id === normalized.id ? {...ci, menuItem: normalized} : ci,
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
  const addToCart = useCallback((item: MenuItem, selectedToppings: SelectedTopping[] = []) => {
    const menuItem = normalizeMenuItem(item);
    const toppings = [...selectedToppings].sort((a, b) => a.id.localeCompare(b.id));
    const key = selectionKey(menuItem.id, toppings);

    setCartItems(prev => {
      const existing = prev.find(
        ci => selectionKey(ci.menuItem.id, ci.selectedToppings ?? []) === key,
      );
      if (existing) {
        return prev.map(ci =>
          selectionKey(ci.menuItem.id, ci.selectedToppings ?? []) === key
            ? {...ci, quantity: ci.quantity + 1}
            : ci,
        );
      }
      const line: CartItem = {
        cartLineId: uuidv4(),
        menuItem,
        quantity: 1,
        selectedToppings: toppings,
      };
      return [...prev, line];
    });
  }, []);

  const replaceCartLine = useCallback(
    (cartLineId: string, menuItem: MenuItem, selectedToppings: SelectedTopping[]) => {
      const normalizedItem = normalizeMenuItem(menuItem);
      const toppings = [...selectedToppings].sort((a, b) => a.id.localeCompare(b.id));
      const key = selectionKey(normalizedItem.id, toppings);

      setCartItems(prev => {
        const oldLine = prev.find(ci => ci.cartLineId === cartLineId);
        const qty = oldLine?.quantity ?? 1;
        const without = prev.filter(ci => ci.cartLineId !== cartLineId);
        const mergeTarget = without.find(
          ci => selectionKey(ci.menuItem.id, ci.selectedToppings ?? []) === key,
        );
        if (mergeTarget) {
          return without.map(ci =>
            ci.cartLineId === mergeTarget.cartLineId
              ? {...ci, quantity: ci.quantity + qty}
              : ci,
          );
        }
        const line: CartItem = {
          cartLineId: uuidv4(),
          menuItem: normalizedItem,
          quantity: qty,
          selectedToppings: toppings,
        };
        return [...without, line];
      });
    },
    [],
  );

  const removeFromCart = useCallback((cartLineId: string) => {
    setCartItems(prev => prev.filter(ci => ci.cartLineId !== cartLineId));
  }, []);

  const updateCartQuantity = useCallback((cartLineId: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(prev => prev.filter(ci => ci.cartLineId !== cartLineId));
    } else {
      setCartItems(prev =>
        prev.map(ci =>
          ci.cartLineId === cartLineId ? {...ci, quantity} : ci,
        ),
      );
    }
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // ── Cart Totals ───────────────────────────────────────────────────────────
  const cartSubtotal = cartItems.reduce((sum, ci) => {
    const unit = unitPriceForLine(ci.menuItem, ci.selectedToppings ?? []);
    return sum + unit * ci.quantity;
  }, 0);
  const cartTaxAmount = cartSubtotal * (settings.taxRate / 100);
  const cartTotal = cartSubtotal + cartTaxAmount;

  // ── Order Actions ─────────────────────────────────────────────────────────
  const placeOrder = useCallback(
    async (note?: string, paymentMethod: PaymentMethod = 'cash'): Promise<Order> => {
      /** Immutable snapshot with numeric topping prices (avoids bad totals from string/coercion bugs). */
      const lineSnapshots: CartItem[] = cartItems.map(ci => ({
        cartLineId: ci.cartLineId,
        menuItem: normalizeMenuItem(ci.menuItem),
        quantity: ci.quantity,
        selectedToppings: (ci.selectedToppings ?? []).map(t => ({
          id: t.id,
          name: t.name,
          price: Number(t.price) || 0,
        })),
      }));

      const computedSubtotal = lineSnapshots.reduce(
        (sum, ci) =>
          sum + unitPriceForLine(ci.menuItem, ci.selectedToppings) * ci.quantity,
        0,
      );
      const taxAmount = computedSubtotal * (settings.taxRate / 100);
      const total = computedSubtotal + taxAmount;

      const order: Order = {
        id: uuidv4(),
        items: lineSnapshots,
        subtotal: computedSubtotal,
        taxRate: settings.taxRate,
        taxAmount,
        total,
        createdAt: new Date().toISOString(),
        restaurantName: settings.restaurantName,
        note,
        paymentMethod,
        userId: session?.userId,
      };
      await dbInsertOrder(order);
      setOrders(prev => [order, ...prev]);
      setCartItems([]);
      return order;
    },
    [cartItems, settings.taxRate, settings.restaurantName, session?.userId],
  );

  const deleteOrder = useCallback((id: string) => {
    deleteOrderById(id);
    setOrders(prev => prev.filter(o => o.id !== id));
  }, []);

  const clearAllOrders = useCallback(() => {
    dbClearAllOrders();
    setOrders([]);
  }, []);

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
        replaceCartLine,
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
