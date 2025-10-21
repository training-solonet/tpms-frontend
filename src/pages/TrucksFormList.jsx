import React from 'react';
import { Link } from 'react-router-dom';
import TailwindLayout from '../components/layout/TailwindLayout.jsx';
import TruckImage from '../components/common/TruckImage.jsx';
// Use Backend 2 APIs
import { trucksApi, driversApi, vendorsApi } from '../services/api2';

const TrucksFormList = () => {
  const [trucks, setTrucks] = React.useState([]);
  const [drivers, setDrivers] = React.useState([]);
  const [vendors, setVendors] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const [query, setQuery] = React.useState('');
  const [cluster, setCluster] = React.useState('');
  const [vendorFilter, setVendorFilter] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        console.log('📡 Loading trucks data from Backend 2...');

        const [trucksRes, driversRes, vendorsRes] = await Promise.all([
          trucksApi.getAll(),
          driversApi.getAll().catch((err) => {
            console.warn('Failed to load drivers:', err);
            return { data: { drivers: [] } };
          }),
          vendorsApi.getAll().catch((err) => {
            console.warn('Failed to load vendors:', err);
            return { data: { vendors: [] } };
          }),
        ]);

        console.log('✅ Trucks response:', trucksRes);
        console.log('✅ Drivers response:', driversRes);
        console.log('✅ Vendors response:', vendorsRes);

        const trucksArray = trucksRes?.data?.trucks || [];
        const driversArray = driversRes?.data?.drivers || [];
        const vendorsArray = vendorsRes?.data?.vendors || [];

        setTrucks(Array.isArray(trucksArray) ? trucksArray : []);
        setDrivers(Array.isArray(driversArray) ? driversArray : []);
        setVendors(Array.isArray(vendorsArray) ? vendorsArray : []);
      } catch (error) {
        console.error('❌ Failed to load data:', error);
        setTrucks([]);
        setDrivers([]);
        setVendors([]);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const allTrucks = React.useMemo(() => {
    return trucks.map((truck) => {
      // Backend 2 uses different field names
      const driver = drivers.find((d) => d.id === truck.driverId);
      return {
        id: truck.id,
        plate: truck.plateNumber || truck.plate_number,
        name: truck.truckNumber || truck.name,
        cluster: truck.fleetGroupId || truck.fleet_group_id || '-',
        driver: {
          name: driver
            ? driver.name || `${driver.first_name || ''} ${driver.last_name || ''}`.trim() || '-'
            : truck.driverName || '-',
        },
        vendor_id: truck.vendorId || truck.vendor_id || '',
        status: truck.status || 'idle',
        fuel: truck.fuelLevel || truck.fuel_level || 0,
        location: { coordinates: [truck.latitude || 0, truck.longitude || 0] },
        speed: truck.speed || 0,
        lastUpdate: truck.updatedAt || truck.updated_at || new Date().toISOString(),
        manufacturer: truck.manufacturer || 'Caterpillar',
        model: truck.model || '-',
        year: truck.year || 2020,
      };
    });
  }, [trucks, drivers]);

  const pageSizes = [10, 25, 50, 100];

  const clusters = React.useMemo(
    () => Array.from(new Set(allTrucks.map((t) => t.cluster).filter(Boolean))),
    [allTrucks]
  );

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase();
    return allTrucks.filter((t) => {
      const matchesQ =
        !q ||
        t.id.toLowerCase().includes(q) ||
        t.plate.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.driver.name.toLowerCase().includes(q);
      const matchesCluster = !cluster || t.cluster === cluster;
      const matchesVendor = !vendorFilter || t.vendor_id === vendorFilter;
      return matchesQ && matchesCluster && matchesVendor;
    });
  }, [allTrucks, query, cluster, vendorFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageData = filtered.slice(start, end);

  React.useEffect(() => {
    setPage(1);
  }, [query, cluster, pageSize]);

  return (
    <TailwindLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Search</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by Truck ID, Plate, Name, or Driver"
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Cluster</label>
              <select
                value={cluster}
                onChange={(e) => setCluster(e.target.value)}
                className="mt-1 w-56 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">All</option>
                {clusters.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Vendor</label>
              <select
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
                className="mt-1 w-56 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">All</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} {v.code ? `(${v.code})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Page size</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="mt-1 w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                {pageSizes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white shadow rounded-xl">
            <div className="overflow-x-auto">
              <div className="max-h-[60vh] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Truck
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plate
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cluster
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vendor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Driver
                      </th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td className="px-4 py-6 text-gray-500" colSpan={6}>
                          Loading...
                        </td>
                      </tr>
                    ) : (
                      pageData.map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-16 h-10 rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
                                <TruckImage
                                  id={t.id}
                                  width={160}
                                  height={100}
                                  className="w-16 h-10"
                                />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{t.name}</div>
                                <div className="text-xs text-gray-500">{t.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">{t.plate}</td>
                          <td className="px-4 py-3">{t.cluster}</td>
                          <td className="px-4 py-3">
                            {vendors.find((v) => v.id === t.vendor_id)?.name || '-'}
                          </td>
                          <td className="px-4 py-3">{t.driver.name}</td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              to={`/trucks/${t.id}`}
                              state={{ truck: t }}
                              className="inline-flex items-center px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700"
                            >
                              Edit
                            </Link>
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
              Showing {start + 1}-{Math.min(end, filtered.length)} of {filtered.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              <div className="text-sm">
                Page {currentPage} / {totalPages}
              </div>
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
};

export default TrucksFormList;
