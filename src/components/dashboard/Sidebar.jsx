// src/components/dashboard/Sidebar.jsx
import React from 'react';
import { Search, Filter, Eye, EyeOff, Wifi, WifiOff, RefreshCw } from 'lucide-react';

const Sidebar = ({
  showTruckList,
  setShowTruckList,
  searchQuery,
  setSearchQuery,
  filteredTrucks,
  trucks,
  dashboardStats,
  isConnected,
  lastUpdate,
  loadTrucks,
  loading,
  isFilterOpen,
  setIsFilterOpen,
  statusFilter,
  toggleStatusFilter,
  selectedTruck,
  handleTruckSelect,
  error
}) => {
  return (
    <div className={`${showTruckList ? 'w-80' : 'w-12'} bg-white shadow-lg transition-all duration-300 flex flex-col h-full overflow-hidden shrink-0`}>
      {/* Sidebar Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 shrink-0">
        <div className="flex items-center justify-between">
    {showTruckList ? (
      <>
        <div className="text-white">
          <h2 className="font-bold text-lg">Fleet Monitor</h2>
          <p className="text-blue-100 text-sm">PT Borneo Indobara</p>
          <p className="text-blue-100 text-xs">{filteredTrucks.length} dari {trucks.length} truck</p>
        </div>
        <button
          onClick={() => setShowTruckList(!showTruckList)}
          className="p-2 text-white hover:bg-blue-500 rounded-lg transition-colors"
        >
          <EyeOff size={20} />
        </button>
      </>
    ) : (
      <button
        onClick={() => setShowTruckList(!showTruckList)}
        className="p-2 text-white hover:bg-blue-500 rounded-lg transition-colors"
      >
        <Eye size={20} />
      </button>
    )}
  </div>
</div>

      {showTruckList && (
        <>
          {/* Search Bar */}
          <div className="p-4 border-b shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari truck atau driver..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="p-4 border-b shrink-0">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <div>
                    <div className="text-green-700 font-semibold text-sm">Aktif</div>
                    <div className="text-green-900 font-bold">{dashboardStats.activeTrucks || 0}</div>
                  </div>
                </div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <div>
                    <div className="text-red-700 font-semibold text-sm">Inaktif</div>
                    <div className="text-red-900 font-bold">{dashboardStats.inactiveTrucks || 0}</div>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <div>
                    <div className="text-yellow-700 font-semibold text-sm">Maintenance</div>
                    <div className="text-yellow-900 font-bold">{dashboardStats.maintenanceTrucks || 0}</div>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <div>
                    <div className="text-blue-700 font-semibold text-sm">Total</div>
                    <div className="text-blue-900 font-bold">{dashboardStats.totalTrucks || 0}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <div className="p-4 border-b shrink-0">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                {isConnected ? (
                  <Wifi size={16} className="text-green-500 mr-2" />
                ) : (
                  <WifiOff size={16} className="text-red-500 mr-2" />
                )}
                <span className={isConnected ? "text-green-600" : "text-red-600"}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <button
                onClick={loadTrucks}
                className="p-1 hover:bg-gray-100 rounded"
                disabled={loading}
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
            {lastUpdate && (
              <div className="text-xs text-gray-500 mt-1">
                Last update: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </div>

          {/* Filter Controls */}
          <div className="p-4 border-b shrink-0">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-gray-700">Filter Status</span>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Filter size={16} />
              </button>
            </div>
            
            {isFilterOpen && (
              <div className="space-y-2">
                {Object.entries(statusFilter).map(([status, isChecked]) => (
                  <label key={status} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className={`form-checkbox h-4 w-4 ${
                        status === "active" ? "text-green-500" :
                        status === "inactive" ? "text-red-500" : "text-yellow-500"
                      }`}
                      checked={isChecked}
                      onChange={() => toggleStatusFilter(status)}
                    />
                    <span className={`ml-2 text-sm capitalize ${
                      status === "active" ? "text-green-700" :
                      status === "inactive" ? "text-red-700" : "text-yellow-700"
                    }`}>
                      {status}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Truck List */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {error && (
              <div className="m-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            
            <div className="p-2">
              {filteredTrucks.slice(0, 100).map((truck) => (
                <div
                  key={truck.id}
                  className={`p-3 mb-2 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedTruck?.id === truck.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => handleTruckSelect(truck)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        truck.status === "active" ? "bg-green-500" :
                        truck.status === "inactive" ? "bg-red-500" : "bg-yellow-500"
                      }`}></div>
                      <div>
                        <div className="font-semibold text-sm">{truck.truckNumber}</div>
                        <div className="text-xs text-gray-500">{truck.driver || 'No driver'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-medium capitalize ${
                        truck.status === "active" ? "text-green-600" :
                        truck.status === "inactive" ? "text-red-600" : "text-yellow-600"
                      }`}>
                        {truck.status}
                      </div>
                      <div className="text-xs text-gray-500">{truck.speed} km/h</div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredTrucks.length > 100 && (
                <div className="p-3 text-center text-sm text-gray-500 bg-gray-50 rounded">
                  Menampilkan 100 dari {filteredTrucks.length} hasil
                </div>
              )}

              {loading && (
                <div className="p-4 text-center text-gray-500">
                  <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
                  Loading trucks...
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Sidebar;