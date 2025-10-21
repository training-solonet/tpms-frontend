/**
 * Devices API for Backend 2
 * Handles IoT device and sensor management operations
 */

import api2Instance from './config';

export const devicesApi = {
  /**
   * Get all devices with pagination and filters
   * @param {Object} params - { page, limit, type }
   * @returns {Promise}
   */
  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();

      if (params.page) queryParams.append('page', params.page);
      if (params.type) queryParams.append('type', params.type);

      const queryString = queryParams.toString();
      const url = queryString ? `/devices?${queryString}` : '/devices';

      console.log('📱 Fetching devices from:', url);
      const response = await api2Instance.get(url);
      console.log(
        '✅ Devices data loaded:',
        response?.data?.length || response?.length || 'unknown count'
      );
      return response;
    } catch (error) {
      console.error('❌ Failed to load devices:', error.message);
      throw error;
    }
  },

  /**
   * Get device by ID
   * @param {string} deviceId
   * @returns {Promise}
   */
  getById: async (deviceId) => {
    const response = await api2Instance.get(`/devices/${deviceId}`);
    return response;
  },

  /**
   * Create new device
   * @param {Object} deviceData - { device_sn, imei, device_type, status, truck_id }
   * @returns {Promise}
   */
  create: async (deviceData) => {
    const response = await api2Instance.post('/devices', deviceData);
    return response;
  },

  /**
   * Update device
   * @param {string} deviceId
   * @param {Object} deviceData
   * @returns {Promise}
   */
  update: async (deviceId, deviceData) => {
    const response = await api2Instance.put(`/devices/${deviceId}`, deviceData);
    return response;
  },

  /**
   * Delete device
   * @param {string} deviceId
   * @returns {Promise}
   */
  delete: async (deviceId) => {
    const response = await api2Instance.delete(`/devices/${deviceId}`);
    return response;
  },

  /**
   * Get all sensors
   * @param {Object} params - { page, limit }
   * @returns {Promise}
   */
  getAllSensors: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();

      if (params.page) queryParams.append('page', params.page);

      const queryString = queryParams.toString();
      const url = queryString ? `/devices/sensors/all?${queryString}` : '/devices/sensors/all';

      console.log('📡 Fetching sensors from:', url);
      const response = await api2Instance.get(url);
      console.log(
        '✅ Sensors data loaded:',
        response?.data?.length || response?.length || 'unknown count'
      );
      return response;
    } catch (error) {
      console.error('❌ Failed to load sensors:', error.message);
      throw error;
    }
  },

  /**
   * Get sensors by device ID
   * @param {string} deviceId
   * @returns {Promise}
   */
  getSensorsByDevice: async (deviceId) => {
    const response = await api2Instance.get(`/devices/${deviceId}/sensors`);
    return response;
  },

  /**
   * Create new sensor
   * @param {Object} sensorData - { device_id, sensor_type, position, sn }
   * @returns {Promise}
   */
  createSensor: async (sensorData) => {
    const response = await api2Instance.post('/devices/sensors', sensorData);
    return response;
  },

  /**
   * Update sensor
   * @param {string} sensorId
   * @param {Object} sensorData
   * @returns {Promise}
   */
  updateSensor: async (sensorId, sensorData) => {
    const response = await api2Instance.put(`/devices/sensors/${sensorId}`, sensorData);
    return response;
  },

  /**
   * Delete sensor
   * @param {string} sensorId
   * @returns {Promise}
   */
  deleteSensor: async (sensorId) => {
    const response = await api2Instance.delete(`/devices/sensors/${sensorId}`);
    return response;
  },
};

export default devicesApi;
