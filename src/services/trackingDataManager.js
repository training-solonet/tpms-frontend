// src/services/trackingDataManager.js
import { generateGpsPositions, getLiveTrackingData, getTruckRoute } from '../data/index.js';

/**
 * Manager untuk mengelola data tracking dan optimasi performa
 * Mengintegrasikan dengan dummy data dan backend API
 */
export class TrackingDataManager {
    constructor(apiConfig) {
      this.apiConfig = apiConfig;
      this.trackCache = new Map();
      this.vehicleCache = new Map();
      this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
      this.maxCacheSize = 50; // Maximum cached tracks
    }
  
    /**
     * Load dan cache location history untuk truck
     */
    async getLocationHistory(truckId, truckNumber, hours = 2, maxPoints = 100) {
      const cacheKey = `${truckId}_${hours}h_${maxPoints}`;
      const cached = this.trackCache.get(cacheKey);
  
      // Return cached data if still valid
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        return cached.data;
      }
  
      try {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - (hours * 60 * 60 * 1000));
        
        // Try backend API first
        try {
          const response = await fetch(`${this.apiConfig.BASE_URL}/api/trucks/${truckId}/history?` + new URLSearchParams({
            startDate: startTime.toISOString(),
            endDate: endTime.toISOString(),
            limit: maxPoints.toString()
          }), {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.data) {
              const points = data.data
                .map(point => ({
                  lat: parseFloat(point.latitude),
                  lng: parseFloat(point.longitude),
                  timestamp: new Date(point.recordedAt),
                  speed: parseFloat(point.speed || 0),
                  fuel: parseFloat(point.fuelPercentage || 0),
                  heading: parseInt(point.heading || 0)
                }))
                .sort((a, b) => a.timestamp - b.timestamp);

              // Cache the result
              this.cacheTrackData(cacheKey, points);
              
              return points;
            }
          }
        } catch (apiError) {
          console.warn('Backend API unavailable, using dummy data:', apiError.message);
        }

        // Fallback to dummy data
        const allGpsData = generateGpsPositions();
        const truckData = allGpsData.filter(pos => 
          pos.truck_id === truckId && 
          new Date(pos.ts) >= startTime && 
          new Date(pos.ts) <= endTime
        ).slice(0, maxPoints);

        const points = truckData.map(point => ({
          lat: parseFloat(point.lat),
          lng: parseFloat(point.lon),
          timestamp: new Date(point.ts),
          speed: parseFloat(point.speed_kph || 0),
          fuel: 0, // Will be populated from telemetry
          heading: parseInt(point.heading_deg || 0)
        })).sort((a, b) => a.timestamp - b.timestamp);

        // Cache the result
        this.cacheTrackData(cacheKey, points);
        
