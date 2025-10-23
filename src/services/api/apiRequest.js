// src/services/api/apiRequest.js
// API Request utility for Backend 1 (Tracking & TPMS)

import { TRACKING_CONFIG } from './config.js';

/**
 * Make an API request to Backend 1 (Tracking Server)
 * @param {string} endpoint - API endpoint path
 * @param {object} options - Fetch options
 * @returns {Promise<object>} Response object with success, data, and error
 */
export const apiRequest = async (endpoint, options = {}) => {
  // Use TRACKING_CONFIG for Backend 1
  let base = TRACKING_CONFIG.BASE_URL || '';
  let path = endpoint || '';

  // Normalize slashes
  if (base.endsWith('/')) base = base.slice(0, -1);
  if (!path.startsWith('/')) path = '/' + path;

  const url = `${base}${path}`;

  console.log(`🌐 [BE1 apiRequest] Calling: ${url}`);

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    mode: 'cors',
    credentials: 'omit',
    timeout: TRACKING_CONFIG.TIMEOUT || 30000,
    ...options,
  };

  // If method is not GET and Content-Type not provided, set JSON explicitly
  const method = (defaultOptions.method || 'GET').toUpperCase();
  if (method !== 'GET') {
    defaultOptions.headers['Content-Type'] =
      defaultOptions.headers['Content-Type'] || 'application/json';
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn(`⏰ Request timeout after ${defaultOptions.timeout}ms for: ${url}`);
      controller.abort();
    }, defaultOptions.timeout);

    const response = await fetch(url, {
      ...defaultOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const message = `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(message);
    }

    const data = await response.json();

    return {
      success: true,
      data: data.data || data,
      online: true,
    };
  } catch (error) {
    let errorMessage = error.message;

    if (error.name === 'AbortError') {
      errorMessage = `Request timeout after ${defaultOptions.timeout}ms`;
      console.warn(`⏰ ${errorMessage} for ${url}`);
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMessage = 'Network connection failed - server may be unreachable';
      console.warn(`🌐 ${errorMessage} for ${url}`);
    } else {
      console.warn(`❌ API request failed for ${url}:`, error.message);
    }

    return {
      success: false,
      data: null,
      online: false,
      error: errorMessage,
    };
  }
};

export default apiRequest;
