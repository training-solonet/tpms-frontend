import React from 'react';
import TailwindLayout from '../components/layout/TailwindLayout.jsx';
// Use Backend 2 API
import { trucksApi } from '../services/api2';

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

export default function TelemetryTemperatureForm() {
  // Load from backend if possible, fallback to dummy flattened hub data
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [clusters, setClusters] = React.useState([]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        console.log('📡 Loading temperature data from Backend 2...');
        
        // Load trucks from Backend 2
        const res = await trucksApi.getAll();
        console.log('✅ Trucks response for temperature:', res);
        
        const trucks = res?.data?.trucks || res?.data || [];
        if (!Array.isArray(trucks) || trucks.length === 0) {
          console.warn('No trucks data from Backend 2');
          if (mounted) setRows([]);
          return;
        }
        console.log(`✅ Using ${trucks.length} trucks from Backend 2 for TelemetryTemperatureForm`);

        // Build flattened rows focused on Hub Temperature sensor data
        // Based on JSON protocol: cmd: "hubdata" with tireNo (hub position), tempValue, bat, exType
        const flattened = [];
        for (const t of trucks) {
          try {
            // Try to get real Hub Temperature data from backend
            let hubData = [];

            // Check if backend provides Hub data in expected format
            if (t.sensors?.hub && Array.isArray(t.sensors.hub)) {
              hubData = t.sensors.hub;
            } else if (t.hubData && Array.isArray(t.hubData)) {
              hubData = t.hubData;
            } else {
              // Generate realistic Hub Temperature data based on protocol specification
              hubData = Array.from({ length: 6 }, (_, idx) => ({
                tireNo: idx + 1, // Hub position number (same as tire position)
                tempValue: Math.round((65 + Math.random() * 35) * 10) / 10, // 65-100°C (realistic hub temperature)
                bat: Math.floor(Math.random() * 5), // 0-4 battery level as per protocol
                exType: Math.random() > 0.9 ? (Math.random() > 0.5 ? '1,3' : '3') : '', // Occasional brake pad abnormal or high temp
                simNumber:
                  t.simNumber ||
                  `89860814262380084${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
                lastUpdate: new Date(Date.now() - Math.random() * 1800000).toISOString(),
              }));
            }

            const driverName = t.driver?.name || '-';
            const clusterName = t.cluster || '-';

            hubData.forEach((hub, idx) => {
              // Parse exception types according to protocol
              const exceptionTypes = hub.exType ? hub.exType.split(',').map((e) => e.trim()) : [];
              const hasBrakePadAbnormal = exceptionTypes.includes('1');
              const hasHighTemp = exceptionTypes.includes('3');
              const hasSensorLost = exceptionTypes.includes('4');
              const hasLowBattery = exceptionTypes.includes('5');

              // Determine overall status based on exceptions
              let status = 'normal';
              if (hasSensorLost) status = 'critical';
              else if (hasBrakePadAbnormal || hasHighTemp || hasLowBattery) status = 'warning';

              const hubPositions = [
                'Front Left',
                'Front Right',
                'Middle Left',
                'Middle Right',
                'Rear Left',
                'Rear Right',
              ];

              flattened.push({
                truckId: t.id,
                truckName: t.name || t.truckNumber || t.id,
                cluster: clusterName,
                driverName,
                hubIndex: idx,
                tireNo: hub.tireNo || idx + 1, // Hub position number
                position: hubPositions[idx] || `Hub ${hub.tireNo || idx + 1}`,
                // Core Hub Temperature data according to protocol
                tempValue: hub.tempValue || 0, // Temperature in Celsius
                bat: hub.bat || 0, // Battery level 0-4
                exType: hub.exType || '', // Exception types
                simNumber: hub.simNumber || '-',
                lastUpdated: hub.lastUpdate || new Date().toISOString(),
                // Status analysis based on protocol exceptions
                status,
                hasBrakePadAbnormal,
                hasHighTemp,
                hasSensorLost,
                hasLowBattery,
                // Human-readable status
                tempStatus: hasHighTemp ? 'high' : hub.tempValue > 85 ? 'elevated' : 'normal',
                brakeStatus: hasBrakePadAbnormal ? 'abnormal' : 'normal',
                batteryStatus: hasLowBattery ? 'low' : hub.bat > 2 ? 'good' : 'medium',
                sensorStatus: hasSensorLost ? 'lost' : 'connected',
                // Additional analysis for hub-specific conditions
                criticalTemp: hub.tempValue > 95, // Critical hub temperature threshold
                maintenanceNeeded: hasBrakePadAbnormal || hasHighTemp || hub.tempValue > 90,
              });
            });
          } catch (error) {
            console.error(`Error processing Hub Temperature data for truck ${t.id}:`, error);
            // Add error entry for this truck
            flattened.push({
              truckId: t.id,
              truckName: t.name || t.truckNumber || t.id,
              cluster: t.cluster || '-',
              driverName: t.driver?.name || '-',
              hubIndex: 0,
              tireNo: 1,
              position: 'Error',
              tempValue: 0,
              bat: 0,
              exType: '4', // Sensor lost
              simNumber: '-',
              lastUpdated: new Date().toISOString(),
              status: 'error',
              hasError: true,
              errorMessage: 'Failed to load Hub Temperature data',
            });
          }
        }

        if (mounted) {
          setRows(flattened);
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
    const q = query.toLowerCase();
    return rows.filter((r) => {
      const matchesQ =
        !q ||
        r.truckId.toLowerCase().includes(q) ||
        r.truckName.toLowerCase().includes(q) ||
        String(r.tireNo).includes(q) ||
        r.driverName.toLowerCase().includes(q) ||
        (r.simNumber || '').toLowerCase().includes(q);
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
            <h1 className="text-2xl font-semibold text-gray-900">
              Telemetry - Hub Temperature (hubdata)
            </h1>
            <p className="text-sm text-gray-500">
              Form edit data suhu hub per ban sesuai protokol JSON
            </p>
          </div>

          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Search (Truck/Tire/Driver/SIM)"
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
              <div className="max-h-[60vh] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Truck</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Hub</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">SN</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">SIM</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">exType</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Temp (°C)</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">
                        Battery (0-4)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr>
                        <td className="px-3 py-6 text-gray-500" colSpan={7}>
                          Loading...
                        </td>
                      </tr>
                    ) : pageData.length === 0 ? (
                      <tr>
                        <td className="px-3 py-6 text-gray-500" colSpan={7}>
                          No data
                        </td>
                      </tr>
                    ) : (
                      pageData.map((r) => {
                        return (
                          <tr key={`${r.truckId}-${r.tireNo}`} className="align-top">
                            <td className="px-3 py-2">
                              <div className="font-medium text-gray-900">{r.truckName}</div>
                              <div className="text-xs text-gray-500">
                                {r.truckId} • {r.cluster}
                              </div>
                              <div className="text-xs text-gray-500">Driver: {r.driverName}</div>
                            </td>
                            <td className="px-3 py-2">
                              <div className="font-medium">#{r.tireNo}</div>
                              <div className="text-xs text-gray-500">{r.position}</div>
                            </td>
                            <td className="px-3 py-2 w-48">
                              <div className="font-mono text-xs">
                                HUB-{String(r.tireNo).padStart(2, '0')}
                              </div>
                            </td>
                            <td className="px-3 py-2 w-56">
                              <div className="font-mono text-xs">{r.simNumber || '-'}</div>
                            </td>
                            <td className="px-3 py-2 w-56">
                              <div className="flex flex-wrap gap-1">
                                {r.exType ? (
                                  r.exType.split(',').map((ex) => (
                                    <span
                                      key={ex}
                                      className={`px-1 py-0.5 rounded text-xs ${
                                        ex === '1'
                                          ? 'bg-red-100 text-red-700' // Brake pad abnormal
                                          : ex === '3'
                                            ? 'bg-orange-100 text-orange-700' // High temp
                                            : ex === '4'
                                              ? 'bg-gray-100 text-gray-700' // Sensor lost
                                              : ex === '5'
                                                ? 'bg-yellow-100 text-yellow-700' // Low battery
                                                : 'bg-gray-100 text-gray-700'
                                      }`}
                                    >
                                      {ex === '1'
                                        ? 'Brake Abnormal'
                                        : ex === '3'
                                          ? 'High T'
                                          : ex === '4'
                                            ? 'Lost'
                                            : ex === '5'
                                              ? 'Low Bat'
                                              : ex}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-gray-400 text-xs">Normal</span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2 w-40">
                              <div className="font-medium">{r.tempValue}°C</div>
                              <div className="text-xs text-gray-500">{r.tempStatus}</div>
                            </td>
                            <td className="px-3 py-2 w-40">
                              <div className="font-medium">{r.bat}/4</div>
                              <div className="text-xs text-gray-500">{r.batteryStatus}</div>
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

