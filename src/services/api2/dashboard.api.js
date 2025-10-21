/**
 * Dashboard API for Backend 2
 * Handles dashboard statistics and analytics
 */

import api2Instance from './config';

export const dashboardApi = {
  /**
   * Get dashboard statistics
   * @returns {Promise} - Fleet overview, alerts, fuel stats, etc.
   */
  getStats: async () => {
    const response = await api2Instance.get('/dashboard/stats');
    return response;
  },

  /**
   * Get fleet summary
   * @returns {Promise}
   */
  getFleetSummary: async () => {
    const response = await api2Instance.get('/dashboard/fleet-summary');
    return response;
  },

  /**
   * Get alert summary
   * @param {Object} params - { severity, limit }
   * @returns {Promise}
   */
  getAlertSummary: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.severity) queryParams.append('severity', params.severity);
    if (params.limit) queryParams.append('limit', params.limit);

    const response = await api2Instance.get(`/dashboard/alerts?${queryParams.toString()}`);
    return response;
  },

  /**
   * Get fuel report
   * @returns {Promise}
   */
  getFuelReport: async () => {
    const response = await api2Instance.get('/dashboard/fuel');
    return response;
  },

  /**
   * Get maintenance report
   * @returns {Promise}
   */
  getMaintenanceReport: async () => {
    const response = await api2Instance.get('/dashboard/maintenance');
    return response;
  },
};

export default dashboardApi;
