import React from 'react';
import TailwindLayout from '../components/layout/TailwindLayout.jsx';
import { allDummyTrucks } from '../data/dummyTrucks';
import { trucksAPI } from '../services/api.js';

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

export default function TirePressureOverview() {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [clusters, setClusters] = React.useState([]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const trRes = await trucksAPI.getAllTrucks();
        let trucks;

        // Backend returns trucks nested under data.trucks
        const trucksArray = trRes.data?.trucks || trRes.data;
        if (trRes.success && Array.isArray(trucksArray) && trucksArray.length > 0) {
          trucks = trucksArray;
          console.log('✅ Using real trucks data for Tire Pressure Overview');
        } else {
          trucks = allDummyTrucks.map((t) => ({
            id: t.id,
            name: t.name,
            cluster: t.cluster,
            driver: { name: t.driver.name },
          }));
          console.log(
            `🔄 Backend trucks unavailable (${trRes.error || 'unknown error'}), using dummy data`
          );
        }

        // Build rows with 1 row per truck showing all tire sensors
        // Based on JSON protocol: cmd: "tpdata" with tireNo, tiprValue, tempValue, bat, exType
        const truckRows = [];
        for (const t of trucks) {
          try {
            // Try to get real TPMS data from backend
            let tpmsData = [];

            // Check if backend provides TPMS data in expected format
            if (t.sensors?.tpms && Array.isArray(t.sensors.tpms)) {
              tpmsData = t.sensors.tpms;
            } else if (t.tpmsData && Array.isArray(t.tpmsData)) {
              tpmsData = t.tpmsData;
            } else {
              // Generate realistic TPMS data based on protocol specification
              // Standard mining truck has 6 tires
              tpmsData = Array.from({ length: 6 }, (_, idx) => ({
                tireNo: idx + 1,
                tiprValue: Math.round((220 + Math.random() * 80) * 10) / 10, // 220-300 kPa
                tempValue: Math.round((35 + Math.random() * 25) * 10) / 10, // 35-60°C
                bat: Math.floor(Math.random() * 5), // 0-4 battery level
                exType: Math.random() > 0.85 ? (Math.random() > 0.5 ? '1' : '3') : '', // Occasional exceptions
                simNumber:
                  t.simNumber ||
                  `89860814262380084${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
                lastUpdate: new Date(Date.now() - Math.random() * 1800000).toISOString(),
              }));
            }

            const driverName = t.driver?.name || '-';
            const clusterName = t.cluster || '-';

            // Create one row per truck with all tire data
            truckRows.push({
              truckId: t.id,
              truckName: t.name || t.truckNumber || t.id,
              cluster: clusterName,
              driverName,
              simNumber: tpmsData[0]?.simNumber || '-',
              lastUpdate: tpmsData[0]?.lastUpdate || new Date().toISOString(),
              // All tire sensors data in one row
              tires: tpmsData.map((tpms, idx) => {
                // Parse exception types according to protocol
                const exceptionTypes = tpms.exType
                  ? tpms.exType.split(',').map((e) => e.trim())
                  : [];
                const hasHighPressure = exceptionTypes.includes('1');
                const hasLowPressure = exceptionTypes.includes('2');
                const hasHighTemp = exceptionTypes.includes('3');
                const hasSensorLost = exceptionTypes.includes('4');
                const hasLowBattery = exceptionTypes.includes('5');

                // Determine overall status based on exceptions
                let status = 'normal';
                if (hasSensorLost) status = 'critical';
                else if (hasHighPressure || hasLowPressure || hasHighTemp || hasLowBattery)
                  status = 'warning';

                return {
                  tireNo: tpms.tireNo || idx + 1,
                  position: `Tire ${tpms.tireNo || idx + 1}`,
                  tiprValue: tpms.tiprValue || 0,
                  tempValue: tpms.tempValue || 0,
                  bat: tpms.bat || 0,
                  exType: tpms.exType || '',
                  status,
                  hasHighPressure,
                  hasLowPressure,
                  hasHighTemp,
                  hasSensorLost,
                  hasLowBattery,
                  pressureStatus: hasHighPressure ? 'high' : hasLowPressure ? 'low' : 'normal',
                  tempStatus: hasHighTemp ? 'high' : 'normal',
                  batteryStatus: hasLowBattery ? 'low' : tpms.bat > 2 ? 'good' : 'medium',
                  sensorStatus: hasSensorLost ? 'lost' : 'connected',
                };
              }),
              // Overall truck tire status
              overallStatus: tpmsData.some((t) => {
                const ex = t.exType ? t.exType.split(',') : [];
                return ex.includes('4'); // Has sensor lost
              })
                ? 'critical'
                : tpmsData.some((t) => {
                      const ex = t.exType ? t.exType.split(',') : [];
                      return (
                        ex.includes('1') || ex.includes('2') || ex.includes('3') || ex.includes('5')
                      );
                    })
                  ? 'warning'
                  : 'normal',
              alertCount: tpmsData.reduce((count, t) => {
                const ex = t.exType ? t.exType.split(',').length : 0;
                return count + ex;
              }, 0),
            });
          } catch (error) {
            console.error(`Error processing TPMS data for truck ${t.id}:`, error);
            // Add error entry for this truck
            truckRows.push({
              truckId: t.id,
              truckName: t.name || t.truckNumber || t.id,
              cluster: t.cluster || '-',
              driverName: t.driver?.name || '-',
              simNumber: '-',
              lastUpdate: new Date().toISOString(),
              tires: [],
              overallStatus: 'error',
              alertCount: 0,
              hasError: true,
              errorMessage: 'Failed to load TPMS data',
            });
          }
        }

        if (mounted) {
          setRows(truckRows);
          const cls = Array.from(new Set(trucks.map((tt) => tt.cluster).filter(Boolean)));
          setClusters(cls);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const [query, setQuery] = React.useState('');
  const [cluster, setCluster] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);

  const filtered = React.useMemo(() => {
    return rows.filter((r) => {
      if (query) {
        const q = query.toLowerCase();
        if (
          !r.truckName.toLowerCase().includes(q) &&
          !r.truckId.toLowerCase().includes(q) &&
          !r.driverName.toLowerCase().includes(q) &&
          !r.simNumber.toLowerCase().includes(q)
        )
          return false;
      }
      if (cluster && r.cluster !== cluster) return false;
      return true;
    });
  }, [rows, query, cluster]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageData = filtered.slice(start, end);

  React.useEffect(() => setPage(1), [query, cluster, pageSize]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'normal':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'error':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getTireStatusColor = (status) => {
    switch (status) {
      case 'normal':
        return 'bg-green-100 border-green-300';
      case 'warning':
        return 'bg-yellow-100 border-yellow-300';
      case 'critical':
        return 'bg-red-100 border-red-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  return (
    <TailwindLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              Tire Pressure Overview - TPMS Data
            </h1>
            <p className="text-sm text-gray-500">
              1 baris per truk menampilkan semua sensor ban berdasarkan protokol JSON (cmd:
              "tpdata")
            </p>
          </div>

          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Search (Truck/Driver/SIM)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Select label="Cluster" value={cluster} onChange={(e) => setCluster(e.target.value)}>
              <option value="">All</option>
              {clusters.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
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
            <div className="flex items-end text-sm text-gray-600">
              Showing {start + 1}-{Math.min(end, filtered.length)} of {filtered.length}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow">
            <div className="overflow-x-auto">
              <div className="max-h-[70vh] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Truck Info</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Status</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Tire 1</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Tire 2</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Tire 3</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Tire 4</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Tire 5</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Tire 6</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">
                        SIM & Update
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr>
                        <td className="px-3 py-6 text-gray-500" colSpan={9}>
                          Loading...
                        </td>
                      </tr>
                    ) : pageData.length === 0 ? (
                      <tr>
                        <td className="px-3 py-6 text-gray-500" colSpan={9}>
                          No data
                        </td>
                      </tr>
                    ) : (
                      pageData.map((r) => {
                        return (
                          <tr key={r.truckId} className="align-top hover:bg-gray-50">
                            <td className="px-3 py-3">
                              <div className="font-medium text-gray-900">{r.truckName}</div>
                              <div className="text-xs text-gray-500">
                                {r.truckId} • {r.cluster}
                              </div>
                              <div className="text-xs text-gray-500">Driver: {r.driverName}</div>
                            </td>
                            <td className="px-3 py-3">
                              <div
                                className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(r.overallStatus)}`}
                              >
                                {r.overallStatus}
                              </div>
                              {r.alertCount > 0 && (
                                <div className="text-xs text-red-600 mt-1">
                                  {r.alertCount} alerts
                                </div>
                              )}
                            </td>
                            {/* Tire columns */}
                            {[1, 2, 3, 4, 5, 6].map((tireNum) => {
                              const tire = r.tires.find((t) => t.tireNo === tireNum);
                              if (!tire) {
                                return (
                                  <td key={tireNum} className="px-3 py-3">
                                    <div className="text-xs text-gray-400">No sensor</div>
                                  </td>
                                );
                              }
                              return (
                                <td key={tireNum} className="px-3 py-3">
                                  <div
                                    className={`p-2 rounded border ${getTireStatusColor(tire.status)}`}
                                  >
                                    <div className="text-xs font-medium">#{tire.tireNo}</div>
                                    <div className="text-xs">
                                      <div className="font-medium">{tire.tiprValue} kPa</div>
                                      <div>{tire.tempValue}°C</div>
                                      <div>Bat: {tire.bat}/4</div>
                                    </div>
                                    {tire.exType && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {tire.exType.split(',').map((ex) => (
                                          <span
                                            key={ex}
                                            className="px-1 py-0.5 bg-red-200 text-red-700 rounded text-xs"
                                          >
                                            {ex === '1'
                                              ? 'HP'
                                              : ex === '2'
                                                ? 'LP'
                                                : ex === '3'
                                                  ? 'HT'
                                                  : ex === '4'
                                                    ? 'Lost'
                                                    : ex === '5'
                                                      ? 'LB'
                                                      : ex}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                            <td className="px-3 py-3">
                              <div className="text-xs">
                                <div className="font-mono">{r.simNumber}</div>
                                <div className="text-gray-500 mt-1">
                                  {new Date(r.lastUpdate).toLocaleString('id-ID')}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
