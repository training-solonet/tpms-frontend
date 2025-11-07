import React, { useState, useEffect } from 'react';
import TailwindLayout from '../../components/layout/TailwindLayout.jsx';
import { trucksApi } from '../../services/api2';

export default function LiveTireView() {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTruck, setSelectedTruck] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, critical, warning, normal
  const [currentPage, setCurrentPage] = useState(1);
  const trucksPerPage = 24; // 4 rows x 6 columns

  // Load data
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('📡 Loading truck tire data...');

        const res = await trucksApi.getAll();
        console.log('✅ Trucks response:', res);

        const trucksData = res?.data?.trucks || res?.data || [];

        if (!Array.isArray(trucksData) || trucksData.length === 0) {
          console.warn('No trucks data available');
          if (mounted) {
            setTrucks([]);
            setLoading(false);
          }
          return;
        }

        // Transform data with tire info
        const trucksWithTires = trucksData.map((truck) => {
          const tpms = truck.tpms || [];

          // Organize tires by position - support all positions
          const tiresByPosition = {
            frontLeft:
              tpms.find((t) => t.tire_location?.toLowerCase().includes('front left')) || null,
            frontRight:
              tpms.find((t) => t.tire_location?.toLowerCase().includes('front right')) || null,
            rearLeft1:
              tpms.find((t) => t.tire_location?.toLowerCase().includes('rear left 1')) || null,
            rearRight1:
              tpms.find((t) => t.tire_location?.toLowerCase().includes('rear right 1')) || null,
            rearLeft2:
              tpms.find((t) => t.tire_location?.toLowerCase().includes('rear left 2')) || null,
            rearRight2:
              tpms.find((t) => t.tire_location?.toLowerCase().includes('rear right 2')) || null,
            rearLeft3:
              tpms.find((t) => t.tire_location?.toLowerCase().includes('rear left 3')) || null,
            rearRight3:
              tpms.find((t) => t.tire_location?.toLowerCase().includes('rear right 3')) || null,
          };

          // Determine tire configuration based on available tires
          const tireCount = tpms.length;
          let config = '4-tire'; // default
          if (tireCount >= 8) config = '8-tire';
          else if (tireCount >= 6) config = '6-tire';

          return {
            id: truck.id,
            code: truck.unit_code || 'N/A',
            name: truck.truck_number || 'N/A',
            status: truck.status || 'active',
            tires: tiresByPosition,
            tpmsArray: tpms,
            tireConfig: config,
            tireCount: tireCount,
          };
        });

        if (mounted) {
          setTrucks(trucksWithTires);
          setLoading(false);
          // Auto-select first truck
          if (trucksWithTires.length > 0 && !selectedTruck) {
            setSelectedTruck(trucksWithTires[0].code);
          }
        }
      } catch (error) {
        console.error('❌ Error loading truck data:', error);
        if (mounted) {
          setTrucks([]);
          setLoading(false);
        }
      }
    };

    loadData();
    const interval = setInterval(loadData, 5000); // Refresh every 5s for live effect

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [selectedTruck]);

  // Filter trucks based on search and status
  const filteredTrucks = trucks.filter((truck) => {
    // Search filter
    const matchesSearch = 
      truck.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      truck.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // Status filter
    if (statusFilter === 'all') return true;
    
    const criticalCount = truck.tpmsArray.filter(t => getTireStatus(t) === 'red').length;
    const warningCount = truck.tpmsArray.filter(t => getTireStatus(t) === 'yellow').length;
    
    if (statusFilter === 'critical') return criticalCount > 0;
    if (statusFilter === 'warning') return warningCount > 0;
    if (statusFilter === 'normal') return criticalCount === 0 && warningCount === 0;
    
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTrucks.length / trucksPerPage);
  const startIndex = (currentPage - 1) * trucksPerPage;
  const endIndex = startIndex + trucksPerPage;
  const paginatedTrucks = filteredTrucks.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Get selected truck only
  const currentTruck = selectedTruck
    ? trucks.find((truck) => truck.code === selectedTruck)
    : filteredTrucks[0]; // Default to first filtered truck if none selected

  // Get tire status color
  const getTireStatus = (tire) => {
    if (!tire) return 'gray';

    const pressure = tire.tire_pressure || 0;
    const temp = tire.tire_temperature || 0;
    const exType = tire.ex_type || '';

    if (exType.includes('4')) return 'gray'; // Lost
    if (exType.includes('1') || pressure > 120) return 'red'; // High pressure
    if (exType.includes('3') || temp > 80) return 'red'; // High temp
    if (exType.includes('2') || pressure < 80) return 'yellow'; // Low pressure
    if (exType.includes('5') || (tire.battery || 0) < 20) return 'orange'; // Low battery

    return 'green'; // Normal
  };

  // Tire display component - support double tires
  const TireDisplay = ({ tire, position, isDouble = false }) => {
    if (!tire) {
      return (
        <div className="relative">
          <div
            className={`${isDouble ? 'w-16 h-24' : 'w-20 h-28'} bg-gray-200 rounded-lg flex items-center justify-center border-2 border-gray-300`}
          >
            <span className="text-gray-400 text-[10px]">No Data</span>
          </div>
          <div className="text-center mt-1 text-[10px] text-gray-500">{position}</div>
        </div>
      );
    }

    const status = getTireStatus(tire);
    const statusColors = {
      green: 'bg-green-500 border-green-600',
      yellow: 'bg-yellow-400 border-yellow-600',
      orange: 'bg-orange-400 border-orange-600',
      red: 'bg-red-500 border-red-600',
      gray: 'bg-gray-400 border-gray-600',
    };

    const pressure = tire.tire_pressure || 0;
    const temp = tire.tire_temperature || 0;
    const battery = tire.battery || 0;

    return (
      <div className="relative group">
        {/* Tire visual */}
        <div
          className={`${isDouble ? 'w-16 h-24' : 'w-20 h-28'} ${statusColors[status]} rounded-lg flex flex-col items-center justify-center border-4 shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer`}
        >
          <div className={`text-white font-bold ${isDouble ? 'text-[11px]' : 'text-sm'}`}>
            {pressure.toFixed(0)}
          </div>
          <div className={`text-white ${isDouble ? 'text-[9px]' : 'text-[10px]'}`}>PSI</div>
          <div className={`${isDouble ? 'w-10' : 'w-14'} h-0.5 bg-white/50 my-0.5`}></div>
          <div className={`text-white font-bold ${isDouble ? 'text-[11px]' : 'text-sm'}`}>
            {temp.toFixed(0)}°C
          </div>
        </div>

        {/* Position label */}
        <div className={`text-center mt-1 ${isDouble ? 'text-[9px]' : 'text-[10px]'} font-medium text-gray-700`}>{position}</div>

        {/* Tooltip on hover */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
          <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-xl">
            <div className="font-semibold mb-1">{position}</div>
            <div>Pressure: {pressure.toFixed(1)} PSI</div>
            <div>Temp: {temp.toFixed(1)}°C</div>
            <div>Battery: {battery}%</div>
            <div className="text-gray-300 text-[10px] mt-1">{tire.serial_number || 'N/A'}</div>
          </div>
        </div>

        {/* Status indicator */}
        <div
          className={`absolute -top-1 -right-1 w-4 h-4 ${statusColors[status]} rounded-full border-2 border-white animate-pulse`}
        ></div>
      </div>
    );
  };

  // Truck card component
  const TruckCard = ({ truck }) => {
    const hasRear2 = truck.tires.rearLeft2 || truck.tires.rearRight2;
    const hasRear3 = truck.tires.rearLeft3 || truck.tires.rearRight3;

    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        {/* Truck header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{truck.code}</h2>
            <p className="text-sm text-gray-500">{truck.name}</p>
          </div>
          <div className="text-right">
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                truck.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {truck.status === 'active' ? '● Active' : '○ Inactive'}
            </div>
            <div className="text-xs text-gray-500 mt-1">Live Update: 5s</div>
          </div>
        </div>

        {/* Tire layout - Top view of truck with scroll */}
        <div className="relative overflow-x-auto">
          {/* Truck body visualization */}
          <div className="mx-auto min-w-[500px]" style={{ maxWidth: '700px' }}>
            {/* Front label */}
            <div className="text-center text-sm font-semibold text-gray-600 mb-2">▲ FRONT</div>

            {/* Truck outline with tires */}
            <div className="relative bg-linear-to-b from-gray-100 to-gray-200 rounded-3xl p-6 border-4 border-gray-300 shadow-inner">
              {/* Front tires */}
              <div className="flex justify-between items-center mb-12">
                <TireDisplay tire={truck.tires.frontLeft} position="Front Left" />
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <svg
                      className="w-12 h-12 text-gray-400 mx-auto"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                      />
                    </svg>
                    <div className="text-xs text-gray-500 mt-1 font-semibold">{truck.code}</div>
                    <div className="text-[10px] text-gray-400">{truck.tireCount} Tires</div>
                  </div>
                </div>
                <TireDisplay tire={truck.tires.frontRight} position="Front Right" />
              </div>

              {/* Rear tires row 1 - Double tires (always show in dual format for 6x4 and 8x4) */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex gap-1.5">
                  <TireDisplay
                    tire={truck.tires.rearLeft1}
                    position="RL1-I"
                    isDouble={true}
                  />
                  <TireDisplay
                    tire={truck.tires.rearLeft1}
                    position="RL1-O"
                    isDouble={true}
                  />
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-xs text-gray-500 font-semibold bg-gray-100 px-3 py-1 rounded-full">
                    Axle 1
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <TireDisplay
                    tire={truck.tires.rearRight1}
                    position="RR1-I"
                    isDouble={true}
                  />
                  <TireDisplay
                    tire={truck.tires.rearRight1}
                    position="RR1-O"
                    isDouble={true}
                  />
                </div>
              </div>

              {/* Rear tires row 2 - Only if exists */}
              {hasRear2 && (
                <div className="flex justify-between items-center mb-6">
                  <div className="flex gap-1.5">
                    <TireDisplay tire={truck.tires.rearLeft2} position="RL2-I" isDouble={true} />
                    <TireDisplay tire={truck.tires.rearLeft2} position="RL2-O" isDouble={true} />
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-xs text-gray-500 font-semibold bg-gray-100 px-3 py-1 rounded-full">
                      Axle 2
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <TireDisplay tire={truck.tires.rearRight2} position="RR2-I" isDouble={true} />
                    <TireDisplay tire={truck.tires.rearRight2} position="RR2-O" isDouble={true} />
                  </div>
                </div>
              )}

              {/* Rear tires row 3 - Only if exists */}
              {hasRear3 && (
                <div className="flex justify-between items-center">
                  <div className="flex gap-1.5">
                    <TireDisplay tire={truck.tires.rearLeft3} position="RL3-I" isDouble={true} />
                    <TireDisplay tire={truck.tires.rearLeft3} position="RL3-O" isDouble={true} />
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-xs text-gray-500 font-semibold bg-gray-100 px-3 py-1 rounded-full">
                      Axle 3
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <TireDisplay tire={truck.tires.rearRight3} position="RR3-I" isDouble={true} />
                    <TireDisplay tire={truck.tires.rearRight3} position="RR3-O" isDouble={true} />
                  </div>
                </div>
              )}
            </div>

            {/* Rear label */}
            <div className="text-center text-sm font-semibold text-gray-600 mt-2">▼ REAR</div>
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-4 justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded border-2 border-green-600"></div>
              <span>Normal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-400 rounded border-2 border-yellow-600"></div>
              <span>Low Pressure</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-400 rounded border-2 border-orange-600"></div>
              <span>Low Battery</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded border-2 border-red-600"></div>
              <span>Critical</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-400 rounded border-2 border-gray-600"></div>
              <span>No Signal</span>
            </div>
          </div>
        </div>

        {/* Summary stats - Quick overview */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Tire Count */}
          <div className="bg-linear-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-900">{truck.tireCount}</div>
                <div className="text-xs text-blue-700 font-medium">Total Tires</div>
              </div>
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {/* Normal Count */}
          <div className="bg-linear-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-900">
                  {truck.tpmsArray.filter(t => getTireStatus(t) === 'green').length}
                </div>
                <div className="text-xs text-green-700 font-medium">Normal</div>
              </div>
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {/* Warning Count */}
          <div className="bg-linear-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-900">
                  {truck.tpmsArray.filter(t => getTireStatus(t) === 'yellow').length}
                </div>
                <div className="text-xs text-yellow-700 font-medium">Low Pressure</div>
              </div>
              <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          {/* Critical Count */}
          <div className="bg-linear-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-900">
                  {truck.tpmsArray.filter(t => getTireStatus(t) === 'red').length}
                </div>
                <div className="text-xs text-red-700 font-medium">Critical</div>
              </div>
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Detailed alerts - only show if there are issues */}
        {truck.tpmsArray.filter(t => getTireStatus(t) !== 'green' && getTireStatus(t) !== 'gray').length > 0 && (
          <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-yellow-800 mb-2">Attention Required</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {truck.tpmsArray.map((tire, idx) => {
                    const status = getTireStatus(tire);
                    if (status === 'green' || status === 'gray') return null;
                    return (
                      <div key={idx} className="flex items-center text-xs text-yellow-800 bg-white rounded px-2 py-1.5">
                        <span className={`w-2 h-2 rounded-full mr-2 ${
                          status === 'red' ? 'bg-red-500' : status === 'orange' ? 'bg-orange-500' : 'bg-yellow-500'
                        }`}></span>
                        <span className="font-medium">{tire.tire_location}:</span>
                        <span className="ml-1">
                          {status === 'red' ? 'Critical' : status === 'orange' ? 'Warning' : 'Low Pressure'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <TailwindLayout>
      <div
        className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 overflow-y-auto"
        style={{ maxHeight: 'calc(100vh - 80px)' }}
      >
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Live Tire Monitoring</h1>
          <p className="mt-1 text-sm text-gray-500">
            Real-time visual tire pressure and temperature monitoring
          </p>
        </div>

        {/* Truck Selector - Grid Cards */}
        <div className="bg-white shadow-lg rounded-xl p-6 mb-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Select Vehicle</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Showing {filteredTrucks.length} of {trucks.length} vehicles
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg
                className="w-5 h-5 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span className="font-medium">{trucks.length} Total Vehicles</span>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            {/* Search Box */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by truck code or name..."
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Status Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-300'
                    : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:border-gray-300'
                }`}
              >
                All ({trucks.length})
              </button>
              <button
                onClick={() => setStatusFilter('critical')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'critical'
                    ? 'bg-red-100 text-red-700 border-2 border-red-300'
                    : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:border-gray-300'
                }`}
              >
                Critical ({trucks.filter(t => t.tpmsArray.some(tire => getTireStatus(tire) === 'red')).length})
              </button>
              <button
                onClick={() => setStatusFilter('warning')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'warning'
                    ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300'
                    : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:border-gray-300'
                }`}
              >
                Warning ({trucks.filter(t => t.tpmsArray.some(tire => getTireStatus(tire) === 'yellow')).length})
              </button>
              <button
                onClick={() => setStatusFilter('normal')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'normal'
                    ? 'bg-green-100 text-green-700 border-2 border-green-300'
                    : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:border-gray-300'
                }`}
              >
                Normal ({trucks.filter(t => 
                  t.tpmsArray.every(tire => getTireStatus(tire) === 'green' || getTireStatus(tire) === 'gray')
                ).length})
              </button>
            </div>
          </div>

          {/* Results Info */}
          {filteredTrucks.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-gray-600 font-medium">No trucks found</p>
              <p className="text-xs text-gray-500 mt-1">Try adjusting your search or filter</p>
            </div>
          ) : (
            <>
              {/* Truck Grid Cards - with max height and scroll */}
              <div className="max-h-[500px] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {paginatedTrucks.map((truck) => {
              const isSelected = selectedTruck === truck.code;
              const normalCount = truck.tpmsArray.filter(t => getTireStatus(t) === 'green').length;
              const criticalCount = truck.tpmsArray.filter(t => getTireStatus(t) === 'red').length;
              const warningCount = truck.tpmsArray.filter(t => getTireStatus(t) === 'yellow').length;
              const hasIssues = criticalCount > 0 || warningCount > 0;

              return (
                <button
                  key={truck.code}
                  onClick={() => setSelectedTruck(truck.code)}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 shadow-lg scale-105'
                      : hasIssues
                        ? 'border-red-300 bg-red-50 hover:border-red-400 hover:shadow-md'
                        : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
                  }`}
                >
                  {/* Status indicator badge */}
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 bg-indigo-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">
                      ACTIVE
                    </div>
                  )}
                  {!isSelected && hasIssues && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow animate-pulse">
                      ALERT
                    </div>
                  )}

                  {/* Truck icon */}
                  <div className={`flex items-center justify-center mb-2 ${
                    isSelected ? 'text-indigo-600' : hasIssues ? 'text-red-500' : 'text-gray-400'
                  }`}>
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                  </div>

                  {/* Truck info */}
                  <div className="text-center mb-2">
                    <div className={`text-sm font-bold truncate ${
                      isSelected ? 'text-indigo-900' : 'text-gray-900'
                    }`}>
                      {truck.code}
                    </div>
                    <div className="text-[10px] text-gray-500 truncate">{truck.name}</div>
                  </div>

                  {/* Tire status summary */}
                  <div className="flex items-center justify-center gap-1.5 text-[10px]">
                    {normalCount > 0 && (
                      <div className="flex items-center gap-0.5 text-green-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        <span className="font-semibold">{normalCount}</span>
                      </div>
                    )}
                    {warningCount > 0 && (
                      <div className="flex items-center gap-0.5 text-yellow-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                        <span className="font-semibold">{warningCount}</span>
                      </div>
                    )}
                    {criticalCount > 0 && (
                      <div className="flex items-center gap-0.5 text-red-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        <span className="font-semibold">{criticalCount}</span>
                      </div>
                    )}
                  </div>

                  {/* Total tire count */}
                  <div className="text-center mt-2 pt-2 border-t border-gray-200">
                    <span className={`text-[9px] font-medium ${
                      isSelected ? 'text-indigo-700' : 'text-gray-500'
                    }`}>
                      {truck.tireCount} TIRES
                    </span>
                  </div>
                </button>
              );
            })}
                </div>
              </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredTrucks.length)} of {filteredTrucks.length} vehicles
              </div>
              
              <div className="flex items-center gap-2">
                {/* Previous Button */}
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Page Numbers */}
                <div className="flex gap-1">
                  {/* First page */}
                  {currentPage > 3 && (
                    <>
                      <button
                        onClick={() => setCurrentPage(1)}
                        className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        1
                      </button>
                      {currentPage > 4 && <span className="px-2 py-2 text-gray-400">...</span>}
                    </>
                  )}

                  {/* Current page and neighbors */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      return page === currentPage || 
                             page === currentPage - 1 || 
                             page === currentPage + 1 ||
                             (currentPage <= 2 && page <= 3) ||
                             (currentPage >= totalPages - 1 && page >= totalPages - 2);
                    })
                    .map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                  {/* Last page */}
                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && <span className="px-2 py-2 text-gray-400">...</span>}
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Jump to page */}
                <div className="ml-2 flex items-center gap-2">
                  <span className="text-sm text-gray-600">Go to:</span>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                      const page = parseInt(e.target.value);
                      if (page >= 1 && page <= totalPages) {
                        setCurrentPage(page);
                      }
                    }}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}
            </>
          )}
        </div>

        {/* Truck Display */}
        <div>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-sm text-gray-500">Loading truck data...</p>
            </div>
          ) : !currentTruck ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No truck selected</h3>
              <p className="mt-1 text-sm text-gray-500">
                Please select a truck from the dropdown above.
              </p>
            </div>
          ) : (
            <TruckCard truck={currentTruck} />
          )}
        </div>
      </div>
    </TailwindLayout>
  );
}
