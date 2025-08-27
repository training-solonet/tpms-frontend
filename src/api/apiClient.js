// src/api/apiClient.js
import { API_CONFIG } from './config';
import { generateMockTrucks, generateMockDashboardStats } from '../data/mockData';

// API Client Class
export class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('fleet_token');
    this.useMock = API_CONFIG.USE_MOCK;
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
    // Use mock data if configured or if backend is not available
    if (this.useMock) {
      console.log('Using mock data for:', endpoint);
      return this.getMockResponse(endpoint, options);
    }

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
      console.log('Falling back to mock data...');
      // Fallback to mock data if real API fails
      return this.getMockResponse(endpoint, options);
    }
  }

  async getMockResponse(endpoint, options) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      if (endpoint === API_CONFIG.ENDPOINTS.LOGIN) {
        const credentials = JSON.parse(options.body || '{}');
        if (credentials.username === 'admin' && credentials.password === 'admin123') {
          const token = 'mock-jwt-token-' + Date.now();
          return {
            success: true,
            data: {
              token,
              user: { username: 'admin', role: 'administrator' }
            }
          };
        } else {
          return {
            success: false,
            message: 'Invalid credentials'
          };
        }
      } else if (endpoint.includes('/trucks')) {
        const trucks = generateMockTrucks(50);
        return {
          success: true,
          data: { trucks }
        };
      } else if (endpoint === API_CONFIG.ENDPOINTS.DASHBOARD) {
        const trucks = generateMockTrucks(50);
        const stats = generateMockDashboardStats(trucks);
        return {
          success: true,
          data: stats
        };
      }
      
      // Default mock response
      return {
        success: true,
        data: {},
        message: 'Mock response'
      };
    } catch (error) {
      console.error('Mock API Error:', error);
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