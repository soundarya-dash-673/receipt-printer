import AsyncStorage from '@react-native-async-storage/async-storage';
import type {Order} from '../context/AppContext';
import {migrateCartItem} from '../utils/cartMigration';
import {isSqliteAvailable} from './database';
import {countOrders, insertOrder} from './ordersRepository';

const ORDERS_KEY = '@food_receipt_orders';

/** One-time copy from legacy AsyncStorage when SQLite `orders` is empty. */
export async function migrateOrdersFromAsyncStorageIfNeeded(): Promise<void> {
  if (!isSqliteAvailable()) {
    return;
  }
  if ((await countOrders()) > 0) {
    return;
  }
  try {
    const raw = await AsyncStorage.getItem(ORDERS_KEY);
    if (!raw) {
      return;
    }
    const parsed: Order[] = JSON.parse(raw);
    for (const o of parsed) {
      const items = (o.items ?? []).map((line, i) => migrateCartItem(line, i));
      const order: Order = {
        ...o,
        items,
      };
      await insertOrder(order);
    }
  } catch (e) {
    console.warn('Order migration from AsyncStorage failed', e);
  }
}
