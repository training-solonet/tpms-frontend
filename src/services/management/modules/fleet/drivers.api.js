/**
 * Drivers API for Backend 2
 * Handles driver management operations (CRUD)
 */

import api2Instance from '../../config';

export const driversApi = {
  /**
   * Get all drivers with pagination
   * @param {Object} params - { page, limit, status, vendorId }
   * @returns {Promise}
   */
  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();

      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.status) queryParams.append('status', params.status);
      if (params.vendorId) queryParams.append('vendorId', params.vendorId);

      const queryString = queryParams.toString();
      const url = queryString ? `/drivers?${queryString}` : '/drivers';

      console.log('👤 Fetching drivers from:', url);
      const response = await api2Instance.get(url);
      console.log(
        '✅ Drivers data loaded:',
        response?.data?.drivers?.length || response?.data?.length || 'unknown count'
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
   * Get drivers with expiring licenses
   * @param {number} days - Number of days (default: 30)
   * @returns {Promise}
   */
  getExpiringLicenses: async (days = 30) => {
    const response = await api2Instance.get(`/drivers/expiring-licenses?days=${days}`);
    return response;
  },

  /**
   * Create new driver (with optional image upload)
   * @param {Object|FormData} driverData - FormData for image upload or Object { name, phone, email, license_number, license_type, license_expiry, vendor_id, status, image }
   * @returns {Promise}
   */
  create: async (driverData) => {
    try {
      console.log('➕ Creating driver with data:', driverData);
      const config =
        driverData instanceof FormData
          ? {
              headers: { 'Content-Type': 'multipart/form-data' },
            }
          : {};
      const response = await api2Instance.post('/drivers', driverData, config);
      console.log('✅ Driver created successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to create driver:', error);
      throw error;
    }
  },

  /**
   * Update driver (with optional image upload)
   * @param {string} driverId
   * @param {Object|FormData} driverData - FormData for image upload or Object { name, phone, email, license_number, license_type, license_expiry, status }
   * @returns {Promise}
   */
  update: async (driverId, driverData) => {
    try {
      console.log(`🔄 Updating driver ${driverId} with data:`, driverData);
      const config =
        driverData instanceof FormData
          ? {
              headers: { 'Content-Type': 'multipart/form-data' },
            }
          : {};
      const response = await api2Instance.put(`/drivers/${driverId}`, driverData, config);
      console.log('✅ Driver updated successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to update driver:', error);
      throw error;
    }
  },

  /**
   * Delete driver
   * @param {string} driverId
   * @returns {Promise}
   */
  delete: async (driverId) => {
    const response = await api2Instance.delete(`/drivers/${driverId}`);
    return response;
  },
};

export default driversApi;
