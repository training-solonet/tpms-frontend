import React, { useState } from 'react';
import { 
  ShieldCheckIcon, 
  MapPinIcon, 
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { geofences } from '../data/index.js';
import TailwindLayout from '../components/layout/TailwindLayout.jsx';

const Geofences = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGeofence, setSelectedGeofence] = useState(null);
  const [filterType, setFilterType] = useState('all');

  // Filter geofences
  const filteredGeofences = geofences.filter(geofence => {
    const matchesSearch = !searchTerm || 
      geofence.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      geofence.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || geofence.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const getTypeColor = (type) => {
    switch (type) {
      case 'mining_area': return 'bg-blue-100 text-blue-800';
      case 'restricted': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'parking': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'mining_area': return <ShieldCheckIcon className="h-5 w-5 text-blue-600" />;
      case 'restricted': return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />;
      case 'maintenance': return <MapPinIcon className="h-5 w-5 text-yellow-600" />;
      case 'parking': return <MapPinIcon className="h-5 w-5 text-green-600" />;
      default: return <MapPinIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatCoordinates = (coordinates) => {
    if (!coordinates || coordinates.length === 0) return 'No coordinates';
    return `${coordinates.length} points defined`;
  };

  return (
    <TailwindLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Geofences</h1>
                <p className="text-gray-600 mt-2">Manage geographic boundaries and restricted areas</p>
              </div>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-lg">
                <PlusIcon className="h-5 w-5" />
                Add Geofence
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
                  placeholder="Search geofences..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="mining_area">Mining Area</option>
                <option value="restricted">Restricted</option>
                <option value="maintenance">Maintenance</option>
                <option value="parking">Parking</option>
              </select>
            </div>
          </div>

          {/* Geofences Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGeofences.map((geofence) => (
              <div key={geofence.id} className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-2 rounded-xl">
                      {getTypeIcon(geofence.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{geofence.name}</h3>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getTypeColor(geofence.type)}`}>
                        {geofence.type ? geofence.type.replace('_', ' ') : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {geofence.description && (
                    <p className="text-sm text-gray-600">{geofence.description}</p>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      {formatCoordinates(geofence.coordinates)}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Created:</span>
                        <p className="text-gray-600">
                          {new Date(geofence.created_at).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Status:</span>
                        <p className="text-gray-600">Active</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                  <button 
                    onClick={() => setSelectedGeofence(geofence)}
                    className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <EyeIcon className="h-4 w-4" />
                    View
                  </button>
                  <button className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1">
                    <PencilIcon className="h-4 w-4" />
                    Edit
                  </button>
                  <button className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredGeofences.length === 0 && (
            <div className="text-center py-12">
              <ShieldCheckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No geofences found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
            </div>
          )}

          {/* Geofence Detail Modal */}
          {selectedGeofence && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Geofence Details</h2>
                    <button 
                      onClick={() => setSelectedGeofence(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Basic Information</h3>
                      <div className="space-y-2">
                        <p><span className="font-medium">Name:</span> {selectedGeofence.name}</p>
                        <p><span className="font-medium">Type:</span> 
                          <span className={`ml-2 px-2 py-1 rounded text-xs ${getTypeColor(selectedGeofence.type)}`}>
                            {selectedGeofence.type ? selectedGeofence.type.replace('_', ' ') : 'Unknown'}
                          </span>
                        </p>
                        {selectedGeofence.description && (
                          <p><span className="font-medium">Description:</span> {selectedGeofence.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Geographic Data</h3>
                      <div className="space-y-2">
                        <p><span className="font-medium">Coordinates:</span> {formatCoordinates(selectedGeofence.coordinates)}</p>
                        {selectedGeofence.coordinates && selectedGeofence.coordinates.length > 0 && (
                          <div className="mt-3">
                            <p className="font-medium mb-2">Boundary Points:</p>
                            <div className="max-h-32 overflow-y-auto bg-white rounded p-2 text-xs font-mono">
                              {selectedGeofence.coordinates.map((coord, index) => (
                                <div key={index}>
                                  Point {index + 1}: [{coord[0]}, {coord[1]}]
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Metadata</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <p><span className="font-medium">Created:</span> {new Date(selectedGeofence.created_at).toLocaleString('id-ID')}</p>
                        <p><span className="font-medium">Updated:</span> {new Date(selectedGeofence.updated_at).toLocaleString('id-ID')}</p>
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

export default Geofences;
