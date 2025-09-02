import React, { useEffect, useRef, useState } from 'react';
import {
  TruckIcon,
  MapPinIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  SignalIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  MapIcon
} from '@heroicons/react/24/outline';
import 'leaflet/dist/leaflet.css';
import BORNEO_INDOBARA_GEOJSON from '../../data/geofance.js';
import { trucksAPI, miningAreaAPI, FleetWebSocket } from '../../services/api.js';
import { getLiveTrackingData, getTruckRoute, generateGpsPositions } from '../../data/index.js';

const LiveTrackingMap = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [legendVisible, setLegendVisible] = useState(true);
  const [mapStyle, setMapStyle] = useState('osm');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Route tracking states
  const [vehicleRoutes, setVehicleRoutes] = useState({});
  const [routeVisible, setRouteVisible] = useState({});
  const [isTrackingActive, setIsTrackingActive] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [routeColors] = useState([
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ]);
  
  const markersRef = useRef({});
  const routeLinesRef = useRef({});
  const wsRef = useRef(null);

  // Initialize sample data when backend is not available
  const initializeSampleData = async () => {
    console.log('🔄 Backend not available - initializing comprehensive dummy data');
    
    try {
      // Get live tracking data from our comprehensive dummy data
      const liveTrackingData = getLiveTrackingData();
      console.log(`📊 Loaded ${liveTrackingData.length} vehicles from dummy data`);
      
      // Load route history for each vehicle
      const routes = {};
      const routePromises = liveTrackingData.map(async (vehicle) => {
        const routeData = getTruckRoute(vehicle.id, timeRange);
        if (routeData && routeData.length > 0) {
          routes[vehicle.id] = routeData.map(point => [point.latitude, point.longitude]);
          // Save to offline storage
          saveOfflineRoute(vehicle.id, routes[vehicle.id]);
        }
        return vehicle.id;
      });
      
      await Promise.all(routePromises);
      setVehicleRoutes(routes);
      
      // Initialize route visibility
      const initialRouteVisibility = {};
      liveTrackingData.forEach(vehicle => {
        initialRouteVisibility[vehicle.id] = true;
      });
      setRouteVisible(initialRouteVisibility);
      
      console.log(`✅ Initialized ${liveTrackingData.length} vehicles with comprehensive dummy data`);
      return liveTrackingData;
    } catch (error) {
      console.error('❌ Failed to initialize dummy data:', error);
      return [];
    }
  };

  // Advanced route simulation for active trucks
  const simulateRealisticMovement = (vehicle, currentRoute) => {
    const zones = {
      loadingPoint: [115.580000, -3.520000],
      dumpingPoint: [115.610000, -3.590000],
      workshop: [115.590000, -3.580000],
      fuelStation: [115.575000, -3.535000],
      weighbridge: [115.585000, -3.545000]
    };

    // Determine next waypoint based on current load and position
    let targetZone;
    if (vehicle.load.includes('Empty')) {
      targetZone = zones.loadingPoint; // Go to loading area
    } else if (vehicle.load.includes('Coal')) {
      targetZone = zones.dumpingPoint; // Go to dumping area
    } else {
      targetZone = zones.workshop; // Go to workshop
    }

    // Calculate direction towards target
    const currentPos = vehicle.position;
    const deltaLat = (targetZone[0] - currentPos[0]) * 0.1;
    const deltaLng = (targetZone[1] - currentPos[1]) * 0.1;
    
    // Add road following behavior with curves
    const roadNoise = {
      lat: (Math.sin(Date.now() / 10000) * 0.0002),
      lng: (Math.cos(Date.now() / 8000) * 0.0003)
    };
    
    const newPosition = [
      currentPos[0] + deltaLat + roadNoise.lat,
      currentPos[1] + deltaLng + roadNoise.lng
    ];

    // Calculate realistic heading based on movement
    const bearing = Math.atan2(deltaLng, deltaLat) * 180 / Math.PI;
    const newHeading = (bearing + 360) % 360;

    return {
      position: newPosition,
      heading: Math.round(newHeading),
      speed: Math.max(15, Math.min(65, vehicle.speed + (Math.random() - 0.5) * 8))
    };
  };

  // Load route history from database with fallback
  const loadRouteHistory = async (truckId, timeRange = '24h') => {
    try {
      console.log(`📍 Loading route history for ${truckId} (${timeRange})`);
      
      const params = {
        timeRange: timeRange,
        limit: 200,
        minSpeed: 0
      };
      
      const response = await trucksAPI.getLocationHistory(truckId, params);
      
      if (response.success && response.data) {
        // Convert database records to route points
        const routePoints = response.data.map(record => [
          parseFloat(record.latitude),
          parseFloat(record.longitude)
        ]).filter(point => 
          !isNaN(point[0]) && !isNaN(point[1]) && 
          point[0] !== 0 && point[1] !== 0
        );
        
        console.log(`✅ Loaded ${routePoints.length} route points for ${truckId}`);
        return routePoints;
      }
      
      return [];
    } catch (error) {
      console.error(`❌ Failed to load route history for ${truckId}:`, error);
      
      // Try to get from offline storage
      const offlineRoute = getOfflineRoute(truckId);
      if (offlineRoute.length > 0) {
        console.log(`📱 Using offline route for ${truckId}: ${offlineRoute.length} points`);
        return offlineRoute;
      }
      
      return [];
    }
  };

  // Load all vehicles route history from database with fallback
  const loadAllRoutesHistory = async (vehicleList) => {
    try {
      console.log('📍 Loading route history for all vehicles...');
      
      const routePromises = vehicleList.map(async (vehicle) => {
        const routeHistory = await loadRouteHistory(vehicle.id, timeRange);
        return {
          vehicleId: vehicle.id,
          routeHistory: routeHistory
        };
      });
      
      const routeResults = await Promise.all(routePromises);
      const routesData = {};
      
      routeResults.forEach(result => {
        routesData[result.vehicleId] = result.routeHistory;
      });
      
      console.log('✅ All route history loaded');
      return routesData;
    } catch (error) {
      console.error('❌ Failed to load routes history:', error);
      return {};
    }
  };

  // Offline route storage utilities
  const saveOfflineRoute = (vehicleId, routeData) => {
    try {
      const offlineRoutes = JSON.parse(localStorage.getItem('offlineRoutes') || '{}');
      offlineRoutes[vehicleId] = {
        route: routeData,
        timestamp: new Date().toISOString(),
        points: routeData.length
      };
      localStorage.setItem('offlineRoutes', JSON.stringify(offlineRoutes));
    } catch (error) {
      console.error('Failed to save offline route:', error);
    }
  };

  const getOfflineRoute = (vehicleId) => {
    try {
      const offlineRoutes = JSON.parse(localStorage.getItem('offlineRoutes') || '{}');
      return offlineRoutes[vehicleId]?.route || [];
    } catch (error) {
      console.error('Failed to get offline route:', error);
      return [];
    }
  };
  const calculateRouteDistance = (routePoints) => {
    if (routePoints.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < routePoints.length; i++) {
      const lat1 = routePoints[i - 1][0];
      const lng1 = routePoints[i - 1][1];
      const lat2 = routePoints[i][0];
      const lng2 = routePoints[i][1];
      
      const R = 6371; // Earth's radius in kilometers
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      totalDistance += distance;
    }
    
    return totalDistance;
  };

  // Initialize map
  useEffect(() => {
    const initializeMap = async () => {
      if (mapRef.current && !map) {
        try {
          const L = await import('leaflet');
          
          // Initialize map centered on PT Borneo Indobara geofence area
          const mapInstance = L.default.map(mapRef.current, {
            center: [-3.580000, 115.600000],
            zoom: 13,
            zoomControl: true,
            scrollWheelZoom: true,
            doubleClickZoom: true,
            dragging: true,
            touchZoom: true,
            boxZoom: true,
            keyboard: true
          });

          mapInstance.getContainer().style.outline = 'none';

          // Add tile layers
          const osmLayer = L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          });
          
          const satelliteLayer = L.default.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri'
          });
          
          osmLayer.addTo(mapInstance);
          mapInstance.osmLayer = osmLayer;
          mapInstance.satelliteLayer = satelliteLayer;

          // Add geofence
          if (BORNEO_INDOBARA_GEOJSON && BORNEO_INDOBARA_GEOJSON.features) {
            L.default.geoJSON(BORNEO_INDOBARA_GEOJSON, {
              style: {
                color: '#3b82f6',
                weight: 3,
                opacity: 0.8,
                fillColor: '#3b82f6',
                fillOpacity: 0.1,
                dashArray: '10, 10'
              }
            }).addTo(mapInstance);
          }

          setMap(mapInstance);
        } catch (error) {
          console.error('Error initializing map:', error);
        }
      }
    };

    initializeMap();
  }, []);

  // Load truck data and route history
  useEffect(() => {
    const loadTruckData = async () => {
      try {
        setLoading(true);
        
        // Load truck data from API
        const response = await trucksAPI.getRealTimeLocations();
        
        if (response.success && response.data) {
          // Convert GeoJSON to vehicle format
          const vehicleData = response.data.features?.map(feature => ({
            id: feature.properties.truckNumber,
            driver: feature.properties.driverName || 'Unknown Driver',
            position: [feature.geometry.coordinates[1], feature.geometry.coordinates[0]],
            status: feature.properties.status?.toLowerCase() || 'offline',
            speed: feature.properties.speed || 0,
            heading: feature.properties.heading || 0,
            fuel: feature.properties.fuelPercentage || 0,
            battery: 90,
            signal: 'good',
            lastUpdate: new Date(),
            route: 'Mining Area',
            load: feature.properties.payloadTons ? `Coal - ${feature.properties.payloadTons} tons` : 'Unknown'
          })) || [];
          
          setVehicles(vehicleData);
          
          // Load route history for each vehicle from database
          const routesData = await loadAllRoutesHistory(vehicleData);
          setVehicleRoutes(routesData);
          
          // Initialize route visibility
          const initialRouteVisibility = {};
          vehicleData.forEach(vehicle => {
            initialRouteVisibility[vehicle.id] = true;
          });
          setRouteVisible(initialRouteVisibility);
          
        } else {
          console.log('🔌 Backend not available - using sample data for demo');
          const sampleData = await initializeSampleData();
          setVehicles(sampleData);
          setError('Backend not available - using demo data');
        }
      } catch (error) {
        console.error('❌ Failed to load truck data:', error);
        console.log('🔄 Using sample data as fallback');
        
        const sampleData = await initializeSampleData();
        setVehicles(sampleData);
        setError('Connection failed - using demo data');
      } finally {
        setLoading(false);
      }
    };

    loadTruckData();

    // Setup WebSocket for real-time updates (with fallback)
    wsRef.current = new FleetWebSocket();
    
    try {
      wsRef.current.connect();
      
      // Subscribe to truck location updates
      wsRef.current.subscribe('truck_locations_update', async (data) => {
        if (data && Array.isArray(data)) {
          console.log('📡 Received WebSocket truck updates:', data.length, 'vehicles');
          
          const vehicleData = data.map(truck => ({
            id: truck.truckNumber,
            driver: truck.driverName || 'Unknown Driver',
            position: [truck.latitude, truck.longitude],
            status: truck.status?.toLowerCase() || 'offline',
            speed: truck.speed || 0,
            heading: truck.heading || 0,
            fuel: truck.fuelPercentage || 0,
            battery: 90,
            signal: 'good',
            lastUpdate: new Date(),
            route: 'Mining Area',
            load: truck.payloadTons ? `Coal - ${truck.payloadTons} tons` : 'Unknown'
          }));
          
          setVehicles(vehicleData);
          setError(null);
          
          // Update route tracking for moved vehicles (real-time from database)
          if (isTrackingActive) {
            vehicleData.forEach(vehicle => {
              if (vehicle.status === 'active' && vehicle.speed > 0) {
                setVehicleRoutes(prev => {
                  const currentRoute = prev[vehicle.id] || [];
                  const newPosition = vehicle.position;
                  const lastPosition = currentRoute[currentRoute.length - 1];
                  
                  // Check if vehicle has moved significantly (>10 meters)
                  const shouldAdd = !lastPosition || 
                    (Math.abs(lastPosition[0] - newPosition[0]) > 0.0001 || 
                     Math.abs(lastPosition[1] - newPosition[1]) > 0.0001);
                  
                  if (shouldAdd) {
                    const newRoute = [...currentRoute, newPosition];
                    const limitedRoute = newRoute.slice(-200);
                    
                    // Save to offline storage
                    saveOfflineRoute(vehicle.id, limitedRoute);
                    
                    return {
                      ...prev,
                      [vehicle.id]: limitedRoute
                    };
                  }
                  
                  return prev;
                });
              }
            });
          }
        }
      });
      
    } catch (wsError) {
      console.warn('⚠️ WebSocket connection failed, using polling fallback');
    }

    return () => {
      if (map) {
        map.remove();
      }
      if (wsRef.current) {
        wsRef.current.disconnect();
      }
    };
  }, [timeRange]);

  // Update markers and routes when data changes
  useEffect(() => {
    if (map && vehicles.length > 0) {
      const L = window.L || require('leaflet');
      
      // Clear existing markers and routes
      Object.values(markersRef.current).forEach(marker => {
        if (marker && map.hasLayer(marker)) {
          map.removeLayer(marker);
        }
      });
      
      Object.values(routeLinesRef.current).forEach(routeLine => {
        if (routeLine && map.hasLayer(routeLine)) {
          map.removeLayer(routeLine);
        }
      });
      
      markersRef.current = {};
      routeLinesRef.current = {};

      // Add vehicle markers and routes
      vehicles.forEach((vehicle, index) => {
        const colors = {
          active: '#10b981',
          idle: '#f59e0b',
          maintenance: '#ef4444',
          offline: '#6b7280'
        };

        // Create vehicle marker
        const icon = L.divIcon({
          html: `
            <div style="
              background: ${colors[vehicle.status] || colors.offline};
              border: 3px solid white;
              border-radius: 50%;
              width: 28px;
              height: 28px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              position: relative;
            ">
              <svg width="14" height="14" fill="white" viewBox="0 0 24 24">
                <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
              </svg>
              ${vehicle.speed > 0 ? `
                <div style="
                  position: absolute;
                  top: -2px;
                  right: -2px;
                  width: 8px;
                  height: 8px;
                  background: #22c55e;
                  border-radius: 50%;
                  animation: pulse 2s infinite;
                "></div>
              ` : ''}
            </div>
          `,
          className: 'custom-truck-icon',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker(vehicle.position, { icon }).addTo(map);
        markersRef.current[vehicle.id] = marker;
        
        // Enhanced popup with route info
        marker.bindPopup(`
          <div class="p-4 min-w-72 max-w-80">
            <div class="flex items-center justify-between mb-3">
              <h4 class="font-bold text-gray-900 text-lg">${vehicle.id}</h4>
              <span class="px-3 py-1 rounded-full text-xs font-medium bg-${vehicle.status === 'active' ? 'green' : vehicle.status === 'idle' ? 'yellow' : 'red'}-100 text-${vehicle.status === 'active' ? 'green' : vehicle.status === 'idle' ? 'yellow' : 'red'}-600">
                ${vehicle.status.toUpperCase()}
              </span>
            </div>
            
            <div class="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div class="bg-gray-50 p-2 rounded">
                <div class="text-gray-500 text-xs">Driver</div>
                <div class="font-medium">${vehicle.driver}</div>
              </div>
              <div class="bg-gray-50 p-2 rounded">
                <div class="text-gray-500 text-xs">Speed</div>
                <div class="font-medium">${vehicle.speed} km/h</div>
              </div>
              <div class="bg-gray-50 p-2 rounded">
                <div class="text-gray-500 text-xs">Fuel</div>
                <div class="font-medium">${vehicle.fuel}%</div>
              </div>
              <div class="bg-gray-50 p-2 rounded">
                <div class="text-gray-500 text-xs">Signal</div>
                <div class="font-medium">${vehicle.signal}</div>
              </div>
            </div>
            
            <div class="border-t pt-3 space-y-2">
              <div class="text-sm">
                <div class="text-gray-500">Route:</div>
                <div class="font-medium">${vehicle.route}</div>
              </div>
              <div class="text-sm">
                <div class="text-gray-500">Load:</div>
                <div class="font-medium">${vehicle.load}</div>
              </div>
              <div class="text-sm">
                <div class="text-gray-500">Route Points:</div>
                <div class="font-medium">${(vehicleRoutes[vehicle.id] || []).length} points</div>
              </div>
              <div class="text-sm">
                <div class="text-gray-500">Distance:</div>
                <div class="font-medium">~${calculateRouteDistance(vehicleRoutes[vehicle.id] || []).toFixed(1)} km</div>
              </div>
              <div class="text-sm">
                <div class="text-gray-500">Last Update:</div>
                <div class="font-medium">${formatLastUpdate(vehicle.lastUpdate)}</div>
              </div>
            </div>
          </div>
        `);

        marker.on('click', () => {
          setSelectedVehicle(vehicle);
        });

        // Add route line if exists and visible
        const routeHistory = vehicleRoutes[vehicle.id] || [];
        if (routeHistory.length > 1 && routeVisible[vehicle.id] !== false) {
          const routeColor = routeColors[index % routeColors.length];
          
          // Create route line
          const routeLine = L.polyline(routeHistory, {
            color: routeColor,
            weight: 4,
            opacity: 0.7,
            smoothFactor: 1,
            dashArray: vehicle.status === 'active' ? null : '10, 10'
          }).addTo(map);
          
          routeLinesRef.current[vehicle.id] = routeLine;
          
          // Add route start marker
          if (routeHistory.length > 0) {
            const startIcon = L.divIcon({
              html: `
                <div style="
                  background: white;
                  border: 2px solid ${routeColor};
                  border-radius: 50%;
                  width: 16px;
                  height: 16px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                ">
                  <div style="
                    background: ${routeColor};
                    border-radius: 50%;
                    width: 8px;
                    height: 8px;
                  "></div>
                </div>
              `,
              className: 'route-start-marker',
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            });
            
            L.marker(routeHistory[0], { icon: startIcon }).addTo(map)
              .bindTooltip(`${vehicle.id} - Route Start (${routeHistory.length} points)`, { 
                permanent: false, 
                direction: 'top' 
              });
          }
          
          // Add route info tooltip
          routeLine.bindTooltip(`
            <div class="text-sm">
              <strong>${vehicle.id} Route</strong><br/>
              Points: ${routeHistory.length}<br/>
              Distance: ~${calculateRouteDistance(routeHistory).toFixed(1)} km<br/>
              Status: ${vehicle.status.toUpperCase()}
            </div>
          `, { 
            sticky: true 
          });
        }
      });
    }
  }, [map, vehicles, vehicleRoutes, routeVisible]);

  // Enhanced real-time simulation with realistic mining truck movements
  useEffect(() => {
    if (!isTrackingActive) return;
    
    const interval = setInterval(() => {
      setVehicles(prevVehicles => 
        prevVehicles.map(vehicle => {
          if (vehicle.status === 'active') {
            // Use realistic movement simulation
            const movement = simulateRealisticMovement(vehicle, vehicleRoutes[vehicle.id] || []);
            
            // Update route for active vehicles with curved paths
            setVehicleRoutes(prev => {
              const currentRoute = prev[vehicle.id] || [];
              const newPosition = movement.position;
              const lastPosition = currentRoute[currentRoute.length - 1];
              
              // Check if vehicle has moved significantly (realistic threshold)
              const shouldAdd = !lastPosition || 
                (Math.abs(lastPosition[0] - newPosition[0]) > 0.00008 || 
                 Math.abs(lastPosition[1] - newPosition[1]) > 0.00008);
              
              if (shouldAdd) {
                const newRoute = [...currentRoute, newPosition];
                const limitedRoute = newRoute.slice(-200);
                
                // Save to offline storage
                saveOfflineRoute(vehicle.id, limitedRoute);
                
                return {
                  ...prev,
                  [vehicle.id]: limitedRoute
                };
              }
              
              return prev;
            });
            
            return {
              ...vehicle,
              position: movement.position,
              heading: movement.heading,
              speed: movement.speed,
              lastUpdate: new Date()
            };
          }
          return vehicle;
        })
      );
    }, 6000); // Update every 6 seconds for smooth movement

    return () => clearInterval(interval);
  }, [isTrackingActive, vehicleRoutes]);

  // Refresh route history for specific vehicle with fallback
  const refreshVehicleRoute = async (vehicleId, range = timeRange) => {
    try {
      console.log(`🔄 Refreshing route for ${vehicleId} (${range})`);
      
      const routeHistory = await loadRouteHistory(vehicleId, range);
      
      setVehicleRoutes(prev => ({
        ...prev,
        [vehicleId]: routeHistory
      }));
      
      // Save to offline storage
      if (routeHistory.length > 0) {
        saveOfflineRoute(vehicleId, routeHistory);
      }
      
      console.log(`✅ Route refreshed for ${vehicleId}: ${routeHistory.length} points`);
      
    } catch (error) {
      console.error(`❌ Failed to refresh route for ${vehicleId}:`, error);
      
      // Try offline fallback
      const offlineRoute = getOfflineRoute(vehicleId);
      if (offlineRoute.length > 0) {
        setVehicleRoutes(prev => ({
          ...prev,
          [vehicleId]: offlineRoute
        }));
        console.log(`📱 Loaded offline route for ${vehicleId}: ${offlineRoute.length} points`);
      }
    }
  };

  // Handle time range change
  const handleTimeRangeChange = async (newRange) => {
    setTimeRange(newRange);
    setLoading(true);
    
    try {
      const routesData = await loadAllRoutesHistory(vehicles);
      setVehicleRoutes(routesData);
    } catch (error) {
      console.error('Failed to change time range:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle route visibility
  const toggleRouteVisibility = (vehicleId) => {
    setRouteVisible(prev => ({
      ...prev,
      [vehicleId]: !prev[vehicleId]
    }));
    
    // Toggle route line visibility on map
    const routeLine = routeLinesRef.current[vehicleId];
    if (routeLine && map) {
      if (routeVisible[vehicleId]) {
        map.removeLayer(routeLine);
      } else {
        map.addLayer(routeLine);
      }
    }
  };

  // Clear all routes
  const clearAllRoutes = () => {
    setVehicleRoutes({});
    Object.values(routeLinesRef.current).forEach(routeLine => {
      if (routeLine && map && map.hasLayer(routeLine)) {
        map.removeLayer(routeLine);
      }
    });
    routeLinesRef.current = {};
  };

  // Toggle tracking
  const toggleTracking = () => {
    setIsTrackingActive(!isTrackingActive);
  };

  // Helper functions
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'idle': return 'text-yellow-600 bg-yellow-100';
      case 'maintenance': return 'text-red-600 bg-red-100';
      case 'offline': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatLastUpdate = (date) => {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const focusOnVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    if (map) {
      map.setView(vehicle.position, 15);
    }
  };

  const resetMapView = () => {
    setSelectedVehicle(null);
    if (map) {
      map.setView([-3.580000, 115.600000], 13);
    }
  };

  return (
    <div className="h-full flex">
      {/* Toggle Button */}
      <button
        onClick={() => setSidebarVisible(!sidebarVisible)}
        className={`fixed top-1/2 -translate-y-1/2 z-40 bg-white hover:bg-gray-50 border border-gray-300 shadow-lg transition-all duration-300 flex items-center rounded-r-lg px-2 py-3 ${
          sidebarVisible 
            ? 'left-80' 
            : 'left-72'
        }`}
        style={{ 
          zIndex: 999,
          left: sidebarVisible ? '605px' : '288px'  // Tested position - 605px when sidebar open
        }}
        title={sidebarVisible ? 'Hide Vehicle List' : 'Show Vehicle List'}
      >
        <svg 
          className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${
            sidebarVisible ? 'rotate-180' : ''
          }`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      {/* Vehicle List Sidebar */}
      <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
        sidebarVisible ? 'w-80' : 'w-0 overflow-hidden'
      }`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold text-gray-900">Live Tracking</h4>
            <div className="flex gap-2">
              <button
                onClick={toggleTracking}
                className={`p-2 rounded-lg transition-colors ${
                  isTrackingActive 
                    ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={isTrackingActive ? 'Pause Tracking' : 'Start Tracking'}
              >
                {isTrackingActive ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
              </button>
              <button
                onClick={resetMapView}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium px-2"
              >
                Reset View
              </button>
            </div>
          </div>

          {/* Route Controls */}
          <div className="space-y-2 mb-3">
            <div className="flex gap-2">
              <button
                onClick={clearAllRoutes}
                className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg text-xs font-medium transition-colors"
              >
                <TrashIcon className="w-3 h-3" />
                Clear Routes
              </button>
              <button
                onClick={() => {
                  vehicles.forEach(vehicle => {
                    refreshVehicleRoute(vehicle.id, timeRange);
                  });
                }}
                className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg text-xs font-medium transition-colors"
                disabled={loading}
              >
                <ArrowPathIcon className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                Refresh All
              </button>
            </div>
            
            {/* Time Range Selector */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                History Range
              </label>
              <select
                value={timeRange}
                onChange={(e) => handleTimeRangeChange(e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="1h">Last 1 Hour</option>
                <option value="6h">Last 6 Hours</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
            
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <div className={`w-2 h-2 rounded-full ${isTrackingActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              {isTrackingActive ? 'Live Tracking Active' : 'Tracking Paused'}
              {loading && (
                <span className="text-blue-600 ml-2">Syncing...</span>
              )}
            </div>
          </div>

          {selectedVehicle && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-blue-900 text-sm font-medium">
                Tracking: {selectedVehicle.id}
              </div>
              <div className="text-blue-700 text-xs">
                {selectedVehicle.driver} - {selectedVehicle.route}
              </div>
              <div className="text-blue-600 text-xs mt-1">
                Route: {(vehicleRoutes[selectedVehicle.id] || []).length} points • 
                ~{calculateRouteDistance(vehicleRoutes[selectedVehicle.id] || []).toFixed(1)} km
              </div>
            </div>
          )}
        </div>
        
        {/* Vehicle List */}
        <div className="flex-1 p-3 space-y-2 overflow-y-auto">
          {error ? (
            <div className="text-center py-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm text-yellow-800 font-medium">
                    {error}
                  </span>
                </div>
                <p className="text-xs text-yellow-700 mt-1">
                  Showing demo data with simulated routes
                </p>
              </div>
            </div>
          ) : null}
          
          {loading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading vehicles...</p>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-600">No vehicles found</p>
            </div>
          ) : (
            vehicles.map((vehicle, index) => {
              const routeHistory = vehicleRoutes[vehicle.id] || [];
              const routeColor = routeColors[index % routeColors.length];
              
              return (
                <div
                  key={vehicle.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedVehicle?.id === vehicle.id
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  onClick={() => focusOnVehicle(vehicle)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          {vehicle.id.split('-')[1]}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{vehicle.id}</div>
                        <div className="text-xs text-gray-500">{vehicle.driver}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Route visibility toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRouteVisibility(vehicle.id);
                        }}
                        className={`p-1 rounded transition-colors ${
                          routeVisible[vehicle.id] !== false
                            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                        title={routeVisible[vehicle.id] !== false ? 'Hide Route' : 'Show Route'}
                      >
                        {routeVisible[vehicle.id] !== false ? 
                          <EyeIcon className="w-3 h-3" /> : 
                          <EyeSlashIcon className="w-3 h-3" />
                        }
                      </button>
                      
                      {/* Refresh route button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          refreshVehicleRoute(vehicle.id, timeRange);
                        }}
                        className="p-1 rounded bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                        title="Refresh Route from Database"
                      >
                        <ArrowPathIcon className="w-3 h-3" />
                      </button>
                      
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                        {vehicle.status}
                      </span>
                    </div>
                  </div>
                  
                  {/* Route info line */}
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="w-3 h-0.5 rounded"
                      style={{ backgroundColor: routeColor }}
                    ></div>
                    <span className="text-xs text-gray-600">
                      {routeHistory.length} points • ~{calculateRouteDistance(routeHistory).toFixed(1)} km
                    </span>
                    {routeHistory.length === 0 && (
                      <span className="text-xs text-red-500">No route data</span>
                    )}
                  </div>
                  
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Speed:</span>
                      <span className="font-semibold">{vehicle.speed} km/h</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Fuel:</span>
                      <div className="flex items-center space-x-1">
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${vehicle.fuel > 30 ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${vehicle.fuel}%` }}
                          />
                        </div>
                        <span className="font-semibold">{vehicle.fuel}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>Updated:</span>
                      <span className="font-semibold">{formatLastUpdate(vehicle.lastUpdate)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative">
        <div 
          ref={mapRef}
          className="absolute inset-0 w-full h-full"
          style={{ cursor: 'grab' }}
        />
        
        {/* Map Controls */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3" style={{ zIndex: 1000 }}>
          <div className="flex items-center gap-3">
            {/* Map Style Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setMapStyle('osm');
                  if (map) {
                    map.removeLayer(map.satelliteLayer);
                    map.addLayer(map.osmLayer);
                  }
                }}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  mapStyle === 'osm' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Map
              </button>
              <button
                onClick={() => {
                  setMapStyle('satellite');
                  if (map) {
                    map.removeLayer(map.osmLayer);
                    map.addLayer(map.satelliteLayer);
                  }
                }}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  mapStyle === 'satellite' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Satellite
              </button>
            </div>
            
            {/* Route Display Controls */}
            <div className="border-l border-gray-300 pl-3 flex items-center gap-2">
              <span className="text-xs text-gray-600">Routes:</span>
              <button
                onClick={() => {
                  vehicles.forEach(vehicle => {
                    if (!routeVisible[vehicle.id]) {
                      toggleRouteVisibility(vehicle.id);
                    }
                  });
                }}
                className="px-2 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded transition-colors"
              >
                Show All
              </button>
              <button
                onClick={() => {
                  vehicles.forEach(vehicle => {
                    if (routeVisible[vehicle.id]) {
                      toggleRouteVisibility(vehicle.id);
                    }
                  });
                }}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 rounded transition-colors"
              >
                Hide All
              </button>
            </div>
            
            {/* Live Status */}
            <div className="border-l border-gray-300 pl-3 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isTrackingActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-700 font-medium">
                {isTrackingActive ? 'LIVE' : 'PAUSED'}
              </span>
            </div>
          </div>
        </div>

        {/* Top Right Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2" style={{ zIndex: 1000 }}>
          {/* Compass */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-2">
            <div className="flex flex-col items-center relative">
              <span className="text-xs font-bold text-gray-700 mb-1">N</span>
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8" stroke="#374151" strokeWidth="1" fill="white"/>
                <polygon points="12,6 13.5,11 12,10.5 10.5,11" fill="#ef4444" stroke="#dc2626" strokeWidth="0.5"/>
                <polygon points="12,18 10.5,13 12,13.5 13.5,13" fill="#6b7280" stroke="#4b5563" strokeWidth="0.5"/>
                <circle cx="12" cy="12" r="1" fill="#374151"/>
              </svg>
            </div>
          </div>

          {/* Fleet Status Legend */}
          <div className={`bg-white/90 backdrop-blur-sm rounded-lg shadow-lg transition-all duration-300 ${
            legendVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
          }`}>
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-900">Fleet Status</h4>
                <button
                  onClick={() => setLegendVisible(!legendVisible)}
                  className="text-gray-400 hover:text-gray-600 ml-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-lg font-bold text-green-600">
                    {vehicles.filter(v => v.status === 'active').length}
                  </div>
                  <div className="text-xs text-green-700 font-medium">Active</div>
                </div>
                <div className="text-center p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="text-lg font-bold text-yellow-600">
                    {vehicles.filter(v => v.status === 'idle').length}
                  </div>
                  <div className="text-xs text-yellow-700 font-medium">Idle</div>
                </div>
                <div className="text-center p-2 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-lg font-bold text-red-600">
                    {vehicles.filter(v => v.status === 'maintenance').length}
                  </div>
                  <div className="text-xs text-red-700 font-medium">Maint.</div>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-lg font-bold text-blue-600">
                    {vehicles.length}
                  </div>
                  <div className="text-xs text-blue-700 font-medium">Total</div>
                </div>
              </div>

              <div className="space-y-2 text-xs border-t border-gray-200 pt-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Active Vehicle</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-700">Idle Vehicle</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-gray-700">Maintenance</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-1 bg-blue-500 rounded"></div>
                  <span className="text-gray-700">Vehicle Route</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-0.5 bg-blue-500 border-dashed border border-blue-500"></div>
                  <span className="text-gray-700">Mining Area</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-white border-2 border-orange-500 rounded-full"></div>
                  <span className="text-gray-700">Route Start</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Show Legend Button */}
        <button
          onClick={() => setLegendVisible(true)}
          className={`absolute top-20 right-4 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg px-2 py-1 shadow-lg transition-opacity duration-300 ${
            legendVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          style={{ zIndex: 1000 }}
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Action Buttons */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2" style={{ zIndex: 1000 }}>
          {/* Fit All Routes Button */}
          <button
            onClick={() => {
              if (map) {
                const allRoutes = Object.values(vehicleRoutes).flat();
                if (allRoutes.length > 0) {
                  const bounds = [];
                  allRoutes.forEach(point => bounds.push(point));
                  
                  if (bounds.length > 0) {
                    const group = new L.featureGroup();
                    bounds.forEach(point => {
                      L.marker(point).addTo(group);
                    });
                    map.fitBounds(group.getBounds().pad(0.1));
                  }
                } else {
                  resetMapView();
                }
              }
            }}
            className="bg-purple-500 hover:bg-purple-600 text-white rounded-lg px-4 py-2 shadow-lg transition-colors duration-200 flex items-center gap-2"
          >
            <MapIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Fit Routes</span>
          </button>
          
          {/* Auto Center Button */}
          <button
            onClick={resetMapView}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 shadow-lg transition-colors duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0z" />
            </svg>
            <span className="text-sm font-medium">Auto Center</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveTrackingMap;