import {isSqliteAvailable} from './database';
import * as sqliteUsers from './usersRepository';
import type {UserRow} from './usersRepository';
import * as asyncUsers from './usersAsyncStorage';

export async function upsertUserForSession(
  phoneNormalized: string,
  displayPhone: string,
): Promise<string> {
  if (isSqliteAvailable()) {
    return sqliteUsers.upsertUser(phoneNormalized, displayPhone);
  }
  return asyncUsers.upsertUser(phoneNormalized, displayPhone);
}

export async function listUsersForSession(): Promise<UserRow[]> {
  if (isSqliteAvailable()) {
    return sqliteUsers.listUsers();
  }
  const rows = await asyncUsers.listUsers();
  return rows.map(r => ({
    id: r.id,
    phone_normalized: r.phone_normalized,
    display_phone: r.display_phone,
    created_at: r.created_at,
  }));
}
