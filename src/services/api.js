// src/services/api.js
import axios from 'axios';

// Base API configuration
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication APIs
export const authAPI = {
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      console.log('Login error:', error);
      
      // Fallback for demo when backend is not available
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || !error.response) {
        console.log('Backend offline, checking demo credentials:', credentials);
        
        // Demo login fallback - allow any credentials when backend is offline
        if (credentials.username && credentials.password) {
          return {
            success: true,
            data: {
              user: {
                id: 'demo',
                username: credentials.username,
                email: `${credentials.username}@borneo.com`,
                role: 'admin'
              },
              token: 'demo-token-' + Date.now(),
              expiresIn: '24h'
            }
          };
        }
        throw { message: 'Please enter username and password (Demo Mode - Backend Offline)' };
      }
      throw error.response?.data || { message: 'Backend connection failed. Try debug mode.' };
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  refreshToken: async () => {
    try {
      const response = await api.post('/auth/refresh');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Token refresh failed' };
    }
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }
};

// Dashboard APIs
export const dashboardAPI = {
  getOverview: async () => {
    try {
      const response = await api.get('/dashboard/overview');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch dashboard overview' };
    }
  },

  getFleetStatus: async () => {
    try {
      const response = await api.get('/dashboard/fleet-status');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch fleet status' };
    }
  }
};

// Truck Management APIs
export const trucksAPI = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/trucks', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch trucks' };
    }
  },

  getById: async (truckId) => {
    try {
      const response = await api.get(`/trucks/${truckId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch truck details' };
    }
  },

  updateStatus: async (truckId, statusData) => {
    try {
      const response = await api.patch(`/trucks/${truckId}/status`, statusData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update truck status' };
    }
  },

  assignDriver: async (truckId, driverData) => {
    try {
      const response = await api.patch(`/trucks/${truckId}/driver`, driverData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to assign driver' };
    }
  }
};

// Real-Time Tracking APIs
export const trackingAPI = {
  getLiveLocations: async (params = {}) => {
    try {
      const response = await api.get('/tracking/live', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch live locations' };
    }
  },

  getRouteHistory: async (truckId, params = {}) => {
    try {
      const response = await api.get(`/tracking/history/${truckId}`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch route history' };
    }
  },

  getHeatmap: async (params = {}) => {
    try {
      const response = await api.get('/tracking/heatmap', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch heatmap data' };
    }
  }
};

// Analytics APIs
export const analyticsAPI = {
  getPerformance: async (params = {}) => {
    try {
      const response = await api.get('/analytics/performance', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch performance analytics' };
    }
  },

  getFuelAnalytics: async () => {
    try {
      const response = await api.get('/analytics/fuel');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch fuel analytics' };
    }
  },

  getReports: async (reportType, params = {}) => {
    try {
      const response = await api.get(`/analytics/reports/${reportType}`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch reports' };
    }
  }
};

// Alert Management APIs
export const alertsAPI = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/alerts', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch alerts' };
    }
  },

  create: async (alertData) => {
    try {
      const response = await api.post('/alerts', alertData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create alert' };
    }
  },

  resolve: async (alertId, resolutionData) => {
    try {
      const response = await api.patch(`/alerts/${alertId}/resolve`, resolutionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to resolve alert' };
    }
  },

  acknowledge: async (alertId, ackData) => {
    try {
      const response = await api.patch(`/alerts/${alertId}/acknowledge`, ackData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to acknowledge alert' };
    }
  }
};

// Maintenance APIs
export const maintenanceAPI = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/maintenance', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch maintenance records' };
    }
  },

  schedule: async (maintenanceData) => {
    try {
      const response = await api.post('/maintenance/schedule', maintenanceData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to schedule maintenance' };
    }
  },

  updateStatus: async (maintenanceId, statusData) => {
    try {
      const response = await api.patch(`/maintenance/${maintenanceId}/status`, statusData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update maintenance status' };
    }
  }
};

// Mining Zone APIs
export const zonesAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/zones');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch zones' };
    }
  },

  getTrucksInZone: async (zoneId) => {
    try {
      const response = await api.get(`/zones/${zoneId}/trucks`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch trucks in zone' };
    }
  }
};

// Settings APIs
export const settingsAPI = {
  get: async () => {
    try {
      const response = await api.get('/settings');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch settings' };
    }
  },

  update: async (settingsData) => {
    try {
      const response = await api.put('/settings', settingsData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update settings' };
    }
  }
};

// WebSocket connection
export class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 5000;
    this.listeners = new Map();
  }

  connect() {
    try {
      const token = localStorage.getItem('authToken');
      this.ws = new WebSocket('ws://localhost:3001/ws');

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        
        // Send authentication
        if (token) {
          this.ws.send(JSON.stringify({
            type: 'auth',
            token: token
          }));
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.attemptReconnect();
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  handleMessage(data) {
    const { type } = data;
    if (this.listeners.has(type)) {
      this.listeners.get(type).forEach(callback => {
        try {
          callback(data.data);
        } catch (error) {
          console.error(`Error in WebSocket listener for ${type}:`, error);
        }
      });
    }
  }

  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }
}

// Export singleton instance
export const wsService = new WebSocketService();

export default api;
