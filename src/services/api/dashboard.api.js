// src/services/api/dashboard.api.js

import { apiRequest } from '../utils/apiRequest.js';

/**
 * Dashboard API
 * Handles dashboard statistics and reports
 */

export const dashboardAPI = {
  /**
   * Get dashboard statistics
   * @returns {Promise<object>} Dashboard stats
   */
  getStats: async () => {
    const result = await apiRequest('/api/dashboard/stats');
    return result;
  },

  /**
   * Get fleet summary
   * @returns {Promise<object>} Fleet summary data
   */
  getFleetSummary: async () => {
    const result = await apiRequest('/api/dashboard/fleet-summary');
    return result;
  },

  /**
   * Get alerts
   * @returns {Promise<object>} Alerts data
   */
  getAlerts: async () => {
    return await apiRequest('/api/dashboard/alerts');
  },

  /**
   * Get fuel report
   * @returns {Promise<object>} Fuel report data
   */
  getFuelReport: async () => {
    return await apiRequest('/api/dashboard/fuel');
  },

  /**
   * Get maintenance report
   * @returns {Promise<object>} Maintenance report data
   */
  getMaintenanceReport: async () => {
    return await apiRequest('/api/dashboard/maintenance');
  },
};

export default dashboardAPI;
