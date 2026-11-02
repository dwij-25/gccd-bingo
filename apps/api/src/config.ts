import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173')
    .split(',')
    .map(o => o.trim()),
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_super_secret_jwt_key_gccd_32_chars_min',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  cookie: {
    secret: process.env.COOKIE_SECRET || 'dev_cookie_secret_key',
    name: 'gccd_bingo_session'
  },
  database: {
    url: process.env.DATABASE_URL || '',
    sqlitePath: process.env.SQLITE_DB_PATH || path.resolve(__dirname, '../../../gccd_bingo.db')
  },
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local',
    localUploadDir: path.resolve(__dirname, '../../uploads'),
    maxFileSizeMb: 8
  },
  admin: {
    secretKey: process.env.ADMIN_SECRET_KEY || 'admin_gccd_secure_pass_2026',
    email: process.env.ADMIN_EMAIL || 'organizer@gdg.community'
  },
  otp: {
    enabled: process.env.ENABLE_EMAIL_OTP === 'true'
  }
};
