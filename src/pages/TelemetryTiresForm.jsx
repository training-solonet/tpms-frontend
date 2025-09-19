import React from 'react';
import TailwindLayout from '../components/layout/TailwindLayout.jsx';
import { allDummyTrucks } from '../data/dummyTrucks';
import { trucksAPI } from '../services/api.js';

function Input({ label, ...props }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700">{label}</span>
      <input {...props} className={`mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${props.className || ''}`} />
    </label>
  );
}

function Select({ label, children, ...props }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700">{label}</span>
      <select {...props} className={`mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${props.className || ''}`}>
        {children}
      </select>
    </label>
  );
}

export default function TelemetryTiresForm() {
  // Attempt to load from backend; fallback to dummy flattened rows
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [clusters, setClusters] = React.useState([]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // Load trucks from backend
        const trRes = await trucksAPI.getAll();
        const trucks = trRes.success && Array.isArray(trRes.data) && trRes.data.length > 0
          ? trRes.data
          : allDummyTrucks.map(t => ({ id: t.id, name: t.name, cluster: t.cluster, driver: { name: t.driver.name } , tires: t.tires }));

        // Build flattened rows; try fetching tire data per truck when backend is online
        const flattened = [];
        for (const t of trucks) {
          let tires = t.tires;
          try {
            const tireRes = await trucksAPI.getTirePressures(t.id);
            if (tireRes.success && Array.isArray(tireRes.data)) {
              // Expect backend returns array of { tireNo, sensor: { data: {...} }, hub: {...} } or similar
              tires = tireRes.data;
            }
          } catch { /* empty */ }
          const driverName = t.driver?.name || '-';
          const clusterName = t.cluster || '-';
          if (Array.isArray(tires)) {
            tires.forEach((ti, idx) => {
              const tireNo = ti.tireNo || ti.position_no || idx + 1;
              const sensor = ti.sensor || { data: ti.tpdata || {} };
              flattened.push({
                truckId: t.id,
                truckName: t.name || t.id,
                cluster: clusterName,
                driverName,
                tireIndex: idx,
                tireNo,
                sensor,
              });
            });
          }
        }

        if (mounted) {
          setRows(flattened);
          const cls = Array.from(new Set(trucks.map(tt => tt.cluster).filter(Boolean)));
          setClusters(cls);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const [query, setQuery] = React.useState('');
  const [cluster, setCluster] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase();
    return rows.filter(r => {
      const matchesQ = !q ||
        r.truckId.toLowerCase().includes(q) ||
        r.truckName.toLowerCase().includes(q) ||
        String(r.tireNo).includes(q) ||
        r.driverName.toLowerCase().includes(q) ||
        r.sensor.data.simNumber.toLowerCase().includes(q);
      const matchesCluster = !cluster || r.cluster === cluster;
      return matchesQ && matchesCluster;
    });
  }, [rows, query, cluster]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageData = filtered.slice(start, end);

  React.useEffect(() => setPage(1), [query, cluster, pageSize]);

  // Read-only: no editing

  return (
    <TailwindLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Telemetry - Tire Pressure (tpdata)</h1>
            <p className="text-sm text-gray-500">Form edit data TPMS per ban berdasarkan protokol JSON</p>
          </div>

          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input label="Search (Truck/Tire/Driver/SIM)" value={query} onChange={e => setQuery(e.target.value)} />
            <Select label="Cluster" value={cluster} onChange={e => setCluster(e.target.value)}>
              <option value="">All</option>
              {clusters.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select label="Page size" value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
              {[10,25,50,100].map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            <div className="flex items-end text-sm text-gray-600">Showing {start + 1}-{Math.min(end, filtered.length)} of {filtered.length}</div>
          </div>

          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Truck</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Tire</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">SN</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">SIM</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">exType</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Pressure (kPa)</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Temp (°C)</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Battery (0-4)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td className="px-3 py-6 text-gray-500" colSpan={8}>Loading...</td></tr>
                ) : pageData.length === 0 ? (
                  <tr><td className="px-3 py-6 text-gray-500" colSpan={8}>No data</td></tr>
                ) : pageData.map(r => {
                  const tp = r.sensor?.data || {};
                  return (
                    <tr key={`${r.truckId}-${r.tireNo}`} className="align-top">
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-900">{r.truckName}</div>
                        <div className="text-xs text-gray-500">{r.truckId} • {r.cluster}</div>
                        <div className="text-xs text-gray-500">Driver: {r.driverName}</div>
                      </td>
                      <td className="px-3 py-2">#{r.tireNo}</td>
                      <td className="px-3 py-2 w-48">{r.sensor?.sn || '-'}</td>
                      <td className="px-3 py-2 w-56">{tp.simNumber || '-'}</td>
                      <td className="px-3 py-2 w-56">{tp.exType || '-'}</td>
                      <td className="px-3 py-2 w-40">{tp.tiprValue ?? '-'}</td>
                      <td className="px-3 py-2 w-40">{tp.tempValue ?? '-'}</td>
                      <td className="px-3 py-2 w-40">{tp.bat ?? '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">Page {currentPage} / {totalPages}</div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-50" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
              <button className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-50" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
            </div>
          </div>
        </div>
      </div>
    </TailwindLayout>
  );
}
