/**
 * Devices API for Backend 2
 * Uses REST-style endpoints for CRUD operations
 * Note: /iot/data endpoint only accepts cmd: tpdata|hubdata|state|lock for IoT hardware data
 */

import api2Instance from './config';

export const devicesApi = {
  /**
   * Get all devices with pagination and filters
   * @param {Object} params - { page, limit, truck_id, status, search }
   * @returns {Promise}
   */
  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.truck_id) queryParams.append('truck_id', params.truck_id);
      if (params.status) queryParams.append('status', params.status);
      if (params.search) queryParams.append('search', params.search);

      const queryString = queryParams.toString();
      const url = queryString ? `/devices?${queryString}` : '/devices';

      console.log('📱 Fetching devices from:', url);
      const response = await api2Instance.get(url);
      console.log(
        '✅ Devices data loaded:',
        response?.data?.devices?.length || response?.data?.length || 'unknown count'
      );
      return response;
    } catch (error) {
      console.error('❌ Failed to load devices:', error.message);
      throw error;
    }
  },

  /**
   * Get device by ID
   * @param {number} deviceId - Integer ID
   * @returns {Promise}
   */
  getById: async (deviceId) => {
    const response = await api2Instance.get(`/devices/${parseInt(deviceId)}`);
    return response;
  },

  /**
   * Create new device
   * @param {Object} deviceData - { truck_id, sn, sim_number, status }
   * @returns {Promise}
   */
  create: async (deviceData) => {
    const payload = {
      sn: deviceData.sn,
      truck_id: deviceData.truck_id ? parseInt(deviceData.truck_id) : null,
      sim_number: deviceData.sim_number || null,
      status: deviceData.status || 'active',
    };
    const response = await api2Instance.post('/devices', payload);
    return response;
  },

  /**
   * Update device
   * @param {number} deviceId - Integer ID
   * @param {Object} deviceData
   * @returns {Promise}
   */
  update: async (deviceId, deviceData) => {
    const payload = {
      ...(deviceData.sn && { sn: deviceData.sn }),
      ...(deviceData.truck_id && { truck_id: parseInt(deviceData.truck_id) }),
      ...(deviceData.sim_number !== undefined && { sim_number: deviceData.sim_number }),
      ...(deviceData.status && { status: deviceData.status }),
      ...(deviceData.bat1 !== undefined && { bat1: deviceData.bat1 }),
      ...(deviceData.bat2 !== undefined && { bat2: deviceData.bat2 }),
      ...(deviceData.bat3 !== undefined && { bat3: deviceData.bat3 }),
    };
    const response = await api2Instance.put(`/devices/${parseInt(deviceId)}`, payload);
    return response;
  },

  /**
   * Delete device (soft delete)
   * @param {number} deviceId - Integer ID
   * @returns {Promise}
   */
  delete: async (deviceId) => {
    const response = await api2Instance.delete(`/devices/${parseInt(deviceId)}`);
    return response;
  },

  /**
   * Get all sensors
   * @param {Object} params - { page, limit, device_id, status, tireNo, search }
   * @returns {Promise}
   */
  getAllSensors: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.device_id) queryParams.append('device_id', params.device_id);
      if (params.status) queryParams.append('status', params.status);
      if (params.tireNo) queryParams.append('tireNo', params.tireNo);
      if (params.search) queryParams.append('search', params.search);

      const queryString = queryParams.toString();
      const url = queryString ? `/devices/sensors/all?${queryString}` : '/devices/sensors/all';

      console.log('📡 Fetching sensors from:', url);
      const response = await api2Instance.get(url);
      console.log(
        '✅ Sensors data loaded:',
        response?.data?.sensors?.length || response?.data?.length || 'unknown count'
      );
      return response;
    } catch (error) {
      console.error('❌ Failed to load sensors:', error.message);
      throw error;
    }
  },

  /**
   * Get sensor by ID
   * @param {number} sensorId - Integer ID
   * @returns {Promise}
   */
  getSensorById: async (sensorId) => {
    const response = await api2Instance.get(`/devices/sensors/${parseInt(sensorId)}`);
    return response;
  },

  /**
   * Get sensors by device ID
   * @param {number} deviceId - Integer ID
   * @returns {Promise}
   */
  getSensorsByDevice: async (deviceId) => {
    const response = await api2Instance.get(`/devices/${parseInt(deviceId)}/sensors`);
    return response;
  },

  /**
   * Create new sensor
   * @param {Object} sensorData - { sn, device_id, tireNo, sensorNo, simNumber, status }
   * @returns {Promise}
   */
  createSensor: async (sensorData) => {
    const payload = {
      sn: sensorData.sn,
      device_id: parseInt(sensorData.device_id),
      tireNo: parseInt(sensorData.tireNo),
      ...(sensorData.sensorNo && { sensorNo: parseInt(sensorData.sensorNo) }),
      ...(sensorData.simNumber && { simNumber: sensorData.simNumber }),
      status: sensorData.status || 'active',
    };
    const response = await api2Instance.post('/devices/sensors', payload);
    return response;
  },

  /**
   * Update sensor
   * @param {number} sensorId - Integer ID
   * @param {Object} sensorData - { tireNo, sensor_lock, status }
   * @returns {Promise}
   */
  updateSensor: async (sensorId, sensorData) => {
    const payload = {
      ...(sensorData.tireNo && { tireNo: parseInt(sensorData.tireNo) }),
      ...(sensorData.sensor_lock !== undefined && { sensor_lock: sensorData.sensor_lock }),
      ...(sensorData.status && { status: sensorData.status }),
    };
    const response = await api2Instance.put(`/devices/sensors/${parseInt(sensorId)}`, payload);
    return response;
  },

  /**
   * Delete sensor (soft delete)
   * @param {number} sensorId - Integer ID
   * @returns {Promise}
   */
  deleteSensor: async (sensorId) => {
    const response = await api2Instance.delete(`/devices/sensors/${parseInt(sensorId)}`);
    return response;
  },
};

export default devicesApi;
