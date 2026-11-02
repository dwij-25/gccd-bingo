import { Request, Response, NextFunction } from 'express';
import { db } from '../db.js';
import { storageService } from '../services/storageService.js';
import { evaluateWinConditions, logActivity } from '../services/bingoService.js';
import { saveDraftSchema, submitCardSchema } from '../validators/cardValidators.js';

export async function getCard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;

    const card = await db.queryOne(
      `SELECT * FROM bingo_cards WHERE participant_id = $1`,
      [userId]
    );

    if (!card) {
      res.status(404).json({ success: false, error: 'Bingo card not found for participant.' });
      return;
    }

    const tiles = await db.query(
      `SELECT * FROM bingo_tiles WHERE card_id = $1 ORDER BY tile_index ASC`,
      [card.id]
    );

    res.json({
      success: true,
      card: {
        ...card,
        tiles
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function uploadTile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const rawIndex = Array.isArray(req.params.index) ? req.params.index[0] : req.params.index;
    const tileIndex = parseInt(rawIndex, 10);

    if (isNaN(tileIndex) || tileIndex < 0 || tileIndex > 8) {
      res.status(400).json({ success: false, error: 'Tile index must be an integer between 0 and 8.' });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, error: 'No image file uploaded.' });
      return;
    }

    // 1. Fetch card & enforce submission lock
    const card = await db.queryOne(
      `SELECT * FROM bingo_cards WHERE participant_id = $1`,
      [userId]
    );

    if (!card) {
      res.status(404).json({ success: false, error: 'Card not found.' });
      return;
    }

    if (card.status !== 'draft') {
      res.status(403).json({
        success: false,
        error: 'This bingo card has already been submitted and is locked in read-only mode.'
      });
      return;
    }

    // 2. Save file via Storage Service
    const uploadRes = await storageService.saveFile(file, card.bingo_id, tileIndex);

    // 3. Update the tile in database
    await db.query(
      `UPDATE bingo_tiles
       SET image_url = $1, image_path = $2, status = 'completed', uploaded_at = NOW(), updated_at = NOW()
       WHERE card_id = $3 AND tile_index = $4`,
      [uploadRes.url, uploadRes.path, card.id, tileIndex]
    );

    // 4. Recalculate completed count
    const completedRes = await db.queryOne(
      `SELECT COUNT(*) as count FROM bingo_tiles WHERE card_id = $1 AND status = 'completed'`,
      [card.id]
    );
    const totalCompleted = parseInt(completedRes.count, 10);

    await db.query(
      `UPDATE bingo_cards SET total_completed = $1, updated_at = NOW() WHERE id = $2`,
      [totalCompleted, card.id]
    );

    await logActivity(userId, card.id, 'TILE_UPLOADED', {
      tileIndex,
      imageUrl: uploadRes.url,
      totalCompleted
    });

    res.json({
      success: true,
      tileIndex,
      imageUrl: uploadRes.url,
      status: 'completed',
      totalCompleted,
      canSubmit: totalCompleted === 9,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
}

export async function removeTile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const rawIndex = Array.isArray(req.params.index) ? req.params.index[0] : req.params.index;
    const tileIndex = parseInt(rawIndex, 10);

    if (isNaN(tileIndex) || tileIndex < 0 || tileIndex > 8) {
      res.status(400).json({ success: false, error: 'Tile index must be an integer between 0 and 8.' });
      return;
    }

    const card = await db.queryOne(
      `SELECT * FROM bingo_cards WHERE participant_id = $1`,
      [userId]
    );

    if (!card) {
      res.status(404).json({ success: false, error: 'Card not found.' });
      return;
    }

    if (card.status !== 'draft') {
      res.status(403).json({
        success: false,
        error: 'This bingo card has already been submitted and is locked.'
      });
      return;
    }

    // Get current tile to delete file
    const currentTile = await db.queryOne(
      `SELECT * FROM bingo_tiles WHERE card_id = $1 AND tile_index = $2`,
      [card.id, tileIndex]
    );

    if (currentTile?.image_url) {
      await storageService.deleteFile(currentTile.image_url);
    }

    // Reset tile
    await db.query(
      `UPDATE bingo_tiles
       SET image_url = NULL, image_path = NULL, status = 'not_finished', uploaded_at = NULL, updated_at = NOW()
       WHERE card_id = $1 AND tile_index = $2`,
      [card.id, tileIndex]
    );

    // Recalculate completed count
    const completedRes = await db.queryOne(
      `SELECT COUNT(*) as count FROM bingo_tiles WHERE card_id = $1 AND status = 'completed'`,
      [card.id]
    );
    const totalCompleted = parseInt(completedRes.count, 10);

    await db.query(
      `UPDATE bingo_cards SET total_completed = $1, updated_at = NOW() WHERE id = $2`,
      [totalCompleted, card.id]
    );

    await logActivity(userId, card.id, 'TILE_REMOVED', { tileIndex, totalCompleted });

    res.json({
      success: true,
      tileIndex,
      status: 'not_finished',
      imageUrl: null,
      totalCompleted,
      canSubmit: false,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
}

export async function saveDraft(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const validated = saveDraftSchema.parse(req.body);

    const card = await db.queryOne(
      `SELECT * FROM bingo_cards WHERE participant_id = $1`,
      [userId]
    );

    if (!card) {
      res.status(404).json({ success: false, error: 'Card not found.' });
      return;
    }

    if (card.status !== 'draft') {
      res.status(403).json({ success: false, error: 'Card already submitted.' });
      return;
    }

    let completedCount = 0;
    for (const t of validated.tiles) {
      if (t.status === 'completed' && t.imageUrl) {
        completedCount++;
      }
      await db.query(
        `UPDATE bingo_tiles
         SET title = $1, status = $2, updated_at = NOW()
         WHERE card_id = $3 AND tile_index = $4`,
        [t.title, t.status, card.id, t.tileIndex]
      );
    }

    await db.query(
      `UPDATE bingo_cards SET total_completed = $1, updated_at = NOW() WHERE id = $2`,
      [completedCount, card.id]
    );

    const now = new Date().toISOString();
    await logActivity(userId, card.id, 'DRAFT_SAVED', { totalCompleted: completedCount });

    res.json({
      success: true,
      message: 'Draft successfully saved to database.',
      timestamp: now,
      totalCompleted: completedCount,
      canSubmit: completedCount === 9
    });
  } catch (err) {
    next(err);
  }
}

export async function submitCard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    submitCardSchema.parse(req.body);

    const card = await db.queryOne(
      `SELECT * FROM bingo_cards WHERE participant_id = $1`,
      [userId]
    );

    if (!card) {
      res.status(404).json({ success: false, error: 'Card not found.' });
      return;
    }

    if (card.status !== 'draft') {
      res.status(400).json({ success: false, error: 'Card is already submitted.' });
      return;
    }

    const tiles = await db.query(
      `SELECT * FROM bingo_tiles WHERE card_id = $1 ORDER BY tile_index ASC`,
      [card.id]
    );

    const completedTiles = tiles.filter((t: any) => t.status === 'completed' && t.image_url);
    if (completedTiles.length < 9) {
      res.status(400).json({
        success: false,
        error: `Cannot submit yet. You have completed ${completedTiles.length}/9 challenges. Complete all 9 to submit!`
      });
      return;
    }

    // Evaluate Win Conditions
    const winEval = evaluateWinConditions(tiles);

    // Finalize card
    await db.query(
      `UPDATE bingo_cards
       SET status = 'submitted', submitted_at = NOW(), win_tier = $1, total_completed = 9, updated_at = NOW()
       WHERE id = $2`,
      [winEval.winTier, card.id]
    );

    await logActivity(userId, card.id, 'CARD_SUBMITTED', {
      bingoId: card.bingo_id,
      winEval
    });

    res.json({
      success: true,
      bingoId: card.bingo_id,
      submittedAt: new Date().toISOString(),
      winEvaluation: winEval,
      message: `🎉 Bingo card ${card.bingo_id} submitted! Show this Bingo ID at the organizer booth to claim your prize!`
    });
  } catch (err) {
    next(err);
  }
}

