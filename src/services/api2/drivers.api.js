/**
 * Drivers API for Backend 2
 * Handles driver management operations (CRUD)
 */

import api2Instance from './config';

export const driversApi = {
  /**
   * Get all drivers with pagination
   * @param {Object} params - { page, limit }
   * @returns {Promise}
   */
  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      
      const queryString = queryParams.toString();
      const url = queryString ? `/drivers?${queryString}` : '/drivers';
      
      console.log('👤 Fetching drivers from:', url);
      const response = await api2Instance.get(url);
      console.log('✅ Drivers data loaded:', response?.data?.length || response?.length || 'unknown count');
      return response;
    } catch (error) {
      console.error('❌ Failed to load drivers:', error.message);
      throw error;
    }
  },

  /**
   * Get specific driver by ID
   * @param {string} driverId
   * @returns {Promise}
   */
  getById: async (driverId) => {
    const response = await api2Instance.get(`/drivers/${driverId}`);
    return response;
  },

  /**
   * Create new driver
   * @param {Object} driverData - { name, licenseNumber, phone, email, address, status }
   * @returns {Promise}
   */
  create: async (driverData) => {
    const response = await api2Instance.post('/drivers', driverData);
    return response;
  },

  /**
   * Update driver
   * @param {string} driverId
   * @param {Object} driverData
   * @returns {Promise}
   */
  update: async (driverId, driverData) => {
    const response = await api2Instance.put(`/drivers/${driverId}`, driverData);
    return response;
  },

  /**
   * Delete driver (Soft delete - set status to inactive)
   * @param {string} driverId
   * @returns {Promise}
   */
  delete: async (driverId) => {
    try {
      // Try using DELETE endpoint first (backend might handle soft delete internally)
      const response = await api2Instance.delete(`/drivers/${driverId}`);
      return response;
    } catch (error) {
      // Fallback: Try PATCH with status update
      console.warn('DELETE failed, trying PATCH with status update:', error.message);
      const response = await api2Instance.patch(`/drivers/${driverId}`, { status: 'inactive' });
      return response;
    }
  },
};

export default driversApi;
