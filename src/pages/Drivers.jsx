import React, { useState } from 'react';
import { 
  UserIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  PhoneIcon,
  IdentificationIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { drivers, trucks, driverAssignments } from '../data/index.js';
import TailwindLayout from '../components/layout/TailwindLayout.jsx';

const Drivers = () => {
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Filter drivers
  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.license_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || driver.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Get driver statistics
  const getDriverStats = () => {
    const activeDrivers = drivers.filter(d => d.status === 'active').length;
    const inactiveDrivers = drivers.filter(d => d.status === 'inactive').length;
    const suspendedDrivers = drivers.filter(d => d.status === 'suspended').length;
    
    return {
      total: drivers.length,
      active: activeDrivers,
      inactive: inactiveDrivers,
      suspended: suspendedDrivers
    };
  };

  const stats = getDriverStats();

  // Get driver's current assignment
  const getDriverAssignment = (driverId) => {
    const assignment = driverAssignments.find(a => a.driver_id === driverId && a.status === 'active');
    if (assignment) {
      const truck = trucks.find(t => t.id === assignment.truck_id);
      return truck;
    }
    return null;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
                <h1 className="text-3xl font-bold text-gray-900">Driver Management</h1>
                <p className="text-gray-600 mt-2">Manage fleet drivers and their assignments</p>
              </div>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-lg">
                <PlusIcon className="h-5 w-5" />
                Add Driver
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <UserIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Drivers</p>
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
                <div className="bg-gray-100 p-3 rounded-xl">
                  <XCircleIcon className="h-6 w-6 text-gray-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Inactive</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center">
                <div className="bg-red-100 p-3 rounded-xl">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Suspended</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.suspended}</p>
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
                    placeholder="Search drivers..."
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
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>

          {/* Drivers Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {filteredDrivers.map((driver) => {
              const assignment = getDriverAssignment(driver.id);
              
              return (
                <div
                  key={driver.id}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedDriver(driver)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="bg-indigo-100 p-3 rounded-xl">
                        <UserIcon className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-900">{driver.name}</h3>
                        <p className="text-sm text-gray-600">License: {driver.license_number}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(driver.status)}`}>
                      {driver.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{driver.phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hired:</span>
                      <span className="font-medium">{formatDate(driver.hire_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Assignment:</span>
                      <span className="font-medium">
                        {assignment ? assignment.name : 'Unassigned'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Driver Detail Modal */}
          {selectedDriver && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedDriver.name}</h2>
                      <p className="text-gray-600">Driver Details</p>
                    </div>
                    <button 
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl transition-colors"
                      onClick={() => setSelectedDriver(null)}
                    >
                      Close
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <IdentificationIcon className="h-5 w-5 text-gray-600" />
                            <span className="font-medium text-gray-900">License Number</span>
                          </div>
                          <p className="text-gray-600">{selectedDriver.license_number}</p>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <PhoneIcon className="h-5 w-5 text-gray-600" />
                            <span className="font-medium text-gray-900">Phone</span>
                          </div>
                          <p className="text-gray-600">{selectedDriver.phone || 'N/A'}</p>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <CalendarIcon className="h-5 w-5 text-gray-600" />
                            <span className="font-medium text-gray-900">Hire Date</span>
                          </div>
                          <p className="text-gray-600">{formatDate(selectedDriver.hire_date)}</p>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <CheckCircleIcon className="h-5 w-5 text-gray-600" />
                            <span className="font-medium text-gray-900">Status</span>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedDriver.status)}`}>
                            {selectedDriver.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Current Assignment */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Assignment</h3>
                      <div className="bg-gray-50 rounded-xl p-4">
                        {(() => {
                          const assignment = getDriverAssignment(selectedDriver.id);
                          return assignment ? (
                            <div>
                              <p className="font-medium text-gray-900">{assignment.name}</p>
                              <p className="text-sm text-gray-600">Plate: {assignment.plate_number}</p>
                              <p className="text-sm text-gray-600">Type: {assignment.type}</p>
                            </div>
                          ) : (
                            <p className="text-gray-600">No current assignment</p>
                          );
                        })()}
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

export default Drivers;
