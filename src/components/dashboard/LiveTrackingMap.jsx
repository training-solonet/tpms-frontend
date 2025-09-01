import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  TruckIcon,
  MapPinIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  SignalIcon,
  EyeIcon,
  EyeSlashIcon,
  MapIcon
} from '@heroicons/react/24/outline';
import 'leaflet/dist/leaflet.css';
import BORNEO_INDOBARA_GEOJSON from '../../data/geofance.js';
import { trucksAPI, miningAreaAPI, FleetWebSocket } from '../../services/api.js';

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
  const [trackPaths, setTrackPaths] = useState(new Map());
  const [showAllTracks, setShowAllTracks] = useState(true);
  const [trackingSettings, setTrackingSettings] = useState({
    maxPoints: 100, // Maximum points in a track
    updateInterval: 30000, // 30 seconds
    trackColors: {
      active: '#10b981',
      idle: '#f59e0b', 
      maintenance: '#ef4444',
      offline: '#6b7280'
    }
  });
  
  // References for cleanup
  const wsRef = useRef(null);
  const markersRef = useRef(new Map());
  const tracksRef = useRef(new Map());
  const intervalRef = useRef(null);

  // Load location history for a specific truck
  const loadTruckHistory = useCallback(async (truckId, hours = 2) => {
    try {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - (hours * 60 * 60 * 1000));
      
      const response = await trucksAPI.getLocationHistory(truckId, {
        startDate: startTime.toISOString(),
        endDate: endTime.toISOString(),
        limit: trackingSettings.maxPoints
      });
      
      if (response.success && response.data) {
        return response.data.map(point => ({
          lat: parseFloat(point.latitude),
          lng: parseFloat(point.longitude),
          timestamp: new Date(point.recordedAt),
          speed: parseFloat(point.speed || 0),
          fuel: parseFloat(point.fuelPercentage || 0)
        }));
      }
      
      return [];
    } catch (error) {
      console.error(`Failed to load history for truck ${truckId}:`, error);
      return [];
    }
  }, [trackingSettings.maxPoints]);

  // Update route tracks on map
  const updateRouteTracks = useCallback(async (L, vehicles) => {
    if (!map || !L) return;

    // Clear existing tracks
    tracksRef.current.forEach(track => {
      map.removeLayer(track);
    });
    tracksRef.current.clear();

    // Load and display tracks for each vehicle
    for (const vehicle of vehicles) {
      if (!showAllTracks && selectedVehicle?.id !== vehicle.id) {
        continue; // Skip if not showing all tracks and this isn't selected
      }

      try {
        // Get truck ID from the vehicle data
        const truckResponse = await trucksAPI.getAll({ 
          truckNumber: vehicle.id 
        });
        
        if (truckResponse.success && truckResponse.data.length > 0) {
          const truck = truckResponse.data[0];
          const historyPoints = await loadTruckHistory(truck.id);
          
          if (historyPoints.length > 1) {
            // Create polyline for the route
            const coordinates = historyPoints.map(point => [point.lat, point.lng]);
            
            const trackColor = trackingSettings.trackColors[vehicle.status] || '#6b7280';
            
            const polyline = L.polyline(coordinates, {
              color: trackColor,
              weight: 3,
              opacity: selectedVehicle?.id === vehicle.id ? 0.8 : 0.6,
              smoothFactor: 1,
              dashArray: vehicle.status === 'maintenance' ? '10, 10' : null
            });

            // Add to map
            polyline.addTo(map);
            tracksRef.current.set(vehicle.id, polyline);

            // Add waypoint markers for significant stops
            const significantStops = historyPoints.filter((point, index) => {
              if (index === 0 || index === historyPoints.length - 1) return true;
              
              // Consider it a stop if speed was low for this point
              return point.speed < 5;
            });

            significantStops.forEach((stop, index) => {
              if (index === 0 || index === significantStops.length - 1) {
                // Start/End markers
                const isStart = index === 0;
                const waypointIcon = L.divIcon({
                  html: `
                    <div style="
                      background: ${isStart ? '#3b82f6' : '#ef4444'};
                      border: 2px solid white;
                      border-radius: 50%;
                      width: 12px;
                      height: 12px;
                      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                    "></div>
                  `,
                  className: 'waypoint-marker',
                  iconSize: [12, 12],
                  iconAnchor: [6, 6]
                });

                const waypointMarker = L.marker([stop.lat, stop.lng], { 
                  icon: waypointIcon,
                  zIndexOffset: -1000 // Behind truck markers
                }).addTo(map);

                waypointMarker.bindTooltip(
                  `${isStart ? 'Start' : 'Latest'}: ${stop.timestamp.toLocaleTimeString()}`,
                  { 
                    permanent: false,
                    direction: 'top',
                    className: 'waypoint-tooltip'
                  }
                );

                // Store waypoint marker for cleanup
                const vehicleTrack = tracksRef.current.get(vehicle.id);
                if (vehicleTrack) {
                  vehicleTrack.waypoints = vehicleTrack.waypoints || [];
                  vehicleTrack.waypoints.push(waypointMarker);
                }
              }
            });

            // Bind popup with route info
            polyline.bindPopup(`
              <div class="p-3 min-w-48">
                <h4 class="font-bold text-gray-900 mb-2">${vehicle.id} - Route History</h4>
                <div class="space-y-1 text-sm">
                  <div><strong>Points:</strong> ${historyPoints.length}</div>
                  <div><strong>Duration:</strong> ${formatDuration(historyPoints)}</div>
                  <div><strong>Distance:</strong> ${calculateDistance(historyPoints)} km</div>
                  <div><strong>Avg Speed:</strong> ${calculateAverageSpeed(historyPoints)} km/h</div>
                </div>
              </div>
            `);
          }
        }
      } catch (error) {
        console.error(`Failed to load route for ${vehicle.id}:`, error);
      }
    }
  }, [map, showAllTracks, selectedVehicle, loadTruckHistory, trackingSettings]);

  // Helper functions for route calculations
  const formatDuration = (points) => {
    if (points.length < 2) return '0min';
    const start = points[0].timestamp;
    const end = points[points.length - 1].timestamp;
    const diffMinutes = Math.floor((end - start) / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes}min`;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}min`;
  };

  const calculateDistance = (points) => {
    if (points.length < 2) return '0.0';
    
    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      
      // Haversine formula for distance calculation
      const R = 6371; // Earth's radius in km
      const dLat = (curr.lat - prev.lat) * Math.PI / 180;
      const dLng = (curr.lng - prev.lng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(prev.lat * Math.PI / 180) * Math.cos(curr.lat * Math.PI / 180) *
        Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      totalDistance += R * c;
    }
    
    return totalDistance.toFixed(1);
  };

  const calculateAverageSpeed = (points) => {
    if (points.length === 0) return '0.0';
    const avgSpeed = points.reduce((sum, point) => sum + point.speed, 0) / points.length;
    return avgSpeed.toFixed(1);
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

          // Prevent map from interfering with page scroll
          mapInstance.getContainer().style.outline = 'none';

          // Add tile layers
          const osmLayer = L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          });
          
          const satelliteLayer = L.default.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri'
          });
          
          // Add default layer
          osmLayer.addTo(mapInstance);
          
          // Store layers for switching
          mapInstance.osmLayer = osmLayer;
          mapInstance.satelliteLayer = satelliteLayer;

          // Add geofence
          if (BORNEO_INDOBARA_GEOJSON?.features) {
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
          setError('Failed to initialize map');
        }
      }
    };

    initializeMap();
  }, []);

  // Load truck data and setup WebSocket
  useEffect(() => {
    const loadTruckData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await trucksAPI.getRealTimeLocations();
        
        if (response.success && response.data?.features) {
          const vehicleData = response.data.features.map(feature => ({
            id: feature.properties.truckNumber,
            truckId: feature.properties.truckId, // Add truck ID for history lookup
            driver: feature.properties.driverName || 'Unknown Driver',
            position: [feature.geometry.coordinates[1], feature.geometry.coordinates[0]], // [lat, lng]
            status: feature.properties.status?.toLowerCase() || 'offline',
            speed: feature.properties.speed || 0,
            heading: feature.properties.heading || 0,
            fuel: feature.properties.fuelPercentage || 0,
            battery: 90,
            signal: 'good',
            lastUpdate: new Date(),
            route: 'Mining Area',
            load: feature.properties.payloadTons ? `Coal - ${feature.properties.payloadTons} tons` : 'Unknown'
          }));
          
          setVehicles(vehicleData);
        } else if (!response.online) {
          setError('Backend server is offline. Using cached data.');
          // Fallback to sample data when backend is offline
          setVehicles([
            {
              id: 'T001', truckId: 1, driver: 'Ahmad Suryadi',
              position: [-3.520000, 115.580000], status: 'active',
              speed: 45, heading: 135, fuel: 85, battery: 95, signal: 'strong',
              lastUpdate: new Date(), route: 'Route A', load: 'Coal - 50 tons'
            },
            {
              id: 'T002', truckId: 2, driver: 'Budi Santoso', 
              position: [-3.550000, 115.560000], status: 'idle',
              speed: 0, heading: 90, fuel: 72, battery: 88, signal: 'good',
              lastUpdate: new Date(), route: 'Route B', load: 'Empty'
            }
          ]);
        } else {
          setError('No vehicle data available');
        }
      } catch (error) {
        console.error('Failed to load truck data:', error);
        setError('Failed to load truck data');
      } finally {
        setLoading(false);
      }
    };

    loadTruckData();

    // Setup WebSocket for real-time updates
    if (!wsRef.current) {
      wsRef.current = new FleetWebSocket();
      wsRef.current.connect();
      
      // Subscribe to truck updates
      wsRef.current.subscribe('truck_locations_update', (data) => {
        if (data && Array.isArray(data)) {
          const vehicleData = data.map(truck => ({
            id: truck.truckNumber,
            truckId: truck.truckId || truck.id,
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
          
          setVehicles(prevVehicles => {
            // Update positions and add to track history
            const updatedVehicles = vehicleData.map(newVehicle => {
              const prevVehicle = prevVehicles.find(v => v.id === newVehicle.id);
              
              // Add current position to track history
              if (prevVehicle && map) {
                updateVehicleTrack(newVehicle);
              }
              
              return newVehicle;
            });
            
            return updatedVehicles;
          });
        }
      });
    }

    // Setup interval for loading historical data
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        if (vehicles.length > 0 && map) {
          loadAndUpdateAllTracks();
        }
      }, trackingSettings.updateInterval);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Update individual vehicle track
  const updateVehicleTrack = useCallback(async (vehicle) => {
    if (!map) return;
    
    const L = await import('leaflet');
    
    try {
      const historyPoints = await loadTruckHistory(vehicle.truckId || vehicle.id, 2);
      
      if (historyPoints.length > 1) {
        // Remove existing track
        const existingTrack = tracksRef.current.get(vehicle.id);
        if (existingTrack) {
          map.removeLayer(existingTrack);
          // Remove waypoints
          if (existingTrack.waypoints) {
            existingTrack.waypoints.forEach(waypoint => map.removeLayer(waypoint));
          }
        }

        // Create new track
        const coordinates = historyPoints.map(point => [point.lat, point.lng]);
        const trackColor = trackingSettings.trackColors[vehicle.status] || '#6b7280';
        
        const polyline = L.default.polyline(coordinates, {
          color: trackColor,
          weight: selectedVehicle?.id === vehicle.id ? 4 : 3,
          opacity: selectedVehicle?.id === vehicle.id ? 0.9 : 0.6,
          smoothFactor: 1,
          dashArray: vehicle.status === 'maintenance' ? '10, 10' : null
        });

        polyline.addTo(map);
        tracksRef.current.set(vehicle.id, polyline);

        // Add route info popup
        polyline.bindPopup(`
          <div class="p-3 min-w-48">
            <h4 class="font-bold text-gray-900 mb-2">${vehicle.id} - Route History</h4>
            <div class="space-y-1 text-sm">
              <div><strong>Driver:</strong> ${vehicle.driver}</div>
              <div><strong>Points:</strong> ${historyPoints.length}</div>
              <div><strong>Duration:</strong> ${formatDuration(historyPoints)}</div>
              <div><strong>Distance:</strong> ${calculateDistance(historyPoints)} km</div>
              <div><strong>Avg Speed:</strong> ${calculateAverageSpeed(historyPoints)} km/h</div>
              <div><strong>Status:</strong> ${vehicle.status}</div>
            </div>
          </div>
        `);

        // Add start/end waypoints
        if (historyPoints.length > 0) {
          const startPoint = historyPoints[0];
          const endPoint = historyPoints[historyPoints.length - 1];

          // Start waypoint (blue)
          const startIcon = L.default.divIcon({
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
            className: 'waypoint-marker',
            iconSize: [12, 12],
            iconAnchor: [6, 6]
          });

          const startMarker = L.default.marker([startPoint.lat, startPoint.lng], { 
            icon: startIcon,
            zIndexOffset: -1000
          }).addTo(map);

          startMarker.bindTooltip(
            `Start: ${startPoint.timestamp.toLocaleTimeString()}`,
            { permanent: false, direction: 'top' }
          );

          // Store waypoint for cleanup
          polyline.waypoints = [startMarker];
        }
      }
    } catch (error) {
      console.error(`Failed to update track for ${vehicle.id}:`, error);
    }
  }, [map, selectedVehicle, loadTruckHistory, trackingSettings]);

  // Load and update all tracks
  const loadAndUpdateAllTracks = useCallback(async () => {
    if (!map || vehicles.length === 0) return;
    
    console.log('🔄 Refreshing route tracks for all vehicles...');
    
    const L = await import('leaflet');
    await updateRouteTracks(L.default, vehicles);
  }, [map, vehicles, updateRouteTracks]);

  // Update vehicle markers on map
  useEffect(() => {
    if (map && vehicles.length > 0) {
      const updateMarkers = async () => {
        const L = await import('leaflet');
        
        // Clear existing markers
        markersRef.current.forEach(marker => {
          map.removeLayer(marker);
        });
        markersRef.current.clear();

        // Add vehicle markers
        vehicles.forEach(vehicle => {
          const colors = {
            active: '#10b981',
            idle: '#f59e0b',
            maintenance: '#ef4444',
            offline: '#6b7280'
          };

          const icon = L.default.divIcon({
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
                z-index: 1000;
              ">
                <svg width="14" height="14" fill="white" viewBox="0 0 24 24">
                  <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                </svg>
              </div>
            `,
            className: 'custom-truck-icon',
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });

          const marker = L.default.marker(vehicle.position, { 
            icon,
            zIndexOffset: 1000 // Ensure trucks are above tracks
          }).addTo(map);
          
          marker.bindPopup(`
            <div class="p-4 min-w-64">
              <div class="flex items-center justify-between mb-3">
                <h4 class="font-bold text-gray-900">${vehicle.id}</h4>
                <span class="px-2 py-1 rounded-full text-xs font-medium bg-${vehicle.status === 'active' ? 'green' : vehicle.status === 'idle' ? 'yellow' : 'red'}-100 text-${vehicle.status === 'active' ? 'green' : vehicle.status === 'idle' ? 'yellow' : 'red'}-600">
                  ${vehicle.status}
                </span>
              </div>
              <div class="space-y-2 text-sm">
                <div><strong>Driver:</strong> ${vehicle.driver}</div>
                <div><strong>Route:</strong> ${vehicle.route}</div>
                <div><strong>Load:</strong> ${vehicle.load}</div>
                <div><strong>Speed:</strong> ${vehicle.speed} km/h</div>
                <div><strong>Fuel:</strong> ${vehicle.fuel}%</div>
                <div><strong>Heading:</strong> ${vehicle.heading}°</div>
                <div><strong>Last Update:</strong> ${vehicle.lastUpdate.toLocaleTimeString()}</div>
              </div>
              <div class="mt-3 pt-3 border-t border-gray-200">
                <button 
                  onclick="window.showVehicleTrack('${vehicle.id}')"
                  class="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs py-2 px-3 rounded transition-colors"
                >
                  Show Route History
                </button>
              </div>
            </div>
          `);

          marker.on('click', () => {
            setSelectedVehicle(vehicle);
          });

          markersRef.current.set(vehicle.id, marker);
        });

        // Update route tracks
        await updateRouteTracks(L.default, vehicles);
      };

      updateMarkers();
    }
  }, [map, vehicles, updateRouteTracks]);

  // Handle vehicle selection
  const focusOnVehicle = useCallback(async (vehicle) => {
    setSelectedVehicle(vehicle);
    if (map) {
      map.setView(vehicle.position, 15);
      
      // Highlight selected vehicle track
      await updateVehicleTrack(vehicle);
    }
  }, [map, updateVehicleTrack]);

  // Reset map view
  const resetMapView = useCallback(() => {
    setSelectedVehicle(null);
    if (map) {
      map.setView([-3.580000, 115.600000], 13);
    }
  }, [map]);

  // Toggle track visibility
  const toggleTrackVisibility = useCallback(() => {
    setShowAllTracks(prev => !prev);
    
    if (!showAllTracks) {
      // Show all tracks
      tracksRef.current.forEach(track => {
        track.setStyle({ opacity: 0.6 });
      });
    } else {
      // Hide non-selected tracks
      tracksRef.current.forEach((track, vehicleId) => {
        if (selectedVehicle?.id !== vehicleId) {
          track.setStyle({ opacity: 0.2 });
        }
      });
    }
  }, [showAllTracks, selectedVehicle]);

  // Clear all tracks
  const clearAllTracks = useCallback(() => {
    tracksRef.current.forEach(track => {
      map.removeLayer(track);
      if (track.waypoints) {
        track.waypoints.forEach(waypoint => map.removeLayer(waypoint));
      }
    });
    tracksRef.current.clear();
  }, [map]);

  // Refresh tracks
  const refreshTracks = useCallback(async () => {
    if (vehicles.length > 0 && map) {
      await loadAndUpdateAllTracks();
    }
  }, [vehicles, map, loadAndUpdateAllTracks]);

  // Global function for popup buttons
  useEffect(() => {
    window.showVehicleTrack = (vehicleId) => {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (vehicle) {
        focusOnVehicle(vehicle);
      }
    };

    return () => {
      delete window.showVehicleTrack;
    };
  }, [vehicles, focusOnVehicle]);

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

  return (
    <div className="h-full flex">
      {/* Toggle Sidebar Button */}
      <button
        onClick={() => setSidebarVisible(!sidebarVisible)}
        className={`fixed top-1/2 -translate-y-1/2 z-50 bg-white hover:bg-gray-50 border border-gray-300 rounded-r-lg px-2 py-3 shadow-lg transition-all duration-300 ${
          sidebarVisible ? 'left-80' : 'left-0'
        }`}
        style={{ zIndex: 1000 }}
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
            <button
              onClick={resetMapView}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Reset View
            </button>
          </div>

          {/* Track Controls */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={toggleTrackVisibility}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                showAllTracks 
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {showAllTracks ? <EyeIcon className="w-3 h-3" /> : <EyeSlashIcon className="w-3 h-3" />}
              {showAllTracks ? 'Hide Tracks' : 'Show Tracks'}
            </button>
            
            <button
              onClick={refreshTracks}
              className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-full text-xs font-medium transition-colors"
            >
              <MapIcon className="w-3 h-3" />
              Refresh
            </button>
            
            <button
              onClick={clearAllTracks}
              className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-full text-xs font-medium transition-colors"
            >
              Clear
            </button>
          </div>

          {selectedVehicle && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-blue-900 text-sm font-medium">
                Tracking: {selectedVehicle.id}
              </div>
              <div className="text-blue-700 text-xs">
                {selectedVehicle.driver} - {selectedVehicle.route}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-xs text-blue-600">Live tracking active</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Vehicle List */}
        <div className="flex-1 p-3 space-y-2 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading vehicles...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-sm text-yellow-700 font-medium mb-1">Connection Issue</p>
                <p className="text-xs text-yellow-600">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-3 py-1 rounded transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-8">
              <TruckIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No vehicles found</p>
            </div>
          ) : (
            vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedVehicle?.id === vehicle.id
                    ? 'border-blue-500 bg-blue-50 shadow-sm ring-2 ring-blue-200'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                onClick={() => focusOnVehicle(vehicle)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {vehicle.id.replace('T', '')}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{vehicle.id}</div>
                      <div className="text-xs text-gray-500">{vehicle.driver}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                      {vehicle.status}
                    </span>
                    {tracksRef.current.has(vehicle.id) && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-xs text-green-600">Tracked</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Speed:</span>
                    <span className="font-semibold">{vehicle.speed} km/h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Heading:</span>
                    <span className="font-semibold">{vehicle.heading}°</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Fuel:</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${vehicle.fuel > 30 ? 'bg-green-500' : vehicle.fuel > 15 ? 'bg-yellow-500' : 'bg-red-500'}`}
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
            ))
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
        
        {/* Map Controls - Top Center */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3" style={{ zIndex: 1000 }}>
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
        </div>

        {/* Tracking Controls - Top Left */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3" style={{ zIndex: 1000 }}>
          <div className="text-xs font-medium text-gray-700 mb-2">Route Tracking</div>
          <div className="flex flex-col gap-2">
            <button
              onClick={toggleTrackVisibility}
              className={`flex items-center gap-2 px-3 py-1 text-xs font-medium rounded transition-colors ${
                showAllTracks
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {showAllTracks ? <EyeIcon className="w-3 h-3" /> : <EyeSlashIcon className="w-3 h-3" />}
              {showAllTracks ? 'All Routes' : 'Selected Only'}
            </button>
            
            <button
              onClick={refreshTracks}
              className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 text-xs font-medium rounded transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            
            <button
              onClick={clearAllTracks}
              className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 text-xs font-medium rounded transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear
            </button>
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
                  <div className="w-4 h-0.5 bg-blue-500 border-dashed border border-blue-500"></div>
                  <span className="text-gray-700">Mining Area</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-0.5 bg-green-500"></div>
                  <span className="text-gray-700">Route Track</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-700">Start Point</span>
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

        {/* Auto Center Button */}
        <button
          onClick={resetMapView}
          className="absolute bottom-4 right-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 shadow-lg transition-colors duration-200 flex items-center gap-2"
          style={{ zIndex: 1000 }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm font-medium">Auto Center</span>
        </button>

        {/* Track Info Panel - Bottom Left */}
        {selectedVehicle && tracksRef.current.has(selectedVehicle.id) && (
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 max-w-sm" style={{ zIndex: 1000 }}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-900">
                {selectedVehicle.id} - Route Info
              </h4>
              <button
                onClick={() => setSelectedVehicle(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Driver:</span>
                <span className="font-medium text-gray-900">{selectedVehicle.driver}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Current Speed:</span>
                <span className="font-medium text-gray-900">{selectedVehicle.speed} km/h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Route:</span>
                <span className="font-medium text-gray-900">{selectedVehicle.route}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Load:</span>
                <span className="font-medium text-gray-900">{selectedVehicle.load}</span>
              </div>
              
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: trackingSettings.trackColors[selectedVehicle.status] }}
                  ></div>
                  <span className="text-gray-600 text-xs">Live Route Tracking</span>
                </div>
                <div className="text-xs text-gray-500">
                  Updates every {trackingSettings.updateInterval / 1000}s • Max {trackingSettings.maxPoints} points
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center" style={{ zIndex: 2000 }}>
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">Loading live tracking data...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTrackingMap;