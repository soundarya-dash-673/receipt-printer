import type {Order} from '../context/AppContext';
import {getDb, isSqliteAvailable} from './database';

export interface TodayStats {
  orderCount: number;
  totalIncome: number;
}

export interface DayRevenue {
  /** Local calendar day YYYY-MM-DD */
  dayKey: string;
  orderCount: number;
  totalIncome: number;
}

function localDayKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Same logic as SQL path, for AsyncStorage / in-memory order lists. */
export function getTodayStatsFromOrders(orders: Order[]): TodayStats {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const startMs = start.getTime();
  const endMs = end.getTime();
  let orderCount = 0;
  let totalIncome = 0;
  for (const o of orders) {
    const t = new Date(o.createdAt).getTime();
    if (t >= startMs && t < endMs) {
      orderCount += 1;
      totalIncome += o.total;
    }
  }
  return {orderCount, totalIncome};
}

export function getRevenueByLocalDayFromOrders(orders: Order[], limit = 31): DayRevenue[] {
  const map = new Map<string, {count: number; sum: number}>();
  for (const o of orders) {
    const key = localDayKey(o.createdAt);
    const cur = map.get(key) ?? {count: 0, sum: 0};
    cur.count += 1;
    cur.sum += o.total;
    map.set(key, cur);
  }
  const keys = [...map.keys()].sort((a, b) => b.localeCompare(a)).slice(0, limit);
  return keys.map(dayKey => ({
    dayKey,
    orderCount: map.get(dayKey)!.count,
    totalIncome: map.get(dayKey)!.sum,
  }));
}

/** Orders and totals for the current local calendar day (SQLite only). */
export function getTodayStats(): TodayStats {
  if (!isSqliteAvailable()) {
    return {orderCount: 0, totalIncome: 0};
  }
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const startIso = start.toISOString();
  const endIso = end.toISOString();
  const db = getDb();
  if (!db) {
    return {orderCount: 0, totalIncome: 0};
  }
  const r = db.execute(
    `SELECT COUNT(*) as c, COALESCE(SUM(total), 0) as s FROM orders
     WHERE created_at >= ? AND created_at < ?`,
    [startIso, endIso],
  );
  const row = r.rows?._array?.[0];
  const c = row?.c ?? 0;
  const s = row?.s ?? 0;
  return {
    orderCount: typeof c === 'number' ? c : Number(c) || 0,
    totalIncome: typeof s === 'number' ? s : Number(s) || 0,
  };
}

/**
 * Revenue grouped by local calendar day (recent first).
 * @param limit max number of days to return
 */
export function getRevenueByLocalDay(limit = 31): DayRevenue[] {
  if (!isSqliteAvailable()) {
    return [];
  }
  const db = getDb();
  if (!db) {
    return [];
  }
  const r = db.execute(
    'SELECT total, created_at FROM orders ORDER BY created_at DESC LIMIT 8000',
  );
  const rows = r.rows?._array ?? [];
  const map = new Map<string, {count: number; sum: number}>();
  for (const row of rows) {
    const total = Number((row as {total?: number}).total) || 0;
    const createdAt = String((row as {created_at?: string}).created_at ?? '');
    const key = localDayKey(createdAt);
    const cur = map.get(key) ?? {count: 0, sum: 0};
    cur.count += 1;
    cur.sum += total;
    map.set(key, cur);
  }
  const keys = [...map.keys()].sort((a, b) => b.localeCompare(a)).slice(0, limit);
  return keys.map(dayKey => ({
    dayKey,
    orderCount: map.get(dayKey)!.count,
    totalIncome: map.get(dayKey)!.sum,
  }));
}
