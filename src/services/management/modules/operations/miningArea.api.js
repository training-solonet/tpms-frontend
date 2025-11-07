/**
 * Mining Area API for Backend 2
 * Handles mining zone management and geofencing
 */

import api2Instance from '../../config';

export const miningAreaApi = {
  /**
   * Get all mining areas
   * @returns {Promise}
   */
  getAll: async () => {
    const response = await api2Instance.get('/mining-area');
    return response;
  },

  /**
   * Get mining area boundaries (GeoJSON)
   * @returns {Promise}
   */
  getBoundaries: async () => {
    const response = await api2Instance.get('/mining-area');
    return response;
  },

  /**
   * Get trucks in specific zone
   * @param {string} zoneName
   * @returns {Promise}
   */
  getTrucksInZone: async (zoneName) => {
    const response = await api2Instance.get(`/mining-area/${encodeURIComponent(zoneName)}/trucks`);
    return response;
  },

  /**
   * Get zone statistics
   * @returns {Promise}
   */
  getStatistics: async () => {
    const response = await api2Instance.get('/mining-area/statistics');
    return response;
  },

  /**
   * Get zone activity report
   * @returns {Promise}
   */
  getActivityReport: async () => {
    const response = await api2Instance.get('/mining-area/activity');
    return response;
  },

  /**
   * Check truck in zones
   * @param {string} truckId
   * @returns {Promise}
   */
  checkTruckInZones: async (truckId) => {
    const response = await api2Instance.get(`/mining-area/trucks/${truckId}/zones`);
    return response;
  },

  /**
   * Get nearby trucks
   * @param {Object} params - { latitude, longitude, radius }
   * @returns {Promise}
   */
  getNearbyTrucks: async (params) => {
    const queryParams = new URLSearchParams();

    if (params.latitude) queryParams.append('latitude', params.latitude);
    if (params.longitude) queryParams.append('longitude', params.longitude);
    if (params.radius) queryParams.append('radius', params.radius);

    const response = await api2Instance.get(`/mining-area/nearby?${queryParams.toString()}`);
    return response;
  },

  /**
   * Create mining zone
   * @param {Object} zoneData - { name, description, zone_type, coordinates }
   * @returns {Promise}
   */
  create: async (zoneData) => {
    const response = await api2Instance.post('/mining-area', zoneData);
    return response;
  },

  /**
   * Update mining zone
   * @param {string} zoneName
   * @param {Object} zoneData
   * @returns {Promise}
   */
  update: async (zoneName, zoneData) => {
    const response = await api2Instance.put(
      `/mining-area/${encodeURIComponent(zoneName)}`,
      zoneData
    );
    return response;
  },

  /**
   * Delete mining zone
   * @param {string} zoneName
   * @returns {Promise}
   */
  delete: async (zoneName) => {
    const response = await api2Instance.delete(`/mining-area/${encodeURIComponent(zoneName)}`);
    return response;
  },
};

export default miningAreaApi;
