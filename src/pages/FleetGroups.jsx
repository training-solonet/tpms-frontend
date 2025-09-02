import React, { useState } from 'react';
import { 
  TruckIcon, 
  MapPinIcon, 
  UserGroupIcon,
  ChartBarIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  UsersIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { fleetGroups, trucks, getLatestTruckStatus } from '../data/index.js';
import TailwindLayout from '../components/layout/TailwindLayout.jsx';

const FleetGroups = () => {
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Get trucks by fleet group
  const getTrucksByGroup = (groupId) => {
    return trucks.filter(truck => truck.fleet_group_id === groupId);
  };

  // Get group statistics
  const getGroupStats = (groupId) => {
    const groupTrucks = getTrucksByGroup(groupId);
    const activeTrucks = groupTrucks.filter(truck => {
      const status = getLatestTruckStatus(truck.id);
      return status?.status === 'active';
    }).length;

    return {
      total: groupTrucks.length,
      active: activeTrucks,
      inactive: groupTrucks.length - activeTrucks
    };
  };

  return (
    <TailwindLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Fleet Groups</h1>
              <p className="text-gray-600 mt-2">Manage fleet groups and vehicle assignments</p>
            </div>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-lg">
              <PlusIcon className="h-5 w-5" />
              Add Group
            </button>
          </div>
        </div>

        {/* Fleet Groups Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {fleetGroups.map((group) => {
            const stats = getGroupStats(group.id);
            return (
              <div
                key={group.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedGroup(group)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-indigo-100 p-3 rounded-xl">
                      <TruckIcon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {group.site}
                      </div>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <EyeIcon className="h-5 w-5" />
                  </button>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{group.description}</p>

                {/* Statistics */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                    <div className="text-xs text-gray-500">Active</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-400">{stats.inactive}</div>
                    <div className="text-xs text-gray-500">Inactive</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats.total > 0 ? (stats.active / stats.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Group Details */}
        {selectedGroup && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedGroup.name}</h2>
                <p className="text-gray-600">{selectedGroup.description}</p>
              </div>
              <div className="flex gap-2">
                <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
                  <PencilIcon className="h-4 w-4" />
                  Edit
                </button>
                <button 
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl transition-colors"
                  onClick={() => setSelectedGroup(null)}
                >
                  Close
                </button>
              </div>
            </div>

            {/* Trucks in Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getTrucksByGroup(selectedGroup.id).map((truck) => {
                const status = getLatestTruckStatus(truck.id);
                const statusColor = status?.status === 'active' ? 'green' : 
                                  status?.status === 'maintenance' ? 'yellow' : 'gray';
                
                return (
                  <div key={truck.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full bg-${statusColor}-500 mr-2`}></div>
                        <h4 className="font-semibold text-gray-900">{truck.name}</h4>
                      </div>
                      <span className="text-sm text-gray-500">{truck.plate_number}</span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Model:</span>
                        <span className="font-medium">{truck.model}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Year:</span>
                        <span className="font-medium">{truck.year}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Config:</span>
                        <span className="font-medium">{truck.tire_config}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={`font-medium capitalize text-${statusColor}-600`}>
                          {status?.status || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        </div>
      </div>
    </TailwindLayout>
  );
};

export default FleetGroups;
