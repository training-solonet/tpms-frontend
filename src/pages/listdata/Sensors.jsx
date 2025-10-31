import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { devicesApi, trucksApi } from '../../services/api2';
import TailwindLayout from '../../components/layout/TailwindLayout';

const Sensors = () => {
  // State
  const [sensors, setSensors] = useState([]);
  const [devices, setDevices] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [query, setQuery] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('');
  const [truckFilter, setTruckFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState({
    id: false,
    sensorNo: true,
    extype: false,
    createdAt: false,
  });

  // Toggleable columns (optional columns only)
  const toggleableColumns = [
    { key: 'id', label: 'ID' },
    { key: 'sensorNo', label: 'Sensor Number' },
    { key: 'extype', label: 'External Type' },
    { key: 'createdAt', label: 'Created At' },
  ];

  const toggleColumn = (key) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Fetch data
  useEffect(() => {
    fetchSensors();
    fetchDevices();
    fetchTrucks();
  }, []);

  const fetchSensors = async () => {
    try {
      setLoading(true);
      const response = await devicesApi.getAllSensors();
      console.log('📥 Sensors API response:', response);
      
      // Handle different response formats
      const data = Array.isArray(response) 
        ? response 
        : Array.isArray(response?.data) 
        ? response.data 
        : [];
      
      console.log('✅ Sensors data:', data);
      setSensors(data);
    } catch (err) {
      console.error('❌ Error fetching sensors:', err);
      setSensors([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDevices = async () => {
    try {
      const response = await devicesApi.getAll();
      console.log('📥 Devices API response (for filter):', response);
      
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
    }
  };

  const fetchTrucks = async () => {
    try {
      const response = await trucksApi.getAll();
      console.log('📥 Trucks API response (for filter):', response);
      
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

  // Get device and truck info for sensor
  const getSensorInfo = useCallback((sensor) => {
    const device = devices.find((d) => d.serial_number === sensor.sim_number || d.sim_4g_number === sensor.sim_number);
    const truck = device ? trucks.find((t) => t.id === device.truck_id) : null;
    return { device, truck };
  }, [devices, trucks]);

  // Filter & Search
  const filtered = useMemo(() => {
    return sensors.filter((sensor) => {
      const { device, truck } = getSensorInfo(sensor);

      const matchQuery =
        !query ||
        sensor.sn?.toLowerCase().includes(query.toLowerCase()) ||
        sensor.sim_number?.toLowerCase().includes(query.toLowerCase()) ||
        device?.serial_number?.toLowerCase().includes(query.toLowerCase()) ||
        truck?.name?.toLowerCase().includes(query.toLowerCase());

      const matchDevice = !deviceFilter || device?.id?.toString() === deviceFilter;
      const matchTruck = !truckFilter || truck?.id?.toString() === truckFilter;
      const matchStatus = !statusFilter || sensor.status === statusFilter;

      return matchQuery && matchDevice && matchTruck && matchStatus;
    });
  }, [sensors, query, deviceFilter, truckFilter, statusFilter, getSensorInfo]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: sensors.length,
      active: sensors.filter((s) => s.status === 'active').length,
      warning: sensors.filter((s) => {
        const temp = parseFloat(s.temp_value);
        const pressure = parseFloat(s.tire_value);
        return (temp > 60 && temp < 80) || (pressure > 25 && pressure < 28);
      }).length,
      filtered: filtered.length,
    };
  }, [sensors, filtered]);

  // Get unique status options
  const statusOptions = useMemo(() => {
    return [...new Set(sensors.map((s) => s.status).filter(Boolean))];
  }, [sensors]);

  // Delete sensor
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sensor?')) return;

    try {
      await devicesApi.deleteSensor(id);
      setSensors((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Error deleting sensor:', err);
      alert('Failed to delete sensor: ' + (err.message || 'Unknown error'));
    }
  };

  // Get tire position label
  const getTirePosition = (tireNo) => {
    const positions = {
      1: 'Front Left',
      2: 'Front Right',
      3: 'Rear Left 1',
      4: 'Rear Right 1',
      5: 'Rear Left 2',
      6: 'Rear Right 2',
      7: 'Rear Left 3',
      8: 'Rear Right 3',
      9: 'Rear Left 4',
      10: 'Rear Right 4',
      11: 'Rear Left 5',
      12: 'Rear Right 5',
    };
    return positions[tireNo] || `Tire ${tireNo}`;
  };

  // Get status color
  const getStatusColor = (sensor) => {
    if (sensor.status !== 'active') return 'bg-gray-100 text-gray-800';

    const temp = parseFloat(sensor.temp_value);
    const pressure = parseFloat(sensor.tire_value);

    // Critical
    if (temp >= 80 || pressure < 25) return 'bg-red-100 text-red-800';
    // Warning
    if ((temp > 60 && temp < 80) || (pressure >= 25 && pressure < 28)) return 'bg-yellow-100 text-yellow-800';
    // Normal
    return 'bg-green-100 text-green-800';
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sensor Management</h1>
              <p className="text-sm text-gray-600 mt-1">Manage tire pressure and temperature sensors</p>
            </div>
            <Link
              to="/sensors/new"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Sensor
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sensors</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
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
                <p className="text-sm text-gray-600">Warning</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.warning}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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
                    placeholder="Search sensors..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Device Filter */}
                <div className="relative">
                  <select
                    value={deviceFilter}
                    onChange={(e) => setDeviceFilter(e.target.value)}
                    className="px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none cursor-pointer"
                  >
                    <option value="">All Devices</option>
                    {devices.map((device) => (
                      <option key={device.id} value={device.id}>
                        {device.serial_number}
                      </option>
                    ))}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
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
                      ['No', 'Serial Number', 'Device', 'Truck', 'Tire Position', 'Temperature', 'Pressure', 'Battery', 'Status'].join(','),
                      ...filtered.map((s, i) => {
                        const { device, truck } = getSensorInfo(s);
                        return [
                          i + 1,
                          s.sn || '',
                          device?.serial_number || 'N/A',
                          truck?.name || 'Unassigned',
                          getTirePosition(s.tire_no),
                          s.temp_value || '',
                          s.tire_value || '',
                          s.bat || '',
                          s.status || ''
                        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
                      })
                    ].join('\n');
                    
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `sensors_${new Date().toISOString().split('T')[0]}.csv`;
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sensors Found</h3>
              <p className="text-sm text-gray-600 mb-4">
                {query ? 'Try adjusting your search' : 'Get started by adding your first sensor'}
              </p>
              {!query && (
                <Link
                  to="/sensors/new"
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Sensor
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
                        Device
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Truck
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tire Position
                      </th>
                      {visibleColumns.sensorNo && (
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sensor #
                        </th>
                      )}
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Temperature
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pressure
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Battery
                      </th>
                      {visibleColumns.extype && (
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                      )}
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      {visibleColumns.createdAt && (
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created At
                        </th>
                      )}
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginated.map((sensor, index) => {
                      const { device, truck } = getSensorInfo(sensor);
                      return (
                        <tr key={sensor.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(page - 1) * pageSize + index + 1}
                          </td>
                          {visibleColumns.id && (
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {sensor.id}
                            </td>
                          )}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{sensor.sn || '--'}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {device ? (
                              <Link
                                to={`/devices/${device.id}`}
                                className="text-sm text-indigo-600 hover:text-indigo-900"
                              >
                                {device.serial_number}
                              </Link>
                            ) : (
                              <span className="text-sm text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {truck ? (
                              <Link
                                to={`/trucks/${truck.id}`}
                                className="text-sm text-indigo-600 hover:text-indigo-900"
                              >
                                {truck.name}
                              </Link>
                            ) : (
                              <span className="text-sm text-gray-400">Unassigned</span>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getTirePosition(sensor.tire_no)}
                          </td>
                          {visibleColumns.sensorNo && (
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {sensor.sensor_no || '--'}
                            </td>
                          )}
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            {sensor.temp_value ? (
                              <span className={parseFloat(sensor.temp_value) > 60 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                                {sensor.temp_value}°C
                              </span>
                            ) : '--'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            {sensor.tire_value ? (
                              <span className={parseFloat(sensor.tire_value) < 28 ? 'text-yellow-600 font-medium' : 'text-gray-900'}>
                                {sensor.tire_value} PSI
                              </span>
                            ) : '--'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {sensor.bat ? `${sensor.bat}%` : '--'}
                          </td>
                          {visibleColumns.extype && (
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {sensor.extype || '--'}
                            </td>
                          )}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(sensor)}`}>
                              {sensor.status || 'unknown'}
                            </span>
                          </td>
                          {visibleColumns.createdAt && (
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(sensor.created_at)}
                            </td>
                          )}
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                to={`/sensors/${sensor.id}`}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="View Details"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </Link>
                              <Link
                                to={`/sensors/${sensor.id}/edit`}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </Link>
                              <button
                                onClick={() => handleDelete(sensor.id)}
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

export default Sensors;
