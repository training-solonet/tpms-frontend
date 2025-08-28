import React, { useEffect, useRef, useState } from 'react';
import BORNEO_INDOBARA_GEOJSON from '../../data/geofance.js';
import { miningData } from '../../data/miningData.js';
import { useWebSocket } from '../../hooks/useWebSocket.jsx';
import {
  TruckIcon,
  MapPinIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';
import 'leaflet/dist/leaflet.css';

// Sample vehicle data with realistic coordinates within the geofence
const sampleVehicles = [
  {
    id: 'BRN-001',
    driver: 'Ahmad Suryadi',
    position: [115.580000, -3.520000],
    status: 'active',
    speed: 45,
    heading: 135,
    fuel: 85,
    battery: 95,
    signal: 'strong',
    lastUpdate: new Date(Date.now() - 2 * 60 * 1000),
    route: 'Route A - Main Haul Road',
    load: 'Coal - 50 tons'
  },
  {
    id: 'BRN-002',
    driver: 'Budi Santoso',
    position: [115.560000, -3.550000],
    status: 'idle',
    speed: 0,
    heading: 90,
    fuel: 72,
    battery: 88,
    signal: 'good',
    lastUpdate: new Date(Date.now() - 5 * 60 * 1000),
    route: 'Route B - Loading Area',
    load: 'Empty'
  },
  {
    id: 'BRN-003',
    driver: 'Candra Wijaya',
    position: [115.590000, -3.580000],
    status: 'maintenance',
    speed: 0,
    heading: 0,
    fuel: 45,
    battery: 65,
    signal: 'weak',
    lastUpdate: new Date(Date.now() - 30 * 60 * 1000),
    route: 'Workshop Area',
    load: 'Under Maintenance'
  },
  {
    id: 'BRN-004',
    driver: 'Dedi Kurniawan',
    position: [115.570000, -3.530000],
    status: 'active',
    speed: 32,
    heading: 270,
    fuel: 91,
    battery: 92,
    signal: 'strong',
    lastUpdate: new Date(Date.now() - 1 * 60 * 1000),
    route: 'Route C - Dump Area',
    load: 'Coal - 45 tons'
  }
];

const LeafletMap = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [mapStyle, setMapStyle] = useState('osm');
  const [showLegend, setShowLegend] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // WebSocket integration
  const { 
    vehicles: liveVehicles, 
    connectionStatus, 
    isDemoMode, 
    isConnected,
    alerts 
  } = useWebSocket();

  useEffect(() => {
    let markers = [];
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

          // Add initial tile layer (OpenStreetMap)
          const osmLayer = L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          });
          
          const satelliteLayer = L.default.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
          });
          
          // Add default layer
          osmLayer.addTo(mapInstance);
          
          // Store layers for switching
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
              }
            }).addTo(mapInstance);
          }

          // Add vehicle markers with real-time updates
          const addVehicleMarkers = (vehicleData) => {
            // Clear existing markers
            markers.forEach(marker => mapInstance.removeLayer(marker));
            markers = [];

            vehicleData.forEach(vehicle => {
              const colors = {
                active: '#10b981',
                warning: '#f59e0b', 
                maintenance: '#ef4444',
                offline: '#6b7280'
              };

              const icon = L.default.divIcon({
                html: `
                  <div style="
                    background: ${colors[vehicle.status] || colors.offline};
                    border: 3px solid white;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                  ">
                    <svg width="12" height="12" fill="white" viewBox="0 0 24 24">
                      <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                    </svg>
                  </div>
                `,
                className: 'custom-div-icon',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              });

              const marker = L.default.marker([vehicle.lat, vehicle.lng], { icon })
                .addTo(mapInstance)
                .bindPopup(`
                  <div class="p-3 min-w-[200px]">
                    <h3 class="font-bold text-lg mb-2">${vehicle.id}</h3>
                    <div class="space-y-1 text-sm">
                      <p><strong>Driver:</strong> ${vehicle.driver}</p>
                      <p><strong>Status:</strong> <span class="capitalize">${vehicle.status}</span></p>
                      <p><strong>Speed:</strong> ${vehicle.speed} km/h</p>
                      <p><strong>Fuel:</strong> ${vehicle.fuel}%</p>
                      <p><strong>Load:</strong> ${vehicle.load}</p>
                      <p><strong>Route:</strong> ${vehicle.route}</p>
                      <p><strong>Last Update:</strong> ${vehicle.lastUpdate.toLocaleTimeString()}</p>
                    </div>
                  </div>
                `);

              markers.push(marker);
            });
          };

          // Initial load with static data
          addVehicleMarkers(vehicleData);
          setLoading(false);
          setMap(mapInstance);
        } catch (error) {
          console.error('Error initializing map:', error);
          setError('Failed to initialize map');
          setLoading(false);
        }
      }
    };

    initializeMap();
  }, []);

  // Update markers when live data changes
  useEffect(() => {
    if (map && liveVehicles.length > 0) {
      const colors = {
        active: '#10b981',
        warning: '#f59e0b', 
        maintenance: '#ef4444',
        offline: '#6b7280'
      };

      // Clear existing markers
      map.eachLayer((layer) => {
        if (layer.options && layer.options.isVehicleMarker) {
          map.removeLayer(layer);
        }
      });

      liveVehicles.forEach(vehicle => {
        const L = window.L;
        const icon = L.divIcon({
          html: `
            <div style="
              background: ${colors[vehicle.status] || colors.offline};
              border: 3px solid white;
              border-radius: 50%;
              width: 24px;
              height: 24px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            ">
              <svg width="12" height="12" fill="white" viewBox="0 0 24 24">
                <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
              </svg>
            </div>
          `,
          className: 'custom-div-icon',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = L.marker([vehicle.lat, vehicle.lng], { 
          icon,
          isVehicleMarker: true
        })
          .addTo(map)
          .bindPopup(`
            <div class="p-3 min-w-[200px]">
              <h3 class="font-bold text-lg mb-2">${vehicle.id}</h3>
              <div class="space-y-1 text-sm">
                <p><strong>Driver:</strong> ${vehicle.driver}</p>
                <p><strong>Status:</strong> <span class="capitalize">${vehicle.status}</span></p>
                <p><strong>Speed:</strong> ${vehicle.speed} km/h</p>
                <p><strong>Fuel:</strong> ${vehicle.fuel}%</p>
                <p><strong>Load:</strong> ${vehicle.load || 'N/A'}</p>
                <p><strong>Route:</strong> ${vehicle.route || 'N/A'}</p>
                <p><strong>Last Update:</strong> ${new Date(vehicle.lastUpdate).toLocaleTimeString()}</p>
              </div>
            </div>
          `);
      });
    }
  }, [map, liveVehicles]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setVehicles(prevVehicles => 
        prevVehicles.map(vehicle => ({
          ...vehicle,
          lastUpdate: vehicle.status === 'active' ? new Date() : vehicle.lastUpdate,
          position: vehicle.status === 'active' ? [
            vehicle.position[0] + (Math.random() - 0.5) * 0.001,
            vehicle.position[1] + (Math.random() - 0.5) * 0.001
          ] : vehicle.position,
          speed: vehicle.status === 'active' ? 
            Math.max(0, vehicle.speed + (Math.random() - 0.5) * 10) : 0
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'idle': return 'text-yellow-600 bg-yellow-100';
      case 'maintenance': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSignalBars = (signal) => {
    const strength = signal === 'strong' ? 3 : signal === 'good' ? 2 : 1;
    return (
      <div className="flex items-end space-x-0.5">
        {[1, 2, 3].map(bar => (
          <div
            key={bar}
            className={`w-1 ${bar <= strength ? 'bg-green-500' : 'bg-gray-300'} rounded-sm`}
            style={{ height: `${bar * 3 + 3}px` }}
          />
        ))}
      </div>
    );
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
      // Center on PT Borneo Indobara geofence area
      map.setView([-3.580000, 115.600000], 13);
    }
  };

  // Loading and error states
  if (loading) {
    return (
      <div className="relative h-full w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative h-full w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <ExclamationTriangleIcon className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-red-600 mb-2">Failed to load map</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Connection Status */}
      <div className="absolute top-4 left-4 z-[1000]">
        <div className={`px-3 py-2 rounded-lg text-xs font-medium ${
          connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
          connectionStatus === 'demo' ? 'bg-orange-100 text-orange-800' :
          'bg-red-100 text-red-800'
        }`}>
          {connectionStatus === 'connected' && ' Live Data'}
          {connectionStatus === 'demo' && ' Demo Mode'}
          {connectionStatus === 'disconnected' && ' Offline'}
          {connectionStatus === 'error' && ' Connection Error'}
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapRef} className="h-full w-full" />
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[1000] space-y-2">
        {/* Style Switcher */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-2">
          <div className="flex space-x-1">
            <button
              onClick={() => switchMapStyle('osm')}
              className={`px-3 py-1 text-xs rounded ${
                mapStyle === 'osm'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Street
            </button>
            <button
              onClick={() => switchMapStyle('satellite')}
              className={`px-3 py-1 text-xs rounded ${
                mapStyle === 'satellite'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Satellite
            </button>
          </div>
        </div>

        {/* Show legend toggle when hidden */}
        {!showLegend && (
          <div className="absolute bottom-4 right-4 z-[1000]">
            <button
              onClick={() => setShowLegend(true)}
              className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-2 text-gray-600 hover:text-gray-800"
            >
              <MapPinIcon className="w-5 h-5" />
            </button>
          </div>
        )}
        <button
          onClick={() => setLegendVisible(!legendVisible)}
          className={`absolute top-20 right-4 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg px-2 py-1 shadow-lg transition-opacity duration-300 ${
            legendVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          style={{ zIndex: 1000 }}
        >
          <svg
            className="w-4 h-4 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>


        {/* Auto Correct Location Button */}
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
      </div>
    </div>
  );
};

export default LeafletMap;
