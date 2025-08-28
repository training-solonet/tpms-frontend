import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  TruckIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  SignalIcon,
  BatteryIcon,
} from '@heroicons/react/24/outline';
import BORNEO_INDOBARA_GEOJSON from '../../data/geofance.js';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom truck icon
const createTruckIcon = (status, rotation = 0) => {
  const colors = {
    active: '#10b981',
    idle: '#f59e0b',
    maintenance: '#ef4444',
    offline: '#6b7280'
  };
  
  return L.divIcon({
    html: `
      <div style="transform: rotate(${rotation}deg); display: flex; align-items: center; justify-content: center;">
        <div style="
          background: ${colors[status] || colors.offline};
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
      </div>
    `,
    className: 'custom-truck-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

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

const MapController = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center && zoom) {
      map.setView(center, zoom);
    }
  }, [map, center, zoom]);
  
  return null;
};

const LiveTrackingMap = () => {
  const [vehicles, setVehicles] = useState(sampleVehicles);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [mapCenter, setMapCenter] = useState([115.580000, -3.550000]);
  const [mapZoom, setMapZoom] = useState(12);
  const mapRef = useRef();

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setVehicles(prevVehicles => 
        prevVehicles.map(vehicle => ({
          ...vehicle,
          lastUpdate: vehicle.status === 'active' ? new Date() : vehicle.lastUpdate,
          // Simulate small position changes for active vehicles
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
      case 'offline': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSignalIcon = (signal) => {
    const strength = signal === 'strong' ? 3 : signal === 'good' ? 2 : 1;
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3].map(bar => (
          <div
            key={bar}
            className={`w-1 ${bar <= strength ? 'bg-green-500' : 'bg-gray-300'}`}
            style={{ height: `${bar * 4 + 4}px` }}
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

  const geofenceStyle = {
    color: '#3b82f6',
    weight: 3,
    opacity: 0.8,
    fillColor: '#3b82f6',
    fillOpacity: 0.1,
    dashArray: '10, 10'
  };

  const focusOnVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setMapCenter(vehicle.position);
    setMapZoom(15);
  };

  const resetMapView = () => {
    setSelectedVehicle(null);
    setMapCenter([115.580000, -3.550000]);
    setMapZoom(12);
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      {/* Vehicle List Panel */}
      <div className="lg:w-80 flex-shrink-0">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-full">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Live Fleet Status</h3>
              <button
                onClick={resetMapView}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Reset View
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {vehicles.filter(v => v.status === 'active').length}
                </div>
                <div className="text-sm text-green-700">Active</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {vehicles.filter(v => v.status === 'idle').length}
                </div>
                <div className="text-sm text-yellow-700">Idle</div>
              </div>
            </div>
          </div>
          
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedVehicle?.id === vehicle.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                onClick={() => focusOnVehicle(vehicle)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {vehicle.id.split('-')[1]}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{vehicle.id}</div>
                      <div className="text-xs text-gray-500">{vehicle.driver}</div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                    {vehicle.status}
                  </span>
                </div>
                
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Speed:</span>
                    <span className="font-medium">{vehicle.speed} km/h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Fuel:</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${vehicle.fuel > 30 ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${vehicle.fuel}%` }}
                        />
                      </div>
                      <span className="font-medium">{vehicle.fuel}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Signal:</span>
                    <div className="flex items-center space-x-1">
                      {getSignalIcon(vehicle.signal)}
                      <span className="font-medium capitalize">{vehicle.signal}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Updated:</span>
                    <span className="font-medium">{formatLastUpdate(vehicle.lastUpdate)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map Panel */}
      <div className="flex-1 min-h-0">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-full overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <MapPinIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Live Tracking Map</h3>
                  <p className="text-blue-100 text-sm">PT Borneo Indobara Mining Area</p>
                </div>
              </div>
              {selectedVehicle && (
                <div className="bg-white/20 rounded-lg px-3 py-2">
                  <div className="text-white text-sm font-medium">
                    Tracking: {selectedVehicle.id}
                  </div>
                  <div className="text-blue-100 text-xs">
                    {selectedVehicle.route}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="h-full relative" style={{ height: 'calc(100% - 80px)' }}>
            <MapContainer
              ref={mapRef}
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%' }}
              className="rounded-b-xl"
            >
              <MapController center={mapCenter} zoom={mapZoom} />
              
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {/* Geofence */}
              <GeoJSON
                data={BORNEO_INDOBARA_GEOJSON}
                style={geofenceStyle}
              />
              
              {/* Vehicle Markers */}
              {vehicles.map((vehicle) => (
                <Marker
                  key={vehicle.id}
                  position={vehicle.position}
                  icon={createTruckIcon(vehicle.status, vehicle.heading)}
                  eventHandlers={{
                    click: () => setSelectedVehicle(vehicle),
                  }}
                >
                  <Popup className="custom-popup">
                    <div className="p-2 min-w-64">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-gray-900">{vehicle.id}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                          {vehicle.status}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div><strong>Driver:</strong> {vehicle.driver}</div>
                        <div><strong>Route:</strong> {vehicle.route}</div>
                        <div><strong>Load:</strong> {vehicle.load}</div>
                        <div><strong>Speed:</strong> {vehicle.speed} km/h</div>
                        <div className="flex items-center justify-between">
                          <span><strong>Fuel:</strong></span>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${vehicle.fuel > 30 ? 'bg-green-500' : 'bg-red-500'}`}
                                style={{ width: `${vehicle.fuel}%` }}
                              />
                            </div>
                            <span>{vehicle.fuel}%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span><strong>Signal:</strong></span>
                          <div className="flex items-center space-x-1">
                            {getSignalIcon(vehicle.signal)}
                            <span className="capitalize">{vehicle.signal}</span>
                          </div>
                        </div>
                        <div><strong>Last Update:</strong> {formatLastUpdate(vehicle.lastUpdate)}</div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTrackingMap;
