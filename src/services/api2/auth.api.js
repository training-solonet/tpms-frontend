/**
 * Authentication API for Backend 2
 * Handles login, logout, token refresh, and user management
 */

import api2Instance from './config';

export const authApi = {
  /**
   * Login user
   * @param {Object} credentials - { username, password }
   * @returns {Promise} - { success, data: { token, user }, message }
   */
  login: async (credentials) => {
    console.log('🔐 Attempting login...', { username: credentials.username });

    const response = await api2Instance.post('/auth/login', credentials);

    console.log('📥 Login response:', response);

    // Store token and user data
    if (response.data?.token) {
      console.log('💾 Storing token and user data');
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    } else if (response.token) {
      // Handle case where token is at root level
      console.log('💾 Storing token and user data (root level)');
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user || response.data?.user));
    } else {
      console.warn('⚠️ No token found in response');
    }

    return response;
  },

  /**
   * Logout user
   * @returns {Promise}
   */
  logout: async () => {
    try {
      await api2Instance.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API response
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
  },

  /**
   * Refresh authentication token
   * @param {string} refreshToken
   * @returns {Promise}
   */
  refreshToken: async (refreshToken) => {
    const response = await api2Instance.post('/auth/refresh', { refreshToken });

    if (response.data?.token) {
      localStorage.setItem('authToken', response.data.token);
    }

    return response;
  },

  /**
   * Get current user info
   * @returns {Object|null}
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Get current auth token
   * @returns {string|null}
   */
  getToken: () => {
    return localStorage.getItem('authToken');
  },

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },
};

export default authApi;
