// src/services/api.js

// API Configuration
export const API_CONFIG = {
  BASE_URL: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || 'http://connectis.my.id:3001',
  WS_URL: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_WS_URL) || 'ws://connectis.my.id:3001/ws',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

// Vendors (master data) API - CRUD
export const vendorsAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/vendors${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint);
  },

  getById: async (id) => {
    return await apiRequest(`/api/vendors/${encodeURIComponent(id)}`);
  },

  create: async (payload) => {
    return await apiRequest(`/api/vendors`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  update: async (id, payload) => {
    return await apiRequest(`/api/vendors/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  remove: async (id) => {
    return await apiRequest(`/api/vendors/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  }
};

// Connection status
let isOnline = true;
let connectionAttempts = 0;

// Check if backend is available
const checkBackendConnection = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    console.log(`🔌 Checking backend connection to: ${API_CONFIG.BASE_URL}`);

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

    if (response.ok) {
      console.log(`✅ Backend connection successful`);
    } else {
      console.error(`❌ Backend responded with status: ${response.status} ${response.statusText}`);
    }

    return response.ok;
  } catch (error) {
    isOnline = false;
    connectionAttempts++;
    console.error(`❌ Backend connection failed (attempt ${connectionAttempts}):`, error.message);
    console.log(`🔍 Possible issues:
    - Backend server not running on ${API_CONFIG.BASE_URL}
    - Network connectivity issues
    - CORS configuration problems
    - Firewall blocking the connection`);
    return false;
  }
};

// Generic API request
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  const token = localStorage.getItem('authToken');

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
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

    return {
      success: false,
      data: null,
      online: false,
      error: error.message
    };
  }
};

// Authentication API
export const authAPI = {
  login: async (credentials) => {
    const response = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });

    if (response.success && response.data.token) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response;
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

  update: async (id, payload) => {
    return await apiRequest(`/api/trucks/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
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
    console.log(`🚛 Loading real-time truck locations...`);

    const result = await apiRequest('/api/trucks/realtime/locations');

    if (result.success) {
      console.log(`✅ Real-time locations loaded: ${result.data?.features?.length || 0} trucks`);
      return result;
    } else {
      console.error(`❌ Failed to load real-time locations:`, result.error);
      console.log(`🔄 Trying alternative endpoints for real-time data...`);

      // Try alternative endpoints for real-time data
      const alternatives = [
        '/api/trucks/locations',
        '/api/vehicles/realtime',
        '/api/tracking/realtime',
        '/api/fleet/locations'
      ];

      for (const altEndpoint of alternatives) {
        console.log(`🔄 Trying alternative endpoint: ${altEndpoint}`);
        const altResult = await apiRequest(altEndpoint);
        if (altResult.success) {
          console.log(`✅ Success with alternative endpoint: ${altEndpoint}`);
          return altResult;
        }
      }
    }

    return result;
  },

  getLocationHistory: async (id, params = {}) => {
    // Ensure we always encode IDs safely for URL path segments
    const safeId = encodeURIComponent(id);
    const search = new URLSearchParams(params);
    const queryString = search.toString();

    // Primary endpoint per latest docs: /api/location-history/:plateNumber
    const primary = `/api/location-history/${safeId}${queryString ? `?${queryString}` : ''}`;

    console.log(`🔍 Loading location history for truck ${id} from: ${primary}`);
    console.log(`📊 Parameters:`, params);

    let result = await apiRequest(primary);

    if (result.success) {
      console.log(`✅ Location history loaded for ${id}: ${result.data?.length || 0} points`);
      return result;
    }

    console.error(`❌ Failed to load location history for ${id}:`, result.error);
    console.log(`🔄 Trying alternative endpoints...`);

    // Alternative endpoints, both path and query styles
    const altBases = [
      `/api/trucks/${safeId}/history`,
      `/api/trucks/${safeId}/locations`,
      `/api/tracking/${safeId}/history`,
      `/api/vehicles/${safeId}/history`,
    ];

    for (const base of altBases) {
      const url = base + (queryString ? `?${queryString}` : '');
      console.log(`🔄 Trying alternative endpoint: ${url}`);
      const altResult = await apiRequest(url);
      if (altResult.success) {
        console.log(`✅ Success with alternative endpoint: ${base}`);
        return altResult;
      }
    }

    // Query-parameter style variants, without path ID
    const qpVariants = [
      `/api/location-history`,
      `/api/trucks/history`,
      `/api/vehicles/history`,
      `/api/tracking/history`,
    ];

    for (const base of qpVariants) {
      const qp = new URLSearchParams({ ...params, truckId: id }).toString();
      const url = `${base}?${qp}`;
      console.log(`🔄 Trying query-param endpoint: ${url}`);
      const altResult = await apiRequest(url);
      if (altResult.success) {
        console.log(`✅ Success with query-param endpoint: ${base}`);
        return altResult;
      }
    }

    return result;
  }
};

// Dashboard API
export const dashboardAPI = {
  getStats: async () => {
    const result = await apiRequest('/api/dashboard/stats');
    return result;
  },

  getFleetSummary: async () => {
    const result = await apiRequest('/api/dashboard/fleet-summary');
    return result;
  },

  getAlerts: async () => {
    return await apiRequest('/api/dashboard/alerts');
  },

  getFuelReport: async () => {
    return await apiRequest('/api/dashboard/fuel');
  },

  getMaintenanceReport: async () => {
    return await apiRequest('/api/dashboard/maintenance');
  }
};

// Mining Area API
export const miningAreaAPI = {
  getBoundaries: async () => {
    return await apiRequest('/api/mining-area');
  },

  getZoneStatistics: async () => {
    return await apiRequest('/api/mining-area/statistics');
  },

  getTrucksInZone: async (zoneName) => {
    return await apiRequest(`/api/mining-area/${zoneName}/trucks`);
  }
};

// Alerts API
export const alertsAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/alerts${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint);
  },

  resolve: async (alertId) => {
    return await apiRequest(`/api/alerts/${alertId}/resolve`, {
      method: 'PUT'
    });
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

// WebSocket connection for real-time updates
export class FleetWebSocket {
  constructor() {
    this.ws = null;
    this.subscriptions = new Set();
    this.messageHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect() {
    try {
      this.ws = new WebSocket(API_CONFIG.WS_URL);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected to backend');
        this.reconnectAttempts = 0;
        // Auto-subscribe to backend channels as per documentation
        this.send({ type: 'subscribe', channel: 'truck_updates' });
        this.send({ type: 'subscribe', channel: 'alerts' });
        this.send({ type: 'subscribe', channel: 'dashboard' });
        // Also subscribe to any channels registered before connection was open
        if (this.subscriptions && this.subscriptions.size > 0) {
          for (const ch of this.subscriptions) {
            this.send({ type: 'subscribe', channel: ch });
          }
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('❌ WebSocket disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  subscribe(channel, handler) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({
        type: 'subscribe',
        channel: channel
      });

      this.messageHandlers.set(channel, handler);
      this.subscriptions.add(channel);
    } else {
      // If not yet open, store handler; on open we auto-subscribe to standard channels
      this.messageHandlers.set(channel, handler);
      this.subscriptions.add(channel);
    }
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  handleMessage(message) {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message.data);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Initialize connection check
checkBackendConnection();

export default {
  authAPI,
  trucksAPI,
  dashboardAPI,
  miningAreaAPI,
  alertsAPI,
  vendorsAPI,
  connectionUtils,
  FleetWebSocket,
  API_CONFIG
};
