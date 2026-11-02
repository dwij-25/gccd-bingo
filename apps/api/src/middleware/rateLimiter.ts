import rateLimit from 'express-rate-limit';

// Global API rate limiter
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this device. Please wait a few minutes before retrying.'
  }
});

// Stricter limiter for login and verification attempts
export const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 25, // 25 login checks per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many verification attempts. Please check with an event organizer if you need help finding your registration.'
  }
});

// Photo upload limiter
export const uploadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 50, // 50 uploads per 5 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Upload rate limit exceeded. Please wait a moment before uploading another photo.'
  }
});
