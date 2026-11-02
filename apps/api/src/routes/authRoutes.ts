import { Router } from 'express';
import { login, logout, getCurrentUser } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.get('/me', requireAuth, getCurrentUser);

export default router;
