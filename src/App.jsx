import React, { useState, useMemo, useCallback } from "react";
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from "react-leaflet";
import { Search, Filter, Settings, Bell, User, Eye, EyeOff } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

function App() {
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState({
    Aktif: true,
    Inaktif: true,
    Maintenance: true
  });
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showTruckList, setShowTruckList] = useState(true);

  // Dummy GeoJSON area tambang (multiple areas)
  const areaTambang = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[
            [116.780, -1.225],
            [116.800, -1.225],
            [116.800, -1.245],
            [116.780, -1.245],
            [116.780, -1.225]
          ]]
        },
        properties: { name: "Area Tambang Utama", zone: "A" }
      },
      // {
      //   type: "Feature",
      //   geometry: {
      //     type: "Polygon",
      //     coordinates: [[
      //       [116.802, -1.228],
      //       [116.815, -1.228],
      //       [116.815, -1.242],
      //       [116.802, -1.242],
      //       [116.802, -1.228]
      //     ]]
      //   },
      //   properties: { name: "Area Tambang Sekunder", zone: "B" }
      // }
    ]
  };

  // Generate dummy data for 1000 trucks
  const generateTrucks = () => {
    const statuses = ["Aktif", "Inaktif", "Maintenance"];
    const trucks = [];
    
    for (let i = 1; i <= 1000; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const lat = -1.225 + (Math.random() * 0.02) - 0.01; // Random position within area
      const lng = 116.780 + (Math.random() * 0.035);
      
      trucks.push({
        id: `TRK-${String(i).padStart(3, '0')}`,
        status: status,
        position: [lat, lng],
        tekananBan: [
          Math.floor(Math.random() * 10) + 25,
          Math.floor(Math.random() * 10) + 25,
          Math.floor(Math.random() * 10) + 25,
          Math.floor(Math.random() * 10) + 25
        ],
        speed: status === "Aktif" ? Math.floor(Math.random() * 50) + 5 : 0,
        fuelLevel: Math.floor(Math.random() * 100),
        driver: `Driver ${i}`,
        workshift: Math.random() > 0.5 ? "Siang" : "Malam",
        lastUpdate: "21 Aug 2025",
        zone: Math.random() > 0.5 ? "A" : "B"
      });
    }
    return trucks;
  };

  const trucks = useMemo(() => generateTrucks(), []);

  // Filter trucks based on search and status
  const filteredTrucks = useMemo(() => {
    return trucks.filter(truck => {
      const matchesSearch = truck.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           truck.driver.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter[truck.status];
      return matchesSearch && matchesStatus;
    });
  }, [trucks, searchQuery, statusFilter]);

  // Custom marker icons with clustering consideration
  const createCustomIcon = (status, isSelected = false) => {
    const colors = {
      Aktif: "bg-green-500",
      Inaktif: "bg-red-500", 
      Maintenance: "bg-yellow-500"
    };
    
    const size = isSelected ? "w-4 h-4" : "w-3 h-3";
    const border = isSelected ? "border-2 border-blue-400" : "border border-white";
    
    return L.divIcon({
      className: "",
      html: `<div class="${size} ${colors[status]} rounded-full ${border} shadow-lg"></div>`,
      iconSize: isSelected ? [16, 16] : [12, 12]
    });
  };

  // Handle truck selection
  const handleTruckSelect = useCallback((truck) => {
    setSelectedTruck(truck);
  }, []);

  // Toggle status filter
  const toggleStatusFilter = (status) => {
    setStatusFilter(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  // Get statistics
  const stats = useMemo(() => {
    const aktif = trucks.filter(t => t.status === "Aktif").length;
    const inaktif = trucks.filter(t => t.status === "Inaktif").length;
    const maintenance = trucks.filter(t => t.status === "Maintenance").length;
    
    return { aktif, inaktif, maintenance, total: trucks.length };
  }, [trucks]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${showTruckList ? 'w-80' : 'w-12'} bg-white shadow-lg transition-all duration-300 flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center justify-between">
            {showTruckList && (
              <div className="text-white">
                <h2 className="font-bold text-lg">Fleet Monitor</h2>
                <p className="text-blue-100 text-sm">{filteredTrucks.length} dari {trucks.length} truck</p>
              </div>
            )}
            <button
              onClick={() => setShowTruckList(!showTruckList)}
              className="p-2 text-white hover:bg-blue-500 rounded-lg transition-colors"
            >
              {showTruckList ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {showTruckList && (
          <>
            {/* Search Bar */}
            <div className="p-4 border-b">
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
            <div className="p-4 border-b">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <div>
                      <div className="text-green-700 font-semibold text-sm">Aktif</div>
                      <div className="text-green-900 font-bold">{stats.aktif}</div>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <div>
                      <div className="text-red-700 font-semibold text-sm">Inaktif</div>
                      <div className="text-red-900 font-bold">{stats.inaktif}</div>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg col-span-1">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    <div>
                      <div className="text-yellow-700 font-semibold text-sm">Maintenance</div>
                      <div className="text-yellow-900 font-bold">{stats.maintenance}</div>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <div>
                      <div className="text-blue-700 font-semibold text-sm">Total</div>
                      <div className="text-blue-900 font-bold">{stats.total}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="p-4 border-b">
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
                          status === "Aktif" ? "text-green-500" :
                          status === "Inaktif" ? "text-red-500" : "text-yellow-500"
                        }`}
                        checked={isChecked}
                        onChange={() => toggleStatusFilter(status)}
                      />
                      <span className={`ml-2 text-sm ${
                        status === "Aktif" ? "text-green-700" :
                        status === "Inaktif" ? "text-red-700" : "text-yellow-700"
                      }`}>
                        {status}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Truck List */}
            <div className="flex-1 overflow-y-auto">
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
                          truck.status === "Aktif" ? "bg-green-500" :
                          truck.status === "Inaktif" ? "bg-red-500" : "bg-yellow-500"
                        }`}></div>
                        <div>
                          <div className="font-semibold text-sm">{truck.id}</div>
                          <div className="text-xs text-gray-500">{truck.driver}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs font-medium ${
                          truck.status === "Aktif" ? "text-green-600" :
                          truck.status === "Inaktif" ? "text-red-600" : "text-yellow-600"
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
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 border-b">
          <div>
            <h1 className="font-bold text-xl text-gray-800">Fleet Monitoring System</h1>
            <p className="text-sm text-gray-500">Real-time truck tracking & monitoring</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Zone A: {trucks.filter(t => t.zone === "A").length}</span>
              <span className="text-sm text-gray-600">Zone B: {trucks.filter(t => t.zone === "B").length}</span>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
              <User size={18} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Admin</span>
            </div>
          </div>
        </header>

        {/* Map Container */}
        <div className="flex-1 relative">
          <MapContainer
            center={[-1.235, 116.790]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            className="z-0"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            
            {/* Mining Areas */}
            <GeoJSON 
              data={areaTambang} 
              style={(feature) => ({
                color: feature.properties.zone === "A" ? "#2563eb" : "#dc2626",
                fillOpacity: 0.15,
                weight: 2
              })} 
            />
            
            {/* Truck Markers - Only show filtered trucks */}
            {filteredTrucks.map((truck) => (
              <Marker
                key={truck.id}
                position={truck.position}
                icon={createCustomIcon(truck.status, selectedTruck?.id === truck.id)}
                eventHandlers={{
                  click: () => handleTruckSelect(truck)
                }}
              >
                <Popup>
                  <div className="w-64 p-2">
                    <div className="font-bold text-lg mb-3 border-b pb-2 flex items-center justify-between">
                      <span>{truck.id}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        truck.status === "Aktif" ? "bg-green-100 text-green-700" :
                        truck.status === "Inaktif" ? "bg-red-100 text-red-700" : 
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {truck.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div><strong>Driver:</strong> {truck.driver}</div>
                        <div><strong>Shift:</strong> {truck.workshift}</div>
                        <div><strong>Zone:</strong> {truck.zone}</div>
                        <div><strong>Speed:</strong> {truck.speed} km/h</div>
                        <div><strong>Fuel:</strong> {truck.fuelLevel}%</div>
                        <div><strong>Update:</strong> {truck.lastUpdate}</div>
                      </div>
                      
                      <div className="mt-3">
                        <strong className="block mb-1">Tekanan Ban:</strong>
                        <div className="grid grid-cols-4 gap-1 text-xs">
                          {truck.tekananBan.map((pressure, idx) => (
                            <div key={idx} className={`text-center p-1 rounded ${
                              pressure < 28 ? "bg-red-100 text-red-700" : 
                              pressure > 35 ? "bg-yellow-100 text-yellow-700" : 
                              "bg-green-100 text-green-700"
                            }`}>
                              {pressure} psi
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 mt-2">
                        Koordinat: {truck.position[0].toFixed(6)}, {truck.position[1].toFixed(6)}
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Map Controls Overlay */}
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-10">
            <div className="text-sm font-semibold mb-2">Legenda</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span>Aktif ({stats.aktif})</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span>Inaktif ({stats.inaktif})</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span>Maintenance ({stats.maintenance})</span>
              </div>
            </div>
          </div>

          {/* Selected Truck Details */}
          {selectedTruck && (
            <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 z-10 w-80">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg">{selectedTruck.id}</h3>
                <button 
                  onClick={() => setSelectedTruck(null)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-600">Status</div>
                  <div className={`font-semibold ${
                    selectedTruck.status === "Aktif" ? "text-green-600" :
                    selectedTruck.status === "Inaktif" ? "text-red-600" : "text-yellow-600"
                  }`}>
                    {selectedTruck.status}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Speed</div>
                  <div className="font-semibold">{selectedTruck.speed} km/h</div>
                </div>
                <div>
                  <div className="text-gray-600">Driver</div>
                  <div className="font-semibold">{selectedTruck.driver}</div>
                </div>
                <div>
                  <div className="text-gray-600">Fuel Level</div>
                  <div className="font-semibold">{selectedTruck.fuelLevel}%</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;