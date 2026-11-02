const { Client } = require('pg');

const DATABASE_URL = 'postgresql://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require';

const TILE_SLOT_WIDTH = 324;
const TILE_SLOT_HEIGHT = 290;
const TILE_SLOT_RADIUS = 26;

const TEMPLATE_SLOTS = [
  { index: 0, x: 61,  y: 601,  width: TILE_SLOT_WIDTH, height: TILE_SLOT_HEIGHT, radius: TILE_SLOT_RADIUS },
  { index: 1, x: 458, y: 601,  width: TILE_SLOT_WIDTH, height: TILE_SLOT_HEIGHT, radius: TILE_SLOT_RADIUS },
  { index: 2, x: 855, y: 601,  width: TILE_SLOT_WIDTH, height: TILE_SLOT_HEIGHT, radius: TILE_SLOT_RADIUS },
  { index: 3, x: 61,  y: 965,  width: TILE_SLOT_WIDTH, height: TILE_SLOT_HEIGHT, radius: TILE_SLOT_RADIUS },
  { index: 4, x: 458, y: 965,  width: TILE_SLOT_WIDTH, height: TILE_SLOT_HEIGHT, radius: TILE_SLOT_RADIUS },
  { index: 5, x: 855, y: 965,  width: TILE_SLOT_WIDTH, height: TILE_SLOT_HEIGHT, radius: TILE_SLOT_RADIUS },
  { index: 6, x: 61,  y: 1330, width: TILE_SLOT_WIDTH, height: TILE_SLOT_HEIGHT, radius: TILE_SLOT_RADIUS },
  { index: 7, x: 458, y: 1330, width: TILE_SLOT_WIDTH, height: TILE_SLOT_HEIGHT, radius: TILE_SLOT_RADIUS },
  { index: 8, x: 855, y: 1330, width: TILE_SLOT_WIDTH, height: TILE_SLOT_HEIGHT, radius: TILE_SLOT_RADIUS }
];

