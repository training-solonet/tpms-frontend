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
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Sample vehicle data with realistic coordinates within the geofence
const sampleVehicles = [
  {
    id: 'BRN-001',
    driver: 'Ahmad Suryadi',
    lat: -3.520000,
    lng: 115.580000,
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
    lat: -3.550000,
    lng: 115.560000,
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
    lat: -3.580000,
    lng: 115.590000,
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
    lat: -3.530000,
    lng: 115.570000,
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
  const [markers, setMarkers] = useState([]);
  const [vehicles, setVehicles] = useState(sampleVehicles);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [mapStyle, setMapStyle] = useState('osm');
  const [legendVisible, setLegendVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  
  // WebSocket integration
  const { 
    vehicles: liveVehicles, 
    connectionStatus
  } = useWebSocket() || { vehicles: [], connectionStatus: 'demo' };

  // Use live vehicles if available, otherwise use sample data
  const vehicleData = liveVehicles.length > 0 ? liveVehicles : vehicles;

  useEffect(() => {
    const initializeMap = () => {
      if (mapRef.current && !map) {
        console.log('Starting map initialization...');
        
        try {
          
          // Initialize map centered on PT Borneo Indobara geofence area
          const mapInstance = L.map(mapRef.current, {
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
          console.log('Map instance created');

          // Prevent map from interfering with page scroll
          mapInstance.getContainer().style.outline = 'none';

          // Add initial tile layer (OpenStreetMap)
          const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          });
          
          const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
          });
          
          // Add default layer
          osmLayer.addTo(mapInstance);
          console.log('OSM layer added');
          
          // Store layers for switching
          mapInstance.osmLayer = osmLayer;
          mapInstance.satelliteLayer = satelliteLayer;

          // Add geofence
          if (BORNEO_INDOBARA_GEOJSON && BORNEO_INDOBARA_GEOJSON.features) {
            L.geoJSON(BORNEO_INDOBARA_GEOJSON, {
              style: {
                color: '#3b82f6',
                weight: 3,
                opacity: 0.8,
                fillColor: '#3b82f6',
                fillOpacity: 0.1
              }
            }).addTo(mapInstance);
            console.log('Geofence added');
          }

          console.log('Map initialization complete');
          setMap(mapInstance);
          setMapReady(true);
        } catch (error) {
          console.error('Error initializing map:', error);
          // Don't set error immediately, try again
          setTimeout(() => {
            if (!map) {
              setError('Map initialization failed. Showing vehicle list instead.');
            }
          }, 1000);
        }
      }
    };

    // Initialize immediately if DOM is ready
    if (mapRef.current) {
      initializeMap();
    } else {
      // Small delay if DOM not ready
      const initTimeout = setTimeout(() => {
        initializeMap();
      }, 100);
      
      return () => clearTimeout(initTimeout);
    }
  }, []);

  // Update markers when vehicle data changes
  useEffect(() => {
    if (map && vehicleData.length > 0) {
      const colors = {
        active: '#10b981',
        idle: '#f59e0b', 
        maintenance: '#ef4444',
        offline: '#6b7280'
      };

      // Clear existing markers
      markers.forEach(marker => {
        try {
          map.removeLayer(marker);
        } catch (err) {
          console.warn('Error removing marker:', err);
        }
      });

      const newMarkers = [];

      vehicleData.forEach(vehicle => {
        try {
          // Ensure we have valid coordinates
          const lat = vehicle.lat || vehicle.position?.[1] || -3.550000;
          const lng = vehicle.lng || vehicle.position?.[0] || 115.580000;

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

          const marker = L.marker([lat, lng], { 
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

          newMarkers.push(marker);
        } catch (err) {
          console.warn('Error creating marker for vehicle:', vehicle.id, err);
        }
      });

      setMarkers(newMarkers);
    }
  }, [map, vehicleData]);

  // Simulate real-time updates for sample data
  useEffect(() => {
    if (liveVehicles.length === 0) {
      const interval = setInterval(() => {
        setVehicles(prevVehicles => 
          prevVehicles.map(vehicle => ({
            ...vehicle,
            lastUpdate: vehicle.status === 'active' ? new Date() : vehicle.lastUpdate,
            lat: vehicle.status === 'active' ? 
              vehicle.lat + (Math.random() - 0.5) * 0.001 : vehicle.lat,
            lng: vehicle.status === 'active' ? 
              vehicle.lng + (Math.random() - 0.5) * 0.001 : vehicle.lng,
            speed: vehicle.status === 'active' ? 
              Math.max(0, vehicle.speed + (Math.random() - 0.5) * 10) : 0
          }))
        );
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [liveVehicles.length]);

  const switchMapStyle = (style) => {
    if (!map) return;
    
    setMapStyle(style);
    
    // Remove current layers
    if (map.osmLayer && map.hasLayer(map.osmLayer)) {
      map.removeLayer(map.osmLayer);
    }
    if (map.satelliteLayer && map.hasLayer(map.satelliteLayer)) {
      map.removeLayer(map.satelliteLayer);
    }
    
    // Add selected layer
    if (style === 'satellite') {
      map.satelliteLayer.addTo(map);
    } else {
      map.osmLayer.addTo(map);
    }
  };

  const focusOnVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    if (map) {
      const lat = vehicle.lat || vehicle.position?.[1] || -3.550000;
      const lng = vehicle.lng || vehicle.position?.[0] || 115.580000;
      map.setView([lat, lng], 15);
    }
  };

  const resetMapView = () => {
    setSelectedVehicle(null);
    if (map) {
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
      <div className="relative h-full w-full bg-gradient-to-br from-slate-50 to-indigo-50 p-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Vehicle Status - List View</h2>
            <div className={`px-3 py-2 rounded-lg text-xs font-medium ${
              connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
              connectionStatus === 'demo' ? 'bg-orange-100 text-orange-800' :
              'bg-red-100 text-red-800'
            }`}>
              {connectionStatus === 'connected' && '🟢 Live Data'}
              {connectionStatus === 'demo' && '🟠 Demo Mode'}
              {connectionStatus === 'disconnected' && '🔴 Offline'}
              {connectionStatus === 'error' && '❌ Connection Error'}
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {vehicleData.map(vehicle => (
              <div key={vehicle.id} className="bg-white/60 backdrop-blur-sm rounded-lg p-4 shadow-md border border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg">{vehicle.id}</h3>
                  <div className={`w-3 h-3 rounded-full ${
                    vehicle.status === 'active' ? 'bg-green-500' :
                    vehicle.status === 'idle' ? 'bg-yellow-500' :
                    vehicle.status === 'maintenance' ? 'bg-red-500' :
                    'bg-gray-500'
                  }`}></div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Driver:</span>
                    <span className="font-medium">{vehicle.driver}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`capitalize font-medium ${
                      vehicle.status === 'active' ? 'text-green-600' :
                      vehicle.status === 'idle' ? 'text-yellow-600' :
                      vehicle.status === 'maintenance' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>{vehicle.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Speed:</span>
                    <span className="font-medium">{vehicle.speed} km/h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fuel:</span>
                    <span className="font-medium">{vehicle.fuel}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Load:</span>
                    <span className="font-medium text-xs">{vehicle.load || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Route:</span>
                    <span className="font-medium text-xs">{vehicle.route || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Update:</span>
                    <span className="font-medium text-xs">{new Date(vehicle.lastUpdate).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Map view is currently unavailable. Showing vehicle data in list format.
            </p>
          </div>
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
          {connectionStatus === 'connected' && '🟢 Live Data'}
          {connectionStatus === 'demo' && '🟠 Demo Mode'}
          {connectionStatus === 'disconnected' && '🔴 Offline'}
          {connectionStatus === 'error' && '❌ Connection Error'}
        </div>
      </div>

      {/* Vehicle List Panel - Optional, uncomment if needed */}
      {selectedVehicle && (
        <div className="absolute top-16 left-4 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 max-w-xs">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Vehicle Details</h4>
          <div className="space-y-1 text-xs">
            <div><strong>ID:</strong> {selectedVehicle.id}</div>
            <div><strong>Driver:</strong> {selectedVehicle.driver}</div>
            <div><strong>Status:</strong> {selectedVehicle.status}</div>
            <div><strong>Speed:</strong> {selectedVehicle.speed} km/h</div>
            <div><strong>Fuel:</strong> {selectedVehicle.fuel}%</div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="h-full w-full" 
        style={{ minHeight: '400px', position: 'relative' }}
      />
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[1000] space-y-2">
        {/* Style Switcher */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-2">
          <div className="flex space-x-1">
            <button
              onClick={() => switchMapStyle('osm')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                mapStyle === 'osm'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Street
            </button>
            <button
              onClick={() => switchMapStyle('satellite')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                mapStyle === 'satellite'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Satellite
            </button>
          </div>
        </div>

        {/* Legend Toggle */}
        {!legendVisible && (
          <button
            onClick={() => setLegendVisible(true)}
            className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <MapPinIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Auto Center Button */}
      <button
        onClick={resetMapView}
        className="absolute bottom-4 right-4 z-[1000] bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 shadow-lg transition-colors duration-200 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-sm font-medium">Auto Center</span>
      </button>

      {/* Vehicle Legend */}
      {legendVisible && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 max-w-xs">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900">Vehicle Status</h4>
            <button
              onClick={() => setLegendVisible(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-700">Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-xs text-gray-700">Idle</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-xs text-gray-700">Maintenance</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span className="text-xs text-gray-700">Offline</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeafletMap;