// Data service to replace dummy data with real API calls
import {
  trucksAPI,
  vendorsAPI,
  driversAPI,
  devicesAPI,
  sensorsAPI,
  dashboardAPI,
} from './api/index.js';

// Fleet data service - replaces dummy data functions
export class DataService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Cache management
  _getCacheKey(method, params = {}) {
    return `${method}_${JSON.stringify(params)}`;
  }

  _isValidCache(cacheEntry) {
    return cacheEntry && Date.now() - cacheEntry.timestamp < this.cacheTimeout;
  }

  _setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  _getCache(key) {
    const entry = this.cache.get(key);
    return this._isValidCache(entry) ? entry.data : null;
  }

  // Fleet data aggregation with real API
  async getFleetData(useCache = true) {
    const cacheKey = this._getCacheKey('getFleetData');

    if (useCache) {
      const cached = this._getCache(cacheKey);
      if (cached) return cached;
    }

    try {
      console.log('🚛 Loading fleet data from API...');

      // Get trucks with relationships
      const trucksResponse = await trucksAPI.getAll({ limit: 200 });

      if (!trucksResponse.success) {
        throw new Error('Failed to load trucks data');
      }

      // Backend returns trucks nested under data.trucks
      const trucks =
        trucksResponse.data.trucks || trucksResponse.data.items || trucksResponse.data || [];

      // Enhance trucks with additional data
      const enhancedTrucks = trucks.map((truck) => ({
        ...truck,
        status: truck.status || 'idle',
        alerts: truck.alerts || [],
        fuel: truck.fuel_level || 0,
        position: truck.latest_position || null,
      }));

      const result = {
        trucks: enhancedTrucks,
        total: trucksResponse.data.pagination?.total || trucks.length,
      };

      this._setCache(cacheKey, result);
      console.log(`✅ Fleet data loaded: ${trucks.length} trucks`);

      return result;
    } catch (error) {
      console.error('❌ Failed to load fleet data:', error);
      throw error;
    }
  }

  // Live tracking data for map
  async getLiveTrackingData(useCache = true) {
    const cacheKey = this._getCacheKey('getLiveTrackingData');

    if (useCache) {
      const cached = this._getCache(cacheKey);
      if (cached) return cached;
    }

    try {
      console.log('📍 Loading live tracking data from API...');

      const response = await trucksAPI.getRealTimeLocations();

      if (!response.success) {
        throw new Error('Failed to load real-time locations');
      }

      // Transform API data to expected format
      const locations = response.data.features || response.data || [];

      const trackingData = locations.map((item) => {
        const properties = item.properties || item;
        const coordinates = item.geometry?.coordinates || [item.longitude, item.latitude];

        return {
          id: properties.truck_id || properties.id,
          name: properties.truck_name || properties.name || 'Unknown Truck',
          plateNumber: properties.plate_number || properties.plateNumber || 'N/A',
          driver: properties.driver_name || 'N/A',
          position: [coordinates[1], coordinates[0]], // [lat, lng] for Leaflet
          speed: properties.speed_kph || properties.speed || 0,
          heading: properties.heading_deg || properties.heading || 0,
          fuel: properties.fuel_percent || properties.fuel || 0,
          alerts: properties.alert_count || 0,
          status: properties.status || (properties.speed > 5 ? 'active' : 'idle'),
          lastUpdate: properties.timestamp || properties.last_update || new Date().toISOString(),
        };
      });

      this._setCache(cacheKey, trackingData);
      console.log(`✅ Live tracking data loaded: ${trackingData.length} vehicles`);

      return trackingData;
    } catch (error) {
      console.error('❌ Failed to load live tracking data:', error);
      throw error;
    }
  }

  // Get truck route history
  async getTruckRoute(truckId, timeRange = '24h') {
    const cacheKey = this._getCacheKey('getTruckRoute', { truckId, timeRange });
    const cached = this._getCache(cacheKey);
    if (cached) return cached;

    try {
      console.log(`🛣️ Loading route history for truck ${truckId}...`);

      const params = { timeRange };
      const response = await trucksAPI.getLocationHistory(truckId, params);

      if (!response.success) {
        throw new Error(`Failed to load route for truck ${truckId}`);
      }

      const positions = response.data || [];

      // Transform to Leaflet format [lat, lng]
      const route = positions
        .map((pos) => [pos.latitude || pos.lat, pos.longitude || pos.lng || pos.lon])
        .filter((coord) => coord[0] && coord[1]);

      this._setCache(cacheKey, route);
      console.log(`✅ Route loaded for ${truckId}: ${route.length} points`);

      return route;
    } catch (error) {
      console.error(`❌ Failed to load route for truck ${truckId}:`, error);
      throw error;
    }
  }

  // Dashboard statistics
  async getDashboardStats(useCache = true) {
    const cacheKey = this._getCacheKey('getDashboardStats');

    if (useCache) {
      const cached = this._getCache(cacheKey);
      if (cached) return cached;
    }

    try {
      console.log('📊 Loading dashboard statistics from API...');

      const response = await dashboardAPI.getStats();

      if (!response.success) {
        throw new Error('Failed to load dashboard stats');
      }

      const stats = response.data || {};

      const result = {
        totalTrucks: stats.total_trucks || 0,
        activeTrucks: stats.active_trucks || 0,
        idleTrucks: stats.idle_trucks || 0,
        totalAlerts: stats.total_alerts || 0,
        fuelAverage: stats.average_fuel || 0,
      };

      this._setCache(cacheKey, result);
      console.log('✅ Dashboard statistics loaded');

      return result;
    } catch (error) {
      console.error('❌ Failed to load dashboard stats:', error);
      throw error;
    }
  }

  // Get all vendors
  async getVendors(params = {}) {
    try {
      console.log('🏢 Loading vendors from API...');

      const response = await vendorsAPI.getAll(params);

      if (!response.success) {
        throw new Error('Failed to load vendors');
      }

      const vendors = response.data.items || response.data || [];
      console.log(`✅ Vendors loaded: ${vendors.length} vendors`);

      return vendors;
    } catch (error) {
      console.error('❌ Failed to load vendors:', error);
      throw error;
    }
  }

  // Get all drivers
  async getDrivers(params = {}) {
    try {
      console.log('👨‍💼 Loading drivers from API...');

      const response = await driversAPI.getAll(params);

      if (!response.success) {
        throw new Error('Failed to load drivers');
      }

      const drivers = response.data.items || response.data || [];
      console.log(`✅ Drivers loaded: ${drivers.length} drivers`);

      return drivers;
    } catch (error) {
      console.error('❌ Failed to load drivers:', error);
      throw error;
    }
  }

  // Get all devices
  async getDevices(params = {}) {
    try {
      console.log('📱 Loading devices from API...');

      const response = await devicesAPI.getAll(params);

      if (!response.success) {
        throw new Error('Failed to load devices');
      }

      const devices = response.data.items || response.data || [];
      console.log(`✅ Devices loaded: ${devices.length} devices`);

      return devices;
    } catch (error) {
      console.error('❌ Failed to load devices:', error);
      throw error;
    }
  }

  // Get all sensors
  async getSensors(params = {}) {
    try {
      console.log('🔧 Loading sensors from API...');

      const response = await sensorsAPI.getAll(params);

      if (!response.success) {
        throw new Error('Failed to load sensors');
      }

      const sensors = response.data.items || response.data || [];
      console.log(`✅ Sensors loaded: ${sensors.length} sensors`);

      return sensors;
    } catch (error) {
      console.error('❌ Failed to load sensors:', error);
      throw error;
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Cache cleared');
  }

  // Clear specific cache entry
  clearCacheEntry(method, params = {}) {
    const key = this._getCacheKey(method, params);
    this.cache.delete(key);
  }
}

// Create singleton instance
export const dataService = new DataService();

// Export individual functions for backward compatibility
export const getFleetData = () => dataService.getFleetData();
export const getLiveTrackingData = () => dataService.getLiveTrackingData();
export const getTruckRoute = (truckId, timeRange) => dataService.getTruckRoute(truckId, timeRange);
export const getDashboardStats = () => dataService.getDashboardStats();

export default dataService;
