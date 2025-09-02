import React, { useState } from 'react';
import { 
  UserGroupIcon, 
  ClockIcon, 
  CalendarDaysIcon,
  TruckIcon,
  SunIcon,
  MoonIcon,
  Cog6ToothIcon,
  EyeIcon,
  PlusIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { driverShifts, drivers, trucks, getDriverShifts, getTrucksByDriver } from '../data/index.js';
import TailwindLayout from '../components/layout/TailwindLayout.jsx';

const DriverShifts = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [viewMode, setViewMode] = useState('schedule'); // 'schedule' or 'drivers'

  // Get shifts for selected date
  const getShiftsForDate = (date) => {
    return driverShifts.filter(shift => {
      if (!shift.shift_start) return false;
      try {
        const shiftDate = new Date(shift.shift_start);
        if (isNaN(shiftDate.getTime())) return false;
        return shiftDate.toISOString().split('T')[0] === date;
      } catch (error) {
        console.warn('Invalid date in shift:', shift);
        return false;
      }
    });
  };

  // Get driver info with current shift
  const getDriverInfo = (driver) => {
    const currentShifts = getDriverShifts(driver.id);
    const assignedTrucks = getTrucksByDriver(driver.id);
    
    // Find current active shift
    const now = new Date();
    const activeShift = currentShifts.find(shift => {
      if (!shift.shift_start || !shift.shift_end) return false;
      try {
        const start = new Date(shift.shift_start);
        const end = new Date(shift.shift_end);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
        return now >= start && now <= end;
      } catch (error) {
        return false;
      }
    });

    return {
      ...driver,
      currentShift: activeShift,
      assignedTrucks,
      totalShifts: currentShifts.length
    };
  };

  const driverInfos = drivers.map(getDriverInfo);
  const todayShifts = getShiftsForDate(selectedDate);

  const getShiftTypeIcon = (shiftType) => {
    switch (shiftType) {
      case 'day':
        return <SunIcon className="h-5 w-5 text-yellow-500" />;
      case 'night':
        return <MoonIcon className="h-5 w-5 text-indigo-500" />;
      case 'custom':
        return <Cog6ToothIcon className="h-5 w-5 text-purple-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getShiftTypeColor = (shiftType) => {
    switch (shiftType) {
      case 'day': return 'yellow';
      case 'night': return 'indigo';
      case 'custom': return 'purple';
      default: return 'gray';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  return (
    <TailwindLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Driver Shift Management</h1>
              <p className="text-gray-600 mt-2">Manage driver schedules and assignments</p>
            </div>
            <div className="flex gap-2">
              <div className="flex bg-white rounded-xl border border-gray-300 p-1">
                <button
                  onClick={() => setViewMode('schedule')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'schedule' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Schedule View
                </button>
                <button
                  onClick={() => setViewMode('drivers')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'drivers' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Driver View
                </button>
              </div>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-lg">
                <PlusIcon className="h-5 w-5" />
                Add Shift
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-xl">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Drivers</p>
                <p className="text-2xl font-bold text-gray-900">{drivers.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-xl">
                <ClockIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Active Shifts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {driverInfos.filter(d => d.currentShift).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-xl">
                <SunIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Day Shifts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {todayShifts.filter(s => s.shift_type === 'day').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center">
              <div className="bg-indigo-100 p-3 rounded-xl">
                <MoonIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Night Shifts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {todayShifts.filter(s => s.shift_type === 'night').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {viewMode === 'schedule' ? (
          /* Schedule View */
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Daily Schedule</h2>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {todayShifts.map((shift) => {
                const driver = drivers.find(d => d.id === shift.driver_id);
                const truck = trucks.find(t => t.id === shift.truck_id);
                
                return (
                  <div
                    key={shift.id}
                    className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedDriver(driver)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <div className={`bg-${getShiftTypeColor(shift.shift_type)}-100 p-2 rounded-lg`}>
                          {getShiftTypeIcon(shift.shift_type)}
                        </div>
                        <div className="ml-3">
                          <h4 className="font-semibold text-gray-900">{driver?.name}</h4>
                          <p className="text-sm text-gray-600 capitalize">{shift.shift_type} Shift</p>
                        </div>
                      </div>
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Time:</span>
                        <span className="font-medium">
                          {formatTime(shift.shift_start)} - {formatTime(shift.shift_end)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Truck:</span>
                        <span className="font-medium">{truck?.name || 'Unassigned'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Plate:</span>
                        <span className="font-medium">{truck?.plate_number || 'N/A'}</span>
                      </div>
                      {shift.notes && (
                        <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                          <p className="text-xs text-blue-700">{shift.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {todayShifts.length === 0 && (
              <div className="text-center py-12">
                <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No shifts scheduled for this date</p>
              </div>
            )}
          </div>
        ) : (
          /* Driver View */
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {driverInfos.map((driver) => (
              <div
                key={driver.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedDriver(driver)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-indigo-100 p-3 rounded-xl">
                      <UserGroupIcon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">{driver.name}</h3>
                      <p className="text-sm text-gray-600">{driver.license_number}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {driver.currentShift && (
                      <div className="flex items-center gap-1">
                        {getShiftTypeIcon(driver.currentShift.shift_type)}
                        <span className="text-xs text-gray-500">Active</span>
                      </div>
                    )}
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{driver.phone}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Shifts:</span>
                    <span className="font-medium">{driver.totalShifts}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Assigned Trucks:</span>
                    <span className="font-medium">{driver.assignedTrucks.length}</span>
                  </div>
                </div>

                {/* Current Shift Info */}
                {driver.currentShift ? (
                  <div className={`bg-${getShiftTypeColor(driver.currentShift.shift_type)}-50 rounded-xl p-3 border border-${getShiftTypeColor(driver.currentShift.shift_type)}-200`}>
                    <div className="flex items-center gap-2 mb-2">
                      {getShiftTypeIcon(driver.currentShift.shift_type)}
                      <span className="font-medium text-sm capitalize">
                        {driver.currentShift.shift_type} Shift Active
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {formatTime(driver.currentShift.shift_start)} - {formatTime(driver.currentShift.shift_end)}
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-center">
                    <p className="text-sm text-gray-500">No active shift</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Driver Detail Modal */}
        {selectedDriver && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedDriver.name}</h2>
                    <p className="text-gray-600">{selectedDriver.license_number}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
                      <PencilIcon className="h-4 w-4" />
                      Edit
                    </button>
                    <button 
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl transition-colors"
                      onClick={() => setSelectedDriver(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>

                {/* Driver Info */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Contact Info</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{selectedDriver.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">License:</span>
                        <span className="font-medium">{selectedDriver.license_number}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Statistics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Shifts:</span>
                        <span className="font-medium">{selectedDriver.totalShifts}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Assigned Trucks:</span>
                        <span className="font-medium">{selectedDriver.assignedTrucks.length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Shifts */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Shifts</h3>
                  <div className="space-y-3">
                    {getDriverShifts(selectedDriver.id).slice(0, 5).map((shift) => {
                      const truck = trucks.find(t => t.id === shift.truck_id);
                      return (
                        <div key={shift.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getShiftTypeIcon(shift.shift_type)}
                              <div>
                                <p className="font-medium text-gray-900 capitalize">{shift.shift_type} Shift</p>
                                <p className="text-sm text-gray-600">
                                  {formatTime(shift.shift_start)} - {formatTime(shift.shift_end)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">{truck?.name}</p>
                              <p className="text-sm text-gray-600">{truck?.plate_number}</p>
                            </div>
                          </div>
                          {shift.notes && (
                            <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                              <p className="text-xs text-blue-700">{shift.notes}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Assigned Trucks */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Assigned Trucks</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedDriver.assignedTrucks.map((truck) => (
                      <div key={truck.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <TruckIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{truck.name}</p>
                            <p className="text-sm text-gray-600">{truck.plate_number}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </TailwindLayout>
  );
};

export default DriverShifts;
