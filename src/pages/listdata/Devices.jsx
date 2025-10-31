import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { devicesApi, trucksApi } from '../../services/api2';
import TailwindLayout from '../../components/layout/TailwindLayout';

const Devices = () => {
  // State
  const [devices, setDevices] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [query, setQuery] = useState('');
  const [truckFilter, setTruckFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState({
    id: false,
    createdAt: false,
    updatedAt: false,
  });

  // Toggleable columns (optional columns only)
  const toggleableColumns = [
    { key: 'id', label: 'ID' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'updatedAt', label: 'Updated At' },
  ];

  const toggleColumn = (key) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Fetch data
  useEffect(() => {
    fetchDevices();
    fetchTrucks();
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const response = await devicesApi.getAll();
      console.log('📥 Devices API response:', response);
      
      // Handle different response formats
      const data = Array.isArray(response) 
        ? response 
        : Array.isArray(response?.data) 
        ? response.data 
        : [];
      
      console.log('✅ Devices data:', data);
      setDevices(data);
    } catch (err) {
      console.error('❌ Error fetching devices:', err);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrucks = async () => {
    try {
      const response = await trucksApi.getAll();
      console.log('📥 Trucks API response:', response);
      
      // Handle different response formats
      const data = Array.isArray(response) 
        ? response 
        : Array.isArray(response?.data) 
        ? response.data 
        : [];
      
      console.log('✅ Trucks data:', data);
      setTrucks(data);
    } catch (err) {
      console.error('❌ Error fetching trucks:', err);
      setTrucks([]);
    }
  };

  // Filter & Search
  const filtered = useMemo(() => {
    return devices.filter((device) => {
      const matchQuery =
        !query ||
        device.serial_number?.toLowerCase().includes(query.toLowerCase()) ||
        device.sim_4g_number?.toLowerCase().includes(query.toLowerCase()) ||
        device.truck?.name?.toLowerCase().includes(query.toLowerCase());

      const matchTruck = !truckFilter || device.truck_id?.toString() === truckFilter;
      const matchStatus = !statusFilter || device.status === statusFilter;

      return matchQuery && matchTruck && matchStatus;
    });
  }, [devices, query, truckFilter, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: devices.length,
      active: devices.filter((d) => d.status === 'active').length,
      inactive: devices.filter((d) => d.status === 'inactive').length,
      filtered: filtered.length,
    };
  }, [devices, filtered]);

  // Get unique status options
  const statusOptions = useMemo(() => {
    return [...new Set(devices.map((d) => d.status).filter(Boolean))];
  }, [devices]);

  // Delete device
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this device?')) return;

    try {
      await devicesApi.delete(id);
      setDevices((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error('Error deleting device:', err);
      alert('Failed to delete device: ' + (err.message || 'Unknown error'));
    }
  };

  // Battery health indicator
  const getBatteryHealth = (bat1, bat2, bat3) => {
    const batteries = [bat1, bat2, bat3].filter((b) => b != null);
    if (batteries.length === 0) return { status: 'unknown', color: 'gray', icon: '⚪' };

    const avg = batteries.reduce((a, b) => a + b, 0) / batteries.length;

    if (avg >= 70) return { status: 'Good', color: 'green', icon: '🟢' };
    if (avg >= 40) return { status: 'Fair', color: 'yellow', icon: '🟡' };
    return { status: 'Critical', color: 'red', icon: '🔴' };
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <TailwindLayout>
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Device Center</h1>
              <p className="text-sm text-gray-600 mt-1">Manage gateway, repeater, and IoT devices</p>
            </div>
            <Link
              to="/devices/new"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Device
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Devices</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-600 mt-1">{stats.inactive}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Filtered</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.filtered}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Table with Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Filters Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex gap-4 flex-1 w-full flex-wrap">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search devices..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Truck Filter */}
                <div className="relative">
                  <select
                    value={truckFilter}
                    onChange={(e) => setTruckFilter(e.target.value)}
                    className="px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none cursor-pointer"
                  >
                    <option value="">All Trucks</option>
                    {trucks.map((truck) => (
                      <option key={truck.id} value={truck.id}>
                        {truck.name}
                      </option>
                    ))}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none cursor-pointer"
                  >
                    <option value="">All Status</option>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Per Page Selector */}
                <div className="relative">
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none cursor-pointer"
                  >
                    <option value={10}>10 / page</option>
                    <option value={25}>25 / page</option>
                    <option value={50}>50 / page</option>
                    <option value={100}>100 / page</option>
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Column Toggle Dropdown */}
                <div className="relative">
                  <details className="group">
                    <summary className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg cursor-pointer text-sm font-medium text-gray-700 transition-colors list-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                      Columns
                      <svg className="w-4 h-4 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-20 max-h-96 overflow-y-auto">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Toggle Columns</p>
                        {toggleableColumns.map((col) => (
                          <label key={col.key} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={visibleColumns[col.key]}
                              onChange={() => toggleColumn(col.key)}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">{col.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </details>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (filtered.length === 0) {
                      alert('No data to export');
                      return;
                    }
                    const csvContent = [
                      ['No', 'Serial Number', 'Truck', 'SIM 4G', 'Battery 1', 'Battery 2', 'Battery 3', 'Status', 'Installed'].join(','),
                      ...filtered.map((d, i) => [
                        i + 1,
                        d.serial_number || '',
                        d.truck?.name || 'Unassigned',
                        d.sim_4g_number || '',
                        d.bat1 || '',
                        d.bat2 || '',
                        d.bat3 || '',
                        d.status || '',
                        d.installed_at || ''
                      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
                    ].join('\n');
                    
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `devices_${new Date().toISOString().split('T')[0]}.csv`;
                    link.click();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  title="Export to CSV"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export
                </button>

                {query && (
                  <button
                    onClick={() => {
                      setQuery('');
                      setPage(1);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    title="Clear search"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table Content */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Devices Found</h3>
              <p className="text-sm text-gray-600 mb-4">
                {query ? 'Try adjusting your search' : 'Get started by adding your first device'}
              </p>
              {!query && (
                <Link
                  to="/devices/new"
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Device
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        No
                      </th>
                      {visibleColumns.id && (
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                      )}
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Serial Number
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Truck
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SIM 4G Number
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Battery Status
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Installed
                      </th>
                      {visibleColumns.createdAt && (
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created At
                        </th>
                      )}
                      {visibleColumns.updatedAt && (
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Updated At
                        </th>
                      )}
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginated.map((device, index) => {
                      const batteryHealth = getBatteryHealth(device.bat1, device.bat2, device.bat3);
                      return (
                        <tr key={device.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(page - 1) * pageSize + index + 1}
                          </td>
                          {visibleColumns.id && (
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {device.id}
                            </td>
                          )}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{device.serial_number || '--'}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {device.truck ? (
                              <Link
                                to={`/trucks/${device.truck_id}`}
                                className="text-sm text-indigo-600 hover:text-indigo-900"
                              >
                                {device.truck.name}
                              </Link>
                            ) : (
                              <span className="text-sm text-gray-400">Unassigned</span>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {device.sim_4g_number || '--'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-xs space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">B1: {device.bat1 || '--'}%</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">B2: {device.bat2 || '--'}%</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">B3: {device.bat3 || '--'}%</span>
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                <span>{batteryHealth.icon}</span>
                                <span className={`text-${batteryHealth.color}-600 font-medium`}>
                                  {batteryHealth.status}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              device.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : device.status === 'inactive'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {device.status || 'unknown'}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(device.installed_at)}
                          </td>
                          {visibleColumns.createdAt && (
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(device.created_at)}
                            </td>
                          )}
                          {visibleColumns.updatedAt && (
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(device.updated_at)}
                            </td>
                          )}
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                to={`/devices/${device.id}`}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="View Details"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </Link>
                              <Link
                                to={`/devices/${device.id}/edit`}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </Link>
                              <button
                                onClick={() => handleDelete(device.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(page * pageSize, filtered.length)}</span> of{' '}
                      <span className="font-medium">{filtered.length}</span> results
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`px-3 py-1 text-sm border rounded-md ${
                              page === pageNum
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      {totalPages > 5 && <span className="px-2">...</span>}
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </TailwindLayout>
  );
};

export default Devices;
