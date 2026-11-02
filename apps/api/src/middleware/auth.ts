import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  cardId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      isAdmin?: boolean;
    }
  }
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email.toLowerCase(),
      name: user.name,
      role: user.role,
      cardId: user.cardId
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn as any }
  );
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // Check httpOnly cookie first, then fallback to Authorization header
  const token = req.cookies?.[config.cookie.name] || 
    (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Authentication required. Please enter your name and email to continue.'
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: 'Session expired or invalid token. Please log in again.'
    });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const adminSecret = req.headers['x-admin-key'] || req.query.adminKey;

  if (adminSecret === config.admin.secretKey) {
    req.isAdmin = true;
    next();
    return;
  }

  // Also check if authenticated user has role = 'Organizer' or 'Admin'
  const token = req.cookies?.[config.cookie.name] || 
    (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as AuthUser;
      if (decoded.role === 'Organizer' || decoded.role === 'Admin') {
        req.user = decoded;
        req.isAdmin = true;
        next();
        return;
      }
    } catch {
      // Fall through to 403
    }
  }

  res.status(403).json({
    success: false,
    error: 'Access denied. Organizer administrative credentials required.'
  });
}
