import React, { useState } from 'react';
import { 
  CpuChipIcon, 
  ChartBarIcon, 
  ExclamationTriangleIcon,
  FireIcon,
  BoltIcon,
  ClockIcon,
  TruckIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { trucks, getTirePressureData, getHubTemperatureData, tirePressureEvents, hubTemperatureEvents, devices, sensors, getDevicesByTruck } from '../data/index.js';
import TailwindLayout from '../components/layout/TailwindLayout.jsx';

const TelemetryDashboard = () => {
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [activeTab, setActiveTab] = useState('overview');

  // Get telemetry summary for all trucks
  const getTelemetrySummary = () => {
    const now = new Date();
    const cutoff = new Date(now.getTime() - (24 * 60 * 60 * 1000)); // 24 hours ago

    const recentTireEvents = tirePressureEvents.filter(event => 
      new Date(event.reported_at) > cutoff
    );
    
    const recentTempEvents = hubTemperatureEvents.filter(event => 
      new Date(event.reported_at) > cutoff
    );

    // Count alerts
    const pressureAlerts = recentTireEvents.filter(event => 
      event.exception_type && event.exception_type !== 'normal'
    ).length;

    const tempAlerts = recentTempEvents.filter(event => 
      event.temperature > 80 // High temperature threshold
    ).length;

    return {
      totalTireEvents: recentTireEvents.length,
      totalTempEvents: recentTempEvents.length,
      pressureAlerts,
      tempAlerts,
      activeTrucks: [...new Set([...recentTireEvents.map(e => e.truck_id), ...recentTempEvents.map(e => e.device_id)])].length
    };
  };

  const summary = getTelemetrySummary();

  // Get truck telemetry data
  const getTruckTelemetry = (truckId) => {
    const truckDevices = getDevicesByTruck(truckId);
    const deviceIds = truckDevices.map(d => d.id);
    
    const tirePressure = getTirePressureData(truckId, timeRange);
    const hubTemp = deviceIds.flatMap(deviceId => getHubTemperatureData(deviceId, timeRange));
    
    // Get latest readings
    const latestPressure = tirePressure.sort((a, b) => new Date(b.reported_at) - new Date(a.reported_at))[0];
    const latestTemp = hubTemp.sort((a, b) => new Date(b.reported_at) - new Date(a.reported_at))[0];
    
    // Count recent alerts
    const now = new Date();
    const last24h = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    
    const recentPressureAlerts = tirePressure.filter(event => 
      new Date(event.reported_at) > last24h && event.exception_type && event.exception_type !== 'normal'
    ).length;
    
    const recentTempAlerts = hubTemp.filter(event => 
      new Date(event.reported_at) > last24h && event.temperature > 80
    ).length;

    return {
      tirePressure,
      hubTemp,
      latestPressure,
      latestTemp,
      recentPressureAlerts,
      recentTempAlerts,
      devices: truckDevices
    };
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAlertColor = (exceptionType) => {
    switch (exceptionType) {
      case 'low_pressure': return 'red';
      case 'high_pressure': return 'orange';
      case 'rapid_leak': return 'red';
      case 'sensor_fault': return 'gray';
      default: return 'green';
    }
  };

  const getTemperatureColor = (temp) => {
    if (temp > 90) return 'red';
    if (temp > 80) return 'orange';
    if (temp > 70) return 'yellow';
    return 'green';
  };

  return (
    <TailwindLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Telemetry Dashboard</h1>
                <p className="text-gray-600 mt-2">Real-time sensor data and alerts</p>
              </div>
              <div className="flex gap-2">
                <select 
                  value={timeRange} 
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-lg">
                  <ArrowPathIcon className="h-5 w-5" />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <TruckIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Active Trucks</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.activeTrucks}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-xl">
                  <BoltIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Tire Events</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalTireEvents}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center">
                <div className="bg-red-100 p-3 rounded-xl">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Pressure Alerts</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.pressureAlerts}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-xl">
                  <FireIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Temp Alerts</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.tempAlerts}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trucks Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {trucks.map((truck) => {
            const telemetry = getTruckTelemetry(truck.id);
            const hasAlerts = telemetry.recentPressureAlerts > 0 || telemetry.recentTempAlerts > 0;
            
            return (
              <div
                key={truck.id}
                className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 cursor-pointer ${
                  hasAlerts ? 'ring-2 ring-red-200' : ''
                }`}
                onClick={() => setSelectedTruck(truck)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`${hasAlerts ? 'bg-red-100' : 'bg-blue-100'} p-3 rounded-xl`}>
                      <TruckIcon className={`h-6 w-6 ${hasAlerts ? 'text-red-600' : 'text-blue-600'}`} />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">{truck.name}</h3>
                      <p className="text-sm text-gray-600">{truck.plate_number}</p>
                    </div>
                  </div>
                  {hasAlerts && (
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{telemetry.devices.length}</div>
                    <div className="text-xs text-gray-500">Devices</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-bold ${hasAlerts ? 'text-red-600' : 'text-green-600'}`}>
                      {telemetry.recentPressureAlerts + telemetry.recentTempAlerts}
                    </div>
                    <div className="text-xs text-gray-500">Alerts</div>
                  </div>
                </div>

                {/* Latest Readings */}
                <div className="space-y-2 text-sm">
                  {telemetry.latestPressure && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Pressure:</span>
                      <span className={`font-medium text-${getAlertColor(telemetry.latestPressure.exception_type)}-600`}>
                        {telemetry.latestPressure.pressure} PSI
                      </span>
                    </div>
                  )}
                  {telemetry.latestTemp && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Temp:</span>
                      <span className={`font-medium text-${getTemperatureColor(telemetry.latestTemp.temperature)}-600`}>
                        {telemetry.latestTemp.temperature}°C
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
            })}
          </div>

          {/* Truck Detail Modal */}
          {selectedTruck && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedTruck.name}</h2>
                      <p className="text-gray-600">{selectedTruck.plate_number}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <div className="flex bg-white rounded-xl border border-gray-300 p-1">
                        <button
                          onClick={() => setActiveTab('overview')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            activeTab === 'overview' 
                              ? 'bg-indigo-600 text-white shadow-sm' 
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Overview
                        </button>
                        <button
                          onClick={() => setActiveTab('pressure')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            activeTab === 'pressure' 
                              ? 'bg-indigo-600 text-white shadow-sm' 
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Tire Pressure
                        </button>
                        <button
                          onClick={() => setActiveTab('temperature')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            activeTab === 'temperature' 
                              ? 'bg-indigo-600 text-white shadow-sm' 
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Temperature
                        </button>
                      </div>
                      <button 
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl transition-colors"
                        onClick={() => setSelectedTruck(null)}
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Devices */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">IoT Devices</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {getTruckTelemetry(selectedTruck.id).devices.map((device) => (
                            <div key={device.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="bg-blue-100 p-2 rounded-lg">
                                  <CpuChipIcon className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">{device.sn}</h4>
                                  <p className="text-sm text-gray-600">SIM: {device.sim_number}</p>
                                </div>
                              </div>
                              <div className="text-sm text-gray-600">
                                <p>Installed: {new Date(device.installed_at).toLocaleDateString()}</p>
                                <p>Sensors: {sensors.filter(s => s.device_id === device.id).length}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'pressure' && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Tire Pressure Events</h3>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {getTruckTelemetry(selectedTruck.id).tirePressure.slice(0, 20).map((event) => (
                          <div key={event.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full bg-${getAlertColor(event.exception_type)}-500`}></div>
                                <span className="font-medium text-gray-900">
                                  {event.pressure} PSI / {event.temperature}°C
                                </span>
                              </div>
                              <span className="text-sm text-gray-500">
                                {formatTime(event.reported_at)}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>
                                <span>Position: </span>
                                <span className="font-medium">{event.position_no}</span>
                              </div>
                              <div>
                                <span>Battery: </span>
                                <span className="font-medium">{event.battery_level}%</span>
                              </div>
                              <div>
                                <span>Exception: </span>
                                <span className={`font-medium capitalize text-${getAlertColor(event.exception_type)}-600`}>
                                  {event.exception_type?.replace('_', ' ') || 'Normal'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'temperature' && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Hub Temperature Events</h3>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {getTruckTelemetry(selectedTruck.id).hubTemp.slice(0, 20).map((event) => (
                          <div key={event.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full bg-${getTemperatureColor(event.temperature)}-500`}></div>
                                <span className="font-medium text-gray-900">
                                  {event.temperature}°C
                                </span>
                              </div>
                              <span className="text-sm text-gray-500">
                                {formatTime(event.reported_at)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              <span>Device: </span>
                              <span className="font-medium">
                                {devices.find(d => d.id === event.device_id)?.sn || 'Unknown'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </TailwindLayout>
  );
};

export default TelemetryDashboard;
