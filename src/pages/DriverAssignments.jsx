import React, { useState } from 'react';
import { 
  UserGroupIcon, 
  TruckIcon, 
  CalendarDaysIcon,
  ClockIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { driverAssignments, drivers, trucks } from '../data/index.js';
import TailwindLayout from '../components/layout/TailwindLayout.jsx';

const DriverAssignments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  // Get assignment with driver and truck details
  const getAssignmentDetails = (assignment) => {
    const driver = drivers.find(d => d.id === assignment.driver_id);
    const truck = trucks.find(t => t.id === assignment.truck_id);
    
    return {
      ...assignment,
      driver,
      truck
    };
  };

  // Filter assignments
  const filteredAssignments = driverAssignments
    .map(getAssignmentDetails)
    .filter(assignment => {
      const matchesSearch = !searchTerm || 
        assignment.driver?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.truck?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.truck?.plate_number?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || assignment.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
                <h1 className="text-3xl font-bold text-gray-900">Driver Assignments</h1>
                <p className="text-gray-600 mt-2">Manage driver-vehicle assignments and schedules</p>
              </div>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-lg">
                <PlusIcon className="h-5 w-5" />
                New Assignment
              </button>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search drivers, trucks, or plate numbers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Assignments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssignments.map((assignment) => (
              <div key={assignment.id} className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-2 rounded-xl">
                      <UserGroupIcon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{assignment.driver?.name || 'Unknown Driver'}</h3>
                      <p className="text-sm text-gray-600">{assignment.driver?.employee_id}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(assignment.status)}`}>
                    {assignment.status}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <TruckIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      {assignment.truck?.name || 'Unknown Truck'} ({assignment.truck?.plate_number})
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <CalendarDaysIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      {formatDate(assignment.assigned_at)}
                    </span>
                  </div>

                  {assignment.notes && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600">{assignment.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                  <button 
                    onClick={() => setSelectedAssignment(assignment)}
                    className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <EyeIcon className="h-4 w-4" />
                    View
                  </button>
                  <button className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1">
                    <PencilIcon className="h-4 w-4" />
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredAssignments.length === 0 && (
            <div className="text-center py-12">
              <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
            </div>
          )}

          {/* Assignment Detail Modal */}
          {selectedAssignment && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Assignment Details</h2>
                    <button 
                      onClick={() => setSelectedAssignment(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Driver Information</h3>
                        <div className="space-y-2">
                          <p><span className="font-medium">Name:</span> {selectedAssignment.driver?.name}</p>
                          <p><span className="font-medium">Employee ID:</span> {selectedAssignment.driver?.employee_id}</p>
                          <p><span className="font-medium">Phone:</span> {selectedAssignment.driver?.phone}</p>
                          <p><span className="font-medium">License:</span> {selectedAssignment.driver?.license_number}</p>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Vehicle Information</h3>
                        <div className="space-y-2">
                          <p><span className="font-medium">Name:</span> {selectedAssignment.truck?.name}</p>
                          <p><span className="font-medium">Plate Number:</span> {selectedAssignment.truck?.plate_number}</p>
                          <p><span className="font-medium">Model:</span> {selectedAssignment.truck?.model}</p>
                          <p><span className="font-medium">Year:</span> {selectedAssignment.truck?.year}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Assignment Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <p><span className="font-medium">Status:</span> 
                          <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColor(selectedAssignment.status)}`}>
                            {selectedAssignment.status}
                          </span>
                        </p>
                        <p><span className="font-medium">Assigned Date:</span> {formatDate(selectedAssignment.assigned_at)}</p>
                        <p><span className="font-medium">Created:</span> {formatDate(selectedAssignment.created_at)}</p>
                        <p><span className="font-medium">Updated:</span> {formatDate(selectedAssignment.updated_at)}</p>
                      </div>
                      {selectedAssignment.notes && (
                        <div className="mt-4">
                          <p className="font-medium mb-2">Notes:</p>
                          <p className="text-gray-700">{selectedAssignment.notes}</p>
                        </div>
                      )}
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

export default DriverAssignments;
