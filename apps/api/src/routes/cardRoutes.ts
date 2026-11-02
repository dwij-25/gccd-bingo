import { Router } from 'express';
import multer from 'multer';
import { getCard, uploadTile, removeTile, saveDraft, submitCard, checkBingo } from '../controllers/cardController.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Memory storage for multer with client-side image compression & mime checks
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024 // 8 MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (allowedMimes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image format. Allowed formats: JPG, PNG, WEBP, HEIC.'));
    }
  }
});

// Authenticated Card routes
router.get('/card', requireAuth, getCard);
router.put('/card/tiles/:index', requireAuth, uploadLimiter, upload.single('image'), uploadTile);
router.delete('/card/tiles/:index', requireAuth, removeTile);
router.post('/card/save-draft', requireAuth, saveDraft);
router.post('/card/submit', requireAuth, submitCard);

// Public / Authenticated Bingo Verification route
router.get('/bingo/:bingoId', checkBingo);

export default router;