export async function checkBingo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawId = Array.isArray(req.params.bingoId) ? req.params.bingoId[0] : req.params.bingoId;
    const bingoId = String(rawId || '').trim().toUpperCase();

    const card = await db.queryOne(
      `SELECT b.*, p.name as participant_name, p.organization
       FROM bingo_cards b
       JOIN participants p ON b.participant_id = p.id
       WHERE UPPER(b.bingo_id) = $1`,
      [bingoId]
    );

    if (!card) {
      res.status(404).json({
        success: false,
        found: false,
        error: `No Bingo Card found matching ID '${bingoId}'. Please verify the code.`
      });
      return;
    }

    const tiles = await db.query(
      `SELECT tile_index, title, status, image_url, uploaded_at FROM bingo_tiles
       WHERE card_id = $1 ORDER BY tile_index ASC`,
      [card.id]
    );

    const winEval = evaluateWinConditions(tiles);

    res.json({
      success: true,
      found: true,
      bingoId: card.bingo_id,
      participantName: card.participant_name,
      organization: card.organization,
      status: card.status, // draft, submitted, verified, winner, rejected
      totalCompleted: card.total_completed,
      submittedAt: card.submitted_at,
      winTier: card.win_tier || winEval.winTier,
      winEvaluation: winEval
    });
  } catch (err) {
    next(err);
  }
}
