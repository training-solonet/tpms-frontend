/**
 * Backend 2 (BE2) API Module - Master Data & Management
 * Handles: Dashboard, Fleet Management, Drivers, Vendors, Devices, Alerts, Settings
 * Semua fitur kecuali tracking & TPMS
 * 
 * Usage:
 * import { authApi, driversApi, trucksApi } from '@/services/api2';
 */

// Configuration & Axios Instance
export { default as api2Instance } from './config'; // Axios instance dengan interceptor
export { API_BASE_URL, WS_BASE_URL } from './config'; // Base URLs

// Authentication
export { default as authApi } from './auth.api'; // Login, register, logout

// Fleet Management
export { default as trucksApi } from './trucks.api'; // Truck master data (CRUD)
export { default as driversApi } from './drivers.api'; // Driver master data (CRUD)
export { default as vendorsApi } from './vendors.api'; // Vendor master data (CRUD)

// IoT & Monitoring
export { default as devicesApi } from './devices.api'; // Device management
export { default as sensorsApi } from './sensors.api'; // Sensor configuration

// Mining Operations
export { default as miningAreaApi } from './miningArea.api'; // Mining area master data

// Dashboard & Analytics
export { default as dashboardApi } from './dashboard.api'; // Dashboard statistics

// Notifications
export { default as alertsApi } from './alerts.api'; // Alert/notification management
