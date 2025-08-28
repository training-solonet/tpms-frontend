import React, { useState } from 'react';
import {
  TruckIcon,
  MapPinIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';

// Simple vehicle tracking without Leaflet for now
const sampleVehicles = [
  {
    id: 'BRN-001',
    driver: 'Ahmad Suryadi',
    status: 'active',
    speed: 45,
    fuel: 85,
    signal: 'strong',
    lastUpdate: '2 min ago',
    route: 'Route A - Main Haul Road',
    load: 'Coal - 50 tons',
    position: { x: 25, y: 30 }
  },
  {
    id: 'BRN-002',
    driver: 'Budi Santoso',
    status: 'idle',
    speed: 0,
    fuel: 72,
    signal: 'good',
    lastUpdate: '5 min ago',
    route: 'Route B - Loading Area',
    load: 'Empty',
    position: { x: 60, y: 45 }
  },
  {
    id: 'BRN-003',
    driver: 'Candra Wijaya',
    status: 'maintenance',
    speed: 0,
    fuel: 45,
    signal: 'weak',
    lastUpdate: '30 min ago',
    route: 'Workshop Area',
    load: 'Under Maintenance',
    position: { x: 40, y: 70 }
  },
  {
    id: 'BRN-004',
    driver: 'Dedi Kurniawan',
    status: 'active',
    speed: 32,
    fuel: 91,
    signal: 'strong',
    lastUpdate: '1 min ago',
    route: 'Route C - Dump Area',
    load: 'Coal - 45 tons',
    position: { x: 75, y: 25 }
  }
];

const SimpleMap = () => {
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'idle': return 'text-yellow-600 bg-yellow-100';
      case 'maintenance': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'idle': return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'maintenance': return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      default: return <ClockIcon className="w-5 h-5 text-gray-500" />;
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

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      {/* Vehicle List Panel */}
      <div className="lg:w-80 flex-shrink-0">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-full">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Live Fleet Status</h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-500">Live</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  {sampleVehicles.filter(v => v.status === 'active').length}
                </div>
                <div className="text-sm text-green-700 font-medium">Active</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-600">
                  {sampleVehicles.filter(v => v.status === 'idle').length}
                </div>
                <div className="text-sm text-yellow-700 font-medium">Idle</div>
              </div>
            </div>
          </div>
          
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {sampleVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedVehicle?.id === vehicle.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                onClick={() => setSelectedVehicle(selectedVehicle?.id === vehicle.id ? null : vehicle)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-sm font-bold text-white">
                        {vehicle.id.split('-')[1]}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{vehicle.id}</div>
                      <div className="text-xs text-gray-500">{vehicle.driver}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(vehicle.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                      {vehicle.status}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Speed:</span>
                    <span className="text-gray-900 font-semibold">{vehicle.speed} km/h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Fuel:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${vehicle.fuel > 30 ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${vehicle.fuel}%` }}
                        />
                      </div>
                      <span className="text-gray-900 font-semibold">{vehicle.fuel}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Signal:</span>
                    <div className="flex items-center space-x-2">
                      {getSignalBars(vehicle.signal)}
                      <span className="text-gray-900 font-semibold capitalize">{vehicle.signal}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Updated:</span>
                    <span className="text-gray-900 font-semibold">{vehicle.lastUpdate}</span>
                  </div>
                </div>

                {selectedVehicle?.id === vehicle.id && (
                  <div className="mt-4 pt-3 border-t border-gray-200 space-y-2 text-xs">
                    <div><span className="font-medium text-gray-600">Route:</span> <span className="text-gray-900">{vehicle.route}</span></div>
                    <div><span className="font-medium text-gray-600">Load:</span> <span className="text-gray-900">{vehicle.load}</span></div>
                  </div>
                )}
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
                  <h3 className="text-lg font-semibold text-white">Mining Area Overview</h3>
                  <p className="text-blue-100 text-sm">PT Borneo Indobara</p>
                </div>
              </div>
              {selectedVehicle && (
                <div className="bg-white/20 rounded-lg px-3 py-2">
                  <div className="text-white text-sm font-medium">
                    Tracking: {selectedVehicle.id}
                  </div>
                  <div className="text-blue-100 text-xs">
                    {selectedVehicle.driver}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="h-full relative bg-gradient-to-br from-green-100 to-blue-100" style={{ height: 'calc(100% - 80px)' }}>
            {/* Simple Map Representation */}
            <div className="absolute inset-4 bg-green-200 rounded-lg border-2 border-green-300 relative overflow-hidden">
              {/* Mining area background pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-4 left-4 w-16 h-16 bg-brown-400 rounded-lg"></div>
                <div className="absolute top-4 right-4 w-20 h-12 bg-gray-400 rounded-lg"></div>
                <div className="absolute bottom-4 left-4 w-12 h-20 bg-blue-400 rounded-lg"></div>
                <div className="absolute bottom-4 right-4 w-24 h-16 bg-yellow-400 rounded-lg"></div>
              </div>
              
              {/* Area Labels */}
              <div className="absolute top-6 left-6 text-xs font-semibold text-green-800 bg-white/80 px-2 py-1 rounded">
                Loading Zone
              </div>
              <div className="absolute top-6 right-6 text-xs font-semibold text-gray-800 bg-white/80 px-2 py-1 rounded">
                Workshop
              </div>
              <div className="absolute bottom-6 left-6 text-xs font-semibold text-blue-800 bg-white/80 px-2 py-1 rounded">
                Water Station
              </div>
              <div className="absolute bottom-6 right-6 text-xs font-semibold text-yellow-800 bg-white/80 px-2 py-1 rounded">
                Dump Area
              </div>

              {/* Vehicle Markers */}
              {sampleVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
                    selectedVehicle?.id === vehicle.id ? 'scale-125 z-10' : 'hover:scale-110'
                  }`}
                  style={{
                    left: `${vehicle.position.x}%`,
                    top: `${vehicle.position.y}%`
                  }}
                  onClick={() => setSelectedVehicle(selectedVehicle?.id === vehicle.id ? null : vehicle)}
                >
                  <div className={`w-8 h-8 rounded-full border-3 border-white shadow-lg flex items-center justify-center ${
                    vehicle.status === 'active' ? 'bg-green-500' :
                    vehicle.status === 'idle' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}>
                    <TruckIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow-md text-xs font-semibold whitespace-nowrap">
                    {vehicle.id}
                  </div>
                  
                  {selectedVehicle?.id === vehicle.id && (
                    <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-3 min-w-48 z-20 border border-gray-200">
                      <div className="text-sm font-semibold text-gray-900 mb-2">{vehicle.id}</div>
                      <div className="space-y-1 text-xs text-gray-600">
                        <div><strong>Driver:</strong> {vehicle.driver}</div>
                        <div><strong>Status:</strong> <span className={`font-semibold ${
                          vehicle.status === 'active' ? 'text-green-600' :
                          vehicle.status === 'idle' ? 'text-yellow-600' : 'text-red-600'
                        }`}>{vehicle.status}</span></div>
                        <div><strong>Speed:</strong> {vehicle.speed} km/h</div>
                        <div><strong>Route:</strong> {vehicle.route}</div>
                        <div><strong>Load:</strong> {vehicle.load}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Geofence boundary */}
              <div className="absolute inset-2 border-2 border-dashed border-blue-500 rounded-lg opacity-60"></div>
              <div className="absolute top-2 left-2 text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                PT Borneo Indobara Mining Area
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleMap;
