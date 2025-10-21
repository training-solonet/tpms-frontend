// src/services/api/tpms.api.js

import { TPMS_CONFIG } from './config.js';

/**
 * TPMS (Tire Pressure Monitoring System) API
 * Handles tire pressure data from external TPMS service
 */

/**
 * Build TPMS URL with authentication parameters
 * @param {string} baseUrl - Base URL
 * @param {object} extraParams - Additional query parameters
 * @returns {string} Complete URL with auth params
 */
const buildTpmsUrl = (baseUrl, extraParams = {}) => {
  if (!baseUrl) return '';
  try {
    let urlObj;
    if (/^https?:\/\//i.test(baseUrl) || /^wss?:\/\//i.test(baseUrl)) {
      urlObj = new URL(baseUrl);
    } else {
      const origin =
        (typeof window !== 'undefined' && window.location && window.location.origin) ||
        'http://localhost';
      urlObj = new URL(baseUrl, origin);
    }
    const params = new URLSearchParams(urlObj.search);
    if (TPMS_CONFIG.API_KEY) params.set('apiKey', TPMS_CONFIG.API_KEY);
    if (TPMS_CONFIG.SN) params.set('sn', TPMS_CONFIG.SN);
    Object.entries(extraParams || {}).forEach(([k, v]) => {
      if (v != null && v !== '') params.set(k, v);
    });
    urlObj.search = params.toString();
    return urlObj.toString();
  } catch {
    return baseUrl;
  }
};

/**
 * Fetch data from TPMS service
 * @param {string} fullUrl - Complete URL
 * @returns {Promise<object>} TPMS data
 */
const fetchTpms = async (fullUrl) => {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TPMS_CONFIG.TIMEOUT);
  try {
    const isSameOrigin =
      typeof window !== 'undefined' && fullUrl.startsWith(window.location.origin + '/');
    const res = await fetch(fullUrl, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      headers: isSameOrigin && TPMS_CONFIG.API_KEY ? { 'x-api-key': TPMS_CONFIG.API_KEY } : {},
      signal: controller.signal,
    });
    clearTimeout(t);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
    }
    const data = await res.json().catch(() => ({}));
    if (data && data.error) {
      return { success: false, data: null, error: String(data.error) };
    }
    return { success: true, data: data.data || data };
  } catch (e) {
    clearTimeout(t);
    return { success: false, data: null, error: e.message || 'Request failed' };
  }
};

export const tpmsAPI = {
  /**
   * Get WebSocket URL for real-time TPMS data
   * @returns {string} WebSocket URL
   */
  getRealtimeWSUrl: () => {
    if (!TPMS_CONFIG.WS_URL) return '';
    return buildTpmsUrl(TPMS_CONFIG.WS_URL);
  },

  /**
   * Get real-time TPMS snapshot
   * @returns {Promise<object>} Real-time TPMS data
   */
  getRealtimeSnapshot: async () => {
    const url = buildTpmsUrl(TPMS_CONFIG.REALTIME_ENDPOINT);
    if (!url) return { success: false, data: null, error: 'Missing realtime endpoint' };
    return await fetchTpms(url);
  },

  /**
   * Get TPMS location history
   * @param {object} options - { sn, startTime, endTime }
   * @returns {Promise<object>} Location history data
   */
  getLocationHistory: async ({ sn, startTime, endTime } = {}) => {
    const extra = {};
    if (sn) extra.sn = sn;
    if (startTime) extra.startTime = startTime;
    if (endTime) extra.endTime = endTime;
    const url = buildTpmsUrl(TPMS_CONFIG.LOCATION_ENDPOINT, extra);
    if (!url) return { success: false, data: null, error: 'Missing history endpoint' };
    return await fetchTpms(url);
  },
};

export default tpmsAPI;
