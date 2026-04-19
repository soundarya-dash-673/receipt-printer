import initSqlJs from 'sql.js';
import type {Database as SqlJsDatabase} from 'sql.js';
import type {ResultSet, SQLiteDatabase} from 'react-native-sqlite-storage';
import {runMigrations} from './databaseMigrations';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm';

function wrapRows(data: Record<string, unknown>[]): ResultSet {
  return {
    insertId: 0,
    rowsAffected: 0,
    rows: {
      length: data.length,
      item: (i: number) => data[i],
      raw: () => data,
    },
  };
}

function emptyMutationResult(): ResultSet {
  return {
    insertId: 0,
    rowsAffected: 1,
    rows: {
      length: 0,
      item: () => ({}),
      raw: () => [],
    },
  };
}

class WebSqliteDatabase {
  constructor(private readonly sqlDb: SqlJsDatabase) {}

  executeSql(sql: string, params: unknown[] = []): Promise<[ResultSet]> {
    const trimmed = sql.trim();
    const head = trimmed.split(/\s+/)[0]?.toUpperCase() ?? '';
    const isQuery =
      head === 'SELECT' || head === 'PRAGMA' || head === 'WITH' || head === 'EXPLAIN';

    if (isQuery) {
      const stmt = this.sqlDb.prepare(sql);
      try {
        if (params?.length) {
          stmt.bind(params as never[]);
        }
        const rows: Record<string, unknown>[] = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject() as Record<string, unknown>);
        }
        return Promise.resolve([wrapRows(rows)]);
      } finally {
        stmt.free();
      }
    }

    this.sqlDb.run(sql, params as never[]);
    return Promise.resolve([emptyMutationResult()]);
  }
}

let sqlFactory: Awaited<ReturnType<typeof initSqlJs>> | undefined;
let cached: SQLiteDatabase | null = null;

async function getSqlFactory() {
  if (!sqlFactory) {
    sqlFactory = await initSqlJs({
      locateFile: () => sqlWasmUrl,
    });
  }
  return sqlFactory;
}

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (cached) {
    return cached;
  }
  const SQL = await getSqlFactory();
  const sqlDb = new SQL.Database();
  const impl = new WebSqliteDatabase(sqlDb);
  await impl.executeSql('PRAGMA foreign_keys = ON;');
  await runMigrations(impl as unknown as SQLiteDatabase);
  cached = impl as unknown as SQLiteDatabase;
  return cached;
}
