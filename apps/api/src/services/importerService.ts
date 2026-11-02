import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import { Pool } from 'pg';
import sqlite3 from 'sqlite3';
import { config } from '../config.js';

export interface ImportSummary {
  totalRowsRead: number;
  validRecords: number;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  errors: string[];
}

export async function importParticipants(filePath: string): Promise<ImportSummary> {
  const summary: ImportSummary = {
    totalRowsRead: 0,
    validRecords: 0,
    insertedCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    errors: []
  };

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }

  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData: any[] = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

  summary.totalRowsRead = rawData.length;

  const recordsMap = new Map<string, { name: string; email: string; organization: string; role: string }>();

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    let name = '';
    let email = '';
    let organization = 'Community Member';
    let role = 'Attendee';

    for (const key of Object.keys(row)) {
      const k = key.toLowerCase().trim();
      const val = String(row[key] || '').trim();

      if (k.includes('email') || k === 'e-mail' || k === 'mail') {
        email = val.toLowerCase();
      } else if (k.includes('name') || k === 'attendee' || k === 'participant') {
        name = val;
      } else if (k.includes('org') || k.includes('company') || k.includes('college')) {
        organization = val || organization;
      } else if (k.includes('role') || k.includes('ticket')) {
        role = val || role;
      }
    }

    if (!email || !email.includes('@')) {
      summary.skippedCount++;
      continue;
    }

    if (!name) name = email.split('@')[0];
    recordsMap.set(email, { name, email, organization, role });
  }

  summary.validRecords = recordsMap.size;

  if (config.database.url && !config.database.url.includes('sqlite')) {
    const pool = new Pool({ connectionString: config.database.url });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const rec of recordsMap.values()) {
        const query = `
          INSERT INTO participants (name, email, organization, role)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (email) DO UPDATE SET
            name = EXCLUDED.name,
            organization = EXCLUDED.organization,
            role = EXCLUDED.role,
            updated_at = NOW();
        `;
        await client.query(query, [rec.name, rec.email, rec.organization, rec.role]);
        summary.insertedCount++;
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
      await pool.end();
    }
  } else {
    // SQLite Fallback
    const db = new sqlite3.Database(config.database.sqlitePath);
    await new Promise<void>((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        const stmt = db.prepare(`
          INSERT INTO participants (participant_code, name, email, organization, role, registered_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'))
          ON CONFLICT(email) DO UPDATE SET
            name = excluded.name,
            organization = excluded.organization,
            role = excluded.role
        `);

        for (const rec of recordsMap.values()) {
          const code = `GCCD-ATT-${Math.floor(1000 + Math.random() * 9000)}`;
          stmt.run([code, rec.name, rec.email, rec.organization, rec.role]);
          summary.insertedCount++;
        }

        stmt.finalize();
        db.run('COMMIT', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
    db.close();
  }

  return summary;
}
