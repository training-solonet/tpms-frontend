/**
 * Trucks API for Backend 2
 * Handles all truck management operations (CRUD)
 */

import api2Instance from './config';

export const trucksApi = {
  /**
   * Get all trucks with pagination and filters
   * @param {Object} params - { page, limit, status, minFuel, search }
   * @returns {Promise}
   */
  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();

      // Be-tpms.connectis.my.id might not support large limit values
      // Try without query params first, or use smaller limit
      if (params.page) queryParams.append('page', params.page);
      if (params.status) queryParams.append('status', params.status);
      if (params.minFuel) queryParams.append('minFuel', params.minFuel);
      if (params.search) queryParams.append('search', params.search);

      // Try with query string first
      const queryString = queryParams.toString();
      const url = queryString ? `/trucks?${queryString}` : '/trucks';

      console.log('🚛 Fetching trucks from:', url);
      const response = await api2Instance.get(url);
      console.log(
        '✅ Trucks data loaded:',
        response?.data?.length || response?.length || 'unknown count',
        'trucks'
      );
      return response;
    } catch (error) {
      console.error('❌ Failed to load trucks:', error.message);
      throw error;
    }
  },

  /**
   * Get specific truck by ID
   * @param {string} truckId
   * @returns {Promise}
   */
  getById: async (truckId) => {
    const response = await api2Instance.get(`/trucks/${truckId}`);
    return response;
  },

  /**
   * Get truck tire pressures
   * @param {string} truckId
   * @returns {Promise}
   */
  getTirePressures: async (truckId) => {
    const response = await api2Instance.get(`/trucks/${truckId}/tires`);
    return response;
  },

  /**
   * Get truck location history
   * @param {string} truckId - Can be ID or plate number
   * @param {Object} params - { timeRange, limit, minSpeed }
   * @returns {Promise}
   */
  getLocationHistory: async (truckId, params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.timeRange) queryParams.append('timeRange', params.timeRange);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.minSpeed !== undefined) queryParams.append('minSpeed', params.minSpeed);

    const response = await api2Instance.get(`/trucks/${truckId}/history?${queryParams.toString()}`);
    return response;
  },

  /**
   * Get truck alerts
   * @param {string} truckId
   * @param {Object} params - { resolved, limit }
   * @returns {Promise}
   */
  getAlerts: async (truckId, params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.resolved !== undefined) queryParams.append('resolved', params.resolved);
    if (params.limit) queryParams.append('limit', params.limit);

    const response = await api2Instance.get(`/trucks/${truckId}/alerts?${queryParams.toString()}`);
    return response;
  },

  /**
   * Get real-time truck locations (GeoJSON)
   * @returns {Promise}
   */
  getRealtimeLocations: async () => {
    const response = await api2Instance.get('/trucks/realtime/locations');
    return response;
  },

  /**
   * Get truck location by plate number
   * @param {string} plateNumber
   * @param {Object} params - { timeRange, limit }
   * @returns {Promise}
   */
  getLocationByPlate: async (plateNumber, params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.timeRange) queryParams.append('timeRange', params.timeRange);
    if (params.limit) queryParams.append('limit', params.limit);

    const response = await api2Instance.get(
      `/location-history/${encodeURIComponent(plateNumber)}?${queryParams.toString()}`
    );
    return response;
  },

  /**
   * Create new truck
   * @param {Object} truckData - { truckNumber, plateNumber, model, year, capacity, vendor, driver, status }
   * @returns {Promise}
   */
  create: async (truckData) => {
    const response = await api2Instance.post('/trucks', truckData);
    return response;
  },

  /**
   * Update truck
   * @param {string} truckId
   * @param {Object} truckData
   * @returns {Promise}
   */
  update: async (truckId, truckData) => {
    const response = await api2Instance.put(`/trucks/${truckId}`, truckData);
    return response;
  },

  /**
   * Update truck status
   * @param {string} truckId
   * @param {string} status - 'active', 'inactive', 'maintenance'
   * @returns {Promise}
   */
  updateStatus: async (truckId, status) => {
    const response = await api2Instance.put(`/trucks/${truckId}/status`, { status });
    return response;
  },

  /**
   * Bulk update truck status
   * @param {Array} truckIds
   * @param {string} status
   * @returns {Promise}
   */
  bulkUpdateStatus: async (truckIds, status) => {
    const response = await api2Instance.put('/trucks/bulk/status', { truckIds, status });
    return response;
  },

  /**
   * Delete truck
   * @param {string} truckId
   * @returns {Promise}
   */
  delete: async (truckId) => {
    const response = await api2Instance.delete(`/trucks/${truckId}`);
    return response;
  },

  /**
   * Resolve truck alert
   * @param {string} truckId
   * @param {string} alertId
   * @returns {Promise}
   */
  resolveAlert: async (truckId, alertId) => {
    const response = await api2Instance.put(`/trucks/${truckId}/alerts/${alertId}/resolve`);
    return response;
  },
};

export default trucksApi;
