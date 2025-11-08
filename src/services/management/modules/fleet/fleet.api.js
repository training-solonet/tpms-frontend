/**
 * Fleet Management API for Backend 2
 * Handles fleet summary and management operations
 */

import api2Instance from '../../config';

export const fleetApi = {
  /**
   * Get fleet summary
   * @returns {Promise}
   */
  getSummary: async () => {
    const response = await api2Instance.get('/fleet');
    return response;
  },
};

export default fleetApi;
