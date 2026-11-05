const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is required.');
  process.exit(1);
}

const SHORT_TILES = [
  { index: 0, title: 'Selfie with a speaker', description: 'Selfie with any speaker.' },
  { index: 1, title: 'The full auditorium', description: 'Photo of the audience hall.' },
  { index: 2, title: 'A slide that taught you something', description: 'Photo of an insightful slide.' },
  { index: 3, title: 'Selfie with a volunteer', description: 'Selfie with an event volunteer.' },
  { index: 4, title: 'GDG Cloud Ahmedabad', description: 'Photo at the main stage.' },
  { index: 5, title: 'Selfie with someone new', description: 'Selfie with a fellow attendee.' },
  { index: 6, title: 'Photo booth or standee', description: 'Photo at the event booth.' },
  { index: 7, title: 'A sponsor booth', description: 'Photo at any sponsor booth.' },
  { index: 8, title: 'Selfie with your badge', description: 'Selfie showing your event badge.' }
];

async function updateTitles() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected to database. Updating tile descriptions...');

  for (const t of SHORT_TILES) {
    const res = await client.query(
      `UPDATE gccd_bingo_tiles SET title = $1, description = $2 WHERE tile_index = $3`,
      [t.title, t.description, t.index]
    );
    console.log(`Updated tile #${t.index}: "${t.title}" -> "${t.description}" (${res.rowCount} rows)`);
  }

  await client.end();
  console.log('Done!');
}

updateTitles().catch(err => {
  console.error(err);
  process.exit(1);
});
