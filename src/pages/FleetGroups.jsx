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
import { trucksAPI, vendorsAPI } from '../services/api.js';
import TailwindLayout from '../components/layout/TailwindLayout.jsx';
import TruckImage from '../components/common/TruckImage.jsx';

const FleetGroups = () => {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [backendTrucks, setBackendTrucks] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [loadingTrucks, setLoadingTrucks] = useState(true);

  // Load vendors and trucks on mount so summary is visible immediately
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingVendors(true);
        const vRes = await vendorsAPI.getAll();
        if (mounted && vRes.success && Array.isArray(vRes.data)) setVendors(vRes.data);
      } finally {
        if (mounted) setLoadingVendors(false);
      }
    })();
    (async () => {
      try {
        setLoadingTrucks(true);
        const tRes = await trucksAPI.getAll();
        if (mounted && tRes.success && Array.isArray(tRes.data)) {
          setBackendTrucks(tRes.data.map(t => ({
            ...t,
            fleet_group_id: t.fleet_group_id || t.fleetGroupId || t.fleet_group || null,
            vendor_id: t.vendor_id || t.vendorId || null,
            name: t.name || t.id,
            plate_number: t.plate_number || t.plate || '-'
          })));
        }
      } finally {
        if (mounted) setLoadingTrucks(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Get trucks by fleet group
  const getTrucksByGroup = (groupId) => {
    // Prefer backend trucks when available; fallback to dummy
    const source = backendTrucks.length > 0 ? backendTrucks : trucks;
    return source.filter(truck => truck.fleet_group_id === groupId);
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
    const source = backendTrucks.length > 0 ? backendTrucks : trucks;
    const inRange = source.filter(t => {
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
    // Active calculation available for dummy data only
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
            // Compute compact vendor summary per group (visible on card)
            const source = backendTrucks.length > 0 ? backendTrucks : trucks;
            const groupTs = source.filter(t => t.fleet_group_id === group.id);
            const byId = new Map((vendors || []).map(v => [v.id, v]));
            const vCount = new Map();
            for (const t of groupTs) {
              const vid = t.vendor_id || 'none';
              vCount.set(vid, (vCount.get(vid) || 0) + 1);
            }
            const vList = Array.from(vCount.entries()).map(([vid, total]) => ({
              id: vid,
              name: vid !== 'none' ? (byId.get(vid)?.name || 'Unknown') : 'Unassigned',
              total
            })).sort((a,b) => (a.id === 'none') - (b.id === 'none')).slice(0,3);
            return (
              <div
                key={group.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedGroup(group)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-1 rounded-xl bg-indigo-50 overflow-hidden">
                      {/* Group thumbnail - dummy image */}
                      <div className="w-16 h-12 rounded-md overflow-hidden">
                        <TruckImage id={`group-${group.id}`} width={160} height={100} className="w-16 h-12" />
                      </div>
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

                {/* Compact Vendors summary (top 3) */}
                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-1">Vendors</div>
                  {(loadingTrucks || loadingVendors) ? (
                    <div className="text-xs text-gray-400">Loading...</div>
                  ) : vList.length === 0 ? (
                    <div className="text-xs text-gray-400">No assignment</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {vList.map(v => (
                        <span key={v.id} className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs border border-indigo-100">
                          <span className="font-medium">{v.name}</span>
                          <span className="text-[10px] bg-white/70 rounded px-1 text-gray-600 border border-indigo-100">{v.total}</span>
                        </span>
                      ))}
                      {vCount.size > vList.length && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 text-xs border">+{vCount.size - vList.length} more</span>
                      )}
                    </div>
                  )}
                </div>

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

            {/* Vendors Summary in Group */}
            <VendorsSummary 
              groupId={selectedGroup.id} 
              loadState={{ backendTrucks, setBackendTrucks, vendors, setVendors, loadingTrucks, setLoadingTrucks, loadingVendors, setLoadingVendors }}
            />

            {/* Trucks in Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getTrucksByGroup(selectedGroup.id).map((truck) => {
                const status = getLatestTruckStatus(truck.id);
                const statusColor = status?.status === 'active' ? 'green' : 
                                  status?.status === 'maintenance' ? 'yellow' : 'gray';
                
                return (
                  <div key={truck.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    {/* Truck photo */}
                    <div className="mb-3 rounded-lg overflow-hidden">
                      <TruckImage id={truck.id} width={320} height={200} />
                    </div>
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

// Lightweight summary of vendors inside a fleet group
function VendorsSummary({ groupId, loadState }) {
  const { backendTrucks, setBackendTrucks, vendors, setVendors, loadingTrucks, setLoadingTrucks, loadingVendors, setLoadingVendors } = loadState;

  React.useEffect(() => {
    let mounted = true;
    // load vendors once
    (async () => {
      try {
        setLoadingVendors(true);
        const vRes = await vendorsAPI.getAll();
        if (mounted && vRes.success && Array.isArray(vRes.data)) setVendors(vRes.data);
      } finally {
        if (mounted) setLoadingVendors(false);
      }
    })();
    // load trucks once
    (async () => {
      try {
        setLoadingTrucks(true);
        const tRes = await trucksAPI.getAll();
        if (mounted && tRes.success && Array.isArray(tRes.data)) {
          // normalize a bit for local usage
          setBackendTrucks(tRes.data.map(t => ({
            ...t,
            fleet_group_id: t.fleet_group_id || t.fleetGroupId || t.fleet_group || null,
            vendor_id: t.vendor_id || t.vendorId || null,
            name: t.name || t.id,
            plate_number: t.plate_number || t.plate || '-'
          })));
        }
      } finally {
        if (mounted) setLoadingTrucks(false);
      }
    })();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute per-vendor counts in this group
  const sourceTrucks = backendTrucks.length > 0 ? backendTrucks : trucks;
  const groupTrucks = React.useMemo(() => sourceTrucks.filter(t => t.fleet_group_id === groupId), [sourceTrucks, groupId]);

  const vendorMap = React.useMemo(() => {
    const map = new Map();
    for (const t of groupTrucks) {
      const vid = t.vendor_id || 'none';
      if (!map.has(vid)) map.set(vid, { total: 0, active: 0 });
      const entry = map.get(vid);
      entry.total += 1;
      // Active only determinable from dummy getLatestTruckStatus; for backend we may not have status
      const status = getLatestTruckStatus(t.id);
      if (status?.status === 'active') entry.active += 1;
    }
    return map;
  }, [groupTrucks]);

  const items = React.useMemo(() => {
    const list = [];
    // Ensure we show known vendors first, then 'Unassigned'
    const byId = new Map((vendors || []).map(v => [v.id, v]));
    for (const [vid, stats] of vendorMap.entries()) {
      const v = vid !== 'none' ? byId.get(vid) : null;
      const name = v?.name || 'Unassigned Vendor';
      list.push({ id: vid, name, total: stats.total, active: stats.active, inactive: Math.max(0, stats.total - stats.active) });
    }
    // Stable sort: real vendors first then Unassigned
    return list.sort((a, b) => (a.id === 'none') - (b.id === 'none'));
  }, [vendorMap, vendors]);

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Vendors in this Group</h3>
      {(loadingVendors || loadingTrucks) ? (
        <div className="text-gray-500 text-sm">Loading vendors...</div>
      ) : items.length === 0 ? (
        <div className="text-gray-500 text-sm">No trucks in this group.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {items.map((it, idx) => (
            <div key={`${it.id}-${idx}`} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="font-medium text-gray-900">{it.name}</div>
                <span className="text-xs text-gray-500">{`Vendor ${it.id === 'none' ? '-' : ''}`}</span>
              </div>
              <div className="mt-2 flex items-center gap-4 text-sm">
                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700">Active: {it.active}</span>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">Inactive: {it.inactive}</span>
                <span className="ml-auto text-xs text-gray-500">Total: {it.total}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FleetGroups;
