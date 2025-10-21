// src/services/api/sensors.api.js

import { apiRequest } from '../utils/apiRequest.js';

/**
 * Sensors API
 * Handles sensor data operations
 */

export const sensorsAPI = {
  /**
   * Get all sensors
   * @param {object} params - Query parameters
   * @returns {Promise<object>} Sensors data
   */
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/devices/sensors/all${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint);
  },

  /**
   * Get sensor by ID
   * @param {string|number} id - Sensor ID
   * @returns {Promise<object>} Sensor data
   */
  getById: async (id) => {
    return await apiRequest(`/api/devices/sensors/${encodeURIComponent(id)}`);
  },

  /**
   * Create new sensor
   * @param {object} payload - Sensor data
   * @returns {Promise<object>} Created sensor
   */
  create: async (payload) => {
    return await apiRequest(`/api/devices/sensors`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Update sensor
   * @param {string|number} id - Sensor ID
   * @param {object} payload - Updated sensor data
   * @returns {Promise<object>} Updated sensor
   */
  update: async (id, payload) => {
    return await apiRequest(`/api/devices/sensors/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Delete sensor
   * @param {string|number} id - Sensor ID
   * @returns {Promise<object>} Delete response
   */
  remove: async (id) => {
    return await apiRequest(`/api/devices/sensors/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};

export default sensorsAPI;
