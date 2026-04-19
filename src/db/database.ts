import {NativeModules} from 'react-native';
import type {QuickSQLiteConnection} from 'react-native-quick-sqlite';

export const DB_NAME = 'slipgo';

type QuickSqliteModule = typeof import('react-native-quick-sqlite');

/** `undefined` = not yet resolved; `null` = native module missing (e.g. need rebuild). */
let quickSqliteModule: QuickSqliteModule | null | undefined;

let connection: QuickSQLiteConnection | null = null;

/**
 * Loads the JS binding only when `NativeModules.QuickSQLite` exists.
 * Otherwise `require('react-native-quick-sqlite')` runs its entry file and throws
 * ("Base quick-sqlite module not found") before we can fall back.
 */
function getQuickSqlite(): QuickSqliteModule | null {
  if (quickSqliteModule !== undefined) {
    return quickSqliteModule;
  }
  if (NativeModules.QuickSQLite == null) {
    quickSqliteModule = null;
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    quickSqliteModule = require('react-native-quick-sqlite') as QuickSqliteModule;
  } catch {
    quickSqliteModule = null;
  }
  return quickSqliteModule;
}

export function isSqliteAvailable(): boolean {
  return getQuickSqlite() != null;
}

export function getDb(): QuickSQLiteConnection | null {
  const sqlite = getQuickSqlite();
  if (!sqlite) {
    return null;
  }
  if (!connection) {
    connection = sqlite.open({name: DB_NAME});
    applySchema(connection);
  }
  return connection;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  phone_normalized TEXT NOT NULL UNIQUE,
  display_phone TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT,
  items_json TEXT NOT NULL,
  subtotal REAL NOT NULL,
  tax_rate REAL NOT NULL,
  tax_amount REAL NOT NULL,
  total REAL NOT NULL,
  created_at TEXT NOT NULL,
  restaurant_name TEXT NOT NULL,
  note TEXT,
  payment_method TEXT
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
`;

function applySchema(db: QuickSQLiteConnection): void {
  for (const stmt of SCHEMA.split(';')
    .map(s => s.trim())
    .filter(Boolean)) {
    db.execute(stmt);
  }
}

/** Opens DB when native SQLite is linked; otherwise no-op. */
export function ensureSchema(): void {
  getDb();
}
