/* eslint-disable no-unused-vars */
// src/services/api.js

// API Configuration (read from .env via Vite)
export const API_CONFIG = {
  BASE_URL:
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
    '',
  WS_URL:
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_WS_URL) || '',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 2,
  RETRY_DELAY: 2000,
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
      body: JSON.stringify(payload),
    });
  },

  update: async (id, payload) => {
    return await apiRequest(`/api/vendors/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  remove: async (id) => {
    return await apiRequest(`/api/vendors/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};

// Drivers (master data) API - CRUD
export const driversAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/drivers${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint);
  },

  getById: async (id) => {
    return await apiRequest(`/api/drivers/${encodeURIComponent(id)}`);
  },

  create: async (payload) => {
    return await apiRequest(`/api/drivers`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update: async (id, payload) => {
    return await apiRequest(`/api/drivers/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  remove: async (id) => {
    return await apiRequest(`/api/drivers/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};

// Connection status
let isOnline = true;
let connectionAttempts = 0;
// Circuit breaker for problematic endpoints
let trucksPrimaryBackoffUntil = 0; // epoch ms until which we skip /api/trucks
const TRUCKS_BACKOFF_MS = 5 * 60 * 1000; // 5 minutes

// Helper to get stored auth token
const getAuthToken = () => localStorage.getItem('authToken');

// Check if backend is available
const checkBackendConnection = async () => {
  try {
    console.log('🔌 Checking backend connection to:', API_CONFIG.BASE_URL);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    // Try different endpoints in order of preference (avoiding problematic trucks endpoint)
    const endpoints = [
      '/api/vendors?limit=1', // Working endpoint - try first
      '/api/devices?limit=1', // Alternative endpoint
      '/api/dashboard/stats', // Fallback endpoint
    ];

    let response;
    let lastError;

    for (const endpoint of endpoints) {
      try {
        const token = getAuthToken();
        response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
          method: 'GET',
          signal: controller.signal,
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (response.ok || response.status === 401) {
          // 401 means server is responding, just needs auth
          clearTimeout(timeoutId);
          isOnline = true;
          connectionAttempts = 0;
          console.log(`✅ Backend connection successful via ${endpoint}`);
          return true;
        }
      } catch (endpointError) {
        lastError = endpointError;
        console.log(`⚠️ Endpoint ${endpoint} failed, trying next...`);
      }
    }

    clearTimeout(timeoutId);
    isOnline = false;
    connectionAttempts++;
    console.error(
      `❌ All backend endpoints failed. Last response status: ${response?.status || 'No response'}`
    );
    return false;
  } catch (error) {
    isOnline = false;
    connectionAttempts++;

    let errorMessage = error.message;
    if (error.name === 'AbortError') {
      errorMessage = `Connection timeout after 15s`;
      console.warn(`⏰ ${errorMessage} for ${API_CONFIG.BASE_URL}`);
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMessage = 'Network connection failed - server may be unreachable';
      console.warn(`🌐 ${errorMessage} for ${API_CONFIG.BASE_URL}`);
    } else {
      console.warn(`❌ Backend connection failed (attempt ${connectionAttempts}):`, error.message);
    }

    return false;
  }
};
API_CONFIG;

// Generic API request
const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const apiRequest = async (endpoint, options = {}) => {
  // Normalize BASE_URL and endpoint to avoid double /api or missing slashes
  let base = API_CONFIG.BASE_URL || '';
  let path = endpoint || '';
  if (base.endsWith('/')) base = base.slice(0, -1);
  // If base already ends with /api and path starts with /api, strip one /api from path
  if (base.toLowerCase().endsWith('/api') && path.toLowerCase().startsWith('/api')) {
    path = path.slice(4); // remove leading '/api'
  }
  const url = `${base}${path}`;
  const token = getAuthToken();

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    timeout: API_CONFIG.TIMEOUT,
    ...options,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn(`⏰ Request timeout after ${defaultOptions.timeout}ms for: ${url}`);
      controller.abort();
    }, defaultOptions.timeout);

    const response = await fetch(url, {
      ...defaultOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Handle 401 globally
      if (response.status === 401) {
        console.warn('401 Unauthorized detected. Logging out...');
        try {
          authAPI.logout();
        } finally {
          if (typeof window !== 'undefined') {
            window.location.replace('/login');
          }
        }
      }
      const message = `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(message);
    }

    const data = await response.json();
    isOnline = true;
    connectionAttempts = 0;

    return {
      success: true,
      data: data.data || data,
      online: true,
    };
  } catch (error) {
    isOnline = false;
    connectionAttempts++;

    // Better error handling for different error types
    let errorMessage = error.message;
    if (error.name === 'AbortError') {
      errorMessage = `Request timeout after ${defaultOptions.timeout}ms`;
      console.warn(`⏰ ${errorMessage} for ${url}`);
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMessage = 'Network connection failed - server may be unreachable';
      console.warn(`🌐 ${errorMessage} for ${url}`);
    } else {
      console.warn(`❌ API request failed for ${url}:`, error.message);
    }

    return {
      success: false,
      data: null,
      online: false,
      error: errorMessage,
    };
  }
};

// Authentication API
export const authAPI = {
  login: async (credentials) => {
    // Try multiple possible login endpoints
    const loginEndpoints = ['/api/auth/login', '/api/login', '/api/user/login', '/api/users/login'];

    let response;
    let lastError;

    for (const endpoint of loginEndpoints) {
      try {
        response = await apiRequest(endpoint, {
          method: 'POST',
          body: JSON.stringify(credentials),
        });

        if (response.success) {
          console.log(`✅ Login successful via ${endpoint}`);
          break;
        } else if (response.error && !response.error.includes('404')) {
          // If it's not a 404, this endpoint exists but login failed
          console.log(`❌ Login failed via ${endpoint}: ${response.error}`);
          break;
        }
      } catch (error) {
        lastError = error;
        console.log(`⚠️ Login endpoint ${endpoint} failed, trying next...`);
      }
    }

    // If all endpoints failed, try offline mode
    if (!response || !response.success) {
      console.log('🔄 All login endpoints failed, attempting offline mode...');

      // Simple offline authentication for demo
      if (credentials.username === 'admin' && credentials.password === 'admin123') {
        const offlineUser = {
          id: 'offline-user',
          username: 'admin',
          name: 'Administrator',
          role: 'admin',
        };

        const offlineToken = 'offline-demo-token-' + Date.now();
        localStorage.setItem('authToken', offlineToken);
        localStorage.setItem('user', JSON.stringify(offlineUser));

        return {
          success: true,
          data: {
            user: offlineUser,
            token: offlineToken,
          },
          online: false,
          message: 'Logged in (Offline Mode)',
        };
      } else {
        return {
          success: false,
          message:
            'Invalid credentials. Backend unavailable - use demo credentials (admin/admin123)',
          online: false,
        };
      }
    }

    // Helper to decode JWT payload
    const decodeJwt = (token) => {
      try {
        const [, payload] = token.split('.');
        const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(json);
      } catch (e) {
        return null;
      }
    };

    if (response.success && response.data) {
      const d = response.data;
      const token = d.token || d.accessToken || d.jwt || response.token || null;

      if (token) {
        localStorage.setItem('authToken', token);

        // Prefer backend-provided user if available; otherwise derive from JWT
        let user = d.user || response.user || null;
        if (!user) {
          const claims = decodeJwt(token);
          if (claims) {
            user = {
              id: claims.sub || claims.userId || claims.id || null,
              name: claims.name || claims.fullName || null,
              username: claims.username || claims.preferred_username || claims.email || null,
              email: claims.email || null,
              role: claims.role || claims.roles || null,
            };
          }
        }

        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        }
      }
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

    if (token) {
      // Validate JWT expiry if possible
      try {
        const [, payload] = token.split('.');
        const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        const claims = JSON.parse(json);
        if (claims && claims.exp) {
          const nowSec = Math.floor(Date.now() / 1000);
          if (claims.exp < nowSec) {
            // Token expired
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            return { success: false, data: null };
          }
        }
      } catch (e) {
        // Ignore decode errors; assume token is valid if server accepts it
      }
    }

    if (user && token) {
      return {
        success: true,
        data: JSON.parse(user),
        token,
      };
    }

    return { success: false, data: null };
  },
};

// Trucks API
export const trucksAPI = {
  // Get all trucks with automatic pagination
  getAllTrucks: async (params = {}) => {
    const allTrucks = [];
    let page = 1;
    let hasMore = true;
    const limit = 200; // Maximum allowed per request

    while (hasMore) {
      try {
        const result = await trucksAPI.getAll({ ...params, page, limit });
        if (result.success && result.data?.trucks) {
          allTrucks.push(...result.data.trucks);

          // Check if there are more pages
          const pagination = result.data.pagination;
          if (pagination && page < pagination.total_pages) {
            page++;
          } else {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error);
        hasMore = false;
      }
    }

    return {
      success: true,
      data: {
        trucks: allTrucks,
        pagination: {
          total: allTrucks.length,
          total_pages: Math.ceil(allTrucks.length / limit),
          current_page: 1,
          per_page: allTrucks.length,
        },
      },
    };
  },

  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/trucks${queryString ? `?${queryString}` : ''}`;

    // If backoff is active, skip primary endpoint immediately
    const now = Date.now();
    if (now < trucksPrimaryBackoffUntil) {
      const remaining = Math.max(0, Math.round((trucksPrimaryBackoffUntil - now) / 1000));
      console.log(`⏭️ Skipping primary /api/trucks for ${remaining}s (circuit breaker active)`);
    } else {
      try {
        const result = await apiRequest(endpoint);
        if (result.success) {
          // Backend returns trucks nested under data.trucks
          const trucksCount = result.data?.trucks?.length || result.data?.length || 0;
          console.log(`✅ Trucks data loaded: ${trucksCount} trucks`);
          return result;
        } else {
          // If explicit HTTP 500 detected, enable backoff
          if (typeof result.error === 'string' && result.error.includes('HTTP 500')) {
            trucksPrimaryBackoffUntil = Date.now() + TRUCKS_BACKOFF_MS;
            console.warn(
              `🚫 /api/trucks returned 500. Enabling circuit breaker for ${TRUCKS_BACKOFF_MS / 60000}m.`
            );
          }
        }
      } catch (error) {
        console.log(`⚠️ Primary trucks endpoint failed: ${error.message}`);
      }
    }

    // Try alternative endpoints for trucks data
    const alternatives = ['/api/vehicles', '/api/fleet/trucks', '/api/fleet/vehicles'];

    for (const altEndpoint of alternatives) {
      try {
        console.log(`🔄 Trying alternative trucks endpoint: ${altEndpoint}`);
        const altResult = await apiRequest(`${altEndpoint}${queryString ? `?${queryString}` : ''}`);
        if (altResult.success) {
          console.log(`✅ Trucks data loaded via alternative: ${altEndpoint}`);
          return altResult;
        }
      } catch (error) {
        console.log(`⚠️ Alternative endpoint ${altEndpoint} failed: ${error.message}`);
      }
    }

    // If all endpoints fail, return offline fallback
    console.log('🔄 All trucks endpoints failed, using offline mode');
    return {
      success: false,
      data: [],
      error: 'Trucks data unavailable - backend server error (HTTP 500)',
      offline: true,
    };
  },

  getById: async (id) => {
    return await apiRequest(`/api/trucks/${id}`);
  },

  create: async (payload) => {
    return await apiRequest(`/api/trucks`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update: async (id, payload) => {
    return await apiRequest(`/api/trucks/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  updateStatus: async (id, status) => {
    return await apiRequest(`/api/trucks/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  remove: async (id) => {
    return await apiRequest(`/api/trucks/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  getTirePressures: async (id) => {
    // Try multiple possible endpoints for tire data
    const endpoints = [
      // Known working endpoint first to reduce 404 noise
      `/api/devices/sensors/all?truck_id=${id}&type=tire_pressure`,
      // Fallback variants to support future backend shapes
      `/api/trucks/${id}/sensors?type=tire_pressure`,
      `/api/trucks/${id}/telemetry/tires`,
      `/api/trucks/${id}/tires`,
    ];

    let lastError;
    for (const endpoint of endpoints) {
      try {
        const result = await apiRequest(endpoint);
        if (result.success) {
          console.log(`✅ Tire data loaded via ${endpoint}`);
          return result;
        }
      } catch (error) {
        lastError = error;
        console.log(`⚠️ Tire endpoint ${endpoint} failed, trying next...`);
      }
    }

    // If all endpoints fail, return dummy data structure
    console.log('🔄 All tire endpoints failed, using fallback data');
    return {
      success: false,
      data: [],
      error: 'Tire pressure data unavailable - using offline mode',
      offline: true,
    };
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
        '/api/fleet/locations',
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
  },
};

// Devices API
export const devicesAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/devices${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint);
  },

  getById: async (id) => {
    return await apiRequest(`/api/devices/${encodeURIComponent(id)}`);
  },

  create: async (payload) => {
    return await apiRequest(`/api/devices`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update: async (id, payload) => {
    return await apiRequest(`/api/devices/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  remove: async (id) => {
    return await apiRequest(`/api/devices/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};

// Sensors API
export const sensorsAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/devices/sensors/all${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(endpoint);
  },

  getById: async (id) => {
    return await apiRequest(`/api/devices/sensors/${encodeURIComponent(id)}`);
  },

  create: async (payload) => {
    return await apiRequest(`/api/devices/sensors`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update: async (id, payload) => {
    return await apiRequest(`/api/devices/sensors/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  remove: async (id) => {
    return await apiRequest(`/api/devices/sensors/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
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
  },
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
  },
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
      method: 'PUT',
    });
  },
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
  },
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
      console.log(
        `Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );

      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  subscribe(channel, handler) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({
        type: 'subscribe',
        channel: channel,
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
  devicesAPI,
  sensorsAPI,
  dashboardAPI,
  miningAreaAPI,
  alertsAPI,
  vendorsAPI,
  driversAPI,
  connectionUtils,
  FleetWebSocket,
  API_CONFIG,
  getAuthHeaders,
};
