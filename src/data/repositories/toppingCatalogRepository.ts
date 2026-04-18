import {getDatabase} from '../db/database';
import type {ToppingCatalogItem} from '../../domain/models';
import {v4 as uuidv4} from 'uuid';

function map(r: Record<string, unknown>): ToppingCatalogItem {
  return {
    id: r.id as string,
    name: r.name as string,
    price: r.price as number,
    sortOrder: r.sort_order as number,
    createdAt: r.created_at as string,
  };
}

export async function getAllToppings(): Promise<ToppingCatalogItem[]> {
  const db = await getDatabase();
  const [res] = await db.executeSql(
    'SELECT * FROM topping_catalog ORDER BY sort_order ASC, name COLLATE NOCASE ASC;',
  );
  const out: ToppingCatalogItem[] = [];
  for (let i = 0; i < res.rows.length; i++) {
    out.push(map(res.rows.item(i)));
  }
  return out;
}

export async function createTopping(name: string, price: number): Promise<ToppingCatalogItem> {
  const db = await getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();
  const [maxRes] = await db.executeSql('SELECT COALESCE(MAX(sort_order), -1) + 1 as n FROM topping_catalog;');
  const sortOrder = maxRes.rows.item(0).n as number;
  await db.executeSql(
    `INSERT INTO topping_catalog (id, name, price, sort_order, created_at) VALUES (?, ?, ?, ?, ?);`,
    [id, name.trim(), price, sortOrder, now],
  );
  const [one] = await db.executeSql('SELECT * FROM topping_catalog WHERE id = ?;', [id]);
  return map(one.rows.item(0));
}

export async function updateTopping(id: string, name: string, price: number): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('UPDATE topping_catalog SET name = ?, price = ? WHERE id = ?;', [name.trim(), price, id]);
}

export async function deleteTopping(id: string): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('DELETE FROM topping_catalog WHERE id = ?;', [id]);
}