        return points;
      } catch (error) {
        console.error(`Failed to load location history for truck ${truckNumber}:`, error);
        
        // Return cached data even if expired as fallback
        if (cached) {
          console.warn(`Using expired cache for ${truckNumber}`);
          return cached.data;
        }
        
        return [];
      }
    }
  
    /**
     * Cache track data dengan memory management
     */
    cacheTrackData(key, data) {
      // Remove oldest cache entries if at max size
      if (this.trackCache.size >= this.maxCacheSize) {
        const oldestKey = this.trackCache.keys().next().value;
        this.trackCache.delete(oldestKey);
      }
  
      this.trackCache.set(key, {
        data,
        timestamp: Date.now()
      });
    }
  
    /**
     * Batch load location histories untuk multiple trucks
     */
    async batchLoadLocationHistories(vehicles, hours = 2, maxPoints = 100) {
      const promises = vehicles.map(async (vehicle) => {
        try {
          const points = await this.getLocationHistory(
            vehicle.truckId || vehicle.id, 
            vehicle.id, 
            hours, 
            maxPoints
          );
          
          return {
            vehicleId: vehicle.id,
            success: true,
            points,
            stats: this.calculateRouteStatistics(points)
          };
        } catch (error) {
          return {
            vehicleId: vehicle.id,
            success: false,
            points: [],
            stats: null,
            error: error.message
          };
        }
      });
  
      const results = await Promise.allSettled(promises);
      
      return results.map((result, index) => ({
        vehicleId: vehicles[index].id,
        success: result.status === 'fulfilled' && result.value.success,
        data: result.status === 'fulfilled' ? result.value : { points: [], stats: null },
        error: result.status === 'rejected' ? result.reason : result.value?.error
      }));
    }
  
    /**
     * Calculate comprehensive route statistics
     */
    calculateRouteStatistics(points) {
      if (points.length === 0) {
        return {
          distance: 0,
          duration: 0,
          averageSpeed: 0,
          maxSpeed: 0,
          minSpeed: 0,
          stops: 0,
          idleTime: 0,
          movingTime: 0,
          fuelEfficiency: 0
        };
      }
  
      let totalDistance = 0;
      let maxSpeed = 0;
      let minSpeed = Infinity;
      let stops = 0;
      let idleTime = 0; // minutes
      let movingTime = 0; // minutes
      let totalSpeedSum = 0;
      let movingSpeedSum = 0;
      let movingPointsCount = 0;
  
      // Calculate metrics
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        
        // Distance calculation using Haversine formula
        const distance = this.calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
        totalDistance += distance;
  
        // Speed metrics
        const speed = curr.speed;
        maxSpeed = Math.max(maxSpeed, speed);
        minSpeed = Math.min(minSpeed, speed);
        totalSpeedSum += speed;
  
        // Time calculation
        const timeDiff = (curr.timestamp - prev.timestamp) / (1000 * 60); // minutes
        
        if (speed < 5) {
          idleTime += timeDiff;
          if (timeDiff > 5) { // Stop if idle for more than 5 minutes
            stops++;
          }
        } else {
          movingTime += timeDiff;
          movingSpeedSum += speed;
          movingPointsCount++;
        }
      }
  
      const totalDuration = points.length > 1 
        ? (points[points.length - 1].timestamp - points[0].timestamp) / (1000 * 60)
        : 0;
      
      const averageSpeed = totalSpeedSum / points.length;
      const movingAverageSpeed = movingPointsCount > 0 ? movingSpeedSum / movingPointsCount : 0;
  
      // Fuel efficiency (km per liter) - simplified calculation
      const fuelUsed = points.length > 1 
        ? points[0].fuel - points[points.length - 1].fuel 
        : 0;
      const fuelEfficiency = fuelUsed > 0 ? totalDistance / fuelUsed : 0;
  
      return {
        distance: parseFloat(totalDistance.toFixed(2)),
        duration: Math.round(totalDuration),
        averageSpeed: parseFloat(averageSpeed.toFixed(1)),
        movingAverageSpeed: parseFloat(movingAverageSpeed.toFixed(1)),
        maxSpeed: parseFloat(maxSpeed.toFixed(1)),
        minSpeed: minSpeed === Infinity ? 0 : parseFloat(minSpeed.toFixed(1)),
        stops,
        idleTime: Math.round(idleTime),
        movingTime: Math.round(movingTime),
        fuelEfficiency: parseFloat(fuelEfficiency.toFixed(2)),
        efficiency: movingTime > 0 ? Math.round((movingTime / totalDuration) * 100) : 0
      };
    }
  
    /**
     * Calculate distance between two coordinates (Haversine formula)
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
    }
  
    /**
     * Optimize track points untuk performa yang lebih baik
     */
    optimizeTrackPoints(points, tolerance = 0.0001) {
      if (points.length <= 2) return points;
  
      const optimized = [points[0]]; // Always keep first point
      
      for (let i = 1; i < points.length - 1; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const next = points[i + 1];
        
        // Calculate deviation from straight line
        const deviation = this.calculatePointToLineDistance(
          curr.lat, curr.lng,
          prev.lat, prev.lng,
          next.lat, next.lng
        );
        
        // Keep point if it deviates significantly or represents a speed change
        if (deviation > tolerance || 
            Math.abs(curr.speed - prev.speed) > 10 || 
            (curr.timestamp - prev.timestamp) > 300000) { // 5 minutes
          optimized.push(curr);
        }
      }
      
      optimized.push(points[points.length - 1]); // Always keep last point
      return optimized;
    }
  
    /**
     * Calculate point to line distance untuk Douglas-Peucker algorithm
     */
    calculatePointToLineDistance(px, py, x1, y1, x2, y2) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      
      if (dx === 0 && dy === 0) {
        return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
      }
      
      const t = ((px - x1) * dx + (py - y1) * dy) / (dx ** 2 + dy ** 2);
      const projection = {
        x: x1 + t * dx,
        y: y1 + t * dy
      };
      
      return Math.sqrt((px - projection.x) ** 2 + (py - projection.y) ** 2);
    }
  
    /**
     * Detect geofence violations
     */
    detectGeofenceViolations(points, geofenceBounds) {
      if (!geofenceBounds || points.length === 0) return [];
  
      const violations = [];
      
      points.forEach((point, index) => {
        if (!this.isPointInGeofence(point, geofenceBounds)) {
          violations.push({
            pointIndex: index,
            timestamp: point.timestamp,
            lat: point.lat,
            lng: point.lng,
            speed: point.speed
          });
        }
      });
  
      return violations;
    }
  
    /**
     * Check if point is inside geofence
     */
    isPointInGeofence(point, geofence) {
      // Simplified point-in-polygon check
      // In production, use a proper geospatial library
      return true; // Placeholder implementation
    }
  
    /**
     * Generate route summary report
     */
    generateRouteSummary(vehicleId, points, stats) {
      const startTime = points.length > 0 ? points[0].timestamp : new Date();
      const endTime = points.length > 0 ? points[points.length - 1].timestamp : new Date();
  
      return {
        vehicleId,
        reportGenerated: new Date(),
        period: {
          start: startTime,
          end: endTime,
          duration: stats.duration
        },
        route: {
          totalDistance: stats.distance,
          averageSpeed: stats.averageSpeed,
          maxSpeed: stats.maxSpeed,
          minSpeed: stats.minSpeed,
          stops: stats.stops,
          efficiency: stats.efficiency
        },
        performance: {
          movingTime: stats.movingTime,
          idleTime: stats.idleTime,
          fuelEfficiency: stats.fuelEfficiency,
          utilizationRate: stats.movingTime > 0 ? (stats.movingTime / stats.duration) * 100 : 0
        },
        dataQuality: {
          totalPoints: points.length,
          validPoints: points.filter(p => p.lat && p.lng).length,
          coverage: points.length > 0 ? 100 : 0
        }
      };
    }
  
    /**
     * Export route data untuk reporting
     */
    exportRouteData(vehicleId, points, format = 'json') {
      const summary = this.generateRouteSummary(vehicleId, points, this.calculateRouteStatistics(points));
  
      switch (format) {
        case 'csv':
          return this.exportToCSV(points, summary);
        case 'gpx':
          return this.exportToGPX(vehicleId, points);
        case 'geojson':
          return this.exportToGeoJSON(vehicleId, points);
        default:
          return JSON.stringify(summary, null, 2);
      }
    }
  
    /**
     * Export ke CSV format
     */
    exportToCSV(points, summary) {
      const headers = ['timestamp', 'latitude', 'longitude', 'speed', 'heading', 'fuel'];
      const rows = points.map(point => [
        point.timestamp.toISOString(),
        point.lat,
        point.lng,
        point.speed,
        point.heading,
        point.fuel
      ]);
  
      return [
        `# Route Summary for ${summary.vehicleId}`,
        `# Distance: ${summary.route.totalDistance} km`,
        `# Duration: ${summary.period.duration} minutes`,
        `# Average Speed: ${summary.route.averageSpeed} km/h`,
        `# Generated: ${summary.reportGenerated.toISOString()}`,
        '',
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
    }
  
    /**
     * Export ke GPX format untuk GPS devices
     */
    exportToGPX(vehicleId, points) {
      const gpxPoints = points.map(point => 
        `    <trkpt lat="${point.lat}" lon="${point.lng}">
        <time>${point.timestamp.toISOString()}</time>
        <extensions>
          <speed>${point.speed}</speed>
          <course>${point.heading}</course>
          <fuel>${point.fuel}</fuel>
        </extensions>
      </trkpt>`
      ).join('\n');
  
      return `<?xml version="1.0" encoding="UTF-8"?>
  <gpx version="1.1" creator="Fleet Management System">
    <metadata>
      <name>${vehicleId} Route</name>
      <desc>Route tracking data for vehicle ${vehicleId}</desc>
      <time>${new Date().toISOString()}</time>
    </metadata>
    <trk>
      <name>${vehicleId} Track</name>
      <trkseg>
  ${gpxPoints}
      </trkseg>
    </trk>
  </gpx>`;
    }
  
    /**
     * Export ke GeoJSON format
     */
    exportToGeoJSON(vehicleId, points) {
      const coordinates = points.map(point => [point.lng, point.lat]);
      
      return {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {
              vehicleId,
              trackType: "route_history",
              startTime: points[0]?.timestamp.toISOString(),
              endTime: points[points.length - 1]?.timestamp.toISOString(),
              totalPoints: points.length
            },
            geometry: {
              type: "LineString",
              coordinates
            }
          },
          // Add start point
          {
            type: "Feature",
            properties: {
              vehicleId,
              pointType: "start",
              timestamp: points[0]?.timestamp.toISOString(),
              speed: points[0]?.speed,
              fuel: points[0]?.fuel
            },
            geometry: {
              type: "Point",
              coordinates: [points[0]?.lng, points[0]?.lat]
            }
          },
          // Add end point
          {
            type: "Feature",
            properties: {
              vehicleId,
              pointType: "end",
              timestamp: points[points.length - 1]?.timestamp.toISOString(),
              speed: points[points.length - 1]?.speed,
              fuel: points[points.length - 1]?.fuel
            },
            geometry: {
              type: "Point",
              coordinates: [points[points.length - 1]?.lng, points[points.length - 1]?.lat]
            }
          }
        ]
      };
    }
  
    /**
     * Clear cache
     */
    clearCache() {
      this.trackCache.clear();
      this.vehicleCache.clear();
    }
  
    /**
     * Get cache statistics
     */
    getCacheStats() {
      return {
        trackCacheSize: this.trackCache.size,
        vehicleCacheSize: this.vehicleCache.size,
        memoryUsage: this.estimateMemoryUsage()
      };
    }
  
    /**
     * Estimate memory usage (rough calculation)
     */
    estimateMemoryUsage() {
      let totalSize = 0;
      
      this.trackCache.forEach(entry => {
        totalSize += JSON.stringify(entry).length;
      });
      
      this.vehicleCache.forEach(entry => {
        totalSize += JSON.stringify(entry).length;
      });
  
      return Math.round(totalSize / 1024); // KB
    }
  }
  
  /**
   * React hook untuk tracking data management
   */
  export const useTrackingDataManager = (apiConfig) => {
    const [manager] = useState(() => new TrackingDataManager(apiConfig));
    
    const loadVehicleRoute = async (vehicle, hours = 2, maxPoints = 100) => {
      try {
        const points = await manager.getLocationHistory(
          vehicle.truckId || vehicle.id,
          vehicle.id,
          hours,
          maxPoints
        );
        
        const stats = manager.calculateRouteStatistics(points);
        
        return {
          success: true,
          vehicleId: vehicle.id,
          points,
          stats,
          summary: manager.generateRouteSummary(vehicle.id, points, stats)
        };
      } catch (error) {
        return {
          success: false,
          vehicleId: vehicle.id,
          points: [],
          stats: null,
          error: error.message
        };
      }
    };
  
    const loadAllVehicleRoutes = async (vehicles, hours = 2, maxPoints = 100) => {
      return await manager.batchLoadLocationHistories(vehicles, hours, maxPoints);
    };
  
    const exportVehicleRoute = (vehicleId, points, format = 'json') => {
      return manager.exportRouteData(vehicleId, points, format);
    };
  
    const getCacheInfo = () => {
      return manager.getCacheStats();
    };
  
    const clearCache = () => {
      manager.clearCache();
    };
  
    return {
      loadVehicleRoute,
      loadAllVehicleRoutes,
      exportVehicleRoute,
      getCacheInfo,
      clearCache,
      manager
    };
  };
  
  /**
   * Real-time tracking buffer untuk WebSocket updates
   */
  export class RealTimeTrackingBuffer {
    constructor(maxBufferSize = 50) {
      this.buffers = new Map(); // vehicleId -> array of points
      this.maxBufferSize = maxBufferSize;
    }
  
    /**
     * Add new position update to buffer
     */
    addUpdate(vehicleId, position) {
      if (!this.buffers.has(vehicleId)) {
        this.buffers.set(vehicleId, []);
      }
  
      const buffer = this.buffers.get(vehicleId);
      buffer.push({
        lat: position.latitude,
        lng: position.longitude,
        timestamp: new Date(),
        speed: position.speed || 0,
        fuel: position.fuelPercentage || 0,
        heading: position.heading || 0
      });
  
      // Keep buffer size under limit
      if (buffer.length > this.maxBufferSize) {
        buffer.shift();
      }
    }
  
    /**
     * Get buffered points for vehicle
     */
    getBuffer(vehicleId) {
      return this.buffers.get(vehicleId) || [];
    }
  
    /**
     * Get all buffers
     */
    getAllBuffers() {
      const result = {};
      this.buffers.forEach((buffer, vehicleId) => {
        result[vehicleId] = [...buffer];
      });
      return result;
    }
  
    /**
     * Clear buffer for specific vehicle
     */
    clearBuffer(vehicleId) {
      if (vehicleId) {
        this.buffers.delete(vehicleId);
      } else {
        this.buffers.clear();
      }
    }
  
    /**
     * Get buffer statistics
     */
    getStats() {
      let totalPoints = 0;
      this.buffers.forEach(buffer => {
        totalPoints += buffer.length;
      });
  
      return {
        vehicleCount: this.buffers.size,
        totalPoints,
        averagePointsPerVehicle: this.buffers.size > 0 ? Math.round(totalPoints / this.buffers.size) : 0
      };
    }
  }
  
  export default {
    TrackingDataManager,
    RealTimeTrackingBuffer,
    useTrackingDataManager
  };