// src/services/api/trucks.api.js

import { apiRequest } from './apiRequest.js';

/**
 * Trucks API for Backend 1 (Tracking & Real-time Locations)
 * Handles truck tracking, GPS, and real-time location operations
 */

// Circuit breaker for problematic endpoints
let trucksPrimaryBackoffUntil = 0; // epoch ms until which we skip /api/trucks
const TRUCKS_BACKOFF_MS = 5 * 60 * 1000; // 5 minutes

export const trucksAPI = {
  /**
   * Get all trucks with automatic pagination
   * @param {object} params - Query parameters
   * @returns {Promise<object>} All trucks data
   */
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

  /**
   * Get all trucks with pagination
   * @param {object} params - Query parameters
   * @returns {Promise<object>} Trucks data
   */
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

    // As a final attempt, retry primary endpoint ignoring backoff in case server recovered
    try {
      console.log('🔁 Final attempt: retrying primary /api/trucks');
      const finalTry = await apiRequest(endpoint);
      if (finalTry.success) {
        console.log('✅ Trucks data loaded on final primary retry');
        return finalTry;
      }
    } catch (e) {
      console.log(`⚠️ Final primary retry failed: ${e.message}`);
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

  /**
   * Get truck by ID
   * @param {string|number} id - Truck ID
   * @returns {Promise<object>} Truck data
   */
  getById: async (id) => {
    return await apiRequest(`/api/trucks/${id}`);
  },

  /**
   * Create new truck
   * @param {object} payload - Truck data
   * @returns {Promise<object>} Created truck
   */
  create: async (payload) => {
    return await apiRequest(`/api/trucks`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Update truck
   * @param {string|number} id - Truck ID
   * @param {object} payload - Updated truck data
   * @returns {Promise<object>} Updated truck
   */
  update: async (id, payload) => {
    return await apiRequest(`/api/trucks/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Update truck status
   * @param {string|number} id - Truck ID
   * @param {string} status - New status
   * @returns {Promise<object>} Updated truck
   */
  updateStatus: async (id, status) => {
    return await apiRequest(`/api/trucks/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  /**
   * Delete truck
   * @param {string|number} id - Truck ID
   * @returns {Promise<object>} Delete response
   */
  remove: async (id) => {
    return await apiRequest(`/api/trucks/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get tire pressures for a truck
   * @param {string|number} id - Truck ID
   * @returns {Promise<object>} Tire pressure data
   */
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

    for (const endpoint of endpoints) {
      try {
        const result = await apiRequest(endpoint);
        if (result.success) {
          console.log(`✅ Tire data loaded via ${endpoint}`);
          return result;
        }
      } catch {
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

  /**
   * Get real-time locations of all trucks from Backend 1 (Tracking Server)
   * @returns {Promise<object>} Real-time location data
   */
  getRealTimeLocations: async () => {
    console.log(`🚛 [BE1] Loading real-time truck locations from Tracking Server...`);

    const result = await apiRequest('/api/trucks/realtime/locations');

    if (result.success) {
      console.log(
        `✅ [BE1] Real-time locations loaded: ${result.data?.features?.length || 0} trucks`
      );
      console.log(`📍 [BE1] Sample data:`, result.data?.features?.[0]);
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

  /**
   * Get location history for a truck
   * @param {string|number} id - Truck ID or plate number
   * @param {object} params - Query parameters (startTime, endTime, etc.)
   * @returns {Promise<object>} Location history data
   */
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

export default trucksAPI;
