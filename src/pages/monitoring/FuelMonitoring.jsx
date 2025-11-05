import React, { useState, useEffect, useMemo } from 'react';
import TailwindLayout from '../../components/layout/TailwindLayout.jsx';
import { trucksApi } from '../../services/api2';

export default function FuelMonitoring() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTruck, setSelectedTruck] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Load data
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('📡 Loading fuel data...');

        const res = await trucksApi.getAll();
        console.log('✅ Trucks response:', res);

        const trucks = res?.data?.trucks || res?.data || [];

        if (!Array.isArray(trucks) || trucks.length === 0) {
          console.warn('No trucks data available');
          if (mounted) {
            setData([]);
            setLoading(false);
          }
          return;
        }

        // Transform fuel data
        const fuelData = trucks.map((truck) => {
          const fuel = truck.fuel_sensor || {};
          return {
            id: truck.id,
            truckCode: truck.unit_code || 'N/A',
            truckName: truck.truck_number || 'N/A',
            fuelLevel: fuel.fuel_level || 0,
            fuelCapacity: fuel.fuel_capacity || 100,
            fuelPercentage:
              fuel.fuel_level && fuel.fuel_capacity
                ? (fuel.fuel_level / fuel.fuel_capacity) * 100
                : 0,
            consumption: fuel.consumption_rate || 0,
            efficiency: fuel.fuel_efficiency || 0,
            timestamp: fuel.timestamp || new Date().toISOString(),
          };
        });

        if (mounted) {
          setData(fuelData);
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Error loading fuel data:', error);
        if (mounted) {
          setData([]);
          setLoading(false);
        }
      }
    };

    loadData();
    const interval = setInterval(loadData, 60000); // Refresh every 60s

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Get status based on fuel percentage
  const getStatus = (truck) => {
    const percent = truck.fuelPercentage;
    if (percent <= 10) return 'Critical';
    if (percent <= 25) return 'Low';
    if (percent <= 50) return 'Medium';
    return 'Good';
  };

  // Filter logic
  const filteredData = useMemo(() => {
    let result = [...data];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.truckCode.toLowerCase().includes(term) || item.truckName.toLowerCase().includes(term)
      );
    }

    // Truck filter
    if (selectedTruck) {
      result = result.filter((item) => item.truckCode === selectedTruck);
    }

    // Status filter
    if (selectedStatus) {
      result = result.filter((item) => getStatus(item) === selectedStatus);
    }

    return result;
  }, [data, searchTerm, selectedTruck, selectedStatus]);

  // Stats calculations
  const stats = useMemo(() => {
    const total = filteredData.length;
    const good = filteredData.filter((item) => getStatus(item) === 'Good').length;
    const low = filteredData.filter((item) => getStatus(item) === 'Low').length;
    const critical = filteredData.filter((item) => getStatus(item) === 'Critical').length;
    const avgFuel =
      filteredData.length > 0
        ? filteredData.reduce((sum, item) => sum + item.fuelPercentage, 0) / filteredData.length
        : 0;

    return { total, good, low, critical, avgFuel };
  }, [filteredData]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // Unique trucks for filter
  const uniqueTrucks = useMemo(() => {
    const trucks = [...new Set(data.map((item) => item.truckCode))];
    return trucks.sort();
  }, [data]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedTruck, selectedStatus, itemsPerPage]);

  // Status badge
  const StatusBadge = ({ status }) => {
    const colors = {
      Good: 'bg-green-100 text-green-800',
      Medium: 'bg-blue-100 text-blue-800',
      Low: 'bg-yellow-100 text-yellow-800',
      Critical: 'bg-red-100 text-red-800',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}
      >
        {status}
      </span>
    );
  };

  return (
    <TailwindLayout>
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 max-h-[calc(100vh-4rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-100">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Fuel Monitoring</h1>
          <p className="mt-1 text-sm text-gray-500">
            Real-time fuel level and consumption tracking
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="rounded-md bg-blue-500 p-3">
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Trucks</dt>
                    <dd className="text-lg font-semibold text-gray-900">{stats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="rounded-md bg-green-500 p-3">
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Good Level</dt>
                    <dd className="text-lg font-semibold text-gray-900">{stats.good}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="rounded-md bg-yellow-500 p-3">
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Low Fuel</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {stats.low + stats.critical}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="rounded-md bg-purple-500 p-3">
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Avg Fuel</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {stats.avgFuel.toFixed(1)}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white shadow rounded-lg">
          {/* Filters */}
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {/* Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search trucks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {/* Truck Filter */}
              <div className="relative">
                <select
                  value={selectedTruck}
                  onChange={(e) => setSelectedTruck(e.target.value)}
                  className="px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm
                            focus:border-transparent focus:ring-2 focus:ring-indigo-500
                            focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="">All Trucks</option>
                  {uniqueTrucks.map((truck) => (
                    <option key={truck} value={truck}>
                      {truck}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm
             focus:border-transparent focus:ring-2 focus:ring-indigo-500
             focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="">All Status</option>
                  <option value="Good">Good</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                  <option value="Critical">Critical</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {/* Per Page */}
              <div className="relative">
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm
             focus:border-transparent focus:ring-2 focus:ring-indigo-500
             focus:outline-none appearance-none cursor-pointer"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {/* Results Count */}
              <div className="flex items-center text-sm text-gray-700">
                Showing {filteredData.length} of {data.length} trucks
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-500">Loading fuel data...</p>
              </div>
            ) : paginatedData.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No fuel data</h3>
                <p className="mt-1 text-sm text-gray-500">No trucks found matching your filters.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Truck
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Fuel Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Capacity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Percentage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Consumption Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Efficiency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Last Update
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.map((truck) => {
                    const status = getStatus(truck);
                    return (
                      <tr key={truck.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{truck.truckCode}</div>
                          <div className="text-sm text-gray-500">{truck.truckName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {truck.fuelLevel.toFixed(1)} L
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {truck.fuelCapacity} L
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="shrink-0 h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  truck.fuelPercentage > 50
                                    ? 'bg-green-500'
                                    : truck.fuelPercentage > 25
                                      ? 'bg-yellow-500'
                                      : truck.fuelPercentage > 10
                                        ? 'bg-orange-500'
                                        : 'bg-red-500'
                                }`}
                                style={{ width: `${truck.fuelPercentage}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 text-sm font-medium text-gray-900">
                              {truck.fuelPercentage.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {truck.consumption.toFixed(2)} L/hr
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {truck.efficiency.toFixed(2)} km/L
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(truck.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!loading && paginatedData.length > 0 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(startIndex + itemsPerPage, filteredData.length)}
                    </span>{' '}
                    of <span className="font-medium">{filteredData.length}</span> results
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </TailwindLayout>
  );
}
