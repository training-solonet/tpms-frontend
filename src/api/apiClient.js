// src/api/apiClient.js

// API Configuration - Update this IP to your backend server's IP
export const API_CONFIG = {
  BASE_URL: 'http://192.168.21.34:3001', // Replace with your backend server IP
  WS_URL: 'http://192.168.21.34:3001',   // Replace with your backend server IP
  ENDPOINTS: {
    LOGIN: '/api/auth/login',
    TRUCKS: '/api/trucks',
    DASHBOARD: '/api/dashboard/stats',
    MINING_AREA: '/api/mining-area',
    REALTIME_LOCATIONS: '/api/trucks/realtime/locations'
  }
};

// API Client Class
export class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('fleet_token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('fleet_token', token);
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('fleet_token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async login(credentials) {
    const response = await this.request(API_CONFIG.ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.success && response.data.token) {
      this.setToken(response.data.token);
    }
    
    return response;
  }

  async getTrucks(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `${API_CONFIG.ENDPOINTS.TRUCKS}${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  async getDashboardStats() {
    return this.request(API_CONFIG.ENDPOINTS.DASHBOARD);
  }

  async getMiningArea() {
    return this.request(API_CONFIG.ENDPOINTS.MINING_AREA);
  }

  async getRealtimeLocations(status = 'all') {
    const endpoint = `${API_CONFIG.ENDPOINTS.REALTIME_LOCATIONS}?status=${status}`;
    return this.request(endpoint);
  }
}

// Initialize and export API client instance
export const apiClient = new ApiClient(API_CONFIG.BASE_URL);