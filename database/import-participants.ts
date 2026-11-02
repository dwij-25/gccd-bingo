/**
 * GCCD Bingo - Robust Participant Importer Script
 * Loads attendees from an Excel (.xlsx/.xls) or CSV spreadsheet into PostgreSQL/SQLite
 * Features:
 * - Trims input whitespace and normalizes email casing to lowercase
 * - Deduplicates entries and validates email format
 * - Upserts participants: preserves all existing bingo_cards, drafts, and uploaded photos!
 * - Prints a formatted summary audit report
 *
 * Usage:
 *   npx ts-node database/import-participants.ts [path_to_file.xlsx]
 */

import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

interface ParticipantRecord {
  name: string;
  email: string;
  organization?: string;
  role?: string;
}

interface ImportSummary {
  totalRowsRead: number;
  validRecords: number;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  errors: string[];
}

function cleanString(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
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

  console.log(`\n======================================================`);
  console.log(`🚀 Starting Participant Import: ${path.basename(filePath)}`);
  console.log(`======================================================`);

  // 1. Read Workbook
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData: any[] = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

  summary.totalRowsRead = rawData.length;
  console.log(`📊 Found ${rawData.length} rows in sheet '${sheetName}'.`);

  // 2. Identify column mappings (flexible for any spreadsheet headers)
  const recordsMap = new Map<string, ParticipantRecord>();

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    let name = '';
    let email = '';
    let organization = 'Community Attendee';
    let role = 'Attendee';

    for (const key of Object.keys(row)) {
      const k = key.toLowerCase().trim();
      const val = cleanString(row[key]);

      if (k.includes('email') || k === 'e-mail' || k === 'mail') {
        email = val.toLowerCase();
      } else if (k.includes('name') || k === 'attendee' || k === 'participant') {
        name = val;
      } else if (k.includes('org') || k.includes('company') || k.includes('college') || k.includes('university')) {
        organization = val || organization;
      } else if (k.includes('role') || k.includes('ticket') || k.includes('type')) {
        role = val || role;
      }
    }

    if (!email || !isValidEmail(email)) {
      summary.skippedCount++;
      summary.errors.push(`Row ${i + 2}: Invalid or missing email ('${email}')`);
      continue;
    }

    if (!name) {
      name = email.split('@')[0]; // Fallback name from email handle
    }

    // Deduplicate in memory
    recordsMap.set(email, { name, email, organization, role });
  }

  summary.validRecords = recordsMap.size;
  console.log(` Verified ${summary.validRecords} unique valid participant records.`);

  // 3. Database Upsert
  const connectionString = process.env.DATABASE_URL;

  if (connectionString && !connectionString.includes('localhost:5432/gccd_bingo_mock')) {
    const pool = new Pool({ connectionString });
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const record of recordsMap.values()) {
        const query = `
          INSERT INTO participants (name, email, organization, role)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (email) DO UPDATE SET
            name = EXCLUDED.name,
            organization = EXCLUDED.organization,
            role = EXCLUDED.role,
            updated_at = NOW()
          RETURNING (xmax = 0) AS was_inserted;
        `;

        const res = await client.query(query, [
          record.name,
          record.email,
          record.organization,
          record.role
        ]);

        if (res.rows[0]?.was_inserted) {
          summary.insertedCount++;
        } else {
          summary.updatedCount++;
        }
      }

      await client.query('COMMIT');
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('Database transaction error:', err);
      throw err;
    } finally {
      client.release();
      await pool.end();
    }
  } else {
    // SQLite Fallback when PostgreSQL is not configured
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = process.env.SQLITE_DB_PATH || path.resolve(__dirname, '../gccd_bingo.db');
    const db = new sqlite3.Database(dbPath);

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

        for (const record of recordsMap.values()) {
          const code = `GCCD-ATT-${Math.floor(1000 + Math.random() * 9000)}`;
          stmt.run([code, record.name, record.email, record.organization, record.role], function (this: any, err: any) {
            if (err) {
              summary.errors.push(`DB Error for ${record.email}: ${err.message}`);
            } else {
              summary.insertedCount++;
            }
          });
        }

        stmt.finalize();
        db.run('COMMIT', (err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });

    db.close();
  }

  // 4. Output Summary Report
  console.log(`\n======================================================`);
  console.log(`📋 PARTICIPANT IMPORT SUMMARY REPORT`);
  console.log(`======================================================`);
  console.log(`Total Rows Read:      ${summary.totalRowsRead}`);
  console.log(`Valid Unique Records: ${summary.validRecords}`);
  console.log(`Successfully Synced:  ${summary.insertedCount + summary.updatedCount}`);
  console.log(`Skipped / Invalid:    ${summary.skippedCount}`);
  if (summary.errors.length > 0) {
    console.log(`\n⚠️ Noticeable warnings (${summary.errors.length}):`);
    summary.errors.slice(0, 5).forEach(e => console.log(` - ${e}`));
  }
  console.log(`======================================================\n`);

  return summary;
}

// Direct CLI Execution
if (require.main === module) {
  const targetFile = process.argv[2] || path.resolve(__dirname, '../../gccd_participants.xlsx');
  importParticipants(targetFile).catch(err => {
    console.error('Fatal import error:', err);
    process.exit(1);
  });
}
