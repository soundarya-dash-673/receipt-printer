import sha256 from 'js-sha256';
import {MONGO_COLLECTIONS, isMongoConfigured} from '../config/mongoAtlas';
import {mongoDataApiAction} from './mongoDataApi';
import type {MenuItem, Order} from '../context/AppContext';
import {localDayKey} from '../utils/dateKeys';

/** Hash for sync only — use server-side bcrypt in production. */
export function hashPasswordForRemote(password: string, phoneNormalized: string): string {
  return sha256(`${phoneNormalized}:${password}:slipgo`);
}

export async function remoteUpsertUserCredentials(params: {
  phoneNormalized: string;
  displayPhone: string;
  password: string;
}): Promise<void> {
  if (!isMongoConfigured()) {
    return;
  }
  const now = new Date().toISOString();
  const doc = {
    phone_normalized: params.phoneNormalized,
    display_phone: params.displayPhone,
    password_sha256: hashPasswordForRemote(params.password, params.phoneNormalized),
    updatedAt: now,
  };
  await mongoDataApiAction('updateOne', {
    collection: MONGO_COLLECTIONS.users,
    filter: {phone_normalized: params.phoneNormalized},
    update: {$set: doc},
    upsert: true,
  });
}

export async function remoteReplaceMenuSnapshot(
  ownerKey: string,
  items: MenuItem[],
): Promise<void> {
  if (!isMongoConfigured()) {
    return;
  }
  const now = new Date().toISOString();
  const replacement = {
    owner_key: ownerKey,
    items: JSON.parse(JSON.stringify(items)),
    updatedAt: now,
  };
  await mongoDataApiAction('replaceOne', {
    collection: MONGO_COLLECTIONS.menus,
    filter: {owner_key: ownerKey},
    replacement,
    upsert: true,
  });
}

/** Load menu snapshot from MongoDB (if any). */
export async function remoteFetchMenu(ownerKey: string): Promise<MenuItem[] | null> {
  if (!isMongoConfigured()) {
    return null;
  }
  try {
    const res = await mongoDataApiAction<{documents?: Array<{items?: MenuItem[]}>}>(
      'find',
      {
        collection: MONGO_COLLECTIONS.menus,
        filter: {owner_key: ownerKey},
        limit: 1,
      },
    );
    const doc = res.documents?.[0];
    const items = doc?.items;
    return Array.isArray(items) && items.length > 0 ? items : null;
  } catch (e) {
    console.warn('remoteFetchMenu', e);
    return null;
  }
}

export interface DailyReportDoc {
  owner_key: string;
  day: string;
  order_count: number;
  total_revenue: number;
  avg_order_value: number;
  updatedAt: string;
}

export async function remoteUpsertDailyReport(
  ownerKey: string,
  day: string,
  stats: {orderCount: number; totalRevenue: number; avgOrderValue: number},
): Promise<void> {
  if (!isMongoConfigured()) {
    return;
  }
  const now = new Date().toISOString();
  const doc: DailyReportDoc = {
    owner_key: ownerKey,
    day,
    order_count: stats.orderCount,
    total_revenue: Math.round(stats.totalRevenue * 100) / 100,
    avg_order_value: Math.round(stats.avgOrderValue * 100) / 100,
    updatedAt: now,
  };
  await mongoDataApiAction('replaceOne', {
    collection: MONGO_COLLECTIONS.dailyReports,
    filter: {owner_key: ownerKey, day},
    replacement: doc,
    upsert: true,
  });
}

export function aggregateDayMetrics(orders: Order[], dayKey: string) {
  const dayOrders = orders.filter(o => localDayKey(o.createdAt) === dayKey);
  const orderCount = dayOrders.length;
  const totalRevenue = dayOrders.reduce((s, o) => s + o.total, 0);
  const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;
  return {orderCount, totalRevenue, avgOrderValue};
}

/** Recompute and sync one calendar day from the full order list. */
export async function syncRemoteDailyReportForDay(
  ownerKey: string,
  orders: Order[],
  dayKey: string,
): Promise<void> {
  if (!isMongoConfigured()) {
    return;
  }
  const m = aggregateDayMetrics(orders, dayKey);
  if (m.orderCount === 0) {
    try {
      await mongoDataApiAction('deleteOne', {
        collection: MONGO_COLLECTIONS.dailyReports,
        filter: {owner_key: ownerKey, day: dayKey},
      });
    } catch {
      // ignore if delete not supported or doc missing
    }
    return;
  }
  await remoteUpsertDailyReport(ownerKey, dayKey, {
    orderCount: m.orderCount,
    totalRevenue: m.totalRevenue,
    avgOrderValue: m.avgOrderValue,
  });
}

export async function remoteFetchDailyReports(
  ownerKey: string,
  limit = 90,
): Promise<DailyReportDoc[]> {
  if (!isMongoConfigured()) {
    return [];
  }
  const res = await mongoDataApiAction<{documents?: DailyReportDoc[]}>(
    'find',
    {
      collection: MONGO_COLLECTIONS.dailyReports,
      filter: {owner_key: ownerKey},
      sort: {day: -1},
      limit,
    },
  );
  return res.documents ?? [];
}
