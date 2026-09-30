import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  TZ: process.env.TZ || 'Asia/Jakarta',
  DATABASE_URL: process.env.DATABASE_URL || '',

  // Authentication & Security
  JWT_SECRET: process.env.JWT_SECRET || 'presensi-app-secret-key-change-in-production',
  JWT_EXPIRES_IN: (process.env.JWT_EXPIRES_IN || '7d') as any,
  SUPER_ADMIN_SETUP_KEY: process.env.SUPER_ADMIN_SETUP_KEY || 'initial-setup-key',

  // CORS Origins
  CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : [
        'https://yexssync.yexsx.my.id',
        'https://yexsx.my.id',
        'https://app-presensi.yexsx.my.id',
        'https://api-presensi.yexsx.my.id',
        'https://presensi.yexsx.my.id',
        'http://localhost:8081',
        'http://localhost:19006',
        'http://localhost:3000',
      ],

  // Upload limits
  UPLOAD_MAX_SIZE_MB: parseInt(process.env.UPLOAD_MAX_SIZE_MB || '50', 10),

  // Biometrics
  FACE_MATCH_THRESHOLD: parseFloat(process.env.FACE_MATCH_THRESHOLD || '0.6'),

  // Multi-Tenant defaults
  DEFAULT_TENANT_ID: parseInt(process.env.DEFAULT_TENANT_ID || '1', 10),
  DEFAULT_ALLOWED_RADIUS_METERS: parseInt(process.env.DEFAULT_ALLOWED_RADIUS_METERS || '50', 10),
  DEFAULT_OFFICE_LATITUDE: parseFloat(process.env.DEFAULT_OFFICE_LATITUDE || '-6.2088'),
  DEFAULT_OFFICE_LONGITUDE: parseFloat(process.env.DEFAULT_OFFICE_LONGITUDE || '106.8456'),
};
