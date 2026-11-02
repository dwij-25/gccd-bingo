import { z } from 'zod';

export const loginSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters long').max(100),
  email: z.string().trim().email('Invalid email address format').toLowerCase()
});

export const updateTileSchema = z.object({
  tileIndex: z.coerce.number().int().min(0).max(8),
  title: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  status: z.enum(['not_finished', 'completed']).optional()
});

export const saveDraftSchema = z.object({
  tiles: z.array(z.object({
    tileIndex: z.number().int().min(0).max(8),
    title: z.string(),
    description: z.string().optional(),
    status: z.enum(['not_finished', 'completed']),
    imageUrl: z.string().nullable().optional(),
    imagePath: z.string().nullable().optional(),
    uploadedAt: z.string().nullable().optional()
  })).length(9, 'Exactly 9 tiles are required')
});

export const submitCardSchema = z.object({
  confirmSubmit: z.boolean().refine(val => val === true, {
    message: 'You must confirm submission'
  })
});

export const adminVerifyWinnerSchema = z.object({
  bingoId: z.string().min(6),
  isWinner: z.boolean(),
  winTier: z.string().optional()
});
