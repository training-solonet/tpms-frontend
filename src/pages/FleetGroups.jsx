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

  // --- Number range cluster helpers ---
  const extractTruckNumber = (idOrName) => {
    if (!idOrName) return null;
    const m = String(idOrName).match(/(\d{1,4})/);
    return m ? parseInt(m[1], 10) : null;
  };

  const numberRanges = [
    { key: '1-199', label: '1 - 199', lo: 1, hi: 199 },
    { key: '200-399', label: '200 - 399', lo: 200, hi: 399 },
    { key: '400-599', label: '400 - 599', lo: 400, hi: 599 },
    { key: '600-799', label: '600 - 799', lo: 600, hi: 799 },
    { key: '800-999', label: '800 - 999', lo: 800, hi: 999 },
  ];

  const clusterStats = numberRanges.map(r => {
    const inRange = trucks.filter(t => {
      const n = extractTruckNumber(t.id) ?? extractTruckNumber(t.name);
      return n != null && n >= r.lo && n <= r.hi;
    });
    return {
      ...r,
      count: inRange.length,
      active: inRange.filter(t => getLatestTruckStatus(t.id)?.status === 'active').length,
    };
  });

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

        {/* Number Range Clusters */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-indigo-600" /> Number Range Clusters
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {clusterStats.map(cs => (
              <div key={cs.key} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Cluster</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">{cs.label}</span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{cs.count}</div>
                    <div className="text-xs text-gray-500">Vehicles</div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-600 font-semibold">{cs.active}</div>
                    <div className="text-xs text-gray-500">Active</div>
                  </div>
                </div>
                <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-green-500 h-1.5 rounded-full"
                    style={{ width: `${cs.count > 0 ? (cs.active / Math.max(cs.count,1)) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
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
