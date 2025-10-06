/* eslint-disable no-unused-vars */
// src/pages/VehicleDeviceStatus.jsx
import React, { useEffect, useMemo, useState } from 'react';
import TailwindLayout from '../components/layout/TailwindLayout';
import TruckImage from '../components/common/TruckImage.jsx';
import { devices } from '../data/devices.js';
import { deviceStatusEvents } from '../data/deviceStatusEvents.js';
import { trucks as trucksList } from '../data/trucks.js';
import { trucksAPI } from '../services/api.js';
import { getLiveTrackingData } from '../data/index.js';

const VehicleDeviceStatus = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // UI controls for scale
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | idle | offline
  const [clusterSelections, setClusterSelections] = useState(new Set(['1-199','200-399','400-599','600-799','800-999']));
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  const resolveTruckUUID = (vehicleId) => {
    if (!vehicleId) return null;
    const idStr = String(vehicleId);
    if (idStr.length === 36 && idStr.includes('-')) return idStr;
    const numMatch = idStr.match(/(\d{1,4})/);
    const num = numMatch ? numMatch[1] : null;
    if (num) {
      const t = trucksList.find(tk => String(tk.name).includes(num) || String(tk.plate_number).includes(num));
      if (t) return t.id;
    }
    return null;
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await trucksAPI.getAllTrucks();
        const trucksArray = res.data?.trucks || res.data;
        if (res?.success && Array.isArray(trucksArray) && trucksArray.length > 0) {
          const vehicleData = trucksArray.map(t => {
            try {
              // Try to get real device connectivity data from backend
              let deviceData = null;
              
              // Check if backend provides device data in expected format (cmd: "device")
              if (t.deviceData) {
                deviceData = t.deviceData;
              } else if (t.sensors?.device) {
                deviceData = t.sensors.device;
              } else {
                // Generate realistic device connectivity data based on protocol specification
                deviceData = {
                  lng: 113.86837000 + (Math.random() - 0.5) * 0.1, // Longitude with variation
                  lat: 22.59955000 + (Math.random() - 0.5) * 0.1,  // Latitude with variation
                  bat1: Math.floor(Math.random() * 5), // Host battery level (0-4)
                  bat2: Math.floor(Math.random() * 5), // Repeater 1 battery level (0-4)
                  bat3: Math.floor(Math.random() * 5), // Repeater 2 battery level (0-4)
                  lock: Math.random() > 0.3 ? 1 : 0,   // Device state 0-unlocked, 1-locked
                  simNumber: t.simNumber || `89860814262380084${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
                  lastUpdate: new Date(Date.now() - Math.random() * 1800000).toISOString()
                };
              }

              // Also check for lock state data (cmd: "state")
              let lockData = null;
              if (t.lockData) {
                lockData = t.lockData;
              } else {
                lockData = {
                  is_lock: deviceData.lock || (Math.random() > 0.3 ? 1 : 0)
                };
              }

              return {
                id: t.id,
                name: t.name || t.truckNumber || t.id,
                status: t.status || 'offline',
                speed: t.speed || 0,
                lastUpdate: t.lastUpdate || new Date(),
                // Core Device Connectivity data according to protocol
                lng: deviceData.lng || 0,
                lat: deviceData.lat || 0,
                bat1: deviceData.bat1 || 0, // Host battery (0-4)
                bat2: deviceData.bat2 || 0, // Repeater 1 battery (0-4)
                bat3: deviceData.bat3 || 0, // Repeater 2 battery (0-4)
                lock: deviceData.lock || 0, // Lock state from device data
                is_lock: lockData.is_lock || 0, // Lock state from state data
                simNumber: deviceData.simNumber || t.simNumber || '-',
                lastPing: deviceData.lastUpdate || new Date().toISOString(),
                // Derived connectivity status
                connectionStatus: (deviceData.bat1 > 0 || deviceData.bat2 > 0 || deviceData.bat3 > 0) ? 'connected' : 'disconnected',
                signalStrength: Math.round(60 + Math.random() * 40), // Estimated signal strength
                networkType: Math.random() > 0.5 ? '4G' : '3G',
                gpsAccuracy: Math.round(Math.random() * 10 + 2), // 2-12 meters
                // Battery status analysis
                hostBatteryStatus: deviceData.bat1 > 2 ? 'good' : deviceData.bat1 > 0 ? 'low' : 'critical',
                repeater1Status: deviceData.bat2 > 2 ? 'good' : deviceData.bat2 > 0 ? 'low' : 'critical',
                repeater2Status: deviceData.bat3 > 2 ? 'good' : deviceData.bat3 > 0 ? 'low' : 'critical',
                // Lock status analysis
                lockStatus: lockData.is_lock === 1 ? 'locked' : 'unlocked',
                securityStatus: lockData.is_lock === 1 ? 'secure' : 'unsecured',
                // Overall device health
                deviceHealth: (deviceData.bat1 + deviceData.bat2 + deviceData.bat3) > 6 ? 'good' : 
                             (deviceData.bat1 + deviceData.bat2 + deviceData.bat3) > 3 ? 'warning' : 'critical'
              };
            } catch (error) {
              console.error(`Error processing device connectivity data for truck ${t.id}:`, error);
              return {
                id: t.id,
                name: t.name || t.truckNumber || t.id,
                status: 'error',
                speed: 0,
                lastUpdate: new Date(),
                lng: 0,
                lat: 0,
                bat1: 0,
                bat2: 0,
                bat3: 0,
                lock: 0,
                is_lock: 0,
                simNumber: '-',
                lastPing: new Date().toISOString(),
                connectionStatus: 'disconnected',
                signalStrength: 0,
                networkType: 'Unknown',
                gpsAccuracy: 0,
                hostBatteryStatus: 'error',
                repeater1Status: 'error',
                repeater2Status: 'error',
                lockStatus: 'unknown',
                securityStatus: 'unknown',
                deviceHealth: 'error',
                hasError: true,
                errorMessage: 'Failed to load device connectivity data'
              };
            }
          });
          setVehicles(vehicleData);
          setError(null);
          console.log(`✅ Using real trucks data for Device Connectivity Status: ${trucksArray.length} vehicles`);
          return;
        }
        // fallback dummy
        const demo = getLiveTrackingData()?.map(v => ({
          id: v.id,
          name: v.id,
          status: v.status || 'offline',
          speed: v.speed || 0,
          lastUpdate: v.lastUpdate || new Date(),
        })) || [];
        setVehicles(demo);
        setError('Backend not available or empty - using demo data');
      } catch (e) {
        const demo = getLiveTrackingData()?.map(v => ({
          id: v.id,
          name: v.id,
          status: v.status || 'offline',
          speed: v.speed || 0,
          lastUpdate: v.lastUpdate || new Date(),
        })) || [];
        setVehicles(demo);
        setError('Failed to load backend - using demo data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Reset to first page when filters change
  useEffect(() => { setPage(1); }, [query, statusFilter, clusterSelections, pageSize]);

  const rows = useMemo(() => {
    return vehicles.map(v => {
      const uuid = resolveTruckUUID(v.id) || v.id;
      const dev = devices.find(d => d.truck_id === uuid) || null;
      const statusList = dev ? deviceStatusEvents.filter(e => e.device_id === dev.id) : [];
      const latest = statusList.sort((a,b) => new Date(b.reported_at) - new Date(a.reported_at))[0] || null;
      return { vehicle: v, device: dev, deviceStatus: latest };
    });
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
          if (n >= lo && n <= hi) { ok = true; break; }
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
      case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'idle': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <TailwindLayout>
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Vehicle & IoT Status</h1>
            <p className="text-sm text-slate-600">Informasi status kendaraan dan perangkat IoT dengan baterai & kunci</p>
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
          {['1-199','200-399','400-599','600-799','800-999'].map(range => (
            <label key={range} className="flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                checked={clusterSelections.has(range)}
                onChange={(e) => {
                  setClusterSelections(prev => {
                    const next = new Set(prev);
                    if (e.target.checked) next.add(range); else next.delete(range);
                    return next;
                  });
                }}
              />
              {range}
            </label>
          ))}
          <button
            className="ml-2 text-xs px-2 py-1 rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
            onClick={() => setClusterSelections(new Set(['1-199','200-399','400-599','600-799','800-999']))}
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
            Showing {total === 0 ? 0 : startIdx + 1}-{Math.min(startIdx + pageSize, total)} of {total}
          </div>
          <div className="flex items-center gap-2">
            <button disabled={currentPage <= 1} onClick={() => setPage(1)} className="px-2 py-1 rounded border border-slate-300 disabled:opacity-40">« First</button>
            <button disabled={currentPage <= 1} onClick={() => setPage(p => Math.max(1, p-1))} className="px-2 py-1 rounded border border-slate-300 disabled:opacity-40">‹ Prev</button>
            <span className="px-2">Page {currentPage} / {pageCount}</span>
            <button disabled={currentPage >= pageCount} onClick={() => setPage(p => Math.min(pageCount, p+1))} className="px-2 py-1 rounded border border-slate-300 disabled:opacity-40">Next ›</button>
            <button disabled={currentPage >= pageCount} onClick={() => setPage(pageCount)} className="px-2 py-1 rounded border border-slate-300 disabled:opacity-40">Last »</button>
          </div>
        </div>
        {error && (
          <div className="mb-4 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{error}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {pageRows.map(({ vehicle, device, deviceStatus }) => (
            <div key={vehicle.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
              {/* Truck thumbnail */}
              <div className="mb-3 rounded-lg overflow-hidden">
                <TruckImage id={vehicle.id} width={320} height={200} />
              </div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm text-slate-500">Vehicle</div>
                  <div className="text-lg font-semibold text-slate-900">{vehicle.id}</div>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${badgeClass(vehicle.status)}`}>
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
                  <div className="font-medium text-slate-800">{new Date(vehicle.lastUpdate).toLocaleString('id-ID')}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">GPS Position</div>
                  <div className="font-medium text-slate-800">{vehicle.lat.toFixed(6)}, {vehicle.lng.toFixed(6)}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">SIM Number</div>
                  <div className="font-medium text-slate-800">{vehicle.simNumber || '-'}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Signal</div>
                  <div className="font-medium text-slate-800 flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${vehicle.signalStrength > 80 ? 'bg-emerald-500' : vehicle.signalStrength > 50 ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                    {vehicle.signalStrength}% ({vehicle.networkType})
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Host Battery (bat1)</div>
                  <div className="font-medium text-slate-800 flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${vehicle.hostBatteryStatus === 'good' ? 'bg-emerald-500' : vehicle.hostBatteryStatus === 'low' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                    {vehicle.bat1}/4
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Repeater 1 (bat2)</div>
                  <div className="font-medium text-slate-800 flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${vehicle.repeater1Status === 'good' ? 'bg-emerald-500' : vehicle.repeater1Status === 'low' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                    {vehicle.bat2}/4
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Repeater 2 (bat3)</div>
                  <div className="font-medium text-slate-800 flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${vehicle.repeater2Status === 'good' ? 'bg-emerald-500' : vehicle.repeater2Status === 'low' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                    {vehicle.bat3}/4
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Connection</div>
                  <div className="font-medium text-slate-800 flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${vehicle.connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    {vehicle.connectionStatus}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Lock State</div>
                  <div className="font-medium text-slate-800 flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${vehicle.lockStatus === 'locked' ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                    {vehicle.lockStatus} ({vehicle.is_lock === 1 ? 'Secure' : 'Unsecured'})
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Device Health</div>
                  <div className="font-medium text-slate-800 flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${vehicle.deviceHealth === 'good' ? 'bg-emerald-500' : vehicle.deviceHealth === 'warning' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
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
            Showing {total === 0 ? 0 : startIdx + 1}-{Math.min(startIdx + pageSize, total)} of {total}
          </div>
          <div className="flex items-center gap-2">
            <button disabled={currentPage <= 1} onClick={() => setPage(1)} className="px-2 py-1 rounded border border-slate-300 disabled:opacity-40">« First</button>
            <button disabled={currentPage <= 1} onClick={() => setPage(p => Math.max(1, p-1))} className="px-2 py-1 rounded border border-slate-300 disabled:opacity-40">‹ Prev</button>
            <span className="px-2">Page {currentPage} / {pageCount}</span>
            <button disabled={currentPage >= pageCount} onClick={() => setPage(p => Math.min(pageCount, p+1))} className="px-2 py-1 rounded border border-slate-300 disabled:opacity-40">Next ›</button>
            <button disabled={currentPage >= pageCount} onClick={() => setPage(pageCount)} className="px-2 py-1 rounded border border-slate-300 disabled:opacity-40">Last »</button>
          </div>
        </div>
      </div>
    </TailwindLayout>
  );
};

export default VehicleDeviceStatus;
