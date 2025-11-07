// src/pages/Alerts.jsx
import React, { useEffect, useState } from 'react';
import TailwindLayout from '../components/layout/TailwindLayout';
import {
  ExclamationTriangleIcon,
  XCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { alertsApi } from '../services/api2';
import fleetWebSocket from '../services/api2/websocket';
import { Button } from '../components/common/Button.jsx';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '../components/common/DropdownMenu.jsx';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterResolved, setFilterResolved] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const loadAlerts = React.useCallback(async () => {
    try {
      setLoading(true);
      console.log('📡 Loading alerts from Backend 2...');

      const params = {
        limit: 100,
      };

      if (filterSeverity) params.severity = filterSeverity;
      if (filterResolved !== '') params.resolved = filterResolved === 'true';

      const response = await alertsApi.getAll(params);
      console.log('✅ Alerts response:', response);

      const alertsArray = response.data?.alerts || response.data || [];
      setAlerts(Array.isArray(alertsArray) ? alertsArray : []);
    } catch (error) {
      console.error('❌ Failed to load alerts:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [filterSeverity, filterResolved]);

  useEffect(() => {
    loadAlerts();

    // Connect WebSocket for real-time alerts
    fleetWebSocket.connect();
    fleetWebSocket.subscribe('alerts');

    const handleNewAlerts = (newAlerts) => {
      console.log('📡 New alerts received:', newAlerts);
      loadAlerts();
    };

    const handleAlertResolved = (data) => {
      console.log('✅ Alert resolved:', data);
      loadAlerts();
    };

    fleetWebSocket.on('newAlerts', handleNewAlerts);
    fleetWebSocket.on('alertResolved', handleAlertResolved);

    return () => {
      fleetWebSocket.off('newAlerts', handleNewAlerts);
      fleetWebSocket.off('alertResolved', handleAlertResolved);
      fleetWebSocket.unsubscribe('alerts');
    };
  }, [loadAlerts, filterSeverity, filterResolved]);

  const handleResolveAlert = async (truckId, alertId) => {
    if (!window.confirm('Mark this alert as resolved?')) return;

    try {
      await alertsApi.resolve(truckId, alertId);
      console.log('✅ Alert resolved successfully');
      loadAlerts();
    } catch (error) {
      console.error('❌ Failed to resolve alert:', error);
      alert('Failed to resolve alert: ' + error.message);
    }
  };

  const getSeverityColor = (severity) => {
    if (typeof severity === 'number') {
      if (severity >= 4) return 'bg-red-100 text-red-800 border-red-300';
      if (severity >= 2) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      return 'bg-blue-100 text-blue-800 border-blue-300';
    }
    const sev = String(severity).toLowerCase();
    if (sev === 'high') return 'bg-red-100 text-red-800 border-red-300';
    if (sev === 'medium') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-blue-100 text-blue-800 border-blue-300';
  };

  const getSeverityIcon = (severity) => {
    if (typeof severity === 'number') {
      if (severity >= 4) return <XCircleIcon className="h-6 w-6 text-red-500" />;
      if (severity >= 2) return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
      return <ClockIcon className="h-6 w-6 text-blue-500" />;
    }
    const sev = String(severity).toLowerCase();
    if (sev === 'high') return <XCircleIcon className="h-6 w-6 text-red-500" />;
    if (sev === 'medium') return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
    return <ClockIcon className="h-6 w-6 text-blue-500" />;
  };

  const formatTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const totalPages = Math.ceil(alerts.length / pageSize);
  const paginatedAlerts = alerts.slice((page - 1) * pageSize, page * pageSize);

  return (
    <TailwindLayout>
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-indigo-50 p-6 max-h-[calc(100vh-4rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-100">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Fleet Alerts</h1>
            <p className="text-sm text-gray-500 mt-1">
              Real-time monitoring and management of fleet alerts
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                {/* <FunnelIcon className="h-5 w-5 text-gray-400" /> */}
                {/* <span className="text-sm font-medium text-gray-700">Filters:</span> */}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FunnelIcon className="h-4 w-4 mr-2" />
                    {filterSeverity === '1'
                      ? 'Low'
                      : filterSeverity === '2'
                        ? 'Medium'
                        : filterSeverity === '4'
                          ? 'High'
                          : 'All Severities'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  <DropdownMenuItem
                    onClick={() => {
                      setFilterSeverity('');
                      setPage(1);
                    }}
                  >
                    All Severities
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setFilterSeverity('1');
                      setPage(1);
                    }}
                  >
                    Low Severity
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setFilterSeverity('2');
                      setPage(1);
                    }}
                  >
                    Medium Severity
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setFilterSeverity('4');
                      setPage(1);
                    }}
                  >
                    High Severity
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {filterResolved === 'false'
                      ? 'Active Only'
                      : filterResolved === 'true'
                        ? 'Resolved Only'
                        : 'All Alerts'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  <DropdownMenuItem
                    onClick={() => {
                      setFilterResolved('');
                      setPage(1);
                    }}
                  >
                    All Alerts
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setFilterResolved('false');
                      setPage(1);
                    }}
                  >
                    Active Only
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setFilterResolved('true');
                      setPage(1);
                    }}
                  >
                    Resolved Only
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button onClick={loadAlerts} variant="default" size="sm" className="ml-auto">
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">High Priority</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {
                      alerts.filter(
                        (a) => !a.resolved && (a.severity >= 4 || a.severity === 'high')
                      ).length
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active Alerts</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {alerts.filter((a) => !a.resolved).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Resolved Today</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {alerts.filter((a) => a.resolved).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts List */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">
                      Alert
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">
                      Status
                    </th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex items-center justify-center">
                          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                          <span className="ml-3 text-gray-500">Loading alerts...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedAlerts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No alerts found
                      </td>
                    </tr>
                  ) : (
                    paginatedAlerts.map((alert) => (
                      <tr key={alert.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {getSeverityIcon(alert.severity)}
                            <div>
                              <div className="font-medium text-gray-900">
                                {alert.type || 'Alert'}
                              </div>
                              <div className="text-sm text-gray-500">{alert.message}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {alert.plateNumber || alert.truckNumber || alert.truckId || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}
                          >
                            {typeof alert.severity === 'number'
                              ? alert.severity >= 4
                                ? 'High'
                                : alert.severity >= 2
                                  ? 'Medium'
                                  : 'Low'
                              : alert.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatTimeAgo(alert.occurredAt || alert.createdAt || new Date())}
                        </td>
                        <td className="px-6 py-4">
                          {alert.resolved ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              Resolved
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {!alert.resolved && (
                            <button
                              onClick={() => handleResolveAlert(alert.truckId, alert.id)}
                              className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                            >
                              Resolve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, alerts.length)}{' '}
                  of {alerts.length} alerts
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </TailwindLayout>
  );
};

export default Alerts;
