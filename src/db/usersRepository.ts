import {v4 as uuidv4} from 'uuid';
import {getDb} from './database';

/**
 * Creates or updates the row for this phone and returns stable user id.
 * Only call when SQLite is available.
 */
export function upsertUser(phoneNormalized: string, displayPhone: string): string {
  const db = getDb();
  if (!db) {
    throw new Error('SQLite not available');
  }
  const sel = db.execute('SELECT id FROM users WHERE phone_normalized = ? LIMIT 1', [
    phoneNormalized,
  ]);
  const existing = sel.rows?._array?.[0]?.id as string | undefined;
  if (existing) {
    db.execute('UPDATE users SET display_phone = ? WHERE id = ?', [displayPhone, existing]);
    return existing;
  }
  const id = uuidv4();
  const now = new Date().toISOString();
  db.execute(
    'INSERT INTO users (id, phone_normalized, display_phone, created_at) VALUES (?, ?, ?, ?)',
    [id, phoneNormalized, displayPhone, now],
  );
  return id;
}

export interface UserRow {
  id: string;
  phone_normalized: string;
  display_phone: string;
  created_at: string;
}

export function getUserById(id: string): UserRow | null {
  const db = getDb();
  if (!db) {
    return null;
  }
  const r = db.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
  const row = r.rows?._array?.[0];
  return row ?? null;
}

export function listUsers(): UserRow[] {
  const db = getDb();
  if (!db) {
    return [];
  }
  const r = db.execute('SELECT * FROM users ORDER BY created_at DESC');
  return (r.rows?._array ?? []) as UserRow[];
}
