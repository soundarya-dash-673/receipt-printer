import {getDb, isSqliteAvailable} from './database';
import type {Order} from '../context/AppContext';
import {migrateCartItem} from '../utils/cartMigration';
import * as ordersAsync from './ordersAsyncStorage';

function rowToOrder(row: Record<string, unknown>): Order {
  const itemsRaw = JSON.parse(String(row.items_json ?? '[]'));
  const items = Array.isArray(itemsRaw)
    ? itemsRaw.map((ci: unknown, i: number) => migrateCartItem(ci, i))
    : [];
  return {
    id: String(row.id),
    items,
    subtotal: Number(row.subtotal) || 0,
    taxRate: Number(row.tax_rate) || 0,
    taxAmount: Number(row.tax_amount) || 0,
    total: Number(row.total) || 0,
    createdAt: String(row.created_at),
    restaurantName: String(row.restaurant_name ?? ''),
    note: row.note != null && row.note !== '' ? String(row.note) : undefined,
    paymentMethod:
      row.payment_method === 'cash' || row.payment_method === 'card'
        ? row.payment_method
        : undefined,
    userId: row.user_id != null ? String(row.user_id) : undefined,
  };
}

function insertOrderSqlite(order: Order): void {
  const db = getDb();
  if (!db) {
    return;
  }
  db.execute(
    `INSERT INTO orders (
      id, user_id, items_json, subtotal, tax_rate, tax_amount, total,
      created_at, restaurant_name, note, payment_method
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      order.id,
      order.userId ?? null,
      JSON.stringify(order.items),
      order.subtotal,
      order.taxRate,
      order.taxAmount,
      order.total,
      order.createdAt,
      order.restaurantName,
      order.note ?? null,
      order.paymentMethod ?? null,
    ],
  );
}

function deleteOrderByIdSqlite(id: string): void {
  const db = getDb();
  if (!db) {
    return;
  }
  db.execute('DELETE FROM orders WHERE id = ?', [id]);
}

function deleteAllOrdersSqlite(): void {
  const db = getDb();
  if (!db) {
    return;
  }
  db.execute('DELETE FROM orders');
}

function fetchAllOrdersNewestFirstSqlite(): Order[] {
  const db = getDb();
  if (!db) {
    return [];
  }
  const r = db.execute('SELECT * FROM orders ORDER BY created_at DESC');
  const rows = r.rows?._array ?? [];
  return rows.map(row => rowToOrder(row as Record<string, unknown>));
}

function countOrdersSqlite(): number {
  const db = getDb();
  if (!db) {
    return 0;
  }
  const r = db.execute('SELECT COUNT(*) as c FROM orders');
  const n = r.rows?._array?.[0]?.c;
  return typeof n === 'number' ? n : Number(n) || 0;
}

export async function insertOrder(order: Order): Promise<void> {
  if (isSqliteAvailable()) {
    insertOrderSqlite(order);
    return;
  }
  await ordersAsync.insertOrderAwait(order);
}

export function deleteOrderById(id: string): void {
  if (isSqliteAvailable()) {
    deleteOrderByIdSqlite(id);
  } else {
    ordersAsync.deleteOrderById(id);
  }
}

export function clearAllOrders(): void {
  if (isSqliteAvailable()) {
    deleteAllOrdersSqlite();
  } else {
    ordersAsync.deleteAllOrders();
  }
}

export async function loadOrders(): Promise<Order[]> {
  if (isSqliteAvailable()) {
    return fetchAllOrdersNewestFirstSqlite();
  }
  return ordersAsync.fetchAllOrdersNewestFirst();
}

export async function countOrders(): Promise<number> {
  if (isSqliteAvailable()) {
    return countOrdersSqlite();
  }
  return ordersAsync.countOrders();
}
