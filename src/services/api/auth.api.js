// src/services/api/auth.api.js

import { apiRequest } from '../utils/apiRequest.js';

/**
 * Authentication API
 * Handles user login, logout, and session management
 */

// Helper to decode JWT payload
const decodeJwt = (token) => {
  try {
    const [, payload] = token.split('.');
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
};

export const authAPI = {
  /**
   * Login user with credentials
   * @param {object} credentials - { username, password }
   * @returns {Promise<object>} Login response
   */
  login: async (credentials) => {
    // Try multiple possible login endpoints
    const loginEndpoints = ['/api/auth/login', '/api/login', '/api/user/login', '/api/users/login'];

    let response;

    for (const endpoint of loginEndpoints) {
      try {
        response = await apiRequest(endpoint, {
          method: 'POST',
          body: JSON.stringify(credentials),
        });

        if (response.success) {
          console.log(`✅ Login successful via ${endpoint}`);
          break;
        } else if (response.error && !response.error.includes('404')) {
          // If it's not a 404, this endpoint exists but login failed
          console.log(`❌ Login failed via ${endpoint}: ${response.error}`);
          break;
        }
      } catch (error) {
        console.log(`⚠️ Login endpoint ${endpoint} failed, trying next...`);
      }
    }

    // If all endpoints failed, try offline mode
    if (!response || !response.success) {
      console.log('🔄 All login endpoints failed, attempting offline mode...');

      // Simple offline authentication for demo
      if (credentials.username === 'admin' && credentials.password === 'admin123') {
        const offlineUser = {
          id: 'offline-user',
          username: 'admin',
          name: 'Administrator',
          role: 'admin',
        };

        const offlineToken = 'offline-demo-token-' + Date.now();
        localStorage.setItem('authToken', offlineToken);
        localStorage.setItem('user', JSON.stringify(offlineUser));

        return {
          success: true,
          data: {
            user: offlineUser,
            token: offlineToken,
          },
          online: false,
          message: 'Logged in (Offline Mode)',
        };
      } else {
        return {
          success: false,
          message:
            'Invalid credentials. Backend unavailable - use demo credentials (admin/admin123)',
          online: false,
        };
      }
    }

    if (response.success && response.data) {
      const d = response.data;
      const token = d.token || d.accessToken || d.jwt || response.token || null;

      if (token) {
        localStorage.setItem('authToken', token);

        // Prefer backend-provided user if available; otherwise derive from JWT
        let user = d.user || response.user || null;
        if (!user) {
          const claims = decodeJwt(token);
          if (claims) {
            user = {
              id: claims.sub || claims.userId || claims.id || null,
              name: claims.name || claims.fullName || null,
              username: claims.username || claims.preferred_username || claims.email || null,
              email: claims.email || null,
              role: claims.role || claims.roles || null,
            };
          }
        }

        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        }
      }
    }

    return response;
  },

  /**
   * Logout user
   * @returns {object} Logout response
   */
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    return { success: true };
  },

  /**
   * Get current authenticated user
   * @returns {object} User object or null
   */
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('authToken');

    if (token) {
      // Validate JWT expiry if possible
      try {
        const [, payload] = token.split('.');
        const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        const claims = JSON.parse(json);
        if (claims && claims.exp) {
          const nowSec = Math.floor(Date.now() / 1000);
          if (claims.exp < nowSec) {
            // Token expired
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            return { success: false, data: null };
          }
        }
      } catch (e) {
        // Ignore decode errors; assume token is valid if server accepts it
      }
    }

    if (user && token) {
      return {
        success: true,
        data: JSON.parse(user),
        token,
      };
    }

    return { success: false, data: null };
  },
};

export default authAPI;
