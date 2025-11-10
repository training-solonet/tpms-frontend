// src/services/api/config.js

/**
 * Backend 1 (BE1) - Tracking & TPMS Configuration
 * Handles: Live Tracking, History Tracking, TPMS, Telemetry
 * Base URL: VITE_TRACKING_API_BASE_URL
 */

// Tracking API Configuration (Backend 1)
export const TRACKING_CONFIG = {
  BASE_URL:
    (typeof import.meta !== 'undefined' &&
      import.meta.env &&
      import.meta.env.VITE_TRACKING_API_BASE_URL) ||
    '', // Backend 1 untuk tracking
  WS_URL:
    (typeof import.meta !== 'undefined' &&
      import.meta.env &&
      import.meta.env.VITE_TRACKING_WS_URL) ||
    '', // WebSocket untuk live tracking
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 2,
  RETRY_DELAY: 2000,
};

// TPMS (Tire Pressure Monitoring System) Configuration
export const TPMS_CONFIG = {
  REALTIME_ENDPOINT:
    (typeof import.meta !== 'undefined' &&
      import.meta.env &&
      import.meta.env.VITE_API_TPMS_REALTIME_ENDPOINT) ||
    '', // Endpoint realtime TPMS
  LOCATION_ENDPOINT:
    (typeof import.meta !== 'undefined' &&
      import.meta.env &&
      import.meta.env.VITE_API_TPMS_LOCATION_ENDPOINT) ||
    '', // Endpoint history lokasi TPMS
  API_KEY:
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_TPMS_API_KEY) ||
    '', // API Key untuk autentikasi TPMS
  SN: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_TPMS_SN) || '', // Serial Number TPMS
  WS_URL:
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_TPMS_WS_URL) ||
    '', // WebSocket URL untuk realtime TPMS
  TIMEOUT: 30000,
};

export default {
  TRACKING_CONFIG,
  TPMS_CONFIG,
};
