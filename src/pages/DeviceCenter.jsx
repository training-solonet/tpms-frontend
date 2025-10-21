// src/pages/DeviceCenter.jsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TailwindLayout from '../components/layout/TailwindLayout';
// Use Backend 2 APIs
import { devicesApi, trucksApi } from '../services/api2';

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

const Tabs = [
  { key: 'status', label: 'Status' },
  { key: 'sensors', label: 'Sensors' },
  { key: 'locks', label: 'Locks' },
];

const StatusTab = ({ search, truckFilter, devices, trucks, onEdit, onDelete }) => {
  const rows = devices.map((d) => {
    const truck = trucks.find((t) => t.id === d.truck_id);
    return {
      id: d.id,
      imei: d.imei || d.serial || d.sn || '-',
      truckName: truck ? `${truck.name} (${truck.plate_number || 'N/A'})` : 'Unassigned',
      truckId: truck?.id || null,
      battery: d.battery_level ?? 'N/A',
      signal: d.signal_strength ?? 'N/A',
      locked: d.lock_state ?? 'unknown',
      lastSeen:
        d.lastUpdate || d.updated_at
          ? new Date(d.lastUpdate || d.updated_at).toLocaleString()
          : 'N/A',
    };
  });

  const filtered = rows.filter((r) => {
    const matchesTruck =
      !truckFilter || r.truckId === truckFilter || (truckFilter === 'unassigned' && !r.truckId);
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      r.imei.toLowerCase().includes(q) ||
      r.truckName.toLowerCase().includes(q) ||
      String(r.battery).toLowerCase().includes(q) ||
      String(r.signal).toLowerCase().includes(q) ||
      String(r.locked).toLowerCase().includes(q);
    return matchesTruck && matchesSearch;
  });

  return (
    <div className="rounded-xl bg-white/60 backdrop-blur-sm border border-indigo-200/40 shadow-sm p-4">
      <div className="overflow-x-auto">
        <div className="max-h-[500px] overflow-y-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-white/80 backdrop-blur-sm text-left text-gray-600">
              <tr>
                <th className="py-2 pr-4">Device</th>
                <th className="py-2 pr-4">Truck</th>
                <th className="py-2 pr-4">Battery</th>
                <th className="py-2 pr-4">Signal</th>
                <th className="py-2 pr-4">Lock</th>
                <th className="py-2 pr-4">Last Seen</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-100/60">
              {filtered.map((r) => {
                const device = devices.find((d) => d.id === r.id);
                return (
                  <tr key={r.id} className="text-gray-900">
                    <td className="py-2 pr-4 font-mono">{r.imei}</td>
                    <td className="py-2 pr-4">{r.truckName}</td>
                    <td className="py-2 pr-4">{r.battery}%</td>
                    <td className="py-2 pr-4">{r.signal} dBm</td>
                    <td className="py-2 pr-4 capitalize">{String(r.locked)}</td>
                    <td className="py-2 pr-4 whitespace-nowrap">{r.lastSeen}</td>
                    <td className="py-2 pr-4">
                      <button
                        onClick={() => onEdit(device)}
                        className="text-indigo-600 hover:text-indigo-800 text-xs mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(device)}
                        className="text-red-600 hover:text-red-800 text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const SensorsTab = ({ search, truckFilter, sensors, devices, trucks }) => {
  const rows = sensors.map((s) => {
    const device = devices.find((d) => d.id === s.device_id);
    const truck = device ? trucks.find((t) => t.id === device.truck_id) : undefined;
    return {
      id: s.id,
      type: s.type,
      position: s.position || '-',
      deviceName: device?.imei || device?.serial || '-',
      truckName: truck ? `${truck.name} (${truck.plate_number || 'N/A'})` : 'Unassigned',
      truckId: truck?.id || null,
      status: s.removed_at ? 'removed' : 'active',
    };
  });

  const filtered = rows.filter((r) => {
    const matchesTruck =
      !truckFilter || r.truckId === truckFilter || (truckFilter === 'unassigned' && !r.truckId);
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      r.type.toLowerCase().includes(q) ||
      r.position.toLowerCase().includes(q) ||
      r.deviceName.toLowerCase().includes(q) ||
      r.truckName.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q);
    return matchesTruck && matchesSearch;
  });

  return (
    <div className="rounded-xl bg-white/60 backdrop-blur-sm border border-indigo-200/40 shadow-sm p-4">
      <div className="overflow-x-auto">
        <div className="max-h-[500px] overflow-y-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-white/80 backdrop-blur-sm text-left text-gray-600">
              <tr>
                <th className="py-2 pr-4">Sensor</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Position</th>
                <th className="py-2 pr-4">Device</th>
                <th className="py-2 pr-4">Truck</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-100/60">
              {filtered.map((r) => (
                <tr key={r.id} className="text-gray-900">
                  <td className="py-2 pr-4 font-mono">{r.id.slice(0, 8)}…</td>
                  <td className="py-2 pr-4 capitalize">{r.type}</td>
                  <td className="py-2 pr-4">{r.position}</td>
                  <td className="py-2 pr-4">{r.deviceName}</td>
                  <td className="py-2 pr-4">{r.truckName}</td>
                  <td className="py-2 pr-4 capitalize">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const LocksTab = ({ search, truckFilter, actionFilter, lockEvents, devices, trucks }) => {
  const rows = lockEvents
    .slice()
    .sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at))
    .map((e) => {
      const device = devices.find((d) => d.id === e.device_id);
      const truck = device ? trucks.find((t) => t.id === device.truck_id) : undefined;
      return {
        id: e.id,
        when: new Date(e.changed_at).toLocaleString(),
        deviceName: device?.imei || device?.serial || '-',
        truckName: truck ? `${truck.name} (${truck.plate_number || 'N/A'})` : 'Unassigned',
        truckId: truck?.id || null,
        action: e.action,
        source: e.source || '-',
      };
    });

  const filtered = rows.filter((r) => {
    const matchesTruck =
      !truckFilter || r.truckId === truckFilter || (truckFilter === 'unassigned' && !r.truckId);
    const matchesAction = !actionFilter || r.action === actionFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      r.deviceName.toLowerCase().includes(q) ||
      r.truckName.toLowerCase().includes(q) ||
      r.action.toLowerCase().includes(q) ||
      r.source.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q);
    return matchesTruck && matchesAction && matchesSearch;
  });

  return (
    <div className="rounded-xl bg-white/60 backdrop-blur-sm border border-indigo-200/40 shadow-sm p-4">
      <div className="overflow-x-auto">
        <div className="max-h-[500px] overflow-y-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-white/80 backdrop-blur-sm text-left text-gray-600">
              <tr>
                <th className="py-2 pr-4">When</th>
                <th className="py-2 pr-4">Action</th>
                <th className="py-2 pr-4">Device</th>
                <th className="py-2 pr-4">Truck</th>
                <th className="py-2 pr-4">Source</th>
                <th className="py-2 pr-4">Event ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-100/60">
              {filtered.map((r) => (
                <tr key={r.id} className="text-gray-900">
                  <td className="py-2 pr-4 whitespace-nowrap">{r.when}</td>
                  <td className="py-2 pr-4 capitalize">{r.action}</td>
                  <td className="py-2 pr-4">{r.deviceName}</td>
                  <td className="py-2 pr-4">{r.truckName}</td>
                  <td className="py-2 pr-4">{r.source}</td>
                  <td className="py-2 pr-4 font-mono">{r.id.slice(0, 8)}…</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const DeviceCenter = () => {
  const location = useLocation();
  const query = useQuery();
  const navigate = useNavigate();
  const initialTab = query.get('tab') || 'status';
  const [activeTab, setActiveTab] = React.useState(
    Tabs.some((t) => t.key === initialTab) ? initialTab : 'status'
  );
  const [search, setSearch] = React.useState('');
  const [truckFilter, setTruckFilter] = React.useState('');
  const [actionFilter, setActionFilter] = React.useState('');
  const [devices, setDevices] = React.useState([]);
  const [trucks, setTrucks] = React.useState([]);
  const [sensors, setSensors] = React.useState([]);
  const [lockEvents, setLockEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  // eslint-disable-next-line no-unused-vars
  const [showDeviceModal, setShowDeviceModal] = React.useState(false);
  // eslint-disable-next-line no-unused-vars
  const [editingDevice, setEditingDevice] = React.useState(null);

  const loadData = async () => {
    try {
      console.log('📡 Loading devices data from Backend 2...');

      const [devicesRes, trucksRes, sensorsRes] = await Promise.all([
        devicesApi.getAll(),
        trucksApi.getAll(),
        devicesApi.getAllSensors().catch((err) => {
          console.warn('Failed to load sensors:', err);
          return { data: { sensors: [] } };
        }),
      ]);

      console.log('✅ Devices response:', devicesRes);
      console.log('✅ Trucks response:', trucksRes);
      console.log('✅ Sensors response:', sensorsRes);

      const devicesArray = devicesRes?.data?.devices || [];
      const trucksArray = trucksRes?.data?.trucks || [];
      const sensorsArray = sensorsRes?.data?.sensors || sensorsRes?.data || [];

      setDevices(Array.isArray(devicesArray) ? devicesArray : []);
      setTrucks(Array.isArray(trucksArray) ? trucksArray : []);
      setSensors(Array.isArray(sensorsArray) ? sensorsArray : []);
      setLockEvents([]); // Lock events would come from a separate API endpoint
    } catch (error) {
      console.error('❌ Failed to load data:', error);
      setDevices([]);
      setTrucks([]);
      setSensors([]);
      setLockEvents([]);
    }
    setLoading(false);
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const handleEditDevice = (device) => {
    setEditingDevice(device);
    setShowDeviceModal(true);
  };

  const handleDeleteDevice = async (device) => {
    if (!window.confirm(`Delete device ${device.imei || device.sn}?`)) return;
    try {
      await devicesApi.delete(device.id);
      console.log('✅ Device deleted successfully');
      alert('Device deleted successfully!');
      await loadData();
    } catch (error) {
      console.error('❌ Failed to delete device:', error);
      alert(`Failed to delete device: ${error.message || 'Unknown error'}`);
    }
  };

  const setTab = (tab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(location.search);
    params.set('tab', tab);
    navigate({ search: params.toString() }, { replace: true });
  };

  // Use loading state to show a lightweight placeholder
  if (loading) {
    return (
      <TailwindLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6">
          <div className="max-w-7xl mx-auto text-sm text-gray-600">Loading devices...</div>
        </div>
      </TailwindLayout>
    );
  }

  return (
    <TailwindLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {location.pathname.startsWith('/fleet/status')
                  ? 'Vehicle Status'
                  : 'IoT Device Center'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {location.pathname.startsWith('/fleet/status')
                  ? 'Kondisi perangkat pada kendaraan (battery, signal, lock)'
                  : 'Status, Sensors, dan Locks dalam satu halaman'}
              </p>
            </div>
            <button
              onClick={() => setShowDeviceModal(true)}
              className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700"
            >
              Add Device
            </button>
          </div>

          <div className="mb-6 inline-flex rounded-lg bg-white/60 backdrop-blur-sm border border-indigo-200/40 p-1 shadow-sm">
            {Tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition ${
                  activeTab === t.key
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-gray-700 hover:bg-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search device/truck/status..."
              className="w-full rounded-lg border border-indigo-200/50 bg-white/60 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={truckFilter}
              onChange={(e) => setTruckFilter(e.target.value || '')}
              className="w-full rounded-lg border border-indigo-200/50 bg-white/60 px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Trucks</option>
              <option value="unassigned">Unassigned</option>
              {trucks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.plate_number || 'N/A'})
                </option>
              ))}
            </select>
            {activeTab === 'locks' ? (
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value || '')}
                className="w-full rounded-lg border border-indigo-200/50 bg-white/60 px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Actions</option>
                <option value="lock">lock</option>
                <option value="unlock">unlock</option>
              </select>
            ) : (
              <div className="hidden sm:block" />
            )}
          </div>

          {activeTab === 'status' && (
            <StatusTab
              search={search}
              truckFilter={truckFilter}
              devices={devices}
              trucks={trucks}
              onEdit={handleEditDevice}
              onDelete={handleDeleteDevice}
            />
          )}
          {activeTab === 'sensors' && (
            <SensorsTab
              search={search}
              truckFilter={truckFilter}
              sensors={sensors}
              devices={devices}
              trucks={trucks}
            />
          )}
          {activeTab === 'locks' && (
            <LocksTab
              search={search}
              truckFilter={truckFilter}
              actionFilter={actionFilter}
              lockEvents={lockEvents}
              devices={devices}
              trucks={trucks}
            />
          )}
        </div>
      </div>
    </TailwindLayout>
  );
};

export default DeviceCenter;
