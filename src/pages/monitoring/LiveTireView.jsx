import React, { useState, useEffect } from 'react';
import TailwindLayout from '../../components/layout/TailwindLayout.jsx';
import { trucksApi } from '../../services/api2';

export default function LiveTireView() {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTruck, setSelectedTruck] = useState('');

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

  // Get selected truck only
  const currentTruck = selectedTruck
    ? trucks.find((truck) => truck.code === selectedTruck)
    : trucks[0]; // Default to first truck if none selected

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
            className={`${isDouble ? 'w-20 h-28' : 'w-24 h-32'} bg-gray-200 rounded-lg flex items-center justify-center border-2 border-gray-300`}
          >
            <span className="text-gray-400 text-xs">No Data</span>
          </div>
          <div className="text-center mt-1 text-xs text-gray-500">{position}</div>
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
          className={`${isDouble ? 'w-20 h-28' : 'w-24 h-32'} ${statusColors[status]} rounded-lg flex flex-col items-center justify-center border-4 shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer`}
        >
          <div className={`text-white font-bold ${isDouble ? 'text-xs' : 'text-sm'}`}>
            {pressure.toFixed(0)}
          </div>
          <div className={`text-white ${isDouble ? 'text-[10px]' : 'text-xs'}`}>PSI</div>
          <div className={`${isDouble ? 'w-12' : 'w-16'} h-0.5 bg-white/50 my-1`}></div>
          <div className={`text-white font-bold ${isDouble ? 'text-xs' : 'text-sm'}`}>
            {temp.toFixed(0)}°C
          </div>
        </div>

        {/* Position label */}
        <div className="text-center mt-1 text-xs font-medium text-gray-700">{position}</div>

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

              {/* Rear tires row 1 - Double tires */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex gap-1">
                  <TireDisplay
                    tire={truck.tires.rearLeft1}
                    position="RL1"
                    isDouble={hasRear2 || hasRear3}
                  />
                </div>
                <div className="flex-1"></div>
                <div className="flex gap-1">
                  <TireDisplay
                    tire={truck.tires.rearRight1}
                    position="RR1"
                    isDouble={hasRear2 || hasRear3}
                  />
                </div>
              </div>

              {/* Rear tires row 2 - Only if exists */}
              {hasRear2 && (
                <div className="flex justify-between items-center mb-6">
                  <div className="flex gap-1">
                    <TireDisplay tire={truck.tires.rearLeft2} position="RL2" isDouble={hasRear3} />
                  </div>
                  <div className="flex-1"></div>
                  <div className="flex gap-1">
                    <TireDisplay tire={truck.tires.rearRight2} position="RR2" isDouble={hasRear3} />
                  </div>
                </div>
              )}

              {/* Rear tires row 3 - Only if exists */}
              {hasRear3 && (
                <div className="flex justify-between items-center">
                  <div className="flex gap-1">
                    <TireDisplay tire={truck.tires.rearLeft3} position="RL3" isDouble={false} />
                  </div>
                  <div className="flex-1"></div>
                  <div className="flex gap-1">
                    <TireDisplay tire={truck.tires.rearRight3} position="RR3" isDouble={false} />
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

        {/* Summary stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {truck.tpmsArray.map((tire, idx) => {
            const status = getTireStatus(tire);
            return status !== 'green' && status !== 'gray' ? (
              <div key={idx} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="text-xs text-gray-600">{tire.tire_location}</div>
                <div className="text-sm font-semibold text-yellow-800">
                  {status === 'red'
                    ? '⚠️ Critical'
                    : status === 'orange'
                      ? '⚠️ Warning'
                      : '⚠️ Attention'}
                </div>
              </div>
            ) : null;
          })}
        </div>
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

        {/* Truck Selector */}
        <div className="bg-white shadow-lg rounded-xl p-6 mb-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Select Vehicle</h2>
              <p className="text-xs text-gray-500 mt-0.5">Choose a truck to monitor tire status</p>
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
              <span className="font-medium">{trucks.length} Vehicles Available</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Previous Button */}
            <button
              onClick={() => {
                const currentIndex = trucks.findIndex((t) => t.code === selectedTruck);
                const prevIndex = currentIndex > 0 ? currentIndex - 1 : trucks.length - 1;
                setSelectedTruck(trucks[prevIndex]?.code || '');
              }}
              disabled={trucks.length <= 1}
              className="shrink-0 p-3 rounded-lg border-2 border-gray-300 bg-white hover:bg-gray-50 hover:border-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Previous truck"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            {/* Truck Selector */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
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
                    d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                  />
                </svg>
              </div>
              <select
                value={selectedTruck}
                onChange={(e) => setSelectedTruck(e.target.value)}
                className="block w-full pl-12 pr-10 py-3 text-base border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 rounded-lg appearance-none bg-white font-medium text-gray-900 shadow-sm hover:border-indigo-400 transition-colors"
              >
                {trucks.map((truck) => (
                  <option key={truck.code} value={truck.code}>
                    {truck.code} - {truck.name} ({truck.tireCount} tires)
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
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
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            {/* Next Button */}
            <button
              onClick={() => {
                const currentIndex = trucks.findIndex((t) => t.code === selectedTruck);
                const nextIndex = currentIndex < trucks.length - 1 ? currentIndex + 1 : 0;
                setSelectedTruck(trucks[nextIndex]?.code || '');
              }}
              disabled={trucks.length <= 1}
              className="shrink-0 p-3 rounded-lg border-2 border-gray-300 bg-white hover:bg-gray-50 hover:border-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Next truck"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
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
