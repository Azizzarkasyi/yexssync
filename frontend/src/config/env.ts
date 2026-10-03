import { Platform } from 'react-native';

/**
 * Centralized typed configuration for the frontend application.
 * All values are populated from .env (with EXPO_PUBLIC_ prefix) with fallback defaults.
 */
export const APP_ENV = {
  // App info
  APP_NAME: process.env.EXPO_PUBLIC_APP_NAME || 'YexsSync',
  APP_VERSION: process.env.EXPO_PUBLIC_APP_VERSION || '2.1.0',
  DEFAULT_TENANT_ID: parseInt(process.env.EXPO_PUBLIC_DEFAULT_TENANT_ID || '1', 10),

  // API Base URL resolution
  getApiBaseUrl: (): string => {
    // 1. Web browser dynamic origin resolution (prevents pointing to localhost when deployed)
    if (
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      window.location?.hostname
    ) {
      const hostname = window.location.hostname;
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return `${window.location.origin}/api`;
      }
    }

    // 2. Explicit variable in .env (recommended for mobile apps)
    if (process.env.EXPO_PUBLIC_API_URL) {
      return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
    }

    // 3. Default fallback
    return 'https://yexssync.yexsx.my.id/api';
  },

  // Map & Geofencing configurations
  MAP: {
    DEFAULT_LAT: parseFloat(process.env.EXPO_PUBLIC_MAP_DEFAULT_LAT || '-6.2088'),
    DEFAULT_LNG: parseFloat(process.env.EXPO_PUBLIC_MAP_DEFAULT_LNG || '106.8456'),
    DEFAULT_RADIUS: parseInt(process.env.EXPO_PUBLIC_MAP_DEFAULT_RADIUS || '50', 10),
    TILE_URL: process.env.EXPO_PUBLIC_LEAFLET_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    GEOCODING_URL: process.env.EXPO_PUBLIC_GEOCODING_API_URL || 'https://nominatim.openstreetmap.org',
  },

  // Face Recognition Biometric configurations
  BIOMETRICS: {
    ENABLE_FACE_RECOGNITION: process.env.EXPO_PUBLIC_ENABLE_FACE_RECOGNITION !== 'false',
    FACE_MATCH_THRESHOLD: parseFloat(process.env.EXPO_PUBLIC_FACE_MATCH_THRESHOLD || '0.6'),
  },
};
