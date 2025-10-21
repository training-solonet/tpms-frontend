
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
  REALTIME_ENDPOINT: (() => {
    const endpoint = import.meta.env?.VITE_API_TPMS_REALTIME_ENDPOINT || '';
    // Auto-convert relative path ke absolute URL
    if (endpoint && !endpoint.startsWith('http')) {
      return `https://be-tpms.connectis.my.id${endpoint}`;
    }
    return endpoint;
  })(),
  LOCATION_ENDPOINT: (() => {
    const endpoint = import.meta.env?.VITE_API_TPMS_LOCATION_ENDPOINT || '';
    // Auto-convert relative path ke absolute URL
    if (endpoint && !endpoint.startsWith('http')) {
      return `https://be-tpms.connectis.my.id${endpoint}`;
    }
    return endpoint;
  })(),
  API_KEY:
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_TPMS_API_KEY) ||
    '',
  SN: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_TPMS_SN) || '',
  WS_URL:
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_TPMS_WS_URL) ||
    '',
  TIMEOUT: 30000,
};

export default {
  API_CONFIG,
  TPMS_CONFIG,
};
