/**
 * Management Modules - Barrel Export
 * All management API modules organized by domain
 */

// Auth
export { default as authApi } from './auth/auth.api';

// Fleet Management
export { default as trucksApi } from './fleet/trucks.api';
export { default as driversApi } from './fleet/drivers.api';
export { default as vendorsApi } from './fleet/vendors.api';
export { default as fleetApi } from './fleet/fleet.api';

// IoT & Devices
export { default as devicesApi } from './iot/devices.api';
export { default as sensorsApi } from './iot/sensors.api';
export { default as iotApi } from './iot/iot.api';

// Monitoring & Alerts
export { default as alertsApi } from './monitoring/alerts.api';
export { default as dashboardApi } from './monitoring/dashboard.api';

// Mining Operations
export { default as miningAreaApi } from './operations/miningArea.api';
