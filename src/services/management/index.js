/**
 * Backend 2 (BE2) - Management & Master Data API
 * Central export point for all management modules
 *
 * Usage Examples:
 * import { authApi, trucksApi, devicesApi } from 'services/management';
 * import managementClient from 'services/management/config';
 */

// Configuration & Axios Instance
export { default as managementClient, MANAGEMENT_CONFIG } from './config';

// Base Classes
export { default as BaseApi } from './base/BaseApi';

// All API Modules
export * from './modules';

// WebSocket for real-time updates
export { default as fleetWebSocket } from './websocket';

// For backward compatibility during migration
export { default as api2Instance } from './config';
