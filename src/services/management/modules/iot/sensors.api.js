/**
 * Sensors API for Backend 2
 * Handles sensor CRUD operations and IoT data ingestion
 */

import api2Instance from '../../config';

export const sensorsApi = {
  /**
   * Get all sensors
   * @param {Object} params - { page, limit, device_id, status, tireNo, search }
   * @returns {Promise}
   */
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.device_id) queryParams.append('device_id', params.device_id);
    if (params.status) queryParams.append('status', params.status);
    if (params.tireNo) queryParams.append('tireNo', params.tireNo);
    if (params.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const url = queryString ? `/sensors?${queryString}` : '/sensors';
    const response = await api2Instance.get(url);
    return response;
  },

  /**
   * Get sensor by ID
   * @param {string} sensorId
   * @returns {Promise}
   */
  getById: async (sensorId) => {
    const response = await api2Instance.get(`/sensors/${sensorId}`);
    return response;
  },

  /**
   * Create new sensor
   * @param {Object} sensorData - { sn, device_id, tireNo, simNumber, sensorNo, sensor_lock, status }
   * @returns {Promise}
   */
  create: async (sensorData) => {
    const response = await api2Instance.post('/sensors/create', sensorData);
    return response;
  },

  /**
   * Update sensor
   * @param {string} sensorId
   * @param {Object} sensorData - { tireNo, sensor_lock, status }
   * @returns {Promise}
   */
  update: async (sensorId, sensorData) => {
    const response = await api2Instance.put(`/sensors/${sensorId}`, sensorData);
    return response;
  },

  /**
   * Delete sensor
   * @param {string} sensorId
   * @returns {Promise}
   */
  delete: async (sensorId) => {
    const response = await api2Instance.delete(`/sensors/${sensorId}`);
    return response;
  },

  /**
   * Get last sensor data
   * @param {Object} params - { limit, device_id, sensor_id }
   * @returns {Promise}
   */
  getLastData: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.limit) queryParams.append('limit', params.limit);
    if (params.device_id) queryParams.append('device_id', params.device_id);
    if (params.sensor_id) queryParams.append('sensor_id', params.sensor_id);

    const queryString = queryParams.toString();
    const url = queryString ? `/sensors/last?${queryString}` : '/sensors/last';
    const response = await api2Instance.get(url);
    return response;
  },
  /**
   * IoT Data Ingestion - Single endpoint for all IoT data types
   * @param {Object} data - { cmd, sn, ...data }
   * cmd types: 'tpdata' (tire pressure), 'hubdata' (device battery), 'state' (device status), 'lock' (lock status)
   * @returns {Promise}
   */
  ingestIoTData: async (data) => {
    const response = await api2Instance.post('/iot/data', data);
    return response;
  },

  /**
   * Ingest tire pressure and temperature data
   * @param {Object} data - { cmd: 'tpdata', sn, tempValue, tirepValue, exType, bat }
   * @returns {Promise}
   */
  ingestTirePressure: async (data) => {
    const payload = { cmd: 'tpdata', ...data };
    const response = await api2Instance.post('/iot/data', payload);
    return response;
  },

  /**
   * Ingest device battery data
   * @param {Object} data - { cmd: 'hubdata', sn, bat1, bat2, bat3, sim_number }
   * @returns {Promise}
   */
  ingestDeviceBattery: async (data) => {
    const payload = { cmd: 'hubdata', ...data };
    const response = await api2Instance.post('/iot/data', payload);
    return response;
  },

  /**
   * Ingest device status
   * @param {Object} data - { cmd: 'state', sn, status }
   * @returns {Promise}
   */
  ingestDeviceStatus: async (data) => {
    const payload = { cmd: 'state', ...data };
    const response = await api2Instance.post('/iot/data', payload);
    return response;
  },

  /**
   * Ingest lock status
   * @param {Object} data - { cmd: 'lock', sn, lock, type }
   * @returns {Promise}
   */
  ingestLockStatus: async (data) => {
    const payload = { cmd: 'lock', ...data };
    const response = await api2Instance.post('/iot/data', payload);
    return response;
  },
};

export default sensorsApi;
