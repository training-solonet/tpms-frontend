import React, { useEffect, useState } from 'react';
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
import { getDashboardData, getAlertsData, getDriversData } from '../../data/dataManagement.js';
import { trucks, gpsPositions } from '../../data/index.js';


const TailwindFleetOverview = () => {
  const [fleetStats, setFleetStats] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [topVehicles, setTopVehicles] = useState([]);
  const [fuelData, setFuelData] = useState([]);
  const [mileageData] = useState([]);
  const [vehicleStatusData, setVehicleStatusData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load dashboard data from dummy data
  useEffect(() => {
    const loadDashboardData = () => {
      try {
        setLoading(true);
        
        // Load dashboard stats from dummy data
        const dashboardData = getDashboardData();
        const activeTrucks = gpsPositions.filter(pos => pos.speed_kph > 5).length;
        const idleTrucks = trucks.length - activeTrucks;
        const maintenanceTrucks = 2; // Dummy maintenance count
        
        setFleetStats([
          {
            title: 'Total Vehicles',
            value: dashboardData.totalTrucks.toString(),
            change: '+2',
            changeType: 'positive',
            icon: TruckIcon,
            color: 'indigo',
            subtitle: 'Active Fleet'
          },
          {
            title: 'Active Vehicles',
            value: activeTrucks.toString(),
            change: '+1',
            changeType: 'positive',
            icon: CheckCircleIcon,
            color: 'green',
            subtitle: 'Currently Running'
          },
          {
            title: 'Maintenance',
            value: maintenanceTrucks.toString(),
            change: '0',
            changeType: 'neutral',
            icon: ExclamationTriangleIcon,
            color: 'yellow',
            subtitle: 'Under Maintenance'
          },
          {
            title: 'Alerts',
            value: dashboardData.totalAlerts.toString(),
            change: '-3',
            changeType: 'positive',
            icon: XCircleIcon,
            color: 'red',
            subtitle: 'Active Alerts'
          },
        ]);
        
        // Set vehicle status data for pie chart
        setVehicleStatusData([
          { name: 'Active', value: activeTrucks },
          { name: 'Maintenance', value: maintenanceTrucks },
          { name: 'Idle', value: idleTrucks },
        ]);
        
        // Load alerts from dummy data
        const alertsData = getAlertsData(false).slice(0, 4);
        setRecentAlerts(alertsData.map(alert => ({
          id: alert.id,
          vehicle: alert.truckName,
          type: alert.alert_type,
          message: alert.message,
          time: formatTimeAgo(new Date(alert.created_at)),
          severity: alert.severity?.toLowerCase() || 'medium'
        })));
        
        // Load top vehicles from dummy data
        const driversData = getDriversData();
        const topTrucksData = trucks.slice(0, 4).map(truck => {
          const driver = driversData.find(d => d.id === truck.driver_id);
          const position = gpsPositions.find(pos => pos.truck_id === truck.id);
          
          return {
            id: truck.name,
            driver: driver ? `${driver.first_name} ${driver.last_name}` : 'Unknown Driver',
            efficiency: Math.round(Math.random() * 20 + 80),
            mileage: `${Math.round(Math.random() * 5000 + 15000)} km`,
            status: position?.speed_kph > 5 ? 'active' : 'idle'
          };
        });
        setTopVehicles(topTrucksData);
        
        // Generate dummy fuel data for chart
        const monthlyFuelData = [
          { name: 'Jan', value: 2400 },
          { name: 'Feb', value: 2210 },
          { name: 'Mar', value: 2290 },
          { name: 'Apr', value: 2000 },
          { name: 'May', value: 2181 },
          { name: 'Jun', value: 2500 },
          { name: 'Jul', value: 2100 }
        ];
        setFuelData(monthlyFuelData);
        
        console.log('✅ Using dummy data for dashboard overview');
        
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
    
    // Refresh data every 60 seconds
    const interval = setInterval(loadDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);
  
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
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
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))
        ) : (
          fleetStats.map((stat, index) => (
            <TailwindStatCard key={index} {...stat} />
          ))
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 mb-8">
        <div className="lg:col-span-2">
          {loading ? (
            <div className="bg-white p-6 rounded-lg shadow animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <SimpleChartCard
              title="Fuel Consumption Trend"
              subtitle="Monthly fuel usage in liters"
              data={fuelData}
              type="area"
              color="#6366f1"
              height={350}
            />
          )}
        </div>
        <div className="lg:col-span-1">
          {loading ? (
            <div className="bg-white p-6 rounded-lg shadow animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <SimpleChartCard
              title="Vehicle Status"
              subtitle="Current fleet distribution"
              data={vehicleStatusData}
              type="pie"
              height={350}
              colors={['#10b981', '#f59e0b', '#6b7280', '#ef4444']}
            />
          )}
        </div>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 mb-8">
        {loading ? (
          <div className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        ) : (
          <SimpleChartCard
            title="Weekly Mileage"
            subtitle="Distance covered this month"
            data={mileageData}
            type="bar"
            color="#10b981"
            height={300}
          />
        )}
        
        {/* Top Performing Vehicles */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Top Performing Vehicles
            </h3>
            <div className="space-y-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg animate-pulse">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                topVehicles.map((vehicle) => (
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
                ))
              )}
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
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <li key={index} className="pb-8">
                    <div className="flex items-start space-x-3 animate-pulse">
                      <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                recentAlerts.map((alert, alertIdx) => (
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
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default TailwindFleetOverview;
