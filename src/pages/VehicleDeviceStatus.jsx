/* eslint-disable no-unused-vars */
// src/pages/VehicleDeviceStatus.jsx
import React, { useEffect, useMemo, useState } from 'react';
import TailwindLayout from '../components/layout/TailwindLayout';
import TruckImage from '../components/common/TruckImage.jsx';
import { trucksApi } from '../services/api2'; // BE2 untuk master data trucks

const VehicleDeviceStatus = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // UI controls for scale
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | idle | offline
  const [clusterSelections, setClusterSelections] = useState(
    new Set(['1-199', '200-399', '400-599', '600-799', '800-999'])
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  const resolveTruckUUID = (vehicleId) => {
    if (!vehicleId) return null;
    const idStr = String(vehicleId);
    if (idStr.length === 36 && idStr.includes('-')) return idStr;
    return idStr;
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
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
      } catch (e) {
        setVehicles([]);
        setError('Failed to load backend');
      } finally {
        setLoading(false);
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
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Vehicle & IoT Status</h1>
            <p className="text-sm text-slate-600">
              Informasi status kendaraan dan perangkat IoT dengan baterai & kunci
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari truck ID / nama"
              className="px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="idle">Idle</option>
              <option value="offline">Offline</option>
            </select>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
              className="px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={12}>12 / page</option>
              <option value={24}>24 / page</option>
              <option value={48}>48 / page</option>
              <option value={96}>96 / page</option>
            </select>
          </div>
        </div>

        {/* Cluster filter */}
        <div className="mb-4 flex items-center gap-4 flex-wrap">
          <div className="text-xs font-medium text-slate-600">Cluster (Truck No)</div>
          {['1-199', '200-399', '400-599', '600-799', '800-999'].map((range) => (
            <label key={range} className="flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
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
              {range}
            </label>
          ))}
          <button
            className="ml-2 text-xs px-2 py-1 rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
            onClick={() =>
              setClusterSelections(new Set(['1-199', '200-399', '400-599', '600-799', '800-999']))
            }
          >
            Select All
          </button>
          <button
            className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
            onClick={() => setClusterSelections(new Set())}
          >
            Clear
          </button>
        </div>

        {/* Summary and pagination header */}
        <div className="mb-3 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing {total === 0 ? 0 : startIdx + 1}-{Math.min(startIdx + pageSize, total)} of{' '}
            {total}
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setPage(1)}
              className="px-2 py-1 rounded border border-slate-300 disabled:opacity-40"
            >
              « First
            </button>
            <button
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2 py-1 rounded border border-slate-300 disabled:opacity-40"
            >
              ‹ Prev
            </button>
            <span className="px-2">
              Page {currentPage} / {pageCount}
            </span>
            <button
              disabled={currentPage >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              className="px-2 py-1 rounded border border-slate-300 disabled:opacity-40"
            >
              Next ›
            </button>
            <button
              disabled={currentPage >= pageCount}
              onClick={() => setPage(pageCount)}
              className="px-2 py-1 rounded border border-slate-300 disabled:opacity-40"
            >
              Last »
            </button>
          </div>
        </div>
        {error && (
          <div className="mb-4 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {pageRows.map(({ vehicle, device, deviceStatus }) => (
            <div
              key={vehicle.id}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4"
            >
              {/* Truck thumbnail */}
              <div className="mb-3 rounded-lg overflow-hidden">
                <TruckImage id={vehicle.id} width={320} height={200} />
              </div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm text-slate-500">Vehicle</div>
                  <div className="text-lg font-semibold text-slate-900">{vehicle.id}</div>
                </div>
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border ${badgeClass(vehicle.status)}`}
                >
                  {String(vehicle.status || 'offline').toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-[11px] text-slate-500">Speed</div>
                  <div className="font-medium text-slate-800">{vehicle.speed} km/h</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Last Update</div>
                  <div className="font-medium text-slate-800">
                    {new Date(vehicle.lastUpdate).toLocaleString('id-ID')}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">GPS Position</div>
                  <div className="font-medium text-slate-800">
                    {vehicle.lat.toFixed(6)}, {vehicle.lng.toFixed(6)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">SIM Number</div>
                  <div className="font-medium text-slate-800">{vehicle.simNumber || '-'}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Signal</div>
                  <div className="font-medium text-slate-800 flex items-center gap-1">
                    <span
                      className={`w-2 h-2 rounded-full ${vehicle.signalStrength > 80 ? 'bg-emerald-500' : vehicle.signalStrength > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                    ></span>
                    {vehicle.signalStrength}% ({vehicle.networkType})
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Host Battery (bat1)</div>
                  <div className="font-medium text-slate-800 flex items-center gap-1">
                    <span
                      className={`w-2 h-2 rounded-full ${vehicle.hostBatteryStatus === 'good' ? 'bg-emerald-500' : vehicle.hostBatteryStatus === 'low' ? 'bg-amber-500' : 'bg-red-500'}`}
                    ></span>
                    {vehicle.bat1}/4
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Repeater 1 (bat2)</div>
                  <div className="font-medium text-slate-800 flex items-center gap-1">
                    <span
                      className={`w-2 h-2 rounded-full ${vehicle.repeater1Status === 'good' ? 'bg-emerald-500' : vehicle.repeater1Status === 'low' ? 'bg-amber-500' : 'bg-red-500'}`}
                    ></span>
                    {vehicle.bat2}/4
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Repeater 2 (bat3)</div>
                  <div className="font-medium text-slate-800 flex items-center gap-1">
                    <span
                      className={`w-2 h-2 rounded-full ${vehicle.repeater2Status === 'good' ? 'bg-emerald-500' : vehicle.repeater2Status === 'low' ? 'bg-amber-500' : 'bg-red-500'}`}
                    ></span>
                    {vehicle.bat3}/4
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Connection</div>
                  <div className="font-medium text-slate-800 flex items-center gap-1">
                    <span
                      className={`w-2 h-2 rounded-full ${vehicle.connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-red-500'}`}
                    ></span>
                    {vehicle.connectionStatus}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Lock State</div>
                  <div className="font-medium text-slate-800 flex items-center gap-1">
                    <span
                      className={`w-2 h-2 rounded-full ${vehicle.lockStatus === 'locked' ? 'bg-emerald-500' : 'bg-gray-300'}`}
                    ></span>
                    {vehicle.lockStatus} ({vehicle.is_lock === 1 ? 'Secure' : 'Unsecured'})
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Device Health</div>
                  <div className="font-medium text-slate-800 flex items-center gap-1">
                    <span
                      className={`w-2 h-2 rounded-full ${vehicle.deviceHealth === 'good' ? 'bg-emerald-500' : vehicle.deviceHealth === 'warning' ? 'bg-amber-500' : 'bg-red-500'}`}
                    ></span>
                    {vehicle.deviceHealth}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">GPS Accuracy</div>
                  <div className="font-medium text-slate-800">{vehicle.gpsAccuracy}m</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination footer */}
        <div className="mt-4 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing {total === 0 ? 0 : startIdx + 1}-{Math.min(startIdx + pageSize, total)} of{' '}
            {total}
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setPage(1)}
              className="px-2 py-1 rounded border border-slate-300 disabled:opacity-40"
            >
              « First
            </button>
            <button
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2 py-1 rounded border border-slate-300 disabled:opacity-40"
            >
              ‹ Prev
            </button>
            <span className="px-2">
              Page {currentPage} / {pageCount}
            </span>
            <button
              disabled={currentPage >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              className="px-2 py-1 rounded border border-slate-300 disabled:opacity-40"
            >
              Next ›
            </button>
            <button
              disabled={currentPage >= pageCount}
              onClick={() => setPage(pageCount)}
              className="px-2 py-1 rounded border border-slate-300 disabled:opacity-40"
            >
              Last »
            </button>
          </div>
        </div>
      </div>
    </TailwindLayout>
  );
};

export default VehicleDeviceStatus;
