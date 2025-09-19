/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { 
  CpuChipIcon, 
  BoltIcon, 
  LockClosedIcon,
  LockOpenIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { devices, sensors, deviceStatusEvents, trucks, getDevicesByTruck, getTirePressureData, getHubTemperatureData, getDeviceStatus, getSensorsByDevice } from '../data/index.js';
import TailwindLayout from '../components/layout/TailwindLayout.jsx';

const DeviceStatus = () => {
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  // Get device with truck and status information
  const getDeviceInfo = (device) => {
    const truck = trucks.find(t => t.id === device.truck_id);
    const deviceStatus = getDeviceStatus(device.id);
    const deviceSensors = getSensorsByDevice(device.id);
    
    // Determine overall device health
    let healthStatus = 'good';
    if (!deviceStatus) {
      healthStatus = 'offline';
    } else if (deviceStatus.host_bat < 20 || deviceStatus.repeater1_bat < 15 || deviceStatus.repeater2_bat < 10) {
      healthStatus = 'warning';
    } else if (deviceStatus.host_bat < 10) {
      healthStatus = 'critical';
    }

    return {
      ...device,
      truck,
      status: deviceStatus,
      sensors: deviceSensors,
      healthStatus
    };
  };

  const deviceInfos = devices.map(getDeviceInfo);
  
  // Filter devices based on status
  const filteredDevices = deviceInfos.filter(device => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'online') return device.status && device.healthStatus !== 'offline';
    if (filterStatus === 'offline') return !device.status || device.healthStatus === 'offline';
    if (filterStatus === 'warning') return device.healthStatus === 'warning' || device.healthStatus === 'critical';
    return true;
  });

  const getStatusIcon = (healthStatus) => {
    switch (healthStatus) {
      case 'good':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'critical':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'offline':
        return <XCircleIcon className="h-5 w-5 text-gray-400" />;
      default:
        return <CpuChipIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (healthStatus) => {
    switch (healthStatus) {
      case 'good': return 'green';
      case 'warning': return 'yellow';
      case 'critical': return 'red';
      case 'offline': return 'gray';
      default: return 'gray';
    }
  };

  return (
    <TailwindLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">IoT Device Status</h1>
              <p className="text-gray-600 mt-2">Monitor device health and sensor status</p>
            </div>
            <div className="flex gap-2">
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Devices</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="warning">Needs Attention</option>
              </select>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-xl">
                <CpuChipIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Devices</p>
                <p className="text-2xl font-bold text-gray-900">{deviceInfos.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-xl">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Online</p>
                <p className="text-2xl font-bold text-gray-900">
                  {deviceInfos.filter(d => d.healthStatus !== 'offline').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-xl">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Warnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {deviceInfos.filter(d => d.healthStatus === 'warning' || d.healthStatus === 'critical').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center">
              <div className="bg-gray-100 p-3 rounded-xl">
                <XCircleIcon className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Offline</p>
                <p className="text-2xl font-bold text-gray-900">
                  {deviceInfos.filter(d => d.healthStatus === 'offline').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Devices Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDevices.map((device) => (
            <div
              key={device.id}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedDevice(device)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className={`bg-${getStatusColor(device.healthStatus)}-100 p-3 rounded-xl`}>
                    <CpuChipIcon className={`h-6 w-6 text-${getStatusColor(device.healthStatus)}-600`} />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">{device.sn}</h3>
                    <p className="text-sm text-gray-600">{device.truck?.name || 'Unknown Truck'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(device.healthStatus)}
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                </div>
              </div>

              {/* Device Info */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">SIM Number:</span>
                  <span className="font-medium">{device.sim_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Plate Number:</span>
                  <span className="font-medium">{device.truck?.plate_number || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sensors:</span>
                  <span className="font-medium">{device.sensors.length}</span>
                </div>
              </div>

              {/* Battery Status */}
              {device.status && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Host Battery:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${device.status.host_bat > 50 ? 'bg-green-500' : device.status.host_bat > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${device.status.host_bat}%` }}
                        ></div>
                      </div>
                      <span className="font-medium">{device.status.host_bat}%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Repeater 1:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${device.status.repeater1_bat > 50 ? 'bg-green-500' : device.status.repeater1_bat > 15 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${device.status.repeater1_bat}%` }}
                        ></div>
                      </div>
                      <span className="font-medium">{device.status.repeater1_bat}%</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Lock Status:</span>
                    <span className={`font-medium ${device.status.lock_state ? 'text-red-600' : 'text-green-600'}`}>
                      {device.status.lock_state ? 'Locked' : 'Unlocked'}
                    </span>
                  </div>
                </div>
              )}

              {!device.status && (
                <div className="text-center py-4">
                  <XCircleIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Device Offline</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Device Detail Modal */}
        {selectedDevice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedDevice.sn}</h2>
                    <p className="text-gray-600">{selectedDevice.truck?.name} - {selectedDevice.truck?.plate_number}</p>
                  </div>
                  <button 
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl transition-colors"
                    onClick={() => setSelectedDevice(null)}
                  >
                    Close
                  </button>
                </div>

                {/* Sensors List */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Sensors ({selectedDevice.sensors.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedDevice.sensors.map((sensor) => (
                      <div key={sensor.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 capitalize">{sensor.type} Sensor</h4>
                          <span className="text-sm text-gray-500">Pos {sensor.position_no}</span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Serial:</span>
                            <span className="font-medium">{sensor.sn}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Installed:</span>
                            <span className="font-medium">
                              {new Date(sensor.installed_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Status:</span>
                            <span className={`font-medium ${sensor.removed_at ? 'text-red-600' : 'text-green-600'}`}>
                              {sensor.removed_at ? 'Removed' : 'Active'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Device Status Details */}
                {selectedDevice.status && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Status</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Host Battery:</span>
                        <div className="font-medium text-lg">{selectedDevice.status.host_bat}%</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Repeater 1:</span>
                        <div className="font-medium text-lg">{selectedDevice.status.repeater1_bat}%</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Repeater 2:</span>
                        <div className="font-medium text-lg">{selectedDevice.status.repeater2_bat}%</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Lock State:</span>
                        <div className={`font-medium text-lg ${selectedDevice.status.lock_state ? 'text-red-600' : 'text-green-600'}`}>
                          {selectedDevice.status.lock_state ? 'Locked' : 'Unlocked'}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 text-xs text-gray-500">
                      Last reported: {new Date(selectedDevice.status.reported_at).toLocaleString()}
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

export default DeviceStatus;
