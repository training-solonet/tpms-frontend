// src/services/api/index.js

/**
 * Main API Module
 * Re-exports all API modules for easy importing
 *
 * Usage:
 * import { authAPI, trucksAPI, dashboardAPI } from '@/services/api';
 */

// Configuration
export { API_CONFIG, TPMS_CONFIG } from './config.js';

// Utilities
export { apiRequest, getAuthHeaders } from '../utils/apiRequest.js';
export {
  connectionUtils,
  checkBackendConnection,
  isConnectionOnline,
  getConnectionAttempts,
  startConnectionMonitor,
} from '../utils/connectionUtils.js';

// API Endpoints
export { authAPI } from './auth.api.js';
export { trucksAPI } from './trucks.api.js';
export { vendorsAPI } from './vendors.api.js';
export { driversAPI } from './drivers.api.js';
export { devicesAPI } from './devices.api.js';
export { sensorsAPI } from './sensors.api.js';
export { dashboardAPI } from './dashboard.api.js';
export { miningAreaAPI } from './mining-area.api.js';
export { alertsAPI } from './alerts.api.js';
export { tpmsAPI } from './tpms.api.js';

// WebSocket
export { FleetWebSocket } from '../websocket/FleetWebSocket.js';

// Default export for backward compatibility
export default {
  authAPI: () => import('./auth.api.js').then((m) => m.authAPI),
  trucksAPI: () => import('./trucks.api.js').then((m) => m.trucksAPI),
  vendorsAPI: () => import('./vendors.api.js').then((m) => m.vendorsAPI),
  driversAPI: () => import('./drivers.api.js').then((m) => m.driversAPI),
  devicesAPI: () => import('./devices.api.js').then((m) => m.devicesAPI),
  sensorsAPI: () => import('./sensors.api.js').then((m) => m.sensorsAPI),
  dashboardAPI: () => import('./dashboard.api.js').then((m) => m.dashboardAPI),
  miningAreaAPI: () => import('./mining-area.api.js').then((m) => m.miningAreaAPI),
  alertsAPI: () => import('./alerts.api.js').then((m) => m.alertsAPI),
  tpmsAPI: () => import('./tpms.api.js').then((m) => m.tpmsAPI),
  FleetWebSocket: () => import('../websocket/FleetWebSocket.js').then((m) => m.FleetWebSocket),
  connectionUtils: () => import('../utils/connectionUtils.js').then((m) => m.connectionUtils),
};
