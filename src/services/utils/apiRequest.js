// src/services/utils/apiRequest.js

import { API_CONFIG } from '../api/config.js';

/**
 * Generic API request utility
 * Handles all HTTP requests with authentication, error handling, and timeout
 */

// Helper to get stored auth token
const getAuthToken = () => localStorage.getItem('authToken');

// Get auth headers
export const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Make an API request with standardized error handling
 * @param {string} endpoint - API endpoint path
 * @param {object} options - Fetch options
 * @returns {Promise<object>} Response object with success, data, and error
 */
export const apiRequest = async (endpoint, options = {}) => {
  // Normalize BASE_URL and endpoint to avoid double /api or missing slashes
  let base = API_CONFIG.BASE_URL || '';
  let path = endpoint || '';
  if (base.endsWith('/')) base = base.slice(0, -1);
  // If base already ends with /api and path starts with /api, strip one /api from path
  if (base.toLowerCase().endsWith('/api') && path.toLowerCase().startsWith('/api')) {
    path = path.slice(4); // remove leading '/api'
  }
  const url = `${base}${path}`;
  const token = getAuthToken();

  const defaultOptions = {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    // Ensure requests are made with CORS mode to satisfy browsers when hitting cross-origin APIs
    mode: 'cors',
    // We use Bearer tokens, not cookies; keep credentials omitted to avoid unnecessary preflight complications
    credentials: 'omit',
    timeout: API_CONFIG.TIMEOUT,
    ...options,
  };

  // If method is not GET and Content-Type not provided, set JSON explicitly
  const method = (defaultOptions.method || 'GET').toUpperCase();
  if (method !== 'GET') {
    defaultOptions.headers['Content-Type'] = defaultOptions.headers['Content-Type'] || 'application/json';
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
      // Handle 401 globally
      if (response.status === 401) {
        console.warn('401 Unauthorized detected. Logging out...');
        // Import authAPI dynamically to avoid circular dependency
        const { authAPI } = await import('../api/auth.api.js');
        try {
          authAPI.logout();
        } finally {
          if (typeof window !== 'undefined') {
            window.location.replace('/login');
          }
        }
      }
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
    // Better error handling for different error types
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