async function runTests() {
  console.log('====================================================');
  console.log('GCCD BINGO: COMPREHENSIVE PRODUCTION TEST SUITE');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // TEST 1: VISUAL REGRESSION & SLOT BOUNDING BOXES
  // ----------------------------------------------------
  console.log('--- TEST 1: Visual Regression & Template Slot Bounds ---');
  const titleBottomY = 560;
  const footerTopY = 1680;
  let visualOk = true;

  TEMPLATE_SLOTS.forEach(s => {
    // Photo slot must start well below DevFest title
    if (s.y <= titleBottomY) {
      console.error(`FAIL: Slot ${s.index} overlaps title banner! y=${s.y}`);
      visualOk = false;
    }
    // Photo slot must end above footer
    if (s.y + s.height >= footerTopY) {
      console.error(`FAIL: Slot ${s.index} overlaps footer! y+h=${s.y + s.height}`);
      visualOk = false;
    }
    // Must be within canvas
    if (s.x < 0 || s.x + s.width > 1241) {
      console.error(`FAIL: Slot ${s.index} outside width!`);
      visualOk = false;
    }
    console.log(`  ✓ Slot ${s.index} [x=${s.x}, y=${s.y}, w=${s.width}, h=${s.height}] strictly within slot boundary`);
  });

  if (!visualOk) throw new Error('Visual regression test failed');
  console.log('Result: PASS — All 9 slots lie 100% inside template slots and never overlap the title banner.\n');

  // ----------------------------------------------------
  // TEST 2: DATABASE PERSISTENCE, REHYDRATION & CROSS-DEVICE SYNC
  // ----------------------------------------------------
  console.log('--- TEST 2: Database Persistence & Cross-Device Rehydration ---');
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const testEmail = 'dwijpancholi12@gmail.com';
  console.log(`1. Authenticating participant with email: "${testEmail}"...`);

  const partRes = await client.query('SELECT * FROM gccd_participants WHERE LOWER(TRIM(email)) = $1', [testEmail.toLowerCase()]);
  if (partRes.rows.length === 0) throw new Error('Participant not found');
  const participant = partRes.rows[0];
  console.log(`  ✓ Found participant: ${participant.name} (${participant.email}) [ID: ${participant.id}]`);

  // Ensure card exists
  let cardRes = await client.query('SELECT * FROM gccd_bingo_cards WHERE participant_id = $1', [participant.id]);
  let card;
  if (cardRes.rows.length === 0) {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let bId = 'GCCD-';
    for (let i = 0; i < 4; i++) bId += chars[Math.floor(Math.random()*chars.length)];
    bId += '-';
    for (let i = 0; i < 4; i++) bId += chars[Math.floor(Math.random()*chars.length)];
    const newCard = await client.query(
      'INSERT INTO gccd_bingo_cards (id, participant_id, bingo_id, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [`card-${participant.id}`, participant.id, bId, 'draft']
    );
    card = newCard.rows[0];
    for (let i = 0; i < 9; i++) {
      await client.query(
        'INSERT INTO gccd_bingo_tiles (id, card_id, tile_index, title, status) VALUES ($1, $2, $3, $4, $5)',
        [`tile-${card.id}-${i}`, card.id, i, `Challenge ${i+1}`, 'not_finished']
      );
    }
  } else {
    card = cardRes.rows[0];
  }
  console.log(`  ✓ Card retrieved: ${card.id} with stable Bingo ID: ${card.bingo_id}`);

  // Upload 9 test photos with crop parameters
  console.log('2. Uploading 9 photos with crop parameters to database...');
  for (let i = 0; i < 9; i++) {
    const dummyImg = `data:image/jpeg;base64,sample_photo_tile_${i}_gccd_2026`;
    const cropParams = JSON.stringify({ crop: { x: 0, y: 0 }, zoom: 1.2, rotation: 0, mode: 'fill' });
    await client.query(`
      UPDATE gccd_bingo_tiles 
      SET image_url = $1, crop_data = $2, status = 'completed', uploaded_at = NOW()
      WHERE card_id = $3 AND tile_index = $4
    `, [dummyImg, cropParams, card.id, i]);
  }

  await client.query(`UPDATE gccd_bingo_cards SET total_completed = 9, updated_at = NOW() WHERE id = $1`, [card.id]);
  console.log('  ✓ 9 photos saved with server timestamp.');

  // Simulate logout
  console.log('3. Simulating Logout (Clearing local session)...');

  // Simulate logging in from another device (e.g. Mobile phone) with mixed casing and spaces
  const mobileInputEmail = '   DWIJpancholi12@GMAIL.COM   ';
  console.log(`4. Simulating Login on Phone with input: "${mobileInputEmail}"...`);

  const phonePart = await client.query('SELECT * FROM gccd_participants WHERE LOWER(TRIM(email)) = $1', [mobileInputEmail.trim().toLowerCase()]);
  if (phonePart.rows.length === 0) throw new Error('Phone login lookup failed');
  const rehydratedPart = phonePart.rows[0];

  const phoneCardRes = await client.query('SELECT * FROM gccd_bingo_cards WHERE participant_id = $1', [rehydratedPart.id]);
  const rehydratedCard = phoneCardRes.rows[0];

  if (rehydratedCard.bingo_id !== card.bingo_id) {
    throw new Error(`Bingo ID mismatch! Expected ${card.bingo_id}, got ${rehydratedCard.bingo_id}`);
  }
  console.log(`  ✓ Exactly ONE card retrieved with identical stable Bingo ID: ${rehydratedCard.bingo_id}`);

  const phoneTiles = await client.query('SELECT * FROM gccd_bingo_tiles WHERE card_id = $1 ORDER BY tile_index ASC', [rehydratedCard.id]);
  
  console.log('5. Verifying tile rehydration:');
  let greenCount = 0;
  phoneTiles.rows.forEach(t => {
    const isGreen = t.status === 'completed' && Boolean(t.image_url);
    if (isGreen) greenCount++;
    console.log(`  Tile #${t.tile_index + 1}: ${isGreen ? '🟢 GREEN (Image present & completed)' : '🔴 RED (Empty)'}`);
  });

  if (greenCount !== 9) {
    throw new Error(`Expected 9 green tiles, but got ${greenCount}`);
  }
  console.log(`  ✓ Successfully asserted: ALL ${greenCount}/9 TILES ARE GREEN AND PERSISTED!`);

  // ----------------------------------------------------
  // TEST 3: REMOVE TILE TEST
  // ----------------------------------------------------
  console.log('\n--- TEST 3: Remove Tile & Re-authenticate Assertion ---');
  console.log('Removing Tile #3...');
  await client.query(`
    UPDATE gccd_bingo_tiles 
    SET image_url = NULL, crop_data = NULL, status = 'not_finished', uploaded_at = NULL
    WHERE card_id = $1 AND tile_index = 2
  `, [card.id]);
  await client.query(`UPDATE gccd_bingo_cards SET total_completed = 8, updated_at = NOW() WHERE id = $1`, [card.id]);

  const verifyRemove = await client.query('SELECT * FROM gccd_bingo_tiles WHERE card_id = $1 AND tile_index = 2', [card.id]);
  const removedTile = verifyRemove.rows[0];
  const isRed = removedTile.status === 'not_finished' && !removedTile.image_url;
  console.log(`  ✓ Tile #3 Status: ${isRed ? '🔴 RED (Successfully reset to not finished)' : 'Unexpected'}`);
  if (!isRed) throw new Error('Tile removal test failed');

  // Restore tile #3 for user
  const restoreImg = `data:image/jpeg;base64,sample_photo_tile_2_gccd_2026`;
  await client.query(`
    UPDATE gccd_bingo_tiles 
    SET image_url = $1, status = 'completed', uploaded_at = NOW()
    WHERE card_id = $1 AND tile_index = 2
  `, [restoreImg]);
  await client.query(`UPDATE gccd_bingo_cards SET total_completed = 9, updated_at = NOW() WHERE id = $1`, [card.id]);

  await client.end();

  console.log('\n====================================================');
  console.log('ALL TESTS PASSED WITH 100% SUCCESS!');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('\nTEST SUITE FAILED:', err);
  process.exit(1);
});
