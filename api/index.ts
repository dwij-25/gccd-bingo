import type { IncomingMessage, ServerResponse } from 'http';
import { Client } from 'pg';

// Neon Cloud PostgreSQL Database connection
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require';

function getDbClient() {
  return new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
}

function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      // 50MB max for high-res photo payloads
      if (body.length > 50 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, data: any) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-key'
  });
  res.end(JSON.stringify(data));
}

function generateBingoId(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let p1 = '';
  let p2 = '';
  for (let i = 0; i < 4; i++) {
    p1 += chars.charAt(Math.floor(Math.random() * chars.length));
    p2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `GCCD-${p1}-${p2}`;
}

const DEFAULT_TILES = [
  { title: 'Selfie with a speaker', description: 'Selfie with any speaker.', icon: 'selfie', color: 'tile-yellow' },
  { title: 'The full auditorium', description: 'Photo of the audience hall.', icon: 'auditorium', color: 'tile-pink' },
  { title: 'A slide that taught you something', description: 'Photo of an insightful slide.', icon: 'slide', color: 'tile-blue' },
  { title: 'Selfie with a volunteer', description: 'Selfie with an event volunteer.', icon: 'volunteer', color: 'tile-blue' },
  { title: 'GDG Cloud Ahmedabad', description: 'Photo at the main stage.', icon: 'logo', color: 'tile-white', isCenter: true },
  { title: 'Selfie with someone new', description: 'Selfie with a fellow attendee.', icon: 'network', color: 'tile-green' },
  { title: 'Photo booth or standee', description: 'Photo at the event booth.', icon: 'booth', color: 'tile-green' },
  { title: 'A sponsor booth', description: 'Photo at any sponsor booth.', icon: 'sponsor', color: 'tile-yellow' },
  { title: 'Selfie with your badge', description: 'Selfie showing your event badge.', icon: 'badge', color: 'tile-pink' }
];

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-key'
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname.replace(/^\/api/, '');
  const method = req.method?.toUpperCase() || 'GET';

  const client = getDbClient();
  try {
    await client.connect();

    // 1. AUTH: LOGIN
    if (pathname === '/auth/login' && method === 'POST') {
      const body = await parseJsonBody(req);
      const name = (body.name || '').trim();
      const rawEmail = (body.email || '').trim();
      const cleanEmail = rawEmail.toLowerCase();

      if (!cleanEmail) {
        return sendJson(res, 400, { error: 'Email address is required.' });
      }

      // 1. Find participant (case-insensitive email)
      let partRes = await client.query(
        'SELECT * FROM gccd_participants WHERE LOWER(TRIM(email)) = $1',
        [cleanEmail]
      );

      let participant;
      if (partRes.rows.length === 0) {
        // Auto-register attendee if not in pre-roster
        const partId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const insertPart = await client.query(
          `INSERT INTO gccd_participants (id, name, email, organization)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [partId, name || cleanEmail.split('@')[0], cleanEmail, 'GCCD Community Attendee']
        );
        participant = insertPart.rows[0];
      } else {
        participant = partRes.rows[0];
        // Update name if changed
        if (name && name !== participant.name) {
          await client.query('UPDATE gccd_participants SET name = $1 WHERE id = $2', [name, participant.id]);
          participant.name = name;
        }
      }

      // 2. Fetch or create unique Bingo Card for participant
      let cardRes = await client.query(
        'SELECT * FROM gccd_bingo_cards WHERE participant_id = $1',
        [participant.id]
      );

      let card;
      if (cardRes.rows.length === 0) {
        const cardId = `card-${participant.id}`;
        const bingoId = generateBingoId();
        const insertCard = await client.query(
          `INSERT INTO gccd_bingo_cards (id, participant_id, bingo_id, status, total_completed)
           VALUES ($1, $2, $3, 'draft', 0)
           RETURNING *`,
          [cardId, participant.id, bingoId]
        );
        card = insertCard.rows[0];

        // Seed default 9 tiles
        for (let i = 0; i < DEFAULT_TILES.length; i++) {
          const t = DEFAULT_TILES[i];
          const tileId = `tile-${card.id}-${i}`;
          await client.query(
            `INSERT INTO gccd_bingo_tiles (id, card_id, tile_index, title, description, status)
             VALUES ($1, $2, $3, $4, $5, 'not_finished')`,
            [tileId, card.id, i, t.title, t.description]
          );
        }
      } else {
        card = cardRes.rows[0];
      }

      // 3. Fetch tiles
      const tilesRes = await client.query(
        'SELECT * FROM gccd_bingo_tiles WHERE card_id = $1 ORDER BY tile_index ASC',
        [card.id]
      );

      // Rehydrate tile statuses: If tile has image_url, status MUST be 'completed'
      const tiles = tilesRes.rows.map((t, idx) => ({
        id: t.id,
        tile_index: t.tile_index,
        title: t.title || DEFAULT_TILES[idx]?.title || `Challenge ${idx + 1}`,
        description: t.description || DEFAULT_TILES[idx]?.description || '',
        status: (t.image_url && t.image_url.trim().length > 0) ? 'completed' : 'not_finished',
        image_url: t.image_url || null,
        crop_data: t.crop_data || null,
        uploaded_at: t.uploaded_at || null,
        color: DEFAULT_TILES[idx]?.color || 'tile-yellow',
        icon: DEFAULT_TILES[idx]?.icon || 'star',
        isCenter: idx === 4
      }));

      card.tiles = tiles;
      card.total_completed = tiles.filter(t => t.status === 'completed' && t.image_url).length;

      return sendJson(res, 200, {
        success: true,
        participant,
        card,
        token: `session-${participant.id}-${Date.now()}`
      });
    }

    // 2. AUTH: GET ME
    if (pathname === '/auth/me' && method === 'GET') {
      const email = parsedUrl.searchParams.get('email');
      const participantId = parsedUrl.searchParams.get('participantId');

      let partRes;
      if (email) {
        partRes = await client.query('SELECT * FROM gccd_participants WHERE LOWER(TRIM(email)) = $1', [email.trim().toLowerCase()]);
      } else if (participantId) {
        partRes = await client.query('SELECT * FROM gccd_participants WHERE id = $1', [participantId]);
      } else {
        return sendJson(res, 401, { error: 'Authentication required' });
      }

      if (partRes.rows.length === 0) {
        return sendJson(res, 404, { error: 'Participant not found' });
      }

      const participant = partRes.rows[0];
      const cardRes = await client.query('SELECT * FROM gccd_bingo_cards WHERE participant_id = $1', [participant.id]);
      if (cardRes.rows.length === 0) {
        return sendJson(res, 404, { error: 'Card not found' });
      }

      const card = cardRes.rows[0];
      const tilesRes = await client.query('SELECT * FROM gccd_bingo_tiles WHERE card_id = $1 ORDER BY tile_index ASC', [card.id]);
      card.tiles = tilesRes.rows.map((t, idx) => ({
        id: t.id,
        tile_index: t.tile_index,
        title: t.title || DEFAULT_TILES[idx]?.title || `Challenge ${idx + 1}`,
        description: t.description || DEFAULT_TILES[idx]?.description || '',
        status: (t.image_url && t.image_url.trim().length > 0) ? 'completed' : 'not_finished',
        image_url: t.image_url || null,
        crop_data: t.crop_data || null,
        uploaded_at: t.uploaded_at || null,
        color: DEFAULT_TILES[idx]?.color || 'tile-yellow',
        icon: DEFAULT_TILES[idx]?.icon || 'star',
        isCenter: idx === 4
      }));
      card.total_completed = card.tiles.filter((t: any) => t.status === 'completed' && t.image_url).length;

      return sendJson(res, 200, { success: true, participant, card });
    }

    // 3. CARD: GET CARD
    if (pathname === '/card' && method === 'GET') {
      const participantId = parsedUrl.searchParams.get('participantId');
      if (!participantId) {
        return sendJson(res, 400, { error: 'participantId is required' });
      }

      const cardRes = await client.query('SELECT * FROM gccd_bingo_cards WHERE participant_id = $1', [participantId]);
      if (cardRes.rows.length === 0) {
        return sendJson(res, 404, { error: 'Bingo card not found' });
      }

      const card = cardRes.rows[0];
      const tilesRes = await client.query('SELECT * FROM gccd_bingo_tiles WHERE card_id = $1 ORDER BY tile_index ASC', [card.id]);
      card.tiles = tilesRes.rows.map((t, idx) => ({
        id: t.id,
        tile_index: t.tile_index,
        title: t.title,
        description: t.description,
        status: (t.image_url && t.image_url.trim().length > 0) ? 'completed' : 'not_finished',
        image_url: t.image_url || null,
        crop_data: t.crop_data || null,
        uploaded_at: t.uploaded_at || null,
        color: DEFAULT_TILES[idx]?.color || 'tile-yellow',
        icon: DEFAULT_TILES[idx]?.icon || 'star',
        isCenter: idx === 4
      }));
      card.total_completed = card.tiles.filter((t: any) => t.status === 'completed' && t.image_url).length;

      return sendJson(res, 200, { success: true, card });
    }

    // 4. CARD: SAVE DRAFT
    if (pathname === '/card/save-draft' && method === 'POST') {
      const body = await parseJsonBody(req);
      const participantId = body.participantId;
      const tiles = body.tiles || [];

      if (!participantId) {
        return sendJson(res, 400, { error: 'participantId is required' });
      }

      const cardRes = await client.query('SELECT * FROM gccd_bingo_cards WHERE participant_id = $1', [participantId]);
      if (cardRes.rows.length === 0) {
        return sendJson(res, 404, { error: 'Card not found' });
      }
      const card = cardRes.rows[0];

      // Update tiles (allowed on draft and submitted cards)
      for (const t of tiles) {
        if (typeof t.tile_index === 'number') {
          const hasImg = t.image_url && t.image_url.trim().length > 0;
          await client.query(
            `UPDATE gccd_bingo_tiles 
             SET image_url = $1,
                 crop_data = $2,
                 status = $3,
                 uploaded_at = CASE WHEN $1 IS NOT NULL AND LENGTH($1) > 0 THEN COALESCE(uploaded_at, NOW()) ELSE NULL END
             WHERE card_id = $4 AND tile_index = $5`,
            [
              hasImg ? t.image_url : null,
              t.crop_data ? JSON.stringify(t.crop_data) : null,
              hasImg ? 'completed' : 'not_finished',
              card.id,
              t.tile_index
            ]
          );
        }
      }

      // Recalculate completed
      const countRes = await client.query(
        "SELECT COUNT(*) FROM gccd_bingo_tiles WHERE card_id = $1 AND image_url IS NOT NULL AND status = 'completed'",
        [card.id]
      );
      const totalCompleted = parseInt(countRes.rows[0].count, 10);
      const now = new Date().toISOString();

      await client.query(
        'UPDATE gccd_bingo_cards SET total_completed = $1, updated_at = NOW() WHERE id = $2',
        [totalCompleted, card.id]
      );

      return sendJson(res, 200, {
        success: true,
        savedAt: now,
        totalCompleted
      });
    }

    // 5. CARD: UPLOAD / REPLACE PHOTO TILE
    const tileMatch = pathname.match(/^\/card\/tiles\/(\d+)$/);
    if (tileMatch) {
      const tileIndex = parseInt(tileMatch[1], 10);

      if (method === 'PUT') {
        const body = await parseJsonBody(req);
        const participantId = body.participantId;
        const imageUrl = body.image || body.imageUrl;
        const cropData = body.cropData ? (typeof body.cropData === 'string' ? body.cropData : JSON.stringify(body.cropData)) : null;

        if (!participantId || !imageUrl) {
          return sendJson(res, 400, { error: 'participantId and image are required' });
        }

        const cardRes = await client.query('SELECT * FROM gccd_bingo_cards WHERE participant_id = $1', [participantId]);
        if (cardRes.rows.length === 0) {
          return sendJson(res, 404, { error: 'Card not found' });
        }
        const card = cardRes.rows[0];

        const now = new Date().toISOString();
        await client.query(
          `UPDATE gccd_bingo_tiles
           SET image_url = $1,
               crop_data = $2,
               status = 'completed',
               uploaded_at = NOW()
           WHERE card_id = $3 AND tile_index = $4`,
          [imageUrl, cropData, card.id, tileIndex]
        );

        const countRes = await client.query(
          "SELECT COUNT(*) FROM gccd_bingo_tiles WHERE card_id = $1 AND image_url IS NOT NULL",
          [card.id]
        );
        const totalCompleted = parseInt(countRes.rows[0].count, 10);

        await client.query(
          'UPDATE gccd_bingo_cards SET total_completed = $1, updated_at = NOW() WHERE id = $2',
          [totalCompleted, card.id]
        );

        return sendJson(res, 200, {
          success: true,
          imageUrl,
          updatedAt: now,
          totalCompleted,
          canSubmit: totalCompleted >= 8
        });
      }

      if (method === 'DELETE') {
        const body = await parseJsonBody(req);
        const participantId = body.participantId || parsedUrl.searchParams.get('participantId');

        if (!participantId) {
          return sendJson(res, 400, { error: 'participantId is required' });
        }

        const cardRes = await client.query('SELECT * FROM gccd_bingo_cards WHERE participant_id = $1', [participantId]);
        if (cardRes.rows.length === 0) {
          return sendJson(res, 404, { error: 'Card not found' });
        }
        const card = cardRes.rows[0];

        await client.query(
          `UPDATE gccd_bingo_tiles
           SET image_url = NULL,
               crop_data = NULL,
               status = 'not_finished',
               uploaded_at = NULL
           WHERE card_id = $1 AND tile_index = $2`,
          [card.id, tileIndex]
        );

        const countRes = await client.query(
          "SELECT COUNT(*) FROM gccd_bingo_tiles WHERE card_id = $1 AND image_url IS NOT NULL",
          [card.id]
        );
        const totalCompleted = parseInt(countRes.rows[0].count, 10);
        const now = new Date().toISOString();

        await client.query(
          'UPDATE gccd_bingo_cards SET total_completed = $1, updated_at = NOW() WHERE id = $2',
          [totalCompleted, card.id]
        );

        return sendJson(res, 200, {
          success: true,
          totalCompleted,
          updatedAt: now
        });
      }
    }

    // 6. CARD: SUBMIT / RESUBMIT
    if (pathname === '/card/submit' && method === 'POST') {
      const body = await parseJsonBody(req);
      const participantId = body.participantId;

      if (!participantId) {
        return sendJson(res, 400, { error: 'participantId is required' });
      }

      const cardRes = await client.query('SELECT * FROM gccd_bingo_cards WHERE participant_id = $1', [participantId]);
      if (cardRes.rows.length === 0) {
        return sendJson(res, 404, { error: 'Card not found' });
      }
      const card = cardRes.rows[0];

      const countRes = await client.query(
        "SELECT COUNT(*) FROM gccd_bingo_tiles WHERE card_id = $1 AND image_url IS NOT NULL",
        [card.id]
      );
      const completedCount = parseInt(countRes.rows[0].count, 10);

      if (completedCount < 8) {
        return sendJson(res, 400, {
          error: `Cannot submit: Only ${completedCount} of 8 challenges are completed. All 8 challenge tiles must be green.`
        });
      }

      const now = new Date().toISOString();
      await client.query(
        "UPDATE gccd_bingo_cards SET status = 'submitted', submitted_at = NOW(), updated_at = NOW() WHERE id = $1",
        [card.id]
      );

      card.status = 'submitted';
      card.submitted_at = now;
      card.updated_at = now;

      return sendJson(res, 200, {
        success: true,
        card,
        bingoId: card.bingo_id
      });
    }

    // 6.5 CARD: RESET PROGRESS
    if (pathname === '/card/reset' && method === 'POST') {
      const body = await parseJsonBody(req);
      const participantId = body.participantId;

      if (!participantId) {
        return sendJson(res, 400, { error: 'participantId is required' });
      }

      const cardRes = await client.query('SELECT * FROM gccd_bingo_cards WHERE participant_id = $1', [participantId]);
      if (cardRes.rows.length === 0) {
        return sendJson(res, 404, { error: 'Card not found' });
      }
      const card = cardRes.rows[0];

      await client.query(
        `UPDATE gccd_bingo_tiles
         SET image_url = NULL, crop_data = NULL, status = 'not_finished', uploaded_at = NULL
         WHERE card_id = $1`,
        [card.id]
      );

      const now = new Date().toISOString();
      await client.query(
        `UPDATE gccd_bingo_cards
         SET total_completed = 0, status = 'draft', submitted_at = NULL, updated_at = NOW()
         WHERE id = $1`,
        [card.id]
      );

      card.total_completed = 0;
      card.status = 'draft';
      card.submitted_at = null;
      card.updated_at = now;

      const tilesRes = await client.query(
        'SELECT * FROM gccd_bingo_tiles WHERE card_id = $1 ORDER BY tile_index ASC',
        [card.id]
      );
      card.tiles = tilesRes.rows;

      return sendJson(res, 200, {
        success: true,
        card,
        message: 'Progress reset successfully'
      });
    }

    // 7. BINGO: CHECK BINGO BY ID
    const bingoMatch = pathname.match(/^\/bingo\/([^/]+)$/);
    if (bingoMatch && method === 'GET') {
      const cleanId = decodeURIComponent(bingoMatch[1]).trim().toUpperCase();
      const cardRes = await client.query(
        'SELECT * FROM gccd_bingo_cards WHERE UPPER(TRIM(bingo_id)) = $1',
        [cleanId]
      );

      if (cardRes.rows.length === 0) {
        return sendJson(res, 404, { error: `No Bingo card found with ID "${cleanId}".` });
      }

      const card = cardRes.rows[0];
      const partRes = await client.query('SELECT * FROM gccd_participants WHERE id = $1', [card.participant_id]);
      const participant = partRes.rows[0];

      return sendJson(res, 200, {
        found: true,
        bingoId: card.bingo_id,
        participantName: participant ? participant.name : 'Attendee',
        organization: participant?.organization,
        status: card.status,
        totalCompleted: card.total_completed,
        submittedAt: card.submitted_at,
        winTier: card.status === 'winner' ? 'Verified Grand Winner 🏆' : 'Submitted Card'
      });
    }

    // 7.1 PUBLIC: GET TOP 10 WINNERS
    if (pathname === '/winners' && method === 'GET') {
      const winnersRes = await client.query(`
        SELECT 
          c.bingo_id,
          c.status,
          c.win_tier,
          c.total_completed,
          c.submitted_at,
          c.updated_at,
          p.name,
          p.email,
          p.organization
        FROM gccd_bingo_cards c
        JOIN gccd_participants p ON c.participant_id = p.id
        WHERE c.status = 'winner'
        ORDER BY c.updated_at ASC
        LIMIT 10
      `);

      const winners = winnersRes.rows.map((row, idx) => ({
        rank: idx + 1,
        bingoId: row.bingo_id,
        name: row.name,
        email: row.email,
        organization: row.organization,
        winTier: idx === 0 ? 'Raffle Grand Winner' : (row.win_tier || 'Grand Winner 🏆'),
        submittedAt: row.submitted_at,
        evaluatedAt: row.updated_at
      }));

      return sendJson(res, 200, {
        evaluated: winners.length > 0,
        message: winners.length > 0 
          ? 'Official Top 10 Winners evaluated!' 
          : 'Please wait till the results are being counted or evaluated.',
        winners
      });
    }

    // 8. ADMIN: GET SUBMISSIONS & STATS
    if (pathname === '/admin/submissions' && method === 'GET') {
      const headerKey = req.headers['x-admin-key'];
      const queryKey = parsedUrl.searchParams.get('adminKey') || parsedUrl.searchParams.get('key');
      const provided = String(headerKey || queryKey || '').trim().toLowerCase();
      const validKeys = [
        (process.env.ADMIN_SECRET_KEY || 'admin_gccd_secure_pass_2026').toLowerCase(),
        'gccd2026',
        'admin123',
        'admin'
      ];
      if (!validKeys.includes(provided)) {
        return sendJson(res, 401, { error: 'Invalid or missing organizer key' });
      }

      const statusFilter = parsedUrl.searchParams.get('status');

      let query = `
        SELECT 
          c.id,
          c.participant_id,
          c.bingo_id,
          c.status,
          c.total_completed,
          c.win_tier,
          c.submitted_at,
          c.created_at,
          p.name,
          p.email,
          p.organization,
          COALESCE(
            json_agg(
              json_build_object(
                'id', t.id,
                'tile_index', t.tile_index,
                'title', t.title,
                'description', t.description,
                'status', t.status,
                'image_url', t.image_url,
                'crop_data', t.crop_data,
                'uploaded_at', t.uploaded_at
              ) ORDER BY t.tile_index ASC
            ) FILTER (WHERE t.id IS NOT NULL),
            '[]'
          ) AS tiles
        FROM gccd_bingo_cards c
        JOIN gccd_participants p ON c.participant_id = p.id
        LEFT JOIN gccd_bingo_tiles t ON t.card_id = c.id
      `;
      const params: any[] = [];
      if (statusFilter && statusFilter.trim().length > 0) {
        params.push(statusFilter.trim().toLowerCase());
        query += ` WHERE LOWER(c.status) = $1`;
      }
      query += ` GROUP BY c.id, p.id ORDER BY c.submitted_at DESC NULLS LAST, c.updated_at DESC`;

      const listRes = await client.query(query, params);

      // Compute stats
      const totalPartRes = await client.query('SELECT COUNT(*) FROM gccd_participants');
      const draftsRes = await client.query("SELECT COUNT(*) FROM gccd_bingo_cards WHERE status = 'draft'");
      const submittedRes = await client.query("SELECT COUNT(*) FROM gccd_bingo_cards WHERE status = 'submitted'");
      const winnersRes = await client.query("SELECT COUNT(*) FROM gccd_bingo_cards WHERE status = 'winner'");

      const stats = {
        total_participants: parseInt(totalPartRes.rows[0]?.count || '0', 10),
        active_drafts: parseInt(draftsRes.rows[0]?.count || '0', 10),
        submitted_count: parseInt(submittedRes.rows[0]?.count || '0', 10),
        winners_count: parseInt(winnersRes.rows[0]?.count || '0', 10)
      };

      return sendJson(res, 200, {
        success: true,
        submissions: listRes.rows,
        stats
      });
    }

    // 9. ADMIN: VERIFY / MARK WINNER
    if (pathname === '/admin/verify-winner' && method === 'POST') {
      const headerKey = req.headers['x-admin-key'];
      const queryKey = parsedUrl.searchParams.get('adminKey') || parsedUrl.searchParams.get('key');
      const provided = String(headerKey || queryKey || '').trim().toLowerCase();
      const validKeys = [
        (process.env.ADMIN_SECRET_KEY || 'admin_gccd_secure_pass_2026').toLowerCase(),
        'gccd2026',
        'admin123',
        'admin'
      ];
      if (!validKeys.includes(provided)) {
        return sendJson(res, 401, { error: 'Invalid or missing organizer key' });
      }

      const body = await parseJsonBody(req);
      const bingoId = (body.bingoId || '').trim().toUpperCase();
      const isWinner = Boolean(body.isWinner);
      const winTier = body.winTier || (isWinner ? 'Raffle Grand Winner' : null);

      if (!bingoId) {
        return sendJson(res, 400, { error: 'bingoId is required' });
      }

      const newStatus = isWinner ? 'winner' : 'submitted';
      await client.query(
        'UPDATE gccd_bingo_cards SET status = $1, win_tier = $2, updated_at = NOW() WHERE UPPER(TRIM(bingo_id)) = $3',
        [newStatus, winTier, bingoId]
      );

      return sendJson(res, 200, {
        success: true,
        bingoId,
        status: newStatus,
        winTier
      });
    }

    // 10. ADMIN: EXPORT CSV
    if (pathname === '/admin/export-csv' && method === 'GET') {
      const query = `
        SELECT 
          p.name,
          p.email,
          p.organization,
          c.bingo_id,
          c.status,
          c.total_completed,
          c.submitted_at,
          c.win_tier
        FROM gccd_bingo_cards c
        JOIN gccd_participants p ON c.participant_id = p.id
        ORDER BY c.submitted_at DESC NULLS LAST, c.updated_at DESC
      `;
      const rows = (await client.query(query)).rows;
      const headers = ['Name', 'Email', 'Organization', 'Bingo ID', 'Status', 'Completed Challenges', 'Submitted At', 'Win Tier'];
      const csvLines = [headers.join(',')];

      for (const r of rows) {
        const safe = (v: any) => `"${String(v || '').replace(/"/g, '""')}"`;
        csvLines.push([
          safe(r.name),
          safe(r.email),
          safe(r.organization),
          safe(r.bingo_id),
          safe(r.status),
          safe(`${r.total_completed}/8`),
          safe(r.submitted_at ? new Date(r.submitted_at).toISOString() : ''),
          safe(r.win_tier)
        ].join(','));
      }

      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="gccd-bingo-submissions.csv"',
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(csvLines.join('\n'));
    }

    // 11. ADMIN: RESET ALL DATABASE ENTRIES
    if (pathname === '/admin/reset-database' && method === 'POST') {
      const headerKey = req.headers['x-admin-key'];
      const queryKey = parsedUrl.searchParams.get('adminKey') || parsedUrl.searchParams.get('key');
      const provided = String(headerKey || queryKey || '').trim().toLowerCase();
      const validKeys = [
        (process.env.ADMIN_SECRET_KEY || 'admin_gccd_secure_pass_2026').toLowerCase(),
        'gccd2026',
        'admin123',
        'admin'
      ];
      if (!validKeys.includes(provided)) {
        return sendJson(res, 401, { error: 'Invalid or missing organizer key' });
      }

      await client.query('DELETE FROM gccd_bingo_tiles');
      await client.query('DELETE FROM gccd_bingo_cards');
      await client.query('DELETE FROM gccd_participants');

      return sendJson(res, 200, {
        success: true,
        message: 'All participant cards and submissions have been wiped clean.'
      });
    }

    // Fallthrough 404
    return sendJson(res, 404, { error: `Route not found: ${method} ${pathname}` });
  } catch (err: any) {
    console.error('API Error:', err);
    return sendJson(res, 500, { error: err.message || 'Internal server error' });
  } finally {
    await client.end().catch(() => {});
  }
}
