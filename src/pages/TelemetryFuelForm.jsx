/* eslint-disable no-unused-vars */
import React from 'react';
import TailwindLayout from '../components/layout/TailwindLayout.jsx';
import { fuelLevelEvents, trucks } from '../data/index.js';
// Removed dashboardAPI import - using dummy data

function Input({ label, ...props }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700">{label}</span>
      <input
        {...props}
        className={`mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${props.className || ''}`}
      />
    </label>
  );
}

function Select({ label, children, ...props }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700">{label}</span>
      <select
        {...props}
        className={`mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${props.className || ''}`}
      >
        {children}
      </select>
    </label>
  );
}

export default function TelemetryFuelForm() {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  // Load from backend first, fallback to dummy
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // Use dummy fuel data directly
        setRows(fuelLevelEvents.map(f => ({ ...f, truck_name: trucks.find(t => t.id === f.truck_id)?.name || 'Unknown' })));
        console.log('✅ Using dummy fuel data for TelemetryFuelForm');
      } catch (e) {
        if (mounted) {
          setError(e.message || 'Failed to load fuel data');
          setRows(fuelLevelEvents.map((e) => ({ ...e })));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const rowsWithTruck = React.useMemo(
    () =>
      rows.map((r) => {
        const t = trucks.find((tr) => tr.id === r.truck_id);
        return {
          ...r,
          truckName: t?.name || 'Unknown Truck',
          plate: t?.plate_number || 'N/A',
          group: t?.fleet_group_id || '-',
        };
      }),
    [rows]
  );

  const [query, setQuery] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase();
    return rowsWithTruck.filter((r) => {
      const matchesQ =
        !q ||
        r.truck_id.toLowerCase().includes(q) ||
        r.truckName.toLowerCase().includes(q) ||
        r.plate.toLowerCase().includes(q) ||
        String(r.fuel_percent).includes(q) ||
        (r.source || '').toLowerCase().includes(q);
      return matchesQ;
    });
  }, [rowsWithTruck, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageData = filtered.slice(start, end);

  React.useEffect(() => setPage(1), [query, pageSize]);

  return (
    <TailwindLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Telemetry - Fuel Levels</h1>
            <p className="text-sm text-gray-500">Form edit data level BBM (dummy)</p>
          </div>

          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Search (Truck/Plate/Fuel/Source)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Select
              label="Page size"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              {[10, 25, 50, 100].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <div className="md:col-span-2 flex items-end text-sm text-gray-600">
              Showing {start + 1}-{Math.min(end, filtered.length)} of {filtered.length}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow">
            <div className="overflow-x-auto">
              <div className="max-h-[60vh] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Truck</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Fuel %</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Changed At</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr><td className="px-3 py-6 text-gray-500" colSpan={4}>Loading...</td></tr>
                    ) : pageData.length === 0 ? (
                      <tr><td className="px-3 py-6 text-gray-500" colSpan={4}>No data</td></tr>
                    ) : pageData.map(r => (
                      <tr key={r.id}>
                        <td className="px-3 py-2">
                          <div className="font-medium text-gray-900">{r.truckName}</div>
                          <div className="text-xs text-gray-500">{r.truck_id} • {r.plate}</div>
                        </td>
                        <td className="px-3 py-2 w-40">{Number(r.fuel_percent).toFixed(1)}%</td>
                        <td className="px-3 py-2 w-64">{r.changed_at ? new Date(r.changed_at).toLocaleString() : '-'}</td>
                        <td className="px-3 py-2 w-56">{r.source || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {currentPage} / {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              <button
                className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-50"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </TailwindLayout>
  );
}
