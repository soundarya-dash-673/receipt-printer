import type {SQLiteDatabase} from 'react-native-sqlite-storage';
import {getDatabase} from '../db/database';
import type {OrderEntity, OrderItemEntity} from '../../domain/models';
import {v4 as uuidv4} from 'uuid';

export interface OrderWithItems {
  order: OrderEntity;
  items: OrderItemEntity[];
}

function mapOrder(r: Record<string, unknown>): OrderEntity {
  return {
    id: r.id as string,
    orderNumber: r.order_number as number,
    totalAmount: r.total_amount as number,
    taxAmount: r.tax_amount as number,
    paymentMethod: r.payment_method as string,
    createdAt: r.created_at as string,
    createdByUserId: (r.created_by_user_id as string | null) ?? null,
    note: (r.note as string | null | undefined) ?? null,
  };
}

function mapItem(r: Record<string, unknown>): OrderItemEntity {
  return {
    id: r.id as string,
    orderId: r.order_id as string,
    itemName: r.item_name as string,
    quantity: r.quantity as number,
    price: r.price as number,
  };
}

async function nextOrderNumber(db: SQLiteDatabase): Promise<number> {
  const [res] = await db.executeSql('SELECT COALESCE(MAX(order_number), 0) + 1 as n FROM orders;');
  return res.rows.item(0).n as number;
}

export async function createOrder(
  items: Array<{itemName: string; quantity: number; unitPrice: number}>,
  paymentMethod: string,
  createdByUserId: string | null,
  subtotal: number,
  taxAmount: number,
  totalAmount: number,
  note: string | null,
): Promise<OrderWithItems> {
  const db = await getDatabase();
  const orderId = uuidv4();
  const orderNumber = await nextOrderNumber(db);
  const now = new Date().toISOString();

  await db.executeSql('BEGIN IMMEDIATE;');
  try {
    await db.executeSql(
      `INSERT INTO orders (id, order_number, total_amount, tax_amount, payment_method, created_at, created_by_user_id, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [orderId, orderNumber, totalAmount, taxAmount, paymentMethod, now, createdByUserId, note],
    );

    const itemRows: OrderItemEntity[] = [];
    for (const line of items) {
      const itemId = uuidv4();
      await db.executeSql(
        `INSERT INTO order_items (id, order_id, item_name, quantity, price) VALUES (?, ?, ?, ?, ?);`,
        [itemId, orderId, line.itemName, line.quantity, line.unitPrice],
      );
      itemRows.push({
        id: itemId,
        orderId,
        itemName: line.itemName,
        quantity: line.quantity,
        price: line.unitPrice,
      });
    }

    await db.executeSql('COMMIT;');

    return {
      order: {
        id: orderId,
        orderNumber,
        totalAmount,
        taxAmount,
        paymentMethod,
        createdAt: now,
        createdByUserId,
        note,
      },
      items: itemRows,
    };
  } catch (e) {
    await db.executeSql('ROLLBACK;');
    throw e;
  }
}

export async function getOrderById(id: string): Promise<OrderWithItems | null> {
  const db = await getDatabase();
  const [oRes] = await db.executeSql('SELECT * FROM orders WHERE id = ?;', [id]);
  if (oRes.rows.length === 0) {
    return null;
  }
  const order = mapOrder(oRes.rows.item(0));
  const [iRes] = await db.executeSql('SELECT * FROM order_items WHERE order_id = ? ORDER BY rowid;', [id]);
  const items: OrderItemEntity[] = [];
  for (let i = 0; i < iRes.rows.length; i++) {
    items.push(mapItem(iRes.rows.item(i)));
  }
  return {order, items};
}

export async function listOrders(limit = 500): Promise<OrderEntity[]> {
  const db = await getDatabase();
  const [res] = await db.executeSql(
    'SELECT * FROM orders ORDER BY datetime(created_at) DESC LIMIT ?;',
    [limit],
  );
  const out: OrderEntity[] = [];
  for (let i = 0; i < res.rows.length; i++) {
    out.push(mapOrder(res.rows.item(i)));
  }
  return out;
}

export async function listOrdersInRange(startIso: string, endIso: string): Promise<OrderEntity[]> {
  const db = await getDatabase();
  const [res] = await db.executeSql(
    `SELECT * FROM orders WHERE created_at >= ? AND created_at <= ? ORDER BY datetime(created_at) DESC;`,
    [startIso, endIso],
  );
  const out: OrderEntity[] = [];
  for (let i = 0; i < res.rows.length; i++) {
    out.push(mapOrder(res.rows.item(i)));
  }
  return out;
}

export async function aggregateRange(startIso: string, endIso: string): Promise<{sum: number; count: number}> {
  const db = await getDatabase();
  const [res] = await db.executeSql(
    `SELECT COALESCE(SUM(total_amount), 0) as s, COUNT(*) as c FROM orders WHERE created_at >= ? AND created_at <= ?;`,
    [startIso, endIso],
  );
  const row = res.rows.item(0);
  return {sum: row.s as number, count: row.c as number};
}

export async function deleteOrder(id: string): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('DELETE FROM orders WHERE id = ?;', [id]);
}
