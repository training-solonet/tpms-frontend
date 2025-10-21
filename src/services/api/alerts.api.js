// src/services/api/alerts.api.js

import { apiRequest } from '../utils/apiRequest.js';

/**
 * Alerts API
 * Handles alert notifications and management
 */

export const alertsAPI = {
  /**
   * Get all alerts
   * @param {object} params - Query parameters
   * @returns {Promise<object>} Alerts data
   */
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/alerts${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint);
  },

  /**
   * Resolve an alert
   * @param {string|number} alertId - Alert ID
   * @returns {Promise<object>} Resolve response
   */
  resolve: async (alertId) => {
    return await apiRequest(`/api/alerts/${alertId}/resolve`, {
      method: 'PUT',
    });
  },
};

export default alertsAPI;
