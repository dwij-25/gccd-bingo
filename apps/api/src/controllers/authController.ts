import { Request, Response, NextFunction } from 'express';
import { db } from '../db.js';
import { config } from '../config.js';
import { loginSchema } from '../validators/cardValidators.js';
import { generateToken } from '../middleware/auth.js';
import { CANONICAL_TILES, generateHumanFriendlyBingoId, logActivity } from '../services/bingoService.js';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = loginSchema.parse(req.body);
    const emailLower = validated.email.trim().toLowerCase();
    const nameClean = validated.name.trim();

    // 1. Check participants database
    const participant = await db.queryOne(
      `SELECT * FROM participants WHERE LOWER(email) = $1`,
      [emailLower]
    );

    if (!participant) {
      res.status(404).json({
        success: false,
        error: `Email '${emailLower}' is not registered on the official GCCD attendee roster.`,
        hint: 'Please verify the email you used on your registration ticket, or visit the Organizer Desk.'
      });
      return;
    }

    // 2. Fetch or initialize their Bingo Card
    let card = await db.queryOne(
      `SELECT * FROM bingo_cards WHERE participant_id = $1`,
      [participant.id]
    );

    let isNew = false;

    if (!card) {
      isNew = true;
      const bingoId = generateHumanFriendlyBingoId();

      await db.query(
        `INSERT INTO bingo_cards (participant_id, bingo_id, status, total_completed, created_at, updated_at)
         VALUES ($1, $2, 'draft', 0, NOW(), NOW())`,
        [participant.id, bingoId]
      );

      card = await db.queryOne(
        `SELECT * FROM bingo_cards WHERE participant_id = $1`,
        [participant.id]
      );

      // Initialize the 9 canonical tiles
      for (const t of CANONICAL_TILES) {
        await db.query(
          `INSERT INTO bingo_tiles (card_id, tile_index, title, description, status, updated_at)
           VALUES ($1, $2, $3, $4, 'not_finished', NOW())`,
          [card.id, t.index, t.title, t.description]
        );
      }

      await logActivity(participant.id, card.id, 'CARD_INITIALIZED', { bingoId });
    } else {
      await logActivity(participant.id, card.id, 'RETURNING_USER_LOGIN', { lastUpdated: card.updated_at });
    }

    // Fetch tiles
    const tiles = await db.query(
      `SELECT * FROM bingo_tiles WHERE card_id = $1 ORDER BY tile_index ASC`,
      [card.id]
    );

    // Generate JWT Auth Token
    const token = generateToken({
      id: participant.id,
      email: participant.email,
      name: participant.name,
      role: participant.role || 'Attendee',
      cardId: card.id
    });

    // Set secure httpOnly cookie
    res.cookie(config.cookie.name, token, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: config.isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      token,
      isNew,
      message: isNew ? 'Welcome to GCCD Bingo! Your challenge card has been created.' : 'Welcome back! Your saved draft has been loaded.',
      participant: {
        id: participant.id,
        name: participant.name,
        email: participant.email,
        organization: participant.organization,
        role: participant.role
      },
      card: {
        ...card,
        tiles
      }
    });
  } catch (err) {
    next(err);
  }
}

export function logout(req: Request, res: Response): void {
  res.clearCookie(config.cookie.name, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'none' : 'lax'
  });
  res.json({ success: true, message: 'Logged out successfully. Your draft remains safely preserved in the database.' });
}

export async function getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const participant = await db.queryOne(
      `SELECT * FROM participants WHERE id = $1`,
      [req.user.id]
    );

    if (!participant) {
      res.status(404).json({ success: false, error: 'User record not found' });
      return;
    }

    const card = await db.queryOne(
      `SELECT * FROM bingo_cards WHERE participant_id = $1`,
      [participant.id]
    );

    let tiles: any[] = [];
    if (card) {
      tiles = await db.query(
        `SELECT * FROM bingo_tiles WHERE card_id = $1 ORDER BY tile_index ASC`,
        [card.id]
      );
    }

    res.json({
      success: true,
      participant: {
        id: participant.id,
        name: participant.name,
        email: participant.email,
        organization: participant.organization,
        role: participant.role
      },
      card: card ? { ...card, tiles } : null
    });
  } catch (err) {
    next(err);
  }
}
