// src/components/tracking/RouteTrackingPanel.jsx
import React, { useState, useEffect } from 'react';
import {
  MapIcon,
  ClockIcon,
  EyeIcon,
  EyeSlashIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  TrashIcon,
  ChartBarIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const RouteTrackingPanel = ({ 
  vehicles = [],
  selectedVehicle,
  onVehicleSelect,
  trackingSettings,
  onSettingsChange,
  onRefreshTracks,
  onClearTracks,
  onToggleVisibility,
  showAllTracks,
  trackStats = {}
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyTimeRange, setHistoryTimeRange] = useState(2); // hours
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto refresh tracks
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (onRefreshTracks) {
        onRefreshTracks();
      }
    }, trackingSettings?.updateInterval || 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, onRefreshTracks, trackingSettings]);

  const handleSettingsChange = (key, value) => {
    if (onSettingsChange) {
      onSettingsChange({ [key]: value });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-700 border-green-300',
      idle: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      maintenance: 'bg-red-100 text-red-700 border-red-300',
      offline: 'bg-gray-100 text-gray-700 border-gray-300'
    };
    return colors[status] || colors.offline;
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="bg-white border-r border-gray-200 w-80 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Route Tracking</h3>
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="p-1 text-gray-500 hover:text-gray-700 rounded"
          >
            <Cog6ToothIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Controls */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={onToggleVisibility}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              showAllTracks 
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {showAllTracks ? <EyeIcon className="w-3 h-3" /> : <EyeSlashIcon className="w-3 h-3" />}
            {showAllTracks ? 'All Routes' : 'Selected'}
          </button>
          
          <button
            onClick={onRefreshTracks}
            className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-full text-xs font-medium transition-colors"
          >
            <ArrowPathIcon className="w-3 h-3" />
            Refresh
          </button>
          
          <button
            onClick={onClearTracks}
            className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-full text-xs font-medium transition-colors"
          >
            <TrashIcon className="w-3 h-3" />
            Clear
          </button>
        </div>

        {/* Settings Panel */}
        {settingsOpen && (
          <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                History Time Range
              </label>
              <select
                value={historyTimeRange}
                onChange={(e) => setHistoryTimeRange(parseInt(e.target.value))}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value={1}>Last 1 hour</option>
                <option value={2}>Last 2 hours</option>
                <option value={4}>Last 4 hours</option>
                <option value={8}>Last 8 hours</option>
                <option value={24}>Last 24 hours</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Max Track Points
              </label>
              <input
                type="number"
                min="50"
                max="500"
                value={trackingSettings?.maxPoints || 100}
                onChange={(e) => handleSettingsChange('maxPoints', parseInt(e.target.value))}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">Auto Refresh</span>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`w-8 h-4 rounded-full transition-colors ${
                  autoRefresh ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <div className={`w-3 h-3 bg-white rounded-full transform transition-transform ${
                  autoRefresh ? 'translate-x-4' : 'translate-x-0.5'
                } mt-0.5`} />
              </button>
            </div>
          </div>
        )}

        {/* Selected Vehicle Info */}
        {selectedVehicle && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="text-blue-900 text-sm font-medium">
                Tracking: {selectedVehicle.id}
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-xs text-blue-600">Live</span>
              </div>
            </div>
            <div className="text-blue-700 text-xs space-y-1">
              <div>Driver: {selectedVehicle.driver}</div>
              <div>Speed: {selectedVehicle.speed} km/h</div>
              <div>Heading: {selectedVehicle.heading}°</div>
              <div>Fuel: {selectedVehicle.fuel}%</div>
            </div>
          </div>
        )}
      </div>

      {/* Vehicle List */}
      <div className="flex-1 overflow-y-auto">
        {/* Summary Stats */}
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white p-2 rounded border">
              <div className="font-medium text-gray-900">{vehicles.length}</div>
              <div className="text-gray-500">Total Vehicles</div>
            </div>
            <div className="bg-white p-2 rounded border">
              <div className="font-medium text-gray-900">
                {Object.keys(trackStats).length}
              </div>
              <div className="text-gray-500">Tracked Routes</div>
            </div>
          </div>
        </div>

        {/* Vehicle List */}
        <div className="p-3 space-y-2">
          {vehicles.length === 0 ? (
            <div className="text-center py-8">
              <MapIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No vehicles available</p>
            </div>
          ) : (
            vehicles.map((vehicle) => {
              const stats = trackStats[vehicle.id];
              const hasTrack = !!stats;
              
              return (
                <div
                  key={vehicle.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedVehicle?.id === vehicle.id
                      ? 'border-blue-500 bg-blue-50 shadow-sm ring-2 ring-blue-200'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  onClick={() => onVehicleSelect && onVehicleSelect(vehicle)}
                >
                  {/* Vehicle Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          {vehicle.id.replace(/[^0-9]/g, '')}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{vehicle.id}</div>
                        <div className="text-xs text-gray-500">{vehicle.driver}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                        {vehicle.status}
                      </span>
                      {hasTrack && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-xs text-green-600">Tracked</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vehicle Stats */}
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Speed:</span>
                      <span className="font-medium">{vehicle.speed} km/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Heading:</span>
                      <span className="font-medium">{vehicle.heading}°</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Fuel:</span>
                      <div className="flex items-center space-x-1">
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              vehicle.fuel > 50 ? 'bg-green-500' : 
                              vehicle.fuel > 30 ? 'bg-yellow-500' : 
                              vehicle.fuel > 15 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.max(0, Math.min(100, vehicle.fuel))}%` }}
                          />
                        </div>
                        <span className="font-medium">{vehicle.fuel}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Route Stats */}
                  {hasTrack && stats && (
                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <div className="flex items-center gap-1 mb-2">
                        <ChartBarIcon className="w-3 h-3 text-blue-500" />
                        <span className="text-xs font-medium text-gray-700">Route Stats</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Distance:</span>
                          <div className="font-medium">{stats.distance} km</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Duration:</span>
                          <div className="font-medium">{formatDuration(stats.duration)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Avg Speed:</span>
                          <div className="font-medium">{stats.averageSpeed} km/h</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Max Speed:</span>
                          <div className="font-medium">{stats.maxSpeed} km/h</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Last Update */}
                  <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
                    <span>Last update:</span>
                    <div className="flex items-center gap-1">
                      <ClockIcon className="w-3 h-3" />
                      <span>{formatTimeAgo(vehicle.lastUpdate)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Tracking Settings</h3>
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* History Time Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  History Time Range
                </label>
                <select
                  value={historyTimeRange}
                  onChange={(e) => {
                    setHistoryTimeRange(parseInt(e.target.value));
                    handleSettingsChange('historyHours', parseInt(e.target.value));
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value={1}>Last 1 hour</option>
                  <option value={2}>Last 2 hours</option>
                  <option value={4}>Last 4 hours</option>
                  <option value={8}>Last 8 hours</option>
                  <option value={12}>Last 12 hours</option>
                  <option value={24}>Last 24 hours</option>
                </select>
              </div>

              {/* Max Track Points */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Track Points
                </label>
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="25"
                  value={trackingSettings?.maxPoints || 100}
                  onChange={(e) => handleSettingsChange('maxPoints', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>50</span>
                  <span className="font-medium">{trackingSettings?.maxPoints || 100} points</span>
                  <span>500</span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Higher values show more detailed routes but may impact performance
                </div>
              </div>

              {/* Update Interval */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Interval
                </label>
                <select
                  value={(trackingSettings?.updateInterval || 30000) / 1000}
                  onChange={(e) => handleSettingsChange('updateInterval', parseInt(e.target.value) * 1000)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value={15}>Every 15 seconds</option>
                  <option value={30}>Every 30 seconds</option>
                  <option value={60}>Every 1 minute</option>
                  <option value={120}>Every 2 minutes</option>
                  <option value={300}>Every 5 minutes</option>
                </select>
              </div>

              {/* Auto Refresh Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-700">Auto Refresh Routes</div>
                  <div className="text-xs text-gray-500">Automatically update tracks in real-time</div>
                </div>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    autoRefresh ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      autoRefresh ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Track Colors */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Track Colors
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(trackingSettings?.colors || {}).map(([status, color]) => (
                    <div key={status} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-xs capitalize">{status}</span>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-2 rounded"
                          style={{ backgroundColor: color }}
                        />
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => handleSettingsChange('colors', {
                            ...trackingSettings.colors,
                            [status]: e.target.value
                          })}
                          className="w-6 h-6 border border-gray-300 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-2">
              <button
                onClick={() => {
                  if (onRefreshTracks) onRefreshTracks();
                  setSettingsOpen(false);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Apply & Refresh
              </button>
              <button
                onClick={() => setSettingsOpen(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function formatTimeAgo(date) {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }
};

export default RouteTrackingPanel;