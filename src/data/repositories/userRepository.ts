import {getDatabase, hashPin} from '../db/database';
import type {User, UserRole} from '../../domain/models';
import {v4 as uuidv4} from 'uuid';

function mapUser(r: Record<string, unknown>): User {
  return {
    id: r.id as string,
    name: r.name as string,
    role: r.role as UserRole,
    pinHash: r.pin_hash as string,
    createdAt: r.created_at as string,
  };
}

export async function getAllUsers(): Promise<User[]> {
  const db = await getDatabase();
  const [res] = await db.executeSql('SELECT * FROM users ORDER BY name COLLATE NOCASE;');
  const out: User[] = [];
  for (let i = 0; i < res.rows.length; i++) {
    out.push(mapUser(res.rows.item(i)));
  }
  return out;
}

export async function getUserById(id: string): Promise<User | null> {
  const db = await getDatabase();
  const [res] = await db.executeSql('SELECT * FROM users WHERE id = ? LIMIT 1;', [id]);
  if (res.rows.length === 0) {
    return null;
  }
  return mapUser(res.rows.item(0));
}

export async function verifyPin(userId: string, pin: string): Promise<boolean> {
  const user = await getUserById(userId);
  if (!user) {
    return false;
  }
  return user.pinHash === hashPin(pin);
}

export async function createUser(name: string, role: UserRole, pin: string): Promise<User> {
  const db = await getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();
  await db.executeSql(
    'INSERT INTO users (id, name, role, pin_hash, created_at) VALUES (?, ?, ?, ?, ?);',
    [id, name, role, hashPin(pin), now],
  );
  return (await getUserById(id))!;
}

export async function updateUser(id: string, name: string, role: UserRole, pin?: string): Promise<void> {
  const db = await getDatabase();
  if (pin) {
    await db.executeSql('UPDATE users SET name = ?, role = ?, pin_hash = ? WHERE id = ?;', [
      name,
      role,
      hashPin(pin),
      id,
    ]);
  } else {
    await db.executeSql('UPDATE users SET name = ?, role = ? WHERE id = ?;', [name, role, id]);
  }
}

export async function deleteUser(id: string): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('DELETE FROM users WHERE id = ?;', [id]);
}
