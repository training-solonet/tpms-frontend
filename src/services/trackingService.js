// src/services/trackingService.js
import { useState } from 'react';
import { getAuthHeaders } from './api.js';
import { getLiveTrackingData, generateGpsPositions, getDummyRealRoutePoints } from '../data/index.js';

/**
 * Service untuk mengelola tracking dan route history truk
 * Mengintegrasikan dengan dummy data dan backend API untuk mendapatkan data location_history
 */

export class TruckTrackingService {
    constructor(apiConfig) {
      this.apiConfig = apiConfig;
      this.makeUrl = (path) => {
        let base = this.apiConfig.BASE_URL || '';
        let p = path || '';
        if (base.endsWith('/')) base = base.slice(0, -1);
        if (base.toLowerCase().endsWith('/api') && p.toLowerCase().startsWith('/api')) {
          p = p.slice(4);
        }
        return `${base}${p}`;
      };
      this.trackCache = new Map();
      this.trackSettings = {
        maxPoints: 100,
        historyHours: 2,
        updateInterval: 30000,
        cacheTimeout: 300000, // 5 minutes
        colors: {
          active: '#10b981',
          idle: '#f59e0b',
          maintenance: '#ef4444',
          offline: '#6b7280'
        }
      };
    }
  
    /**
     * Load location history for a specific truck from backend or dummy data
     */
    async loadTruckLocationHistory(truckId, hours = 2) {
      try {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - (hours * 60 * 60 * 1000));
        
        // Check cache first
        const cacheKey = `${truckId}_${Math.floor(startTime.getTime() / 300000)}`;
        const cached = this.trackCache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < this.trackSettings.cacheTimeout) {
          return cached.data;
        }

        // Try backend API first - primary endpoint per latest docs
        try {
          const primaryParams = new URLSearchParams({
            timeRange: `${hours}h`,
            limit: this.trackSettings.maxPoints.toString(),
            minSpeed: '0'
          });
          const primaryUrl = this.makeUrl(`/api/location-history/${encodeURIComponent(truckId)}?${primaryParams.toString()}`);
          const res1 = await fetch(primaryUrl, {
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(),
            }
          });
          if (res1.ok) {
            const data = await res1.json();
            const list = Array.isArray(data?.data)
              ? data.data
              : (Array.isArray(data?.locations) ? data.locations : []);
            if (list && list.length > 0) {
              const points = list.map(point => ({
                lat: parseFloat(point.latitude),
                lng: parseFloat(point.longitude),
                timestamp: new Date(point.recordedAt || point.timestamp || point.time || Date.now()),
                speed: parseFloat(point.speed || 0),
                fuel: parseFloat(point.fuelPercentage || point.fuel || 0),
                heading: parseInt(point.heading || point.course || 0)
              })).filter(p => !isNaN(p.lat) && !isNaN(p.lng))
                .sort((a, b) => a.timestamp - b.timestamp);

              this.trackCache.set(cacheKey, { data: points, timestamp: Date.now() });
              return points;
            }
          }

