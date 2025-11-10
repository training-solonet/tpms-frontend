/**
 * IoT Data API
 * Handles real-time IoT device and sensor data updates
 * Endpoint: POST /iot/data
 *
 * This is a unified endpoint that can CREATE or UPDATE data in device and sensor tables
 * based on the 'cmd' field. It will automatically create if data doesn't exist.
 */

import api2Instance from '../../config';

export const iotApi = {
  /**
   * Update/Create sensor data (Temperature & Pressure)
   * CMD: "tpdata" - Updates sensor table
   * @param {Object} data - { sn, tempValue, tirepValue, exType, bat }
   */
  updateSensorData: async (data) => {
    const response = await api2Instance.post('/iot/data', {
      cmd: 'tpdata',
      ...data,
    });
    return response;
  },

  /**
   * Update/Create device hub data (Battery levels)
   * CMD: "hubdata" - Updates device table
   * Can be used to create or update device data
   * @param {Object} data - { sn, bat1, bat2, bat3, sim_number }
   */
  updateDeviceData: async (data) => {
    const response = await api2Instance.post('/iot/data', {
      cmd: 'hubdata',
      ...data,
    });
    return response;
  },

  /**
   * Update device state (Status)
   * CMD: "state" - Updates device table
   * @param {string} sn - Serial number
   * @param {string} status - active | inactive | maintenance
   */
  updateDeviceState: async (sn, status) => {
    const response = await api2Instance.post('/iot/data', {
      cmd: 'state',
      sn,
      status,
    });
    return response;
  },

  /**
   * Update lock status
   * CMD: "lock" - Updates device or sensor table
   * @param {string} sn - Serial number
   * @param {number} lock - 0 (unlocked) or 1 (locked)
   * @param {string} type - 'device' or 'sensor' (optional, auto-detect)
   */
  updateLockStatus: async (sn, lock, type = null) => {
    const payload = {
      cmd: 'lock',
      sn,
      lock,
    };

    if (type) {
      payload.type = type;
    }

    const response = await api2Instance.post('/iot/data', payload);
    return response;
  },

  /**
   * Create/Update device using IoT unified endpoint
   * Note: Backend requires truck_id and deviceId (bug - should only need sn)
   * @param {Object} data - { sn, truck_id, bat1, bat2, bat3, sim_number, status }
   */
  upsertDevice: async (data) => {
    const response = await api2Instance.post('/iot/data', {
      cmd: 'hubdata',
      sn: data.sn,
      deviceId: data.sn, // Backend bug: expects deviceId (same as sn)
      truck_id: data.truck_id || null, // Backend requires truck_id
      bat1: data.bat1 || 100,
      bat2: data.bat2 || 100,
      bat3: data.bat3 || 100,
      sim_number: data.sim_number,
    });

    // If status is provided, update it separately
    if (data.status && data.status !== 'active') {
      await api2Instance.post('/iot/data', {
        cmd: 'state',
        sn: data.sn,
        deviceId: data.sn, // Backend bug: expects deviceId
        status: data.status,
      });
    }

    return response;
  },
};

export default iotApi;
