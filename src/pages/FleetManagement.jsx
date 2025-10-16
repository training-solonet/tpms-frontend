import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import TailwindLayout from '../components/layout/TailwindLayout';
import TruckImage from '../components/common/TruckImage';
import { trucks, devices, fleetGroups } from '../data/index.js';
import WheelFrontIcon from '../components/icons/WheelFrontIcon.jsx';

const FleetManagement = () => {
  const [trucksData, setTrucksData] = useState([]);
  const [devicesData, setDevicesData] = useState([]);
  const [fleetGroupsState, setFleetGroupsState] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [selectedTruck, setSelectedTruck] = useState(null);

  useEffect(() => {
    const loadData = () => {
      setLoading(true);

      // Use dummy data directly
      setTrucksData(trucks);
      setDevicesData(devices);
      setFleetGroupsState(fleetGroups);

      console.log('✅ Fleet management data loaded from dummy data:', {
        trucks: trucks.length,
        devices: devices.length,
        fleetGroups: fleetGroups.length,
      });

      setLoading(false);
    };

    // Simulate loading time
    setTimeout(loadData, 300);
  }, []);

  const getTruckDevices = (truckId) => {
    return devicesData.filter((device) => device.truck_id === truckId);
  };

  const getFleetGroupName = (groupId) => {
    const group = fleetGroupsState.find((g) => g.id === groupId);
    return group ? group.name : 'Unknown';
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const filteredTrucks = trucksData.filter((truck) => {
    const matchesSearch =
      truck.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.plate_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || truck.status === statusFilter;
    const matchesGroup = groupFilter === 'all' || truck.fleet_group_id === groupFilter;

    return matchesSearch && matchesStatus && matchesGroup;
  });

  const stats = {
    total: trucksData.length,
    active: trucksData.filter((t) => t.status === 'active').length,
    maintenance: trucksData.filter((t) => t.status === 'maintenance').length,
    inactive: trucksData.filter((t) => t.status === 'inactive').length,
  };

  if (loading) {
    return (
      <TailwindLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </TailwindLayout>
    );
  }

  return (
    <TailwindLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Fleet Management</h1>
            <p className="text-gray-600">Manage your vehicle fleet and IoT devices</p>
          </div>

          {/* Stats Cards */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100">
                    <div className="w-6 h-6 bg-blue-600 rounded"></div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Vehicles</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100">
                    <div className="w-6 h-6 bg-green-600 rounded"></div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Active</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-yellow-100">
                    <div className="w-6 h-6 bg-yellow-600 rounded"></div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Maintenance</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.maintenance}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-red-100">
                    <div className="w-6 h-6 bg-red-600 rounded"></div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Inactive</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          {!loading && (
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
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <select
                    value={groupFilter}
                    onChange={(e) => setGroupFilter(e.target.value)}
                    className="bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="all">All Groups</option>
                    {fleetGroupsState.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Vehicles Grid */}
          {!loading && (
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
                        <span className="font-medium">
                          {getFleetGroupName(truck.fleet_group_id)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">IoT Devices:</span>
                        <span className="font-medium">{deviceCount}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

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

                    {/* Vehicle Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Vehicle Information</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTruck.status)}`}
                            >
                              {selectedTruck.status}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Type:</span>
                            <span className="font-medium">{selectedTruck.type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Fleet Group:</span>
                            <span className="font-medium">
                              {getFleetGroupName(selectedTruck.fleet_group_id)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Year:</span>
                            <span className="font-medium">{selectedTruck.year || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Capacity:</span>
                            <span className="font-medium">{selectedTruck.capacity || 'N/A'}</span>
                          </div>
                          {/* Tire Configuration with Icons */}
                          <div>
                            <div className="text-gray-600 mb-1">Tire Configuration:</div>
                            <div className="text-sm text-gray-900 mb-2">
                              {selectedTruck.tire_config} ({selectedTruck.tire_count} tires)
                            </div>
                            <div className="inline-flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                              {/* Simple front view layout: render tire_count as icons in rows */}
                              {(() => {
                                const count = selectedTruck.tire_count || 4;
                                // Determine rows: 4 => 2x2, 6 => 3x2, 8 => 4x2
                                const perRow = count / 2;
                                const row = Array.from({ length: perRow });
                                return (
                                  <div className="space-y-1">
                                    {/* Front row */}
                                    <div className="flex items-center justify-between gap-1">
                                      {row.map((_, i) => (
                                        <WheelFrontIcon
                                          key={`front-${i}`}
                                          className="w-6 h-6 text-gray-700"
                                        />
                                      ))}
                                    </div>
                                    {/* Rear row */}
                                    <div className="flex items-center justify-between gap-1">
                                      {row.map((_, i) => (
                                        <WheelFrontIcon
                                          key={`rear-${i}`}
                                          className="w-6 h-6 text-gray-700"
                                        />
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* IoT Devices */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">IoT Devices</h3>
                        <div className="space-y-3">
                          {getTruckDevices(selectedTruck.id).map((device) => (
                            <div key={device.id} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center">
                                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
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
                            <p className="text-gray-600 text-center py-4">
                              No IoT devices installed
                            </p>
                          )}
                        </div>
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