          // Fallback endpoint (legacy): /api/trucks/:id/history with start/end
          const fallbackParams = new URLSearchParams({
            startDate: startTime.toISOString(),
            endDate: endTime.toISOString(),
            limit: this.trackSettings.maxPoints.toString()
          });
          const legacyUrl = this.makeUrl(`/api/trucks/${encodeURIComponent(truckId)}/history?${fallbackParams.toString()}`);
          const res2 = await fetch(legacyUrl, {
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(),
            }
          });
          if (res2.ok) {
            const data = await res2.json();
            const list = Array.isArray(data?.data) ? data.data : [];
            if (list && list.length > 0) {
              const points = list.map(point => ({
                lat: parseFloat(point.latitude),
                lng: parseFloat(point.longitude),
                timestamp: new Date(point.recordedAt),
                speed: parseFloat(point.speed || 0),
                fuel: parseFloat(point.fuelPercentage || 0),
                heading: parseInt(point.heading || 0)
              })).filter(p => !isNaN(p.lat) && !isNaN(p.lng))
                .sort((a, b) => a.timestamp - b.timestamp);

              this.trackCache.set(cacheKey, { data: points, timestamp: Date.now() });
              return points;
            }
          }
        } catch (apiError) {
          console.warn('Backend API unavailable, using dummy data:', apiError?.message || apiError);
        }

        // Fallback to dummy data
        // Prefer using the single source of truth dummy real route from Markdown
        const mdPts = getDummyRealRoutePoints();
        let points = [];
        if (mdPts && mdPts.length > 0) {
          // Spread timestamps evenly across requested time window
          const total = Math.min(mdPts.length, this.trackSettings.maxPoints);
          for (let i = 0; i < total; i++) {
            const t = total > 1 ? i / (total - 1) : 0;
            const ts = new Date(startTime.getTime() + t * (endTime.getTime() - startTime.getTime()));
            points.push({
              lat: mdPts[i].lat,
              lng: mdPts[i].lng,
              timestamp: ts,
              speed: 0,
              fuel: 0,
              heading: 0
            });
          }
        } else {
          // Legacy fallback to generated GPS positions
          const allGpsData = generateGpsPositions();
          const truckData = allGpsData.filter(pos => 
            pos.truck_id === truckId && 
            new Date(pos.ts) >= startTime && 
            new Date(pos.ts) <= endTime
          ).slice(0, this.trackSettings.maxPoints);

          points = truckData.map(point => ({
            lat: parseFloat(point.lat),
            lng: parseFloat(point.lon),
            timestamp: new Date(point.ts),
            speed: parseFloat(point.speed_kph || 0),
            fuel: 0, // Will be populated from telemetry
            heading: parseInt(point.heading_deg || 0)
          })).sort((a, b) => a.timestamp - b.timestamp);
        }

        // Cache the result
        this.trackCache.set(cacheKey, {
          data: points,
          timestamp: Date.now()
        });

        return points;
      } catch (error) {
        console.error(`Failed to load location history for truck ${truckId}:`, error);
        return [];
      }
    }
  
    /**
     * Create Leaflet polyline from track points
     */
    createTrackPolyline(L, points, vehicleStatus, isSelected = false) {
      if (points.length < 2) return null;
  
      const coordinates = points.map(point => [point.lat, point.lng]);
      const trackColor = this.trackSettings.colors[vehicleStatus] || this.trackSettings.colors.offline;
  
      return L.polyline(coordinates, {
        color: trackColor,
        weight: isSelected ? 4 : 3,
        opacity: isSelected ? 0.9 : 0.6,
        smoothFactor: 1.5,
        dashArray: vehicleStatus === 'maintenance' ? '10, 10' : null,
        className: `route-track route-track-${vehicleStatus}${isSelected ? ' selected' : ''}`
      });
    }
  
    /**
     * Create waypoint markers for start/end points
     */
    createWaypoints(L, points, _vehicleId) {
      // Touch unused arg to satisfy ESLint when not used
      void _vehicleId;
      if (points.length < 2) return [];
  
      const waypoints = [];
      const startPoint = points[0];
      const endPoint = points[points.length - 1];
  
      // Start waypoint (blue)
      const startIcon = L.divIcon({
        html: `
          <div style="
            background: #3b82f6;
            border: 2px solid white;
            border-radius: 50%;
            width: 12px;
            height: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          "></div>
        `,
        className: 'waypoint-marker start-waypoint',
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      });
  
      const startMarker = L.marker([startPoint.lat, startPoint.lng], { 
        icon: startIcon,
        zIndexOffset: -500
      });
  
      startMarker.bindTooltip(
        `Start: ${startPoint.timestamp.toLocaleTimeString()}<br/>Speed: ${startPoint.speed} km/h`,
        { 
          permanent: false,
          direction: 'top',
          className: 'waypoint-tooltip'
        }
      );
  
      waypoints.push(startMarker);
  
      // End waypoint (current position - red)
      const endIcon = L.divIcon({
        html: `
          <div style="
            background: #ef4444;
            border: 2px solid white;
            border-radius: 50%;
            width: 12px;
            height: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          "></div>
        `,
        className: 'waypoint-marker end-waypoint',
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      });
  
      const endMarker = L.marker([endPoint.lat, endPoint.lng], { 
        icon: endIcon,
        zIndexOffset: -500
      });
  
      endMarker.bindTooltip(
        `Latest: ${endPoint.timestamp.toLocaleTimeString()}<br/>Speed: ${endPoint.speed} km/h`,
        { 
          permanent: false,
          direction: 'top',
          className: 'waypoint-tooltip'
        }
      );
  
      waypoints.push(endMarker);
  
      return waypoints;
    }
  
    /**
     * Calculate route statistics
     */
    calculateRouteStats(points) {
      if (points.length === 0) {
        return {
          distance: 0,
          duration: 0,
          averageSpeed: 0,
          maxSpeed: 0,
          stops: 0
        };
      }
  
      let totalDistance = 0;
      let maxSpeed = 0;
      let stops = 0;
  
      // Calculate distance using Haversine formula
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        
        // Distance calculation
        const R = 6371; // Earth's radius in km
        const dLat = (curr.lat - prev.lat) * Math.PI / 180;
        const dLng = (curr.lng - prev.lng) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(prev.lat * Math.PI / 180) * Math.cos(curr.lat * Math.PI / 180) *
          Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        totalDistance += R * c;
  
        // Max speed
        maxSpeed = Math.max(maxSpeed, curr.speed);
  
        // Count stops (speed < 5 km/h for more than 5 minutes)
        if (curr.speed < 5 && i > 0) {
          const timeDiff = (curr.timestamp - prev.timestamp) / (1000 * 60); // minutes
          if (timeDiff > 5) {
            stops++;
          }
        }
      }
  
      const duration = points.length > 1 
        ? (points[points.length - 1].timestamp - points[0].timestamp) / (1000 * 60) // minutes
        : 0;
      
      const averageSpeed = points.reduce((sum, point) => sum + point.speed, 0) / points.length;
  
      return {
        distance: parseFloat(totalDistance.toFixed(2)),
        duration: Math.round(duration),
        averageSpeed: parseFloat(averageSpeed.toFixed(1)),
        maxSpeed: parseFloat(maxSpeed.toFixed(1)),
        stops
      };
    }
  
    /**
     * Format duration in human readable format
     */
    formatDuration(minutes) {
      if (minutes < 60) return `${minutes}min`;
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}min`;
    }
  
    /**
     * Get track color based on vehicle status
     */
    getTrackColor(status) {
      return this.trackSettings.colors[status] || this.trackSettings.colors.offline;
    }
  
    /**
     * Clear cache
     */
    clearCache() {
      this.trackCache.clear();
    }
  
    /**
     * Update tracking settings
     */
    updateSettings(newSettings) {
      this.trackSettings = { ...this.trackSettings, ...newSettings };
    }
  
    /**
     * Get tracking settings
     */
    getSettings() {
      return { ...this.trackSettings };
    }
  }
 
  // REST API client for tracking endpoints
  export class TrackingAPI {
    constructor(baseURL) {
      this.baseURL = baseURL;
    }

    async getRealTimeTruckLocations() {
      try {
        const response = await fetch(`${this.baseURL}/api/trucks/realtime/locations`, {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          }
        });

        if (response.ok) {
          const data = await response.json();
          return {
            success: true,
            data: data.data || {},
            online: true
          };
        }
      } catch (error) {
        console.warn('Backend API unavailable, using dummy data:', error.message);
      }

      // Fallback to dummy data if backend fails
      try {
        const liveData = getLiveTrackingData();
        return { success: true, data: liveData, online: false };
      } catch (error) {
        console.error('Failed to get real-time truck locations:', error);
        return { success: false, data: null, online: false, error: error.message };
      }
    }

    async getTruckLocationHistory(truckId, params = {}) {
      const defaults = { limit: 100, minSpeed: 0, ...params };
      // Primary endpoint: /api/location-history/:id
      const primaryQS = new URLSearchParams({
        timeRange: defaults.timeRange || '24h',
        limit: String(defaults.limit),
        minSpeed: String(defaults.minSpeed)
      }).toString();
      const primary = `${this.baseURL}/api/location-history/${encodeURIComponent(truckId)}?${primaryQS}`;

      try {
        const res1 = await fetch(primary, {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          }
        });

        if (res1.ok) {
          const data = await res1.json();
          const list = Array.isArray(data?.data)
            ? data.data
            : (Array.isArray(data?.locations) ? data.locations : []);
          return { success: true, data: list, online: true };
        }
      } catch (e) {
        console.warn('Primary location-history endpoint failed:', e);
      }

      // Fallback legacy endpoint: /api/trucks/:id/history with start/end
      const now = new Date();
      const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const legacyQS = new URLSearchParams({
        startDate: start.toISOString(),
        endDate: now.toISOString(),
        limit: String(defaults.limit)
      }).toString();
      const legacy = `${this.baseURL}/api/trucks/${encodeURIComponent(truckId)}/history?${legacyQS}`;

      try {
        const res2 = await fetch(legacy, {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          }
        });
        if (!res2.ok) throw new Error(`HTTP ${res2.status}: ${res2.statusText}`);
        const data = await res2.json();
        return { success: true, data: data.data || [], online: true };
      } catch (error) {
        console.error(`Failed to get location history for truck ${truckId}:`, error);
        return { success: false, data: [], online: false, error: error.message };
      }
    }

    async getTruckById(truckId) {
      try {
        const response = await fetch(`${this.baseURL}/api/trucks/${truckId}`, {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return { success: true, data: data.data || null, online: true };
      } catch (error) {
        console.error(`Failed to get truck ${truckId}:`, error);
        return { success: false, data: null, online: false, error: error.message };
      }
    }
  }
  
  /**
   * Utility functions for route calculations and formatting
   */
  export const trackingUtils = {
    /**
     * Calculate distance between two coordinates using Haversine formula
     */
    calculateDistance(lat1, lng1, lat2, lng2) {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    },
  
    /**
     * Calculate total route distance
     */
    calculateRouteDistance(points) {
      if (points.length < 2) return 0;
      
      let totalDistance = 0;
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        totalDistance += this.calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
      }
      
      return parseFloat(totalDistance.toFixed(2));
    },
  
    /**
     * Calculate average speed from points
     */
    calculateAverageSpeed(points) {
      if (points.length === 0) return 0;
      const totalSpeed = points.reduce((sum, point) => sum + (point.speed || 0), 0);
      return parseFloat((totalSpeed / points.length).toFixed(1));
    },
  
    /**
     * Format time duration
     */
    formatDuration(startTime, endTime) {
      const diffMs = endTime - startTime;
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      if (diffMinutes < 60) return `${diffMinutes}min`;
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours}h ${minutes}min`;
    },
  
    /**
     * Format time ago
     */
    formatTimeAgo(date) {
      const now = new Date();
      const diff = Math.floor((now - date) / 1000);
      
      if (diff < 60) return `${diff}s ago`;
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
    },
  
    /**
     * Detect stops in route (speed < 5 km/h for > 5 minutes)
     */
    detectStops(points, minDurationMinutes = 5, maxSpeedKmh = 5) {
      const stops = [];
      let currentStop = null;
  
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        
        if (point.speed <= maxSpeedKmh) {
          if (!currentStop) {
            currentStop = {
              startTime: point.timestamp,
              startIndex: i,
              lat: point.lat,
              lng: point.lng
            };
          }
        } else {
          if (currentStop) {
            const duration = (point.timestamp - currentStop.startTime) / (1000 * 60);
            if (duration >= minDurationMinutes) {
              stops.push({
                ...currentStop,
                endTime: points[i - 1].timestamp,
                endIndex: i - 1,
                duration: Math.round(duration)
              });
            }
            currentStop = null;
          }
        }
      }
  
      return stops;
    },
  
    /**
     * Smooth track points to reduce noise
     */
    smoothTrackPoints(points, windowSize = 3) {
      if (points.length <= windowSize) return points;
  
      const smoothed = [...points];
      
      for (let i = windowSize; i < points.length - windowSize; i++) {
        let latSum = 0, lngSum = 0, count = 0;
        
        for (let j = i - windowSize; j <= i + windowSize; j++) {
          latSum += points[j].lat;
          lngSum += points[j].lng;
          count++;
        }
        
        smoothed[i] = {
          ...points[i],
          lat: latSum / count,
          lng: lngSum / count
        };
      }
      
      return smoothed;
    },
  
    /**
     * Generate route popup content
     */
    generateRoutePopupContent(vehicleId, driver, points, stats) {
      return `
        <div class="p-4 min-w-64">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-bold text-gray-900">${vehicleId}</h4>
            <span class="text-xs text-gray-500">Route History</span>
          </div>
          
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Driver:</span>
              <span class="font-medium">${driver}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Distance:</span>
              <span class="font-medium">${stats.distance} km</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Duration:</span>
              <span class="font-medium">${this.formatDuration(points[0]?.timestamp, points[points.length - 1]?.timestamp)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Avg Speed:</span>
              <span class="font-medium">${stats.averageSpeed} km/h</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Max Speed:</span>
              <span class="font-medium">${stats.maxSpeed} km/h</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Data Points:</span>
              <span class="font-medium">${points.length}</span>
            </div>
          </div>
          
          <div class="mt-3 pt-3 border-t border-gray-200">
            <div class="text-xs text-gray-500">
              From: ${points[0]?.timestamp.toLocaleString()}<br/>
              To: ${points[points.length - 1]?.timestamp.toLocaleString()}
            </div>
          </div>
        </div>
      `;
    }
  };
  
  /**
   * WebSocket handler for real-time tracking updates
   */
  export class TrackingWebSocketHandler {
    constructor(webSocket, onLocationUpdate, onTrackUpdate) {
      this.ws = webSocket;
      this.onLocationUpdate = onLocationUpdate;
      this.onTrackUpdate = onTrackUpdate;
      this.trackingBuffer = new Map();
      
      this.setupHandlers();
    }
  
    setupHandlers() {
      // Handle real-time location updates
      this.ws.subscribe('truck_locations_update', (data) => {
        if (data && Array.isArray(data)) {
          data.forEach(truck => {
            // Add point to tracking buffer
            const vehicleId = truck.truckNumber;
            if (!this.trackingBuffer.has(vehicleId)) {
              this.trackingBuffer.set(vehicleId, []);
            }
            
            const buffer = this.trackingBuffer.get(vehicleId);
            buffer.push({
              lat: truck.latitude,
              lng: truck.longitude,
              timestamp: new Date(),
              speed: truck.speed || 0,
              fuel: truck.fuelPercentage || 0,
              heading: truck.heading || 0
            });
  
            // Keep only last 50 points in buffer
            if (buffer.length > 50) {
              buffer.shift();
            }
  
            // Notify parent component
            if (this.onLocationUpdate) {
              this.onLocationUpdate(truck);
            }
          });
  
          // Update tracks if callback provided
          if (this.onTrackUpdate) {
            this.onTrackUpdate(this.trackingBuffer);
          }
        }
      });
    }
  
    getTrackingBuffer(vehicleId) {
      return this.trackingBuffer.get(vehicleId) || [];
    }
  
    clearBuffer(vehicleId) {
      if (vehicleId) {
        this.trackingBuffer.delete(vehicleId);
      } else {
        this.trackingBuffer.clear();
      }
    }
  }
  
  /**
   * React hook for truck tracking functionality
   */
  export const useTrackingData = (apiConfig) => {
    const [trackingService] = useState(() => new TruckTrackingService(apiConfig));
    const [trackingAPI] = useState(() => new TrackingAPI(apiConfig.BASE_URL));
    
    const loadVehicleTrack = async (vehicleId, truckId, hours = 2) => {
      try {
        const points = await trackingService.loadTruckLocationHistory(truckId, hours);
        const stats = trackingService.calculateRouteStats(points);
        
        return {
          success: true,
          points,
          stats,
          vehicleId
        };
      } catch (error) {
        console.error(`Failed to load track for vehicle ${vehicleId}:`, error);
        return {
          success: false,
          points: [],
          stats: null,
          vehicleId,
          error: error.message
        };
      }
    };
  
    const loadAllVehicleTracks = async (vehicles, hours = 2) => {
      const trackPromises = vehicles.map(vehicle => 
        loadVehicleTrack(vehicle.id, vehicle.truckId || vehicle.id, hours)
      );
      
      const results = await Promise.allSettled(trackPromises);
      
      return results.map((result, index) => ({
        vehicleId: vehicles[index].id,
        success: result.status === 'fulfilled' && result.value.success,
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : result.value?.error
      }));
    };
  
    return {
      trackingService,
      trackingAPI,
      loadVehicleTrack,
      loadAllVehicleTracks
    };
  };
  
  export default {
    TruckTrackingService,
    TrackingAPI,
    TrackingWebSocketHandler,
    trackingUtils,
    useTrackingData
  };