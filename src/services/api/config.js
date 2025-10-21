// src/services/api/config.js

/**
 * API Configuration
 * Centralized configuration for all API endpoints
 */

// Main API Configuration (read from .env via Vite)
export const API_CONFIG = {
  BASE_URL:
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
    '',
  WS_URL:
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_WS_URL) || '',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 2,
  RETRY_DELAY: 2000,
};

// TPMS (Tire Pressure Monitoring System) Configuration
export const TPMS_CONFIG = {
  REALTIME_ENDPOINT:
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_TPMS_REALTIME_ENDPOINT) || '',
  LOCATION_ENDPOINT:
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_TPMS_LOCATION_ENDPOINT) || '',
  API_KEY:
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_TPMS_API_KEY) || '',
  SN:
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_TPMS_SN) || '',
  WS_URL:
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_TPMS_WS_URL) || '',
  TIMEOUT: 30000,
};

export default {
  API_CONFIG,
  TPMS_CONFIG,
};
