/**
 * Alerts API for Backend 2
 * Handles alert management and monitoring
 */

import api2Instance from '../../config';

export const alertsApi = {
  /**
   * Get all alerts with filters
   * @param {Object} params - { severity, resolved, limit, page }
   * @returns {Promise}
   */
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.severity) queryParams.append('severity', params.severity);
    if (params.resolved !== undefined) queryParams.append('resolved', params.resolved);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.page) queryParams.append('page', params.page);

    const response = await api2Instance.get(`/dashboard/alerts?${queryParams.toString()}`);
    return response;
  },

  /**
   * Get alerts for specific truck
   * @param {string} truckId
   * @param {Object} params - { resolved, limit }
   * @returns {Promise}
   */
  getByTruck: async (truckId, params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.resolved !== undefined) queryParams.append('resolved', params.resolved);
    if (params.limit) queryParams.append('limit', params.limit);

    const response = await api2Instance.get(`/trucks/${truckId}/alerts?${queryParams.toString()}`);
    return response;
  },

  /**
   * Resolve alert
   * @param {string} truckId
   * @param {string} alertId
   * @returns {Promise}
   */
  resolve: async (truckId, alertId) => {
    const response = await api2Instance.put(`/trucks/${truckId}/alerts/${alertId}/resolve`);
    return response;
  },

  /**
   * Get alert statistics
   * @returns {Promise}
   */
  getStats: async () => {
    const response = await api2Instance.get('/dashboard/alerts');
    return response;
  },
};

export default alertsApi;
