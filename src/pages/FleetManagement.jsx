import React, { useState } from 'react';
import {
  TruckIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  CpuChipIcon,
  MapPinIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { trucks, fleetGroups, devices } from '../data/index.js';
import TailwindLayout from '../components/layout/TailwindLayout.jsx';
import TruckImage from '../components/common/TruckImage.jsx';

const FleetManagement = () => {
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGroup, setFilterGroup] = useState('all');

  // Filter trucks
  const filteredTrucks = trucks.filter((truck) => {
    const matchesSearch =
      truck.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.plate_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || truck.status === filterStatus;
    const matchesGroup = filterGroup === 'all' || truck.fleet_group_id === filterGroup;
    return matchesSearch && matchesStatus && matchesGroup;
  });

  // Get fleet statistics
  const getFleetStats = () => {
    const activeTrucks = trucks.filter((t) => t.status === 'active').length;
    const inactiveTrucks = trucks.filter((t) => t.status === 'inactive').length;
    const maintenanceTrucks = trucks.filter((t) => t.status === 'maintenance').length;

    return {
      total: trucks.length,
      active: activeTrucks,
      inactive: inactiveTrucks,
      maintenance: maintenanceTrucks,
    };
  };

  const stats = getFleetStats();

  // Driver info removed in tracking-only mode

  // Get truck's devices
  const getTruckDevices = (truckId) => {
    return devices.filter((d) => d.truck_id === truckId);
  };

  // Get fleet group name
  const getFleetGroupName = (groupId) => {
    const group = fleetGroups.find((g) => g.id === groupId);
    return group ? group.name : 'Unknown';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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
                <h1 className="text-3xl font-bold text-gray-900">Fleet Management</h1>
                <p className="text-gray-600 mt-2">Manage your fleet vehicles and assignments</p>
              </div>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-lg">
                <PlusIcon className="h-5 w-5" />
                Add Vehicle
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <TruckIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Vehicles</p>
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
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-xl">
                  <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Maintenance</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.maintenance}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center">
                <div className="bg-gray-100 p-3 rounded-xl">
                  <XCircleIcon className="h-6 w-6 text-gray-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Inactive</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
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
                    placeholder="Search vehicles..."
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
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
                <select
                  value={filterGroup}
                  onChange={(e) => setFilterGroup(e.target.value)}
                  className="bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Groups</option>
                  {fleetGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Vehicles Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {filteredTrucks.map((truck) => {
              const deviceCount = getTruckDevices(truck.id).length;

              return (
                <div
                  key={truck.id}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedTruck(truck)}
                >
                  {/* Truck photo */}
                  <div className="mb-4 rounded-xl overflow-hidden">
                    <TruckImage id={truck.id} width={480} height={280} />
                  </div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{truck.name}</h3>
                      <p className="text-sm text-gray-600">{truck.plate_number}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(truck.status)}`}
                    >
                      {truck.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">{truck.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Group:</span>
                      <span className="font-medium">{getFleetGroupName(truck.fleet_group_id)}</span>
                    </div>
                    {/* Driver removed */}
                    <div className="flex justify-between">
                      <span className="text-gray-600">IoT Devices:</span>
                      <span className="font-medium">{deviceCount}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Vehicle Detail Modal */}
          {selectedTruck && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedTruck.name}</h2>
                      <p className="text-gray-600">{selectedTruck.plate_number}</p>
                    </div>
                    <button
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl transition-colors"
                      onClick={() => setSelectedTruck(null)}
                    >
                      Close
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Truck photo large */}
                    <div className="rounded-xl overflow-hidden">
                      <TruckImage id={selectedTruck.id} width={800} height={480} />
                    </div>
                    {/* Vehicle Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Vehicle Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <TruckIcon className="h-5 w-5 text-gray-600" />
                            <span className="font-medium text-gray-900">Type</span>
                          </div>
                          <p className="text-gray-600">{selectedTruck.type}</p>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <MapPinIcon className="h-5 w-5 text-gray-600" />
                            <span className="font-medium text-gray-900">Fleet Group</span>
                          </div>
                          <p className="text-gray-600">
                            {getFleetGroupName(selectedTruck.fleet_group_id)}
                          </p>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <CalendarIcon className="h-5 w-5 text-gray-600" />
                            <span className="font-medium text-gray-900">Created</span>
                          </div>
                          <p className="text-gray-600">{formatDate(selectedTruck.created_at)}</p>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <CheckCircleIcon className="h-5 w-5 text-gray-600" />
                            <span className="font-medium text-gray-900">Status</span>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTruck.status)}`}
                          >
                            {selectedTruck.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Assigned Driver section removed */}

                    {/* IoT Devices */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">IoT Devices</h3>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {getTruckDevices(selectedTruck.id).map((device) => (
                          <div key={device.id} className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                              <CpuChipIcon className="h-6 w-6 text-blue-600" />
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{device.sn}</p>
                                <p className="text-sm text-gray-600">SIM: {device.sim_number}</p>
                                <p className="text-sm text-gray-600">
                                  Installed: {formatDate(device.installed_at)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {getTruckDevices(selectedTruck.id).length === 0 && (
                          <p className="text-gray-600 text-center py-4">No IoT devices installed</p>
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

export default FleetManagement;
