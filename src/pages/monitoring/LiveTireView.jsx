import React, { useState, useEffect } from 'react';
import TailwindLayout from '../../components/layout/TailwindLayout.jsx';
import { trucksApi } from '../../services/api2';

export default function LiveTireView() {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTruck, setSelectedTruck] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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
          
          // Organize tires by position
          const tiresByPosition = {
            frontLeft: tpms.find(t => t.tire_location?.toLowerCase().includes('front left')) || null,
            frontRight: tpms.find(t => t.tire_location?.toLowerCase().includes('front right')) || null,
            rearLeft1: tpms.find(t => t.tire_location?.toLowerCase().includes('rear left 1')) || null,
            rearRight1: tpms.find(t => t.tire_location?.toLowerCase().includes('rear right 1')) || null,
            rearLeft2: tpms.find(t => t.tire_location?.toLowerCase().includes('rear left 2')) || null,
            rearRight2: tpms.find(t => t.tire_location?.toLowerCase().includes('rear right 2')) || null,
          };

          return {
            id: truck.id,
            code: truck.unit_code || 'N/A',
            name: truck.truck_number || 'N/A',
            status: truck.status || 'active',
            tires: tiresByPosition,
            tpmsArray: tpms,
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

  // Filter trucks
  const filteredTrucks = trucks.filter((truck) => {
    const matchSearch = !searchTerm || 
      truck.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSelected = !selectedTruck || truck.code === selectedTruck;
    return matchSearch && matchSelected;
  });

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

  // Tire display component
  const TireDisplay = ({ tire, position }) => {
    if (!tire) {
      return (
        <div className="relative">
          <div className="w-24 h-32 bg-gray-200 rounded-lg flex items-center justify-center border-2 border-gray-300">
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
        <div className={`w-24 h-32 ${statusColors[status]} rounded-lg flex flex-col items-center justify-center border-4 shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer`}>
          <div className="text-white font-bold text-sm">{pressure.toFixed(0)}</div>
          <div className="text-white text-xs">PSI</div>
          <div className="w-16 h-0.5 bg-white/50 my-1"></div>
          <div className="text-white font-bold text-sm">{temp.toFixed(0)}°C</div>
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
        <div className={`absolute -top-1 -right-1 w-4 h-4 ${statusColors[status]} rounded-full border-2 border-white animate-pulse`}></div>
      </div>
    );
  };

  // Truck card component
  const TruckCard = ({ truck }) => {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        {/* Truck header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{truck.code}</h2>
            <p className="text-sm text-gray-500">{truck.name}</p>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              truck.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {truck.status === 'active' ? '● Active' : '○ Inactive'}
            </div>
            <div className="text-xs text-gray-500 mt-1">Live Update: 5s</div>
          </div>
        </div>

        {/* Tire layout - Top view of truck */}
        <div className="relative">
          {/* Truck body visualization */}
          <div className="mx-auto" style={{ maxWidth: '600px' }}>
            {/* Front label */}
            <div className="text-center text-sm font-semibold text-gray-600 mb-2">▲ FRONT</div>
            
            {/* Truck outline with tires */}
            <div className="relative bg-linear-to-b from-gray-100 to-gray-200 rounded-3xl p-8 border-4 border-gray-300 shadow-inner">
              {/* Front tires */}
              <div className="flex justify-between items-center mb-16">
                <TireDisplay tire={truck.tires.frontLeft} position="Front Left" />
                <div className="flex-1 flex items-center justify-center">
                  <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                </div>
                <TireDisplay tire={truck.tires.frontRight} position="Front Right" />
              </div>

              {/* Rear tires row 1 */}
              <div className="flex justify-between items-center mb-8">
                <TireDisplay tire={truck.tires.rearLeft1} position="Rear Left 1" />
                <div className="flex-1"></div>
                <TireDisplay tire={truck.tires.rearRight1} position="Rear Right 1" />
              </div>

              {/* Rear tires row 2 */}
              <div className="flex justify-between items-center">
                <TireDisplay tire={truck.tires.rearLeft2} position="Rear Left 2" />
                <div className="flex-1"></div>
                <TireDisplay tire={truck.tires.rearRight2} position="Rear Right 2" />
              </div>
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
                  {status === 'red' ? '⚠️ Critical' : status === 'orange' ? '⚠️ Warning' : '⚠️ Attention'}
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
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Live Tire Monitoring</h1>
          <p className="mt-1 text-sm text-gray-500">Real-time visual tire pressure and temperature monitoring</p>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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

            {/* Truck selector */}
            <div className="relative">
              <select
                value={selectedTruck}
                onChange={(e) => setSelectedTruck(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md appearance-none"
              >
                <option value="">All Trucks</option>
                {trucks.map((truck) => (
                  <option key={truck.code} value={truck.code}>
                    {truck.code} - {truck.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Truck cards */}
        <div>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-sm text-gray-500">Loading truck data...</p>
            </div>
          ) : filteredTrucks.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No trucks found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
            </div>
          ) : (
            filteredTrucks.map((truck) => <TruckCard key={truck.code} truck={truck} />)
          )}
        </div>
      </div>
    </TailwindLayout>
  );
}
