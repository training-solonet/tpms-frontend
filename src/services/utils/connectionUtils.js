// src/services/utils/connectionUtils.js

import { API_BASE_URL } from '../api2/config.js';

/**
 * Connection utilities for checking backend availability
 */

// Connection status
let isOnline = true;
let connectionAttempts = 0;

// Helper to get stored auth token
const getAuthToken = () => localStorage.getItem('authToken');

/**
 * Check if backend is available
 * @returns {Promise<boolean>} Connection status
 */
export const checkBackendConnection = async () => {
  try {
    console.log('🔌 Checking backend connection to:', API_BASE_URL);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    // Try different endpoints in order of preference (no /api/ prefix, already in BASE_URL)
    const endpoints = [
      '/vendors?limit=1', // Working endpoint - try first
      '/devices?limit=1', // Alternative endpoint
      '/dashboard/stats', // Fallback endpoint
    ];

    let response;

    for (const endpoint of endpoints) {
      try {
        const token = getAuthToken();
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'GET',
          signal: controller.signal,
          mode: 'cors',
          // Do not send Content-Type on GET to keep it a simple request (avoid preflight)
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (response.ok || response.status === 401) {
          // 401 means server is responding, just needs auth
          clearTimeout(timeoutId);
          isOnline = true;
          connectionAttempts = 0;
          console.log(`✅ Backend connection successful via ${endpoint}`);
          return true;
        }
      } catch {
        console.log(`⚠️ Endpoint ${endpoint} failed, trying next...`);
      }
    }

    clearTimeout(timeoutId);
    isOnline = false;
    connectionAttempts++;
    console.error(
      `❌ All backend endpoints failed. Last response status: ${response?.status || 'No response'}`
    );
    return false;
  } catch (error) {
    isOnline = false;
    connectionAttempts++;

    let errorMessage = error.message;
    if (error.name === 'AbortError') {
      errorMessage = `Connection timeout after 15s`;
      console.warn(`⏰ ${errorMessage} for ${API_BASE_URL}`);
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMessage = 'Network connection failed - server may be unreachable';
      console.warn(`🌐 ${errorMessage} for ${API_BASE_URL}`);
    } else {
      console.warn(`❌ Backend connection failed (attempt ${connectionAttempts}):`, error.message);
    }

    return false;
  }
};

/**
 * Get current online status
 * @returns {boolean}
 */
export const isConnectionOnline = () => isOnline;

/**
 * Get number of connection attempts
 * @returns {number}
 */
export const getConnectionAttempts = () => connectionAttempts;

/**
 * Start periodic connection monitoring
 * @param {number} interval - Check interval in milliseconds (default: 30000)
 * @returns {number} Interval ID
 */
export const startConnectionMonitor = (interval = 30000) => {
  return setInterval(async () => {
    await checkBackendConnection();
  }, interval);
};

// Connection status utilities (backward compatibility)
export const connectionUtils = {
  isOnline: isConnectionOnline,
  getConnectionAttempts,
  checkConnection: checkBackendConnection,
  startConnectionMonitor,
};

// Initialize connection check
checkBackendConnection();

export default connectionUtils;
