/**
 * Sensors/Telemetry API for Backend 2
 * Handles sensor data ingestion and retrieval
 */

import api2Instance from './config';

export const sensorsApi = {
  /**
   * Ingest tire pressure data
   * @param {Object} data - { device_sn, tire_number, pressure_psi, temperature_celsius }
   * @returns {Promise}
   */
  ingestTirePressure: async (data) => {
    const response = await api2Instance.post('/sensors/tire-pressure', data);
    return response;
  },

  /**
   * Ingest tire temperature data
   * @param {Object} data - { device_sn, tire_number, temperature_celsius }
   * @returns {Promise}
   */
  ingestTireTemperature: async (data) => {
    const response = await api2Instance.post('/sensors/tire-temperature', data);
    return response;
  },

  /**
   * Ingest GPS data
   * @param {Object} data - { device_sn, latitude, longitude, speed_kmh, heading_deg }
   * @returns {Promise}
   */
  ingestGPS: async (data) => {
    const response = await api2Instance.post('/sensors/gps', data);
    return response;
  },

  /**
   * Ingest lock event
   * @param {Object} data - { device_sn, lock_status }
   * @returns {Promise}
   */
  ingestLockEvent: async (data) => {
    const response = await api2Instance.post('/sensors/lock', data);
    return response;
  },

  /**
   * Ingest raw sensor data
   * @param {Object} data - { device_sn, data_type, raw_data }
   * @returns {Promise}
   */
  ingestRawData: async (data) => {
    const response = await api2Instance.post('/sensors/raw', data);
    return response;
  },

  /**
   * Get last retrieved sensor data
   * @param {Object} params - { device_sn, limit }
   * @returns {Promise}
   */
  getLastData: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.device_sn) queryParams.append('device_sn', params.device_sn);
    if (params.limit) queryParams.append('limit', params.limit);

    const response = await api2Instance.get(`/sensors/last?${queryParams.toString()}`);
    return response;
  },

  /**
   * Get queue statistics
   * @returns {Promise}
   */
  getQueueStats: async () => {
    const response = await api2Instance.get('/sensors/queue/stats');
    return response;
  },

  /**
   * Process queue manually
   * @returns {Promise}
   */
  processQueue: async () => {
    const response = await api2Instance.post('/sensors/queue/process');
    return response;
  },
};

export default sensorsApi;
