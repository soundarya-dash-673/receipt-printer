import AsyncStorage from '@react-native-async-storage/async-storage';
import {v4 as uuidv4} from 'uuid';

const USERS_KEY = '@slipgo_users_sqlite_fallback';

type UserRecord = {
  id: string;
  phone_normalized: string;
  display_phone: string;
  created_at: string;
};

async function readAll(): Promise<UserRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(rows: UserRecord[]): Promise<void> {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(rows));
}

/** AsyncStorage-backed user store when SQLite native module is unavailable. */
export async function upsertUser(
  phoneNormalized: string,
  displayPhone: string,
): Promise<string> {
  const rows = await readAll();
  const existing = rows.find(r => r.phone_normalized === phoneNormalized);
  if (existing) {
    existing.display_phone = displayPhone;
    await writeAll(rows);
    return existing.id;
  }
  const id = uuidv4();
  rows.push({
    id,
    phone_normalized: phoneNormalized,
    display_phone: displayPhone,
    created_at: new Date().toISOString(),
  });
  await writeAll(rows);
  return id;
}

export async function listUsers(): Promise<UserRecord[]> {
  const rows = await readAll();
  return [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at));
}
