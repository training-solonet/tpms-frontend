/* eslint-disable no-unused-vars */
import React from 'react';
import TailwindLayout from '../components/layout/TailwindLayout.jsx';
// Use Backend 2 API
import { driversApi } from '../services/api2';

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

export default function DriversList() {
  const [drivers, setDrivers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [error, setError] = React.useState('');

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      console.log('📡 Loading drivers from Backend 2...');

      const res = await driversApi.getAll();
      console.log('✅ Drivers response:', res);

      // Backend 2 returns data in res.data.drivers
      const driversArray = res.data?.drivers || res.data;

      if (Array.isArray(driversArray)) {
        setDrivers(driversArray);
        console.log(`✅ Loaded ${driversArray.length} drivers from Backend 2`);
        setError('');
      } else {
        setDrivers([]);
        setError('Drivers data unavailable');
        console.log('⚠️ Drivers endpoint returned no data');
      }
    } catch (e) {
      setDrivers([]);
      setError(e.message || 'Failed to load drivers');
      console.log('❌ Error loading drivers:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase();
    return drivers.filter((v) => {
      return (
        !q ||
        (v.name || '').toLowerCase().includes(q) ||
        (v.license_number || '').toLowerCase().includes(q) ||
        (v.phone || '').toLowerCase().includes(q) ||
        (v.badge_id || '').toLowerCase().includes(q)
      );
    });
  }, [drivers, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageData = filtered.slice(start, end);

  React.useEffect(() => setPage(1), [query, pageSize]);

  const onDelete = async (id) => {
    if (!window.confirm('Delete this driver?')) return;
    try {
      await driversApi.delete(id);
      console.log('✅ Driver deleted successfully');
      await load();
    } catch (error) {
      console.error('❌ Failed to delete driver:', error);
      alert('Failed to delete driver: ' + error.message);
    }
  };

  return (
    <TailwindLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Drivers</h1>
              <p className="text-sm text-gray-500">Manajemen data driver (CRUD)</p>
            </div>
            <a
              href="/drivers/new"
              className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700"
            >
              Add Driver
            </a>
          </div>

          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Search (name/license/phone/badge)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <label className="block">
              <span className="block text-sm font-medium text-gray-700">Page size</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                {[10, 25, 50, 100].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
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
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Name</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Badge ID</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">License No.</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Phone</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr>
                        <td className="px-3 py-6 text-gray-500" colSpan={5}>
                          Loading...
                        </td>
                      </tr>
                    ) : pageData.length === 0 ? (
                      <tr>
                        <td className="px-3 py-6 text-gray-500" colSpan={5}>
                          No data
                        </td>
                      </tr>
                    ) : (
                      pageData.map((v) => (
                        <tr key={v.id}>
                          <td className="px-3 py-2 text-gray-900 font-medium">{v.name}</td>
                          <td className="px-3 py-2">{v.badge_id || '-'}</td>
                          <td className="px-3 py-2">{v.license_number || '-'}</td>
                          <td className="px-3 py-2">{v.phone || '-'}</td>
                          <td className="px-3 py-2 text-right">
                            <a
                              href={`/drivers/${v.id}`}
                              className="inline-flex items-center px-3 py-1.5 rounded-md border text-sm mr-2"
                            >
                              Edit
                            </a>
                            <button
                              onClick={() => onDelete(v.id)}
                              className="inline-flex items-center px-3 py-1.5 rounded-md border text-sm text-red-600"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
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
