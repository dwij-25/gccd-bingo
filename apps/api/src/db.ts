import { Pool } from 'pg';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { config } from './config.js';

let pgPool: Pool | null = null;
let sqliteDb: sqlite3.Database | null = null;

const isPostgres = Boolean(config.database.url && !config.database.url.includes('sqlite'));

if (isPostgres) {
  pgPool = new Pool({
    connectionString: config.database.url,
    ssl: config.isProduction ? { rejectUnauthorized: false } : undefined
  });
  console.log(' Using PostgreSQL Connection Pool');
} else {
  const dbDir = path.dirname(config.database.sqlitePath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  sqliteDb = new sqlite3.Database(config.database.sqlitePath);
  console.log(` Using SQLite Database at: ${config.database.sqlitePath}`);
}

export const db = {
  isPostgres,
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (isPostgres && pgPool) {
      const res = await pgPool.query(sql, params);
      return res.rows as T[];
    } else if (sqliteDb) {
      // Convert $1, $2 to ? for SQLite compatibility
      const sqliteSql = sql.replace(/\$(\d+)/g, '?');
      return new Promise<T[]>((resolve, reject) => {
        // Distinguish SELECT vs INSERT/UPDATE/DELETE
        const trimmed = sqliteSql.trim().toUpperCase();
        if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA')) {
          sqliteDb!.all(sqliteSql, params, (err, rows) => {
            if (err) reject(err);
            else resolve((rows || []) as T[]);
          });
        } else {
          sqliteDb!.run(sqliteSql, params, function (this: any, err) {
            if (err) reject(err);
            else resolve([{ id: this.lastID, changes: this.changes }] as any);
          });
        }
      });
    }
    return [];
  },

  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }
};
