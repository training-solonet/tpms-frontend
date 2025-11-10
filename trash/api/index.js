// src/services/api/index.js

/**
 * Backend 1 (BE1) API Module - Tracking & TPMS
 * Handles: Live Tracking, History Tracking, TPMS, Telemetry
 *
 * Usage:
 * import { tpmsAPI, trucksAPI } from '@/services/api';
 */

// Configuration
export { TRACKING_CONFIG, TPMS_CONFIG } from './config.js'; // Export config untuk BE1

// API Endpoints - BE1 (Tracking & TPMS only)
export { tpmsAPI } from './tpms.api.js'; // TPMS tire pressure monitoring
// export { trucksAPI } from './trucks.api.js'; // Truck tracking (location, routes)

// WebSocket untuk live tracking
export { FleetWebSocket } from '../websocket/FleetWebSocket.js';

// Default export for backward compatibility
export default {
  tpmsAPI: () => import('./tpms.api.js').then((m) => m.tpmsAPI),
  FleetWebSocket: () => import('../websocket/FleetWebSocket.js').then((m) => m.FleetWebSocket),
};
