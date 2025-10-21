/**
 * Central export for all Backend 2 API modules
 */

export { default as authApi } from './auth.api';
export { default as trucksApi } from './trucks.api';
export { default as dashboardApi } from './dashboard.api';
export { default as driversApi } from './drivers.api';
export { default as vendorsApi } from './vendors.api';
export { default as devicesApi } from './devices.api';
export { default as sensorsApi } from './sensors.api';
export { default as alertsApi } from './alerts.api';
export { default as miningAreaApi } from './miningArea.api';
export { default as api2Instance } from './config';
export { API_BASE_URL, WS_BASE_URL } from './config';
