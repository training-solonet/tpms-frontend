import React from 'react';
import {
  TruckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon,
  UserGroupIcon,
  MapIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import TailwindStatCard from './TailwindStatCard';
import SimpleChartCard from './SimpleChartCard';

// Sample data for fleet tracking
const fleetStats = [
  {
    title: 'Total Vehicles',
    value: '24',
    change: '2',
    changeType: 'positive',
    icon: TruckIcon,
    color: 'indigo',
    subtitle: 'Active Fleet'
  },
  {
    title: 'Active Vehicles',
    value: '18',
    change: '1',
    changeType: 'positive',
    icon: CheckCircleIcon,
    color: 'green',
    subtitle: 'Currently Running'
  },
  {
    title: 'Maintenance Due',
    value: '3',
    change: '1',
    changeType: 'negative',
    icon: ExclamationTriangleIcon,
    color: 'yellow',
    subtitle: 'Requires Service'
  },
  {
    title: 'Alerts',
    value: '5',
    change: '2',
    changeType: 'negative',
    icon: XCircleIcon,
    color: 'red',
    subtitle: 'Active Alerts'
  },
];

const fuelData = [
  { name: 'Jan', value: 12500 },
  { name: 'Feb', value: 13200 },
  { name: 'Mar', value: 11800 },
  { name: 'Apr', value: 14100 },
  { name: 'May', value: 13500 },
  { name: 'Jun', value: 15200 },
];

const mileageData = [
  { name: 'Week 1', value: 2400 },
  { name: 'Week 2', value: 2800 },
  { name: 'Week 3', value: 2200 },
  { name: 'Week 4', value: 3100 },
];

const vehicleStatusData = [
  { name: 'Active', value: 18 },
  { name: 'Maintenance', value: 3 },
  { name: 'Idle', value: 2 },
  { name: 'Out of Service', value: 1 },
];

const recentAlerts = [
  {
    id: 1,
    vehicle: 'BRN-001',
    type: 'Speed Alert',
    message: 'Speed limit exceeded on Jl. Sudirman',
    time: '5 min ago',
    severity: 'high',
  },
  {
    id: 2,
    vehicle: 'BRN-003',
    type: 'Maintenance',
    message: 'Scheduled maintenance due in 2 days',
    time: '1 hour ago',
    severity: 'medium',
  },
  {
    id: 3,
    vehicle: 'BRN-002',
    type: 'Route Deviation',
    message: 'Vehicle deviated from planned route',
    time: '2 hours ago',
    severity: 'medium',
  },
  {
    id: 4,
    vehicle: 'BRN-004',
    type: 'Fuel Alert',
    message: 'Low fuel level detected',
    time: '3 hours ago',
    severity: 'low',
  },
];

const topVehicles = [
  {
    id: 'BRN-001',
    driver: 'Ahmad Suryadi',
    efficiency: 95,
    mileage: '1,250 km',
    status: 'active',
  },
  {
    id: 'BRN-002',
    driver: 'Budi Santoso',
    efficiency: 92,
    mileage: '1,180 km',
    status: 'active',
  },
  {
    id: 'BRN-003',
    driver: 'Candra Wijaya',
    efficiency: 88,
    mileage: '1,320 km',
    status: 'maintenance',
  },
  {
    id: 'BRN-004',
    driver: 'Dedi Kurniawan',
    efficiency: 85,
    mileage: '1,100 km',
    status: 'active',
  },
];

const TailwindFleetOverview = () => {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'idle': return 'bg-gray-100 text-gray-800';
      default: return 'bg-red-100 text-red-800';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'medium': return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'low': return <ClockIcon className="h-5 w-5 text-blue-500" />;
      default: return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Fleet Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Real-time monitoring and analytics for your fleet operations
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {fleetStats.map((stat, index) => (
          <TailwindStatCard key={index} {...stat} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 mb-8">
        <div className="lg:col-span-2">
          <SimpleChartCard
            title="Fuel Consumption Trend"
            subtitle="Monthly fuel usage in liters"
            data={fuelData}
            type="area"
            color="#6366f1"
            height={350}
          />
        </div>
        <div className="lg:col-span-1">
          <SimpleChartCard
            title="Vehicle Status"
            subtitle="Current fleet distribution"
            data={vehicleStatusData}
            type="pie"
            height={350}
            colors={['#10b981', '#f59e0b', '#6b7280', '#ef4444']}
          />
        </div>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 mb-8">
        <SimpleChartCard
          title="Weekly Mileage"
          subtitle="Distance covered this month"
          data={mileageData}
          type="bar"
          color="#10b981"
          height={300}
        />
        
        {/* Top Performing Vehicles */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Top Performing Vehicles
            </h3>
            <div className="space-y-4">
              {topVehicles.map((vehicle) => (
                <div key={vehicle.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {vehicle.id.split('-')[1]}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">
                          {vehicle.id}
                        </p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                          {vehicle.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Driver: {vehicle.driver}
                      </p>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Efficiency: {vehicle.efficiency}%</span>
                          <span className="text-gray-500">{vehicle.mileage}</span>
                        </div>
                        <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full" 
                            style={{ width: `${vehicle.efficiency}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Alerts
          </h3>
          <div className="flow-root">
            <ul role="list" className="-mb-8">
              {recentAlerts.map((alert, alertIdx) => (
                <li key={alert.id}>
                  <div className="relative pb-8">
                    {alertIdx !== recentAlerts.length - 1 ? (
                      <span
                        className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex items-start space-x-3">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                          {getSeverityIcon(alert.severity)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">
                            {alert.vehicle}
                          </p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                            {alert.type}
                          </span>
                          <p className="text-sm text-gray-500">
                            {alert.time}
                          </p>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          {alert.message}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TailwindFleetOverview;
