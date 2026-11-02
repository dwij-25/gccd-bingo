const { Client } = require('pg');

const DATABASE_URL = 'postgresql://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Neon PostgreSQL.');

    // Check before counts
    const pCountBefore = await client.query('SELECT count(*) FROM gccd_participants');
    const cCountBefore = await client.query('SELECT count(*) FROM gccd_bingo_cards');
    const tCountBefore = await client.query('SELECT count(*) FROM gccd_bingo_tiles');
    console.log('BEFORE RESET:', {
      participants: pCountBefore.rows[0].count,
      cards: cCountBefore.rows[0].count,
      tiles: tCountBefore.rows[0].count
    });

    // Delete in order to satisfy foreign keys
    await client.query('DELETE FROM gccd_bingo_tiles');
    await client.query('DELETE FROM gccd_bingo_cards');
    await client.query('DELETE FROM gccd_participants');

    // Check after counts
    const pCountAfter = await client.query('SELECT count(*) FROM gccd_participants');
    const cCountAfter = await client.query('SELECT count(*) FROM gccd_bingo_cards');
    const tCountAfter = await client.query('SELECT count(*) FROM gccd_bingo_tiles');
    console.log('AFTER RESET:', {
      participants: pCountAfter.rows[0].count,
      cards: cCountAfter.rows[0].count,
      tiles: tCountAfter.rows[0].count
    });

    console.log('All entries successfully reset!');
  } catch (err) {
    console.error('Error resetting database:', err);
  } finally {
    await client.end();
  }
}

main();
