/**
 * Backend 2 (BE2) Configuration
 * Base URL: VITE_API_BASE_URL
 * Handles: Dashboard, Fleet Management, Drivers, Vendors, Devices, Alerts, Settings
 * Semua master data & management kecuali tracking
 */

import axios from 'axios';

// Backend 2 Base URL - Master Data & Management
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''; // Backend 2 untuk master data
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || ''; // WebSocket untuk notifikasi umum

// API Configuration object for apiRequest utility
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  WS_URL: WS_BASE_URL,
  TIMEOUT: 30000,
};

// Create axios instance for Backend 2
const api2Instance = axios.create({
  baseURL: API_BASE_URL, // Pakai VITE_API_BASE_URL untuk BE2
  timeout: 30000, // 30 detik timeout
  headers: {
    'Content-Type': 'application/json', // Header default JSON
  },
});

// Request interceptor - Add JWT token to requests
api2Instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); // Ambil token dari localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Tambahkan token ke header
    }
    return config;
  },
  (error) => {
    return Promise.reject(error); // Forward error
  }
);

// Response interceptor - Handle errors globally
api2Instance.interceptors.response.use(
  (response) => {
    // Return the data directly if success
    if (response.data?.success !== false) {
      return response.data; // Kembalikan data langsung
    }
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken'); // Hapus token
      localStorage.removeItem('user'); // Hapus user data
      window.location.href = '/login'; // Redirect ke login
    }

    // Handle other errors
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An error occurred'; // Parse error message

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
