import { Request, Response, NextFunction } from 'express';
import { db } from '../db.js';
import { adminVerifyWinnerSchema } from '../validators/cardValidators.js';
import { logActivity } from '../services/bingoService.js';

export async function listSubmissions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const statusFilter = req.query.status as string;

    let query = `
      SELECT p.id as participant_id, p.name, p.email, p.organization, p.role,
             b.id as card_id, b.bingo_id, b.status, b.total_completed, b.win_tier,
             b.updated_at, b.submitted_at
      FROM participants p
      LEFT JOIN bingo_cards b ON p.id = b.participant_id
    `;
    const params: any[] = [];

    if (statusFilter && ['draft', 'submitted', 'verified', 'winner', 'rejected'].includes(statusFilter)) {
      query += ` WHERE b.status = $1`;
      params.push(statusFilter);
    }

    query += ` ORDER BY b.submitted_at DESC NULLS LAST, p.name ASC`;

    const submissions = await db.query(query, params);

    // Compute stats
    const statsRes = await db.query(`
      SELECT
        COUNT(p.id) as total_participants,
        COUNT(CASE WHEN b.status = 'draft' THEN 1 END) as active_drafts,
        COUNT(CASE WHEN b.status = 'submitted' THEN 1 END) as submitted_count,
        COUNT(CASE WHEN b.status = 'winner' THEN 1 END) as winners_count
      FROM participants p
      LEFT JOIN bingo_cards b ON p.id = b.participant_id
    `);

    res.json({
      success: true,
      stats: statsRes[0] || {},
      submissions
    });
  } catch (err) {
    next(err);
  }
}

export async function getSubmissionDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cardId = req.params.cardId;

    const card = await db.queryOne(
      `SELECT b.*, p.name, p.email, p.organization, p.role
       FROM bingo_cards b
       JOIN participants p ON b.participant_id = p.id
       WHERE b.id = $1 OR b.bingo_id = $1`,
      [cardId]
    );

    if (!card) {
      res.status(404).json({ success: false, error: 'Card not found' });
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

export async function markWinner(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = adminVerifyWinnerSchema.parse(req.body);

    const card = await db.queryOne(
      `SELECT * FROM bingo_cards WHERE UPPER(bingo_id) = $1`,
      [validated.bingoId.toUpperCase()]
    );

    if (!card) {
      res.status(404).json({ success: false, error: 'Bingo card not found' });
      return;
    }

    const newStatus = validated.isWinner ? 'winner' : 'verified';
    const winTier = validated.winTier || (validated.isWinner ? 'Organizer Raffle Winner' : card.win_tier);

    await db.query(
      `UPDATE bingo_cards SET status = $1, win_tier = $2, updated_at = NOW() WHERE id = $3`,
      [newStatus, winTier, card.id]
    );

    await logActivity(card.participant_id, card.id, 'ADMIN_STATUS_UPDATE', {
      newStatus,
      winTier,
      admin: req.user?.email || 'admin'
    });

    res.json({
      success: true,
      bingoId: card.bingo_id,
      status: newStatus,
      winTier,
      message: `Card ${card.bingo_id} successfully marked as ${newStatus} (${winTier}).`
    });
  } catch (err) {
    next(err);
  }
}

export async function exportCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rows = await db.query(`
      SELECT p.name, p.email, p.organization, p.role,
             b.bingo_id, b.status, b.total_completed, b.win_tier, b.updated_at, b.submitted_at
      FROM participants p
      LEFT JOIN bingo_cards b ON p.id = b.participant_id
      ORDER BY b.submitted_at DESC NULLS LAST, p.name ASC
    `);

    let csv = 'Full Name,Email Address,Organization,Role,Bingo ID,Status,Challenges Completed,Win Tier,Last Updated,Submitted At\r\n';

    for (const r of rows) {
      const escape = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;
      csv += [
        escape(r.name),
        escape(r.email),
        escape(r.organization),
        escape(r.role),
        escape(r.bingo_id || 'N/A'),
        escape(r.status || 'Not Started'),
        escape(`${r.total_completed || 0}/9`),
        escape(r.win_tier || ''),
        escape(r.updated_at || ''),
        escape(r.submitted_at || '')
      ].join(',') + '\r\n';
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="gccd_bingo_submissions.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
}
