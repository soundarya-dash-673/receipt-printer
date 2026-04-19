import AsyncStorage from '@react-native-async-storage/async-storage';
import type {Order} from '../context/AppContext';
import {migrateCartItem} from '../utils/cartMigration';

const ORDERS_KEY = '@food_receipt_orders';

/** Serialize writes so rapid consecutive orders do not clobber each other. */
let persistChain = Promise.resolve();

function parseOrders(raw: string | null): Order[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed: Order[] = JSON.parse(raw);
    return parsed.map((o, idx) => ({
      ...o,
      items: (o.items ?? []).map((line, i) => migrateCartItem(line, i)),
    }));
  } catch {
    return [];
  }
}

export async function fetchAllOrdersNewestFirst(): Promise<Order[]> {
  const raw = await AsyncStorage.getItem(ORDERS_KEY);
  const list = parseOrders(raw);
  return [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/** Resolves after the order is written (queued with other writes). */
export function insertOrderAwait(order: Order): Promise<void> {
  return new Promise((resolve, reject) => {
    persistChain = persistChain
      .then(async () => {
        const raw = await AsyncStorage.getItem(ORDERS_KEY);
        const list = parseOrders(raw);
        list.unshift(order);
        await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(list));
      })
      .then(resolve)
      .catch(reject);
  });
}

export function deleteOrderById(id: string): void {
  persistChain = persistChain.then(async () => {
    const raw = await AsyncStorage.getItem(ORDERS_KEY);
    const list = parseOrders(raw).filter(o => o.id !== id);
    await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(list));
  });
}

export function deleteAllOrders(): void {
  persistChain = persistChain.then(async () => {
    await AsyncStorage.removeItem(ORDERS_KEY);
  });
}

export async function countOrders(): Promise<number> {
  const raw = await AsyncStorage.getItem(ORDERS_KEY);
  return parseOrders(raw).length;
}
