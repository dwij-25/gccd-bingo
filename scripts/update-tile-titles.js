const { Client } = require('pg');

const DATABASE_URL = 'postgresql://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require';

const NEW_TILES = [
  { index: 0, title: 'Selfie with a speaker', description: 'Find a session speaker, thank them for their talk, and take a photo together.' },
  { index: 1, title: 'The full auditorium', description: 'Capture a photo of the main hall or auditorium filled with attendees.' },
  { index: 2, title: 'A slide that taught you something', description: 'Take a picture of a slide from a keynote or session that taught you something new.' },
  { index: 3, title: 'Selfie with a volunteer', description: 'Say hi to an event volunteer or organizer and snap a selfie.' },
  { index: 4, title: 'GDG Cloud Ahmedabad', description: 'Take a photo at the official Google Developer Groups Cloud Ahmedabad stage or backdrop.' },
  { index: 5, title: 'Selfie with someone new', description: 'Network with a fellow community member you have not met before and take a selfie.' },
  { index: 6, title: 'Photo booth or standee', description: 'Strike a pose and take a picture at the official event photo booth or event standee.' },
  { index: 7, title: 'A sponsor booth', description: 'Visit our partner exhibition booths and take a picture at a sponsor booth.' },
  { index: 8, title: 'Selfie with your badge', description: 'Proudly show off your official event attendee badge with a selfie.' }
];

async function updateTitles() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected to database. Updating tile titles...');

  for (const t of NEW_TILES) {
    const res = await client.query(
      `UPDATE gccd_bingo_tiles SET title = $1, description = $2 WHERE tile_index = $3`,
      [t.title, t.description, t.index]
    );
    console.log(`Updated tile index ${t.index} -> "${t.title}" (${res.rowCount} rows)`);
  }

  await client.end();
  console.log('Done!');
}

updateTitles().catch(err => {
  console.error(err);
  process.exit(1);
});
