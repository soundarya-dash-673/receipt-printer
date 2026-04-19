import {openDatabase, enablePromise, type SQLiteDatabase} from 'react-native-sqlite-storage';
import {runMigrations} from './databaseMigrations';

enablePromise(true);

const DB_NAME = 'SlipGo.db';

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
