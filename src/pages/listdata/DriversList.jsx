import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TailwindLayout from '../../components/layout/TailwindLayout.jsx';
import { driversApi } from '../../services/api2/index.js';

function DriverActionMenu({ driver, onEdit, onDelete }) {
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
              onEdit(driver.id);
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
            Edit Driver
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
              onDelete(driver.id);
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
            Delete Driver
          </button>
        </div>
      )}

      {showTimestamp && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-20">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Created:</span>
              <span className="text-gray-900 font-medium">
                {driver.created_at ? new Date(driver.created_at).toLocaleString() : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Updated:</span>
              <span className="text-gray-900 font-medium">
                {driver.updated_at ? new Date(driver.updated_at).toLocaleString() : '-'}
              </span>
            </div>
            {driver.deleted_at && (
              <div className="flex justify-between">
                <span className="text-gray-500">Deleted:</span>
                <span className="text-red-600 font-medium">
                  {new Date(driver.deleted_at).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DriversList() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [error, setError] = React.useState('');

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = React.useState({
    id: false,
    createdAt: false,
    updatedAt: false,
    deletedAt: false,
  });

  // Sort state
  const [sortConfig, setSortConfig] = React.useState({
    key: null,
    direction: 'asc',
  });

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      console.log('📡 Loading drivers from Backend 2...');

      const res = await driversApi.getAll();
      console.log('✅ Drivers response:', res);

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

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key === columnKey) {
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
    let result = drivers.filter((v) => {
      const licenseNum = v.license_number || '';
      const licenseType = v.license_type || '';
      return (
        !q ||
        (v.name || '').toLowerCase().includes(q) ||
        licenseNum.toLowerCase().includes(q) ||
        (v.phone || '').toLowerCase().includes(q) ||
        (v.email || '').toLowerCase().includes(q) ||
        licenseType.toLowerCase().includes(q)
      );
    });

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key] || '';
        let bVal = b[sortConfig.key] || '';

        // Handle different field names
        if (sortConfig.key === 'licenseNumber') {
          aVal = a.license_number || '';
          bVal = b.license_number || '';
        } else if (sortConfig.key === 'licenseType') {
          aVal = a.license_type || '';
          bVal = b.license_type || '';
        } else if (sortConfig.key === 'createdAt') {
          aVal = a.created_at || '';
          bVal = b.created_at || '';
        } else if (sortConfig.key === 'updatedAt') {
          aVal = a.updated_at || '';
          bVal = b.updated_at || '';
        } else if (sortConfig.key === 'deletedAt') {
          aVal = a.deleted_at || '';
          bVal = b.deleted_at || '';
        }

        if (typeof aVal === 'string') {
          return sortConfig.direction === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [drivers, query, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const paginatedDrivers = filtered.slice(start, end);

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

  const handleEdit = (id) => {
    navigate(`/drivers/${id}`);
  };

  const columnDefinitions = [
    { key: 'no', label: 'No', sortable: false },
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'licenseNumber', label: 'License Number', sortable: true },
    { key: 'licenseType', label: 'License Type', sortable: true },
    { key: 'phone', label: 'Phone', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'createdAt', label: 'Created At', sortable: true },
    { key: 'updatedAt', label: 'Updated At', sortable: true },
    { key: 'deletedAt', label: 'Deleted At', sortable: true },
  ];

  // Only optional columns appear in the column toggle dropdown
  const toggleableColumns = [
    { key: 'id', label: 'ID' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'updatedAt', label: 'Updated At' },
    { key: 'deletedAt', label: 'Deleted At' },
  ];

  return (
    <TailwindLayout>
      <div className="p-6 space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
          <Link to="/" className="hover:text-indigo-600 transition-colors">
            Dashboard
          </Link>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-gray-900 font-medium">Drivers</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Driver Management</h1>
            <p className="text-sm text-gray-600 mt-1">Manage driver information and licenses</p>
          </div>
          <Link
            to="/drivers/new"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Driver
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Drivers</p>
                <p className="text-2xl font-bold text-gray-900">{drivers.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
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
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {drivers.filter((d) => !d.deleted_at).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
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
                <p className="text-sm text-gray-600">Filtered</p>
                <p className="text-2xl font-bold text-gray-900">{filtered.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Table with Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Filters Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex gap-4 flex-1 w-full">
                <div className="flex-1 max-w-md">
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Search</label>
                  <input
                    type="text"
                    placeholder="Name, license, phone, email..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Per Page</label>
                  <div className="relative">
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(1);
                      }}
                      className="w-full pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
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
                </div>

                {/* Column Toggle Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Columns</label>
                  <details className="group">
                    <summary className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg cursor-pointer text-sm font-medium text-gray-700 transition-colors list-none">
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
                        {toggleableColumns.map((col) => (
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

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (filtered.length === 0) {
                      alert('No data to export');
                      return;
                    }
                    const csvContent = [
                      [
                        'No',
                        'Name',
                        'License Number',
                        'License Type',
                        'Phone',
                        'Email',
                        'Address',
                        'Status',
                      ].join(','),
                      ...filtered.map((d, i) =>
                        [
                          i + 1,
                          d.name || '',
                          d.license_number || '',
                          d.license_type || '',
                          d.phone || '',
                          d.email || '',
                          d.address || '',
                          d.status || '',
                        ]
                          .map((field) => `"${String(field).replace(/"/g, '""')}"`)
                          .join(',')
                      ),
                    ].join('\n');

                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `drivers_${new Date().toISOString().split('T')[0]}.csv`;
                    link.click();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  title="Export to CSV"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
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
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table Content */}
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
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
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <button
                onClick={load}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Drivers Found</h3>
              <p className="text-sm text-gray-600 mb-4">
                {query
                  ? 'Try adjusting your search criteria'
                  : 'Get started by adding your first driver'}
              </p>
              {!query && (
                <Link
                  to="/drivers/new"
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Driver
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {columnDefinitions.map((col) => {
                        // Only check visibility for optional columns (id, timestamps)
                        const isOptional = ['id', 'createdAt', 'updatedAt', 'deletedAt'].includes(
                          col.key
                        );
                        if (isOptional && !visibleColumns[col.key]) return null;

                        return (
                          <th
                            key={col.key}
                            scope="col"
                            className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                              col.sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''
                            }`}
                            onClick={() => col.sortable && handleSort(col.key)}
                          >
                            <div className="flex items-center space-x-1">
                              <span>{col.label}</span>
                              {col.sortable && getSortIcon(col.key)}
                            </div>
                          </th>
                        );
                      })}
                      <th
                        scope="col"
                        className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedDrivers.map((driver, index) => (
                      <tr key={driver.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{start + index + 1}</div>
                        </td>
                        {visibleColumns.id && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-mono text-gray-600">{driver.id}</div>
                          </td>
                        )}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {driver.name || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700">
                            {driver.license_number || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{driver.license_type || '-'}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{driver.phone || '-'}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{driver.email || '-'}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              driver.status === 'active' || driver.status === 'aktif'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {driver.status || 'N/A'}
                          </span>
                        </td>
                        {visibleColumns.createdAt && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {driver.created_at
                                ? new Date(driver.created_at).toLocaleDateString()
                                : '-'}
                            </div>
                          </td>
                        )}
                        {visibleColumns.updatedAt && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {driver.updated_at
                                ? new Date(driver.updated_at).toLocaleDateString()
                                : '-'}
                            </div>
                          </td>
                        )}
                        {visibleColumns.deletedAt && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {driver.deleted_at
                                ? new Date(driver.deleted_at).toLocaleDateString()
                                : '-'}
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <DriverActionMenu
                            driver={driver}
                            onEdit={handleEdit}
                            onDelete={onDelete}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">
                      Showing <span className="font-medium">{start + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(end, filtered.length)}</span> of{' '}
                      <span className="font-medium">{filtered.length}</span> results
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>

                    <span className="text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>

                    <button
                      onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </TailwindLayout>
  );
}
