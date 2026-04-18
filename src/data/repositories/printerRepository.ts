import {getDatabase} from '../db/database';
import type {PrinterRecord} from '../../domain/models';
import {v4 as uuidv4} from 'uuid';

function map(r: Record<string, unknown>): PrinterRecord {
  return {
    id: r.id as string,
    name: r.name as string,
    bluetoothAddress: r.bluetooth_address as string,
  };
}

export async function getAllPrinters(): Promise<PrinterRecord[]> {
  const db = await getDatabase();
  const [res] = await db.executeSql('SELECT * FROM printers ORDER BY name COLLATE NOCASE;');
  const out: PrinterRecord[] = [];
  for (let i = 0; i < res.rows.length; i++) {
    out.push(map(res.rows.item(i)));
  }
  return out;
}

export async function savePrinter(name: string, bluetoothAddress: string, id?: string): Promise<PrinterRecord> {
  const db = await getDatabase();
  const pid = id ?? uuidv4();
  await db.executeSql(
    `INSERT OR REPLACE INTO printers (id, name, bluetooth_address) VALUES (?, ?, ?);`,
    [pid, name, bluetoothAddress],
  );
  const [res] = await db.executeSql('SELECT * FROM printers WHERE id = ?;', [pid]);
  return map(res.rows.item(0));
}

export async function deletePrinter(id: string): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('DELETE FROM printers WHERE id = ?;', [id]);
}
