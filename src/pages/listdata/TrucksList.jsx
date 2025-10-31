import React from 'react';
import { Link } from 'react-router-dom';
import TailwindLayout from '../../components/layout/TailwindLayout.jsx';
import TruckImage from '../../components/common/TruckImage.jsx';
// Use Backend 2 APIs
import { trucksApi, driversApi, vendorsApi } from '../../services/api2/index.js';

function Input({ label, icon, ...props }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-700 mb-1.5">{label}</span>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`w-full ${icon ? 'pl-9' : 'pl-3'} pr-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${props.className || ''}`}
        />
      </div>
    </label>
  );
}

function TruckActionMenu({ truck, onEdit, onDelete }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [showTimestamp, setShowTimestamp] = React.useState(false);
  const menuRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        title="More options"
      >
        <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
          <button
            onClick={() => {
              onEdit(truck.id);
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit Vehicle
          </button>

          <button
            onClick={() => setShowTimestamp(!showTimestamp)}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {showTimestamp ? 'Hide' : 'Show'} Timestamps
          </button>

          <hr className="my-1" />

          <button
            onClick={() => {
              onDelete(truck.id);
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete Vehicle
          </button>
        </div>
      )}

      {showTimestamp && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-20">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Created:</span>
              <span className="text-gray-900 font-medium">
                {truck.createdAt && truck.createdAt !== '-'
                  ? new Date(truck.createdAt).toLocaleString()
                  : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Created By:</span>
              <span className="text-gray-900 font-medium">{truck.createdBy || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Updated:</span>
              <span className="text-gray-900 font-medium">
                {truck.updatedAt && truck.updatedAt !== '-'
                  ? new Date(truck.updatedAt).toLocaleString()
                  : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Updated By:</span>
              <span className="text-gray-900 font-medium">{truck.updatedBy || '-'}</span>
            </div>
            {truck.deletedAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">Deleted:</span>
                <span className="text-red-600 font-medium">
                  {new Date(truck.deletedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const TrucksFormList = () => {
  const [trucks, setTrucks] = React.useState([]);
  const [drivers, setDrivers] = React.useState([]);
  const [vendors, setVendors] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const [query, setQuery] = React.useState('');
  const [cluster, setCluster] = React.useState('');
  const [vendorFilter, setVendorFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);

  // Column visibility state - only for optional columns
  const [visibleColumns, setVisibleColumns] = React.useState({
    id: false,
    createdAt: false,
    updatedAt: false,
    deletedAt: false,
    createdBy: false,
    updatedBy: false,
  });

  // Sort state
  const [sortConfig, setSortConfig] = React.useState({
    key: null,
    direction: 'asc',
  });

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
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
      setError('');
    } catch (error) {
      console.error('❌ Failed to load data:', error);
      setError(error.message || 'Failed to load trucks');
      setTrucks([]);
      setDrivers([]);
      setVendors([]);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const allTrucks = React.useMemo(() => {
    return trucks.map((truck) => {
      // Backend 2 uses different field names
      const driver = drivers.find((d) => d.id === truck.driverId);
      return {
        id: truck.id,
        name: truck.truckNumber || truck.name,
        image: truck.image || truck.imageUrl || '',
        year: truck.year || '',
        model: truck.model || '-',
        type: truck.type || truck.truckType || '-',
        vendor_id: truck.vendorId || truck.vendor_id || '',
        status: truck.status || 'idle',
        vin: truck.vin || truck.vinNumber || '-',
        plate: truck.plateNumber || truck.plate_number,
        createdAt: truck.createdAt || truck.created_at || '-',
        updatedAt: truck.updatedAt || truck.updated_at || '-',
        deletedAt: truck.deletedAt || truck.deleted_at || null,
        createdBy: truck.createdBy || truck.created_by || '-',
        updatedBy: truck.updatedBy || truck.updated_by || '-',
        cluster: truck.fleetGroupId || truck.fleet_group_id || '-',
        driver: {
          name: driver
            ? driver.name || `${driver.first_name || ''} ${driver.last_name || ''}`.trim() || '-'
            : truck.driverName || '-',
        },
        fuel: truck.fuelLevel || truck.fuel_level || 0,
        location: { coordinates: [truck.latitude || 0, truck.longitude || 0] },
        speed: truck.speed || 0,
        manufacturer: truck.manufacturer || 'Caterpillar',
      };
    });
  }, [trucks, drivers]);

  const clusters = React.useMemo(
    () => Array.from(new Set(allTrucks.map((t) => t.cluster).filter(Boolean))),
    [allTrucks]
  );

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? (
        <svg
          className="w-3 h-3 text-indigo-600 ml-1"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      ) : (
        <svg
          className="w-3 h-3 text-indigo-600 ml-1"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      );
    }
    return (
      <svg
        className="w-3 h-3 text-gray-300 ml-1"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const toggleColumn = (columnKey) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  };

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase();
    let result = allTrucks.filter((t) => {
      const matchesQ =
        !q ||
        t.id.toLowerCase().includes(q) ||
        t.plate.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.vin.toLowerCase().includes(q) ||
        t.driver.name.toLowerCase().includes(q);
      const matchesCluster = !cluster || t.cluster === cluster;
      const matchesVendor = !vendorFilter || t.vendor_id === vendorFilter;
      const matchesStatus = !statusFilter || t.status === statusFilter;
      return matchesQ && matchesCluster && matchesVendor && matchesStatus;
    });

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        // Handle nested values
        if (sortConfig.key === 'vendor') {
          aVal = vendors.find((v) => v.id === a.vendor_id)?.name || '';
          bVal = vendors.find((v) => v.id === b.vendor_id)?.name || '';
        }

        // Handle dates
        if (['createdAt', 'updatedAt', 'deletedAt'].includes(sortConfig.key)) {
          aVal = aVal && aVal !== '-' ? new Date(aVal).getTime() : 0;
          bVal = bVal && bVal !== '-' ? new Date(bVal).getTime() : 0;
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [allTrucks, query, cluster, vendorFilter, statusFilter, sortConfig, vendors]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageData = filtered.slice(start, end);

  React.useEffect(() => {
    setPage(1);
  }, [query, cluster, pageSize]);

  const onDelete = async (id) => {
    if (!confirm('Delete this vehicle? This action cannot be undone.')) return;
    try {
      await trucksApi.delete(id);
      console.log('✅ Vehicle deleted successfully');
      alert('Vehicle deleted successfully!');
      await load();
    } catch (error) {
      console.error('❌ Failed to delete vehicle:', error);
      const errorMsg = error.message || 'Unknown error';
      alert('Failed to delete vehicle: ' + errorMsg);
    }
  };

  const handleEdit = (id) => {
    window.location.href = `/trucks/${id}`;
  };

  const statusOptions = ['active', 'idle', 'maintenance', 'operational', 'out-of-service'];

  return (
    <TailwindLayout>
      <div className="min-h-screen bg-gray-50 p-4 max-h-[calc(100vh-4rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-100">
        <div className="max-w-full mx-auto">
          {/* Breadcrumb */}
          <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-indigo-600"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                  Dashboard
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Vehicles</span>
                </div>
              </li>
            </ol>
          </nav>

          {/* Header Section */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Vehicle Management</h1>
                <p className="text-sm text-gray-600 mt-0.5">
                  Manage your fleet vehicles and equipment
                </p>
              </div>
              <Link
                to="/trucks/new"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Vehicle
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Total Vehicles</p>
                  <p className="text-2xl font-bold text-gray-900">{allTrucks.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Active</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {
                      allTrucks.filter((t) => t.status === 'active' || t.status === 'operational')
                        .length
                    }
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-yellow-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Maintenance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {allTrucks.filter((t) => t.status === 'maintenance').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Filtered</p>
                  <p className="text-2xl font-bold text-gray-900">{filtered.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Table Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Table Header with Filters and Column Toggle */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex gap-4 flex-1 w-full flex-wrap">
                  {/* Search */}
                  <div className="relative flex-1 min-w-[200px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
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
                      placeholder="Search vehicles..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  {/* Cluster Filter */}
                  <div className="relative">
                    <select
                      value={cluster}
                      onChange={(e) => setCluster(e.target.value)}
                      className="px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none cursor-pointer"
                    >
                      <option value="">All Clusters</option>
                      {clusters.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>

                  {/* Vendor Filter */}
                  <div className="relative">
                    <select
                      value={vendorFilter}
                      onChange={(e) => setVendorFilter(e.target.value)}
                      className="px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none cursor-pointer"
                    >
                      <option value="">All Vendors</option>
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
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
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
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
                    <svg
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>

                  {/* Column Toggle Dropdown */}
                  <div className="relative">
                    <details className="group">
                      <summary className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg cursor-pointer text-sm font-medium text-gray-700 transition-colors">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                          />
                        </svg>
                        Columns
                        <svg
                          className="w-4 h-4 group-open:rotate-180 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </summary>
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-20 max-h-96 overflow-y-auto">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Toggle Columns</p>
                          {[
                            { key: 'id', label: 'ID' },
                            { key: 'createdAt', label: 'Created At' },
                            { key: 'updatedAt', label: 'Updated At' },
                            { key: 'deletedAt', label: 'Deleted At' },
                            { key: 'createdBy', label: 'Created By' },
                            { key: 'updatedBy', label: 'Updated By' },
                          ].map((col) => (
                            <label
                              key={col.key}
                              className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer"
                            >
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
              </div>

              {/* Active Filters Display */}
              {(query || cluster || vendorFilter || statusFilter) && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-600 font-medium">Active filters:</span>
                  {query && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs">
                      Search: &quot;{query}&quot;
                      <button
                        onClick={() => setQuery('')}
                        className="hover:bg-indigo-200 rounded p-0.5"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </span>
                  )}
                  {cluster && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      Cluster: {cluster}
                      <button
                        onClick={() => setCluster('')}
                        className="hover:bg-blue-200 rounded p-0.5"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </span>
                  )}
                  {vendorFilter && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                      Vendor: {vendors.find((v) => v.id === vendorFilter)?.name}
                      <button
                        onClick={() => setVendorFilter('')}
                        className="hover:bg-green-200 rounded p-0.5"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </span>
                  )}
                  {statusFilter && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                      Status: {statusFilter}
                      <button
                        onClick={() => setStatusFilter('')}
                        className="hover:bg-purple-200 rounded p-0.5"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setQuery('');
                      setCluster('');
                      setVendorFilter('');
                      setStatusFilter('');
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700 underline ml-2"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-red-600 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-800">Error Loading Vehicles</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                  <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
                    >
                      No
                    </th>
                    {visibleColumns.id && (
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 bg-gray-50"
                        onClick={() => handleSort('id')}
                      >
                        <div className="flex items-center gap-1">
                          ID
                          {getSortIcon('id')}
                        </div>
                      </th>
                    )}
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Image
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        Name
                        {getSortIcon('name')}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('plate')}
                    >
                      <div className="flex items-center gap-1">
                        Plate
                        {getSortIcon('plate')}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('year')}
                    >
                      <div className="flex items-center gap-1">
                        Year
                        {getSortIcon('year')}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('model')}
                    >
                      <div className="flex items-center gap-1">
                        Model
                        {getSortIcon('model')}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('type')}
                    >
                      <div className="flex items-center gap-1">
                        Type
                        {getSortIcon('type')}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('vendor')}
                    >
                      <div className="flex items-center gap-1">
                        Vendor
                        {getSortIcon('vendor')}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1">
                        Status
                        {getSortIcon('status')}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('vin')}
                    >
                      <div className="flex items-center gap-1">
                        VIN
                        {getSortIcon('vin')}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('cluster')}
                    >
                      <div className="flex items-center gap-1">
                        Cluster
                        {getSortIcon('cluster')}
                      </div>
                    </th>
                    {visibleColumns.createdAt && (
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className="flex items-center gap-1">
                          Created At
                          {getSortIcon('createdAt')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.updatedAt && (
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('updatedAt')}
                      >
                        <div className="flex items-center gap-1">
                          Updated At
                          {getSortIcon('updatedAt')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.deletedAt && (
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('deletedAt')}
                      >
                        <div className="flex items-center gap-1">
                          Deleted At
                          {getSortIcon('deletedAt')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.createdBy && (
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('createdBy')}
                      >
                        <div className="flex items-center gap-1">
                          Created By
                          {getSortIcon('createdBy')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.updatedBy && (
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('updatedBy')}
                      >
                        <div className="flex items-center gap-1">
                          Updated By
                          {getSortIcon('updatedBy')}
                        </div>
                      </th>
                    )}
                    <th
                      scope="col"
                      className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="20" className="px-4 py-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                        <p className="text-gray-500 text-sm">Loading vehicles...</p>
                      </td>
                    </tr>
                  ) : pageData.length === 0 ? (
                    <tr>
                      <td colSpan="20" className="px-4 py-12 text-center">
                        <svg
                          className="w-12 h-12 text-gray-400 mx-auto mb-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                          />
                        </svg>
                        <p className="text-gray-600 font-medium">No vehicles found</p>
                        <p className="text-gray-500 text-xs mt-1">
                          Try adjusting your search or filter criteria
                        </p>
                      </td>
                    </tr>
                  ) : (
                    pageData.map((truck, index) => (
                      <tr key={truck.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {(currentPage - 1) * pageSize + index + 1}
                          </div>
                        </td>
                        {visibleColumns.id && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-mono text-gray-600">{truck.id}</div>
                          </td>
                        )}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="w-16 h-12 rounded-md overflow-hidden bg-gray-100">
                            <TruckImage
                              id={truck.id}
                              width={160}
                              height={100}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{truck.name}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{truck.plate}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {truck.year}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {truck.model}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {truck.type}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {vendors.find((v) => v.id === truck.vendor_id)?.name || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              truck.status === 'active' || truck.status === 'operational'
                                ? 'bg-green-100 text-green-800'
                                : truck.status === 'maintenance'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : truck.status === 'idle'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {truck.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 font-mono">
                          {truck.vin}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {truck.cluster}
                        </td>
                        {visibleColumns.createdAt && (
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                            {truck.createdAt !== '-'
                              ? new Date(truck.createdAt).toLocaleString('id-ID', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '-'}
                          </td>
                        )}
                        {visibleColumns.updatedAt && (
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                            {truck.updatedAt !== '-'
                              ? new Date(truck.updatedAt).toLocaleString('id-ID', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '-'}
                          </td>
                        )}
                        {visibleColumns.deletedAt && (
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                            {truck.deletedAt
                              ? new Date(truck.deletedAt).toLocaleString('id-ID', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '-'}
                          </td>
                        )}
                        {visibleColumns.createdBy && (
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {truck.createdBy}
                          </td>
                        )}
                        {visibleColumns.updatedBy && (
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {truck.updatedBy}
                          </td>
                        )}
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <TruckActionMenu truck={truck} onEdit={handleEdit} onDelete={onDelete} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{start + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(end, filtered.length)}</span> of{' '}
                  <span className="font-medium">{filtered.length}</span> results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <div className="text-sm text-gray-700">
                    Page <span className="font-medium">{currentPage}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </div>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TailwindLayout>
  );
};

export default TrucksFormList;
