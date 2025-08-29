// src/services/api.js
import { sampleVehicles } from '../data/miningData.js';

// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3001',
  WS_URL: 'ws://localhost:3001/ws',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

// Connection status
let isOnline = true;
let connectionAttempts = 0;

// Check if backend is available
const checkBackendConnection = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/dashboard/stats`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    isOnline = response.ok;
    connectionAttempts = 0;
    return response.ok;
  } catch (error) {
    isOnline = false;
    connectionAttempts++;
    console.warn(`Backend connection failed (attempt ${connectionAttempts}):`, error.message);
    return false;
  }
};

// Generic API request with fallback
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  const token = localStorage.getItem('authToken');
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    timeout: API_CONFIG.TIMEOUT,
    ...options
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), defaultOptions.timeout);
    
    const response = await fetch(url, {
      ...defaultOptions,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    isOnline = true;
    connectionAttempts = 0;
    
    return {
      success: true,
      data: data.data || data,
      online: true
    };
  } catch (error) {
    isOnline = false;
    connectionAttempts++;
    
    console.warn(`API request failed for ${endpoint}:`, error.message);
    
    // Return fallback data based on endpoint
    return getFallbackData(endpoint, error);
  }
};

// Fallback data for offline mode
const getFallbackData = (endpoint, error) => {
  console.log(`Using fallback data for ${endpoint}`);
  
  if (endpoint.includes('/trucks/realtime/locations')) {
    return {
      success: true,
      data: {
        type: "FeatureCollection",
        features: sampleVehicles.map(vehicle => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [vehicle.position[1], vehicle.position[0]] // [lng, lat]
          },
          properties: {
            truckNumber: vehicle.id,
            status: vehicle.status,
            fuel: vehicle.fuel,
            speed: vehicle.speed,
            heading: vehicle.heading
          }
        }))
      },
      online: false,
      error: error.message
    };
  }
  
  if (endpoint.includes('/trucks')) {
    return {
      success: true,
      data: {
        trucks: sampleVehicles.map(vehicle => ({
          id: vehicle.id,
          truckNumber: vehicle.id,
          status: vehicle.status,
          fuel: vehicle.fuel,
          location: {
            latitude: vehicle.position[0],
            longitude: vehicle.position[1],
            address: "Mining Area (Offline Mode)"
          },
          lastUpdate: vehicle.lastUpdate.toISOString()
        })),
        pagination: {
          current_page: 1,
          total_pages: 1,
          total_items: sampleVehicles.length,
          items_per_page: sampleVehicles.length
        },
        summary: {
          total: sampleVehicles.length,
          active: sampleVehicles.filter(v => v.status === 'active').length,
          inactive: sampleVehicles.filter(v => v.status === 'idle').length,
          maintenance: sampleVehicles.filter(v => v.status === 'maintenance').length
        }
      },
      online: false,
      error: error.message
    };
  }
  
  if (endpoint.includes('/dashboard/stats')) {
    const activeCount = sampleVehicles.filter(v => v.status === 'active').length;
    const idleCount = sampleVehicles.filter(v => v.status === 'idle').length;
    const maintenanceCount = sampleVehicles.filter(v => v.status === 'maintenance').length;
    const avgFuel = sampleVehicles.reduce((sum, v) => sum + v.fuel, 0) / sampleVehicles.length;
    
    return {
      success: true,
      data: {
        totalTrucks: sampleVehicles.length,
        activeTrucks: activeCount,
        inactiveTrucks: idleCount,
        maintenanceTrucks: maintenanceCount,
        averageFuel: Math.round(avgFuel * 10) / 10,
        alertsCount: 3,
        todayDistance: 12450.5,
        fuelConsumption: 2150.8
      },
      online: false,
      error: error.message
    };
  }
  
  if (endpoint.includes('/mining-area')) {
    return {
      success: true,
      data: {
        type: "FeatureCollection",
        features: [] // Will use geofance.js data instead
      },
      online: false,
      error: error.message
    };
  }
  
  return {
    success: false,
    data: null,
    online: false,
    error: error.message
  };
};

// Authentication API
export const authAPI = {
  login: async (credentials) => {
    try {
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
      
      if (response.success && response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response;
    } catch (error) {
      // Fallback for offline mode - allow bypass
      if (credentials.username === 'bypass' || credentials.username === 'admin') {
        const mockUser = {
          id: 1,
          username: credentials.username,
          role: 'admin'
        };
        
        localStorage.setItem('authToken', 'offline-bypass-token');
        localStorage.setItem('user', JSON.stringify(mockUser));
        
        return {
          success: true,
          data: {
            token: 'offline-bypass-token',
            user: mockUser
          },
          online: false,
          message: 'Offline bypass mode activated'
        };
      }
      
      return {
        success: false,
        message: 'Login failed - Backend unavailable',
        online: false,
        error: error.message
      };
    }
  },
  
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    return { success: true };
  },
  
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('authToken');
    
    if (user && token) {
      return {
        success: true,
        data: JSON.parse(user),
        token
      };
    }
    
    return { success: false, data: null };
  }
};

// Trucks API
export const trucksAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/trucks${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint);
  },
  
  getById: async (id) => {
    return await apiRequest(`/api/trucks/${id}`);
  },
  
  updateStatus: async (id, status) => {
    return await apiRequest(`/api/trucks/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },
  
  getTirePressures: async (id) => {
    return await apiRequest(`/api/trucks/${id}/tires`);
  },
  
  getRealTimeLocations: async () => {
    return await apiRequest('/api/trucks/realtime/locations');
  }
};

// Dashboard API
export const dashboardAPI = {
  getStats: async () => {
    return await apiRequest('/api/dashboard/stats');
  }
};

// Mining Area API
export const miningAreaAPI = {
  getBoundaries: async () => {
    return await apiRequest('/api/mining-area');
  }
};

// Connection status utilities
export const connectionUtils = {
  isOnline: () => isOnline,
  getConnectionAttempts: () => connectionAttempts,
  checkConnection: checkBackendConnection,
  
  // Periodic connection check
  startConnectionMonitor: (interval = 30000) => {
    return setInterval(async () => {
      await checkBackendConnection();
    }, interval);
  }
};

// Initialize connection check
checkBackendConnection();

export default {
  authAPI,
  trucksAPI,
  dashboardAPI,
  miningAreaAPI,
  connectionUtils,
  API_CONFIG
};
