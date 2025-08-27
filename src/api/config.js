// src/api/config.js

// API Configuration - Update this IP to your backend server's IP
export const API_CONFIG = {
  BASE_URL: 'http://192.168.21.34:3001', // Replace with your backend server IP
  WS_URL: 'http://192.168.21.34:3001',   // Replace with your backend server IP
  USE_MOCK: true, // Set to false when backend is available
  ENDPOINTS: {
    LOGIN: '/api/auth/login',
    TRUCKS: '/api/trucks',
    DASHBOARD: '/api/dashboard/stats',
    MINING_AREA: '/api/mining-area',
    REALTIME_LOCATIONS: '/api/trucks/realtime/locations'
  }
};