/**
 * Backend 2 Configuration
 * Base URL: https://be-tpms.connectis.my.id/api
 * For all features except tracking (Dashboard, Fleet, Devices, Telemetry, Alerts, etc.)
 */

import axios from 'axios';

// Backend 2 Base URL - Use environment variables
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://be-tpms.connectis.my.id/api';
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'wss://be-tpms.connectis.my.id/ws';

// Create axios instance for Backend 2
const api2Instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token to requests
api2Instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api2Instance.interceptors.response.use(
  (response) => {
    // Return the data directly if success
    if (response.data?.success !== false) {
      return response.data;
    }
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // Handle other errors
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An error occurred';

    console.error('API Error:', {
      status: error.response?.status,
      message: errorMessage,
      url: error.config?.url,
    });

    return Promise.reject({
      status: error.response?.status,
      message: errorMessage,
      data: error.response?.data,
    });
  }
);

export default api2Instance;
