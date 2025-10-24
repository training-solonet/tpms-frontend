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
      console.log(
        '✅ Drivers data loaded:',
        response?.data?.length || response?.length || 'unknown count'
      );
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
   * Backend 2 API expects:
   * Required: name, licenseNumber (Badge ID)
   * Optional: phone, email, address, status ('aktif' or 'nonaktif')
   *
   * @param {Object} driverData - { name, licenseNumber, phone, email, address, status }
   * @returns {Promise}
   */
  create: async (driverData) => {
    try {
      console.log('➕ Creating driver with data:', driverData);
      const response = await api2Instance.post('/drivers', driverData);
      console.log('✅ Driver created successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to create driver:', error);
      throw error;
    }
  },

  /**
   * Update driver
   * @param {string} driverId
   * @param {Object} driverData - { name, licenseNumber, phone, email, address, status }
   * @returns {Promise}
   */
  update: async (driverId, driverData) => {
    try {
      console.log(`🔄 Updating driver ${driverId} with data:`, driverData);
      const response = await api2Instance.put(`/drivers/${driverId}`, driverData);
      console.log('✅ Driver updated successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to update driver:', error);
      throw error;
    }
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
