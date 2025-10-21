// src/services/api/devices.api.js

import { apiRequest } from '../utils/apiRequest.js';

/**
 * Devices API
 * Handles device management operations
 */

export const devicesAPI = {
  /**
   * Get all devices
   * @param {object} params - Query parameters
   * @returns {Promise<object>} Devices data
   */
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/devices${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint);
  },

  /**
   * Get device by ID
   * @param {string|number} id - Device ID
   * @returns {Promise<object>} Device data
   */
  getById: async (id) => {
    return await apiRequest(`/api/devices/${encodeURIComponent(id)}`);
  },

  /**
   * Create new device
   * @param {object} payload - Device data
   * @returns {Promise<object>} Created device
   */
  create: async (payload) => {
    return await apiRequest(`/api/devices`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Update device
   * @param {string|number} id - Device ID
   * @param {object} payload - Updated device data
   * @returns {Promise<object>} Updated device
   */
  update: async (id, payload) => {
    return await apiRequest(`/api/devices/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Delete device
   * @param {string|number} id - Device ID
   * @returns {Promise<object>} Delete response
   */
  remove: async (id) => {
    return await apiRequest(`/api/devices/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};

export default devicesAPI;
