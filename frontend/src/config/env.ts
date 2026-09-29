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
    // 1. Explicit variable in .env (recommended)
    if (process.env.EXPO_PUBLIC_API_URL) {
      return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
    }

    // 2. Web browser dynamic origin resolution
    if (
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      window.location?.hostname
    ) {
      const hostname = window.location.hostname;
      if (hostname.includes('presensi.yexsx.my.id')) {
        return `https://${hostname}/api`;
      }
      return `http://${hostname}:3000/api`;
    }

    // 3. Default fallback
    return 'http://localhost:3000/api';
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
