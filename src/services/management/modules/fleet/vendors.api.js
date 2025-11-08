/**
 * Vendors API for Backend 2
 * Handles vendor management operations (CRUD)
 */

import api2Instance from '../../config';

export const vendorsApi = {
  /**
   * Get all vendors with pagination
   * @param {Object} params - { page, limit }
   * @returns {Promise}
   */
  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();

      if (params.page) queryParams.append('page', params.page);

      const queryString = queryParams.toString();
      const url = queryString ? `/vendors?${queryString}` : '/vendors';

      console.log('🏢 Fetching vendors from:', url);
      const response = await api2Instance.get(url);
      console.log(
        '✅ Vendors data loaded:',
        response?.data?.length || response?.length || 'unknown count'
      );
      return response;
    } catch (error) {
      console.error('❌ Failed to load vendors:', error.message);
      throw error;
    }
  },

  /**
   * Get specific vendor by ID
   * @param {string} vendorId
   * @returns {Promise}
   */
  getById: async (vendorId) => {
    const response = await api2Instance.get(`/vendors/${vendorId}`);
    return response;
  },

  /**
   * Get vendor trucks
   * @param {string} vendorId
   * @param {Object} params - { page, limit }
   * @returns {Promise}
   */
  getTrucks: async (vendorId, params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);

    const queryString = queryParams.toString();
    const url = queryString
      ? `/vendors/${vendorId}/trucks?${queryString}`
      : `/vendors/${vendorId}/trucks`;
    const response = await api2Instance.get(url);
    return response;
  },

  /**
   * Create new vendor
   * @param {Object} vendorData - { name_vendor, email, telephone, address, contact_person }
   * @returns {Promise}
   */
  create: async (vendorData) => {
    const response = await api2Instance.post('/vendors', vendorData);
    return response;
  },

  /**
   * Update vendor
   * @param {string} vendorId
   * @param {Object} vendorData
   * @returns {Promise}
   */
  update: async (vendorId, vendorData) => {
    console.log('🔄 Updating vendor via API:', vendorId, vendorData);
    const response = await api2Instance.put(`/vendors/${vendorId}`, vendorData);
    console.log('✅ Vendor update response:', response);
    return response;
  },

  /**
   * Delete vendor
   * @param {string} vendorId
   * @returns {Promise}
   */
  delete: async (vendorId) => {
    const response = await api2Instance.delete(`/vendors/${vendorId}`);
    return response;
  },
};

export default vendorsApi;
