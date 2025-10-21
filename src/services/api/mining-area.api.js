// src/services/api/mining-area.api.js

import { apiRequest } from '../utils/apiRequest.js';

/**
 * Mining Area API
 * Handles mining area boundaries and zone statistics
 */

export const miningAreaAPI = {
  /**
   * Get mining area boundaries
   * @returns {Promise<object>} Boundaries data
   */
  getBoundaries: async () => {
    return await apiRequest('/api/mining-area');
  },

  /**
   * Get zone statistics
   * @returns {Promise<object>} Zone statistics
   */
  getZoneStatistics: async () => {
    return await apiRequest('/api/mining-area/statistics');
  },

  /**
   * Get trucks in a specific zone
   * @param {string} zoneName - Zone name
   * @returns {Promise<object>} Trucks in zone
   */
  getTrucksInZone: async (zoneName) => {
    return await apiRequest(`/api/mining-area/${zoneName}/trucks`);
  },
};

export default miningAreaAPI;
