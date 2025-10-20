// src/services/api/vendors.api.js

import { apiRequest } from '../utils/apiRequest.js';

/**
 * Vendors API
 * Handles vendor (master data) CRUD operations
 */

export const vendorsAPI = {
  /**
   * Get all vendors
   * @param {object} params - Query parameters
   * @returns {Promise<object>} Vendors data
   */
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/vendors${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint);
  },

  /**
   * Get vendor by ID
   * @param {string|number} id - Vendor ID
   * @returns {Promise<object>} Vendor data
   */
  getById: async (id) => {
    return await apiRequest(`/api/vendors/${encodeURIComponent(id)}`);
  },

  /**
   * Create new vendor
   * @param {object} payload - Vendor data
   * @returns {Promise<object>} Created vendor
   */
  create: async (payload) => {
    return await apiRequest(`/api/vendors`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Update vendor
   * @param {string|number} id - Vendor ID
   * @param {object} payload - Updated vendor data
   * @returns {Promise<object>} Updated vendor
   */
  update: async (id, payload) => {
    return await apiRequest(`/api/vendors/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Delete vendor
   * @param {string|number} id - Vendor ID
   * @returns {Promise<object>} Delete response
   */
  remove: async (id) => {
    return await apiRequest(`/api/vendors/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};

export default vendorsAPI;
