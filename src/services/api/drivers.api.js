// src/services/api/drivers.api.js

import { apiRequest } from '../utils/apiRequest.js';

/**
 * Drivers API
 * Handles driver (master data) CRUD operations
 */

export const driversAPI = {
  /**
   * Get all drivers
   * @param {object} params - Query parameters
   * @returns {Promise<object>} Drivers data
   */
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/drivers${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint);
  },

  /**
   * Get driver by ID
   * @param {string|number} id - Driver ID
   * @returns {Promise<object>} Driver data
   */
  getById: async (id) => {
    return await apiRequest(`/api/drivers/${encodeURIComponent(id)}`);
  },

  /**
   * Create new driver
   * @param {object} payload - Driver data
   * @returns {Promise<object>} Created driver
   */
  create: async (payload) => {
    return await apiRequest(`/api/drivers`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Update driver
   * @param {string|number} id - Driver ID
   * @param {object} payload - Updated driver data
   * @returns {Promise<object>} Updated driver
   */
  update: async (id, payload) => {
    return await apiRequest(`/api/drivers/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Delete driver
   * @param {string|number} id - Driver ID
   * @returns {Promise<object>} Delete response
   */
  remove: async (id) => {
    return await apiRequest(`/api/drivers/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};

export default driversAPI;
