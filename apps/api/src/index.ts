import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { config } from './config.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import cardRoutes from './routes/cardRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Ensure uploads directory exists
const uploadsDir = config.storage.localUploadDir;
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 1. Security Headers (Helmet)
// Note: frameguard is disabled to allow legitimate iframe embedding into the event portal
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  frameguard: false // Enables iframe-embed option
}));

// 2. CORS Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or iframe same-origin)
    if (!origin) return callback(null, true);
    if (config.allowedOrigins.includes(origin) || !config.isProduction) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key']
}));

// 3. Body & Cookie Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(config.cookie.secret));

// 4. Global Rate Limiter
app.use('/api', globalLimiter);

// 5. Static Uploads Serving
app.use('/uploads', express.static(uploadsDir));

// 6. Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// 7. Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api', cardRoutes);
app.use('/api/admin', adminRoutes);

// 8. Centralized Error Handler
app.use(errorHandler);

// Start Server
const server = app.listen(config.port, () => {
  console.log(`\n======================================================`);
  console.log(`⚡ GCCD Bingo API Server running on port ${config.port}`);
  console.log(`📡 Environment: ${config.nodeEnv}`);
  console.log(`🔒 Allowed Origins: ${config.allowedOrigins.join(', ')}`);
  console.log(`======================================================\n`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing HTTP server gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});

export default app;
