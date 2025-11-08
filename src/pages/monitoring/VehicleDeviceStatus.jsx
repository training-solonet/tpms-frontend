// src/pages/VehicleDeviceStatus.jsx
import React, { useEffect, useMemo, useState } from 'react';
import TailwindLayout from '../../components/layout/TailwindLayout.jsx';
import TruckImage from '../../components/common/TruckImage.jsx';

import { trucksApi } from 'services/management';

import {
  SignalIcon,
  BoltIcon,
  WifiIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const VehicleDeviceStatus = () => {
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState(null);
  // UI controls for scale
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | idle | offline
  const [clusterSelections, setClusterSelections] = useState(
    new Set(['1-199', '200-399', '400-599', '600-799', '800-999'])
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await trucksApi.getAllTrucks(); // Ubah ke trucksApi (BE2)
        const trucksArray = res.data?.trucks || res.data;
        if (res?.success && Array.isArray(trucksArray) && trucksArray.length > 0) {
          const vehicleData = trucksArray.map((t) => ({
            id: t.id || t.truckNumber || t.name || '-',
            name: t.name || t.truckNumber || t.plate_number || t.id,
            status: t.status || 'offline',
            speed: Number(t.speed || t.speed_kph || 0),
            lastUpdate: t.lastUpdate || t.updated_at || new Date(),
            lat: Number(t.latitude ?? t.lat ?? 0),
            lng: Number(t.longitude ?? t.lng ?? 0),
            simNumber: t.simNumber || '-',
            // Optional fields if backend provides
            lock: t.lock ?? 0,
            is_lock: t.is_lock ?? 0,
            lastPing: t.lastPing || t.lastUpdate || new Date().toISOString(),
            connectionStatus: t.connectionStatus || (t.speed > 0 ? 'connected' : 'disconnected'),
            signalStrength: Number(t.signalStrength ?? 0),
            networkType: t.networkType || '-',
            gpsAccuracy: Number(t.gpsAccuracy ?? 0),
            bat1: Number(t.bat1 ?? 0),
            bat2: Number(t.bat2 ?? 0),
            bat3: Number(t.bat3 ?? 0),
            hostBatteryStatus: t.hostBatteryStatus || 'unknown',
            repeater1Status: t.repeater1Status || 'unknown',
            repeater2Status: t.repeater2Status || 'unknown',
            lockStatus: t.is_lock === 1 ? 'locked' : 'unlocked',
            deviceHealth: t.deviceHealth || 'unknown',
          }));
          setVehicles(vehicleData);
          setError(null);
          return;
        }
        // Backend-only: no dummy fallback
        setVehicles([]);
        setError('Backend not available or empty');
      } catch {
        setVehicles([]);
        setError('Failed to load backend');
      }
    };
    load();
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, clusterSelections, pageSize]);

  const rows = useMemo(() => {
    return vehicles.map((v) => ({ vehicle: v, device: null, deviceStatus: null }));
  }, [vehicles]);

  const extractTruckNumber = (idOrName) => {
    if (!idOrName) return null;
    const m = String(idOrName).match(/(\d{1,4})/);
    return m ? parseInt(m[1], 10) : null;
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const hasClusterFilter = clusterSelections && clusterSelections.size > 0;
    return rows.filter(({ vehicle }) => {
      // search by id/name
      if (q) {
        const s = `${vehicle.id} ${vehicle.name || ''}`.toLowerCase();
        if (!s.includes(q)) return false;
      }
      // status filter
      if (statusFilter !== 'all') {
        if ((vehicle.status || '').toLowerCase() !== statusFilter) return false;
      }
      // cluster range filter (by truck number)
      if (hasClusterFilter) {
        const n = extractTruckNumber(vehicle.id);
        if (n == null) return false;
        let ok = false;
        for (const key of clusterSelections) {
          const [lo, hi] = key.split('-').map(Number);
          if (n >= lo && n <= hi) {
            ok = true;
            break;
          }
        }
        if (!ok) return false;
      }
      return true;
    });
  }, [rows, query, statusFilter, clusterSelections]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  const startIdx = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(startIdx, startIdx + pageSize);

  // Stats calculation
  const stats = useMemo(() => {
    const activeCount = vehicles.filter((v) => v.status === 'active').length;
    const warningCount = vehicles.filter(
      (v) =>
        v.hostBatteryStatus === 'low' ||
        v.repeater1Status === 'low' ||
        v.repeater2Status === 'low' ||
        v.signalStrength < 50
    ).length;
    const offlineCount = vehicles.filter((v) => v.status === 'offline').length;

    return {
      total: vehicles.length,
      active: activeCount,
      warning: warningCount,
      offline: offlineCount,
    };
  }, [vehicles]);

  const badgeClass = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'active':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'idle':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <TailwindLayout>
      <div className="mx-auto max-w-[1600px] p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Vehicle & IoT Status</h1>
          <p className="text-sm text-slate-600 mt-1">
            Monitor kesehatan perangkat IoT, baterai, dan konektivitas kendaraan
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Total Vehicles</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <WifiIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Active</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.active}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <SignalIcon className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Warning</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{stats.warning}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <ExclamationTriangleIcon className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Offline</p>
                <p className="text-3xl font-bold text-slate-600 mt-1">{stats.offline}</p>
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                <BoltIcon className="w-6 h-6 text-slate-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 mb-6">
          <div className="p-4 border-b border-slate-200">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by truck ID or name..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none pl-3 pr-9 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="idle">Idle</option>
                  <option value="offline">Offline</option>
                </select>
                <svg
                  className="absolute right-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>

              <div className="relative">
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
                  className="appearance-none pl-3 pr-9 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value={12}>12 / page</option>
                  <option value={24}>24 / page</option>
                  <option value={48}>48 / page</option>
                  <option value={96}>96 / page</option>
                </select>
                <svg
                  className="absolute right-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Cluster filter */}
          <div className="p-4 flex flex-wrap items-center gap-4">
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Cluster Range:
            </div>
            {['1-199', '200-399', '400-599', '600-799', '800-999'].map((range) => (
              <label
                key={range}
                className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  checked={clusterSelections.has(range)}
                  onChange={(e) => {
                    setClusterSelections((prev) => {
                      const next = new Set(prev);
                      if (e.target.checked) next.add(range);
                      else next.delete(range);
                      return next;
                    });
                  }}
                />
                <span>{range}</span>
              </label>
            ))}
            <button
              className="ml-2 text-xs px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium transition-colors"
              onClick={() =>
                setClusterSelections(new Set(['1-199', '200-399', '400-599', '600-799', '800-999']))
              }
            >
              Select All
            </button>
            <button
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium transition-colors"
              onClick={() => setClusterSelections(new Set())}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Pagination and Results Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-slate-600">
            Showing{' '}
            <span className="font-semibold text-slate-900">
              {total === 0 ? 0 : startIdx + 1}-{Math.min(startIdx + pageSize, total)}
            </span>{' '}
            of <span className="font-semibold text-slate-900">{total}</span> vehicles
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setPage(1)}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              First
            </button>
            <button
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-sm text-slate-700">
              Page <span className="font-semibold">{currentPage}</span> of{' '}
              <span className="font-semibold">{pageCount}</span>
            </span>
            <button
              disabled={currentPage >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
            <button
              disabled={currentPage >= pageCount}
              onClick={() => setPage(pageCount)}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Last
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {/* Vehicle Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {pageRows.map(({ vehicle }) => (
            <div
              key={vehicle.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Truck Image */}
              <div className="relative h-48 bg-slate-100">
                <TruckImage id={vehicle.id} width={400} height={250} />
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border shadow-sm ${badgeClass(vehicle.status)}`}
                  >
                    {String(vehicle.status || 'offline').toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="p-5">
                <div className="mb-4">
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
                    Vehicle ID
                  </div>
                  <div className="text-xl font-bold text-slate-900">{vehicle.id}</div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Speed</div>
                    <div className="text-lg font-semibold text-slate-900">
                      {vehicle.speed}{' '}
                      <span className="text-sm font-normal text-slate-500">km/h</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">SIM Number</div>
                    <div className="text-sm font-medium text-slate-700">
                      {vehicle.simNumber || '-'}
                    </div>
                  </div>
                </div>

                {/* IoT Device Status Section */}
                <div className="border-t border-slate-200 pt-4 mt-4">
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">
                    IoT Device Status
                  </div>

                  <div className="space-y-2.5">
                    {/* Signal Strength */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <SignalIcon className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">Signal</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${vehicle.signalStrength > 80 ? 'bg-emerald-500' : vehicle.signalStrength > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                        ></span>
                        <span className="text-sm font-semibold text-slate-900">
                          {vehicle.signalStrength}%
                        </span>
                        <span className="text-xs text-slate-500">({vehicle.networkType})</span>
                      </div>
                    </div>

                    {/* Host Battery (bat1) */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BoltIcon className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">Host Battery</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${vehicle.hostBatteryStatus === 'good' ? 'bg-emerald-500' : vehicle.hostBatteryStatus === 'low' ? 'bg-amber-500' : 'bg-red-500'}`}
                        ></span>
                        <span className="text-sm font-semibold text-slate-900">
                          {vehicle.bat1}/4
                        </span>
                      </div>
                    </div>

                    {/* Repeater 1 (bat2) */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <WifiIcon className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">Repeater 1</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${vehicle.repeater1Status === 'good' ? 'bg-emerald-500' : vehicle.repeater1Status === 'low' ? 'bg-amber-500' : 'bg-red-500'}`}
                        ></span>
                        <span className="text-sm font-semibold text-slate-900">
                          {vehicle.bat2}/4
                        </span>
                      </div>
                    </div>

                    {/* Repeater 2 (bat3) */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <WifiIcon className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">Repeater 2</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${vehicle.repeater2Status === 'good' ? 'bg-emerald-500' : vehicle.repeater2Status === 'low' ? 'bg-amber-500' : 'bg-red-500'}`}
                        ></span>
                        <span className="text-sm font-semibold text-slate-900">
                          {vehicle.bat3}/4
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* GPS & Last Update */}
                <div className="border-t border-slate-200 pt-4 mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">GPS Position</span>
                    <span className="font-mono text-slate-700">
                      {vehicle.lat.toFixed(6)}, {vehicle.lng.toFixed(6)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Last Update</span>
                    <span className="text-slate-700">
                      {new Date(vehicle.lastUpdate).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </TailwindLayout>
  );
};

export default VehicleDeviceStatus;
