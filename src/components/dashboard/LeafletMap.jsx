import React, { useEffect, useRef, useState } from 'react';
import {
  TruckIcon,
  MapPinIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';
import 'leaflet/dist/leaflet.css';
import BORNEO_INDOBARA_GEOJSON from '../../data/geofance.js';

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
  const [vehicles, setVehicles] = useState(sampleVehicles);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [legendVisible, setLegendVisible] = useState(true);
  const [mapStyle, setMapStyle] = useState('osm'); // 'osm' or 'satellite'

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
                fillOpacity: 0.1,
                dashArray: '10, 10'
              }
            }).addTo(mapInstance);
          }

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
              className: 'custom-truck-icon',
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            });

            const marker = L.default.marker(vehicle.position, { icon }).addTo(mapInstance);
            markers.push(marker);
            
            marker.bindPopup(`
              <div class="p-3 min-w-64">
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
                  <div><strong>Signal:</strong> ${vehicle.signal}</div>
                </div>
              </div>
            `);

            marker.on('click', () => {
              setSelectedVehicle(vehicle);
            });
          });

          setMap(mapInstance);
        } catch (error) {
          console.error('Error initializing map:', error);
        }
      }
    };

    initializeMap();

    return () => {
      // Remove all markers
      markers.forEach(marker => {
        marker.remove();
      });
      if (map) {
        map.remove();
      }
    };
  }, []);

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

  return (
    <div className="h-full flex">
      {/* Toggle Button */}
      <button
        onClick={() => setSidebarVisible(!sidebarVisible)}
        className={`fixed top-1/2 -translate-y-1/2 z-50 bg-white hover:bg-gray-50 border border-gray-300 rounded-r-lg px-2 py-3 shadow-lg transition-all duration-300 ${
          sidebarVisible ? 'left-[608px]' : 'left-72'
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
            <h4 className="text-lg font-semibold text-gray-900">Vehicle List</h4>
            <button
              onClick={resetMapView}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Reset View
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
            </div>
          )}
        </div>
        
        {/* Vehicle List */}
        <div className="flex-1 p-3 space-y-2 overflow-y-auto">
          {vehicles.map((vehicle) => (
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
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                  {vehicle.status}
                </span>
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
          ))}
        </div>
      </div>

      {/* Map Area - Full Screen */}
      <div className="flex-1 relative">
        <div 
          ref={mapRef}
          className="absolute inset-0 w-full h-full"
          style={{ cursor: 'grab' }}
        />
        
        {/* Map Style Switcher - Top Center */}
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
