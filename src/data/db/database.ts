import {openDatabase, enablePromise, type SQLiteDatabase} from 'react-native-sqlite-storage';
import * as CryptoJS from 'crypto-js';
import {v4 as uuidv4} from 'uuid';

enablePromise(true);

const DB_NAME = 'SlipGo.db';
const PIN_SALT = 'slipgo-pin-v1';

export function hashPin(pin: string): string {
  return CryptoJS.SHA256(`${PIN_SALT}:${pin}`).toString();
}

let dbInstance: SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }
  dbInstance = await openDatabase({
    name: DB_NAME,
    location: 'default',
  });
  await dbInstance.executeSql('PRAGMA foreign_keys = ON;');
  await runMigrations(dbInstance);
  return dbInstance;
}

async function exec(db: SQLiteDatabase, sql: string, params: unknown[] = []): Promise<void> {
  await db.executeSql(sql, params);
}

async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const [verRes] = await db.executeSql('PRAGMA user_version;');
  const row = verRes.rows.item(0);
  let version = (row.user_version ?? row.USER_VERSION ?? 0) as number;

  if (version < 1) {
    await exec(db, `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        pin_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
    await exec(db, `
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY NOT NULL,
        order_number INTEGER NOT NULL UNIQUE,
        total_amount REAL NOT NULL,
        tax_amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        created_at TEXT NOT NULL,
        created_by_user_id TEXT,
        FOREIGN KEY (created_by_user_id) REFERENCES users(id)
      );
    `);
    await exec(db, `
      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY NOT NULL,
        order_id TEXT NOT NULL,
        item_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );
    `);
    await exec(db, `
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        shop_name TEXT NOT NULL DEFAULT 'SlipGo',
        logo_path TEXT,
        tax_percentage REAL NOT NULL DEFAULT 8.5,
        receipt_footer TEXT NOT NULL DEFAULT 'Fast. Simple. Receipts.'
      );
    `);
    await exec(db, `
      CREATE TABLE IF NOT EXISTS printers (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        bluetooth_address TEXT NOT NULL UNIQUE
      );
    `);
    await exec(
      db,
      `INSERT OR IGNORE INTO settings (id, shop_name, tax_percentage, receipt_footer)
       VALUES (1, 'SlipGo', 8.5, 'Fast. Simple. Receipts.');`,
    );

    const [countRes] = await db.executeSql('SELECT COUNT(*) as cnt FROM users;');
    const cnt = countRes.rows.item(0).cnt as number;
    if (cnt === 0) {
      const ownerId = uuidv4();
      const now = new Date().toISOString();
      await exec(db, `INSERT INTO users (id, name, role, pin_hash, created_at) VALUES (?, ?, ?, ?, ?);`, [
        ownerId,
        'Owner',
        'owner',
        hashPin('1234'),
        now,
      ]);
    }

    await exec(db, 'PRAGMA user_version = 1;');
    version = 1;
  }

  if (version < 2) {
    try {
      await exec(db, 'ALTER TABLE orders ADD COLUMN note TEXT;');
    } catch {
      /* column may exist */
    }
    await exec(db, 'PRAGMA user_version = 2;');
  }
}
