import React, { useState } from 'react';
import { 
  CpuChipIcon, 
  TruckIcon,
  MagnifyingGlassIcon, 
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  SignalIcon,
  Battery0Icon
} from '@heroicons/react/24/outline';
import { devices, trucks, sensors } from '../data/index.js';
import TailwindLayout from '../components/layout/TailwindLayout.jsx';

const DeviceAssignment = () => {
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTruck, setFilterTruck] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Filter devices
  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.sn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.sim_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTruck = filterTruck === 'all' || device.truck_id === filterTruck;
    const deviceStatus = device.truck_id ? 'assigned' : 'unassigned';
    const matchesStatus = filterStatus === 'all' || deviceStatus === filterStatus;
    return matchesSearch && matchesTruck && matchesStatus;
  });

  // Get device statistics
  const getDeviceStats = () => {
    const assignedDevices = devices.filter(d => d.truck_id).length;
    const unassignedDevices = devices.filter(d => !d.truck_id).length;
    
    return {
      total: devices.length,
      assigned: assignedDevices,
      unassigned: unassignedDevices,
      online: devices.filter(d => Math.random() > 0.2).length // Simulated online status
    };
  };

  const stats = getDeviceStats();

  // Get truck name
  const getTruckName = (truckId) => {
    if (!truckId) return 'Unassigned';
    const truck = trucks.find(t => t.id === truckId);
    return truck ? `${truck.name} (${truck.plate_number})` : 'Unknown Truck';
  };

  // Get device sensors
  const getDeviceSensors = (deviceId) => {
    return sensors.filter(s => s.device_id === deviceId);
  };

  const getStatusColor = (device) => {
    if (!device.truck_id) return 'bg-gray-100 text-gray-800';
    // Simulate online/offline status
    const isOnline = Math.random() > 0.2;
    return isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getStatusText = (device) => {
    if (!device.truck_id) return 'Unassigned';
    const isOnline = Math.random() > 0.2;
    return isOnline ? 'Online' : 'Offline';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <TailwindLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">IoT Device Assignment</h1>
                <p className="text-gray-600 mt-2">Manage device assignments to fleet vehicles</p>
              </div>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-lg">
                <PlusIcon className="h-5 w-5" />
                Assign Device
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <CpuChipIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Devices</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-xl">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Assigned</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.assigned}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-xl">
                  <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Unassigned</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.unassigned}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center">
                <div className="bg-emerald-100 p-3 rounded-xl">
                  <SignalIcon className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Online</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.online}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search devices by serial number or SIM..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Status</option>
                  <option value="assigned">Assigned</option>
                  <option value="unassigned">Unassigned</option>
                </select>
                <select 
                  value={filterTruck} 
                  onChange={(e) => setFilterTruck(e.target.value)}
                  className="bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Trucks</option>
                  {trucks.map(truck => (
                    <option key={truck.id} value={truck.id}>{truck.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Devices Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8 max-h-[600px] overflow-y-auto">
            {filteredDevices.map((device) => {
              const sensorCount = getDeviceSensors(device.id).length;
              
              return (
                <div
                  key={device.id}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedDevice(device)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="bg-indigo-100 p-3 rounded-xl">
                        <CpuChipIcon className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-900">{device.sn}</h3>
                        <p className="text-sm text-gray-600">SIM: {device.sim_number}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(device)}`}>
                      {getStatusText(device)}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Assigned to:</span>
                      <span className="font-medium">{getTruckName(device.truck_id)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sensors:</span>
                      <span className="font-medium">{sensorCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Installed:</span>
                      <span className="font-medium">{formatDate(device.installed_at)}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                      <PencilIcon className="h-4 w-4 inline mr-1" />
                      Edit
                    </button>
                    <button className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                      <EyeIcon className="h-4 w-4 inline mr-1" />
                      View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Device Detail Modal */}
          {selectedDevice && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedDevice.sn}</h2>
                      <p className="text-gray-600">SIM: {selectedDevice.sim_number}</p>
                    </div>
                    <button 
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl transition-colors"
                      onClick={() => setSelectedDevice(null)}
                    >
                      Close
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Device Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <CpuChipIcon className="h-5 w-5 text-gray-600" />
                            <span className="font-medium text-gray-900">Serial Number</span>
                          </div>
                          <p className="text-gray-600">{selectedDevice.sn}</p>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <SignalIcon className="h-5 w-5 text-gray-600" />
                            <span className="font-medium text-gray-900">SIM Number</span>
                          </div>
                          <p className="text-gray-600">{selectedDevice.sim_number}</p>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <TruckIcon className="h-5 w-5 text-gray-600" />
                            <span className="font-medium text-gray-900">Assigned Vehicle</span>
                          </div>
                          <p className="text-gray-600">{getTruckName(selectedDevice.truck_id)}</p>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <CalendarIcon className="h-5 w-5 text-gray-600" />
                            <span className="font-medium text-gray-900">Installed</span>
                          </div>
                          <p className="text-gray-600">{formatDate(selectedDevice.installed_at)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Connected Sensors */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Connected Sensors</h3>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {getDeviceSensors(selectedDevice.id).map((sensor) => (
                          <div key={sensor.id} className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                              <BatteryIcon className="h-6 w-6 text-green-600" />
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{sensor.type} Sensor</p>
                                <p className="text-sm text-gray-600">Position: {sensor.position}</p>
                                <p className="text-sm text-gray-600">Installed: {formatDate(sensor.installed_at)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {getDeviceSensors(selectedDevice.id).length === 0 && (
                          <p className="text-gray-600 text-center py-4">No sensors connected</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </TailwindLayout>
  );
};

export default DeviceAssignment;
