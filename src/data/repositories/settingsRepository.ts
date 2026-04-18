import {getDatabase} from '../db/database';
import type {Settings} from '../../domain/models';

export async function getSettings(): Promise<Settings> {
  const db = await getDatabase();
  const [res] = await db.executeSql('SELECT * FROM settings WHERE id = 1 LIMIT 1;');
  if (res.rows.length === 0) {
    return {
      id: 1,
      shopName: 'SlipGo',
      logoPath: null,
      taxPercentage: 8.5,
      receiptFooter: 'Fast. Simple. Receipts.',
    };
  }
  const r = res.rows.item(0);
  return {
    id: 1,
    shopName: r.shop_name as string,
    logoPath: (r.logo_path as string | null) ?? null,
    taxPercentage: r.tax_percentage as number,
    receiptFooter: r.receipt_footer as string,
  };
}

export async function updateSettings(partial: Partial<Omit<Settings, 'id'>>): Promise<void> {
  const cur = await getSettings();
  const next = {...cur, ...partial};
  const db = await getDatabase();
  await db.executeSql(
    `UPDATE settings SET shop_name = ?, logo_path = ?, tax_percentage = ?, receipt_footer = ? WHERE id = 1;`,
    [next.shopName, next.logoPath, next.taxPercentage, next.receiptFooter],
  );
}
