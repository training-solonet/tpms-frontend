import React, { useState, useEffect, useMemo, useCallback } from "react";
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from "react-leaflet";
import { Search, Filter, Settings, Bell, User, Eye, EyeOff, Wifi, WifiOff, RefreshCw } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import io from 'socket.io-client';

// Data GeoJSON untuk wilayah PT Borneo Indobara
const BORNEO_INDOBARA_GEOJSON = {
  "type": "FeatureCollection",
  "name": "PT BORNEO INDOBARA",
  "crs": {
    "type": "name",
    "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" }
  },
  "features": [
    {
      "type": "Feature",
      "properties": {
        "Name": " PT INDOBARA",
        "description": "Wilayah Operasional PT Borneo Indobara",
        "zone_type": "mining_area",
        "company": "PT Borneo Indobara"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [115.604399949931505, -3.545400075547209, 0.0],
            [115.604399841131098, -3.608799574004828, 0.0],
            [115.649400029697503, -3.608799509217319, 0.0],
            [115.649400017089704, -3.663100293456181, 0.0],
            [115.617400059975793, -3.663099780174879, 0.0],
            [115.617399737213503, -3.685699156803738, 0.0],
            [115.649299960676103, -3.685699068800897, 0.0],
            [115.649300362663595, -3.699299673460462, 0.0],
            [115.617800049745696, -3.699300020057011, 0.0],
            [115.6177999530113, -3.717199908413447, 0.0],
            [115.658299919322602, -3.717200000114277, 0.0],
            [115.6582955763173, -3.473005894715275, 0.0],
            [115.568699602091598, -3.473001685807625, 0.0],
            [115.568700182646694, -3.464001541662113, 0.0],
            [115.555099828419003, -3.463999391784724, 0.0],
            [115.555099291465098, -3.473003271644793, 0.0],
            [115.532700208403895, -3.473001476768178, 0.0],
            [115.532699846387402, -3.463900605411753, 0.0],
            [115.550701359743002, -3.463902395098822, 0.0],
            [115.5507013482556, -3.454898213912309, 0.0],
            [115.568701230550005, -3.454902873855015, 0.0],
            [115.568700726908006, -3.445900276606981, 0.0],
            [115.577700266719404, -3.445900134950424, 0.0],
            [115.577700019488205, -3.431898966201222, 0.0],
            [115.559699638559096, -3.431899648314737, 0.0],
            [115.559699554334102, -3.437400397522957, 0.0],
            [115.550100512253806, -3.437398099998878, 0.0],
            [115.550099020797404, -3.450002211390146, 0.0],
            [115.532703272530895, -3.449999179807085, 0.0],
            [115.532700637088993, -3.454899270607867, 0.0],
            [115.523702194253303, -3.454899042442723, 0.0],
            [115.523699255391406, -3.463901335023041, 0.0],
            [115.517901076646893, -3.463899658740474, 0.0],
            [115.517900197349306, -3.467902281514015, 0.0],
            [115.514600138263603, -3.467902292826565, 0.0],
            [115.514601072048507, -3.50010155304351, 0.0],
            [115.496599227790597, -3.50009900533689, 0.0],
            [115.496599869340898, -3.518100005601176, 0.0],
            [115.466797471563495, -3.518103740087548, 0.0],
            [115.466801168336701, -3.550206921843847, 0.0],
            [115.442500430814604, -3.550203582815326, 0.0],
            [115.442497952207603, -3.563204681010987, 0.0],
            [115.432199323066001, -3.563200126588743, 0.0],
            [115.432199985374197, -3.575400350745974, 0.0],
            [115.4738011947736, -3.575400021250577, 0.0],
            [115.473797766754501, -3.667299052802766, 0.0],
            [115.478300326726696, -3.667298846101514, 0.0],
            [115.478299650158803, -3.699001512244875, 0.0],
            [115.473698702561805, -3.698999777578339, 0.0],
            [115.473698840205799, -3.706300548298581, 0.0],
            [115.481699037262302, -3.706400782574116, 0.0],
            [115.4817010345688, -3.717102490691376, 0.0],
            [115.505201004278504, -3.717098288779876, 0.0],
            [115.505299006694997, -3.635700209735227, 0.0],
            [115.487399266748895, -3.635701682784649, 0.0],
            [115.487397660302193, -3.545299693708786, 0.0],
            [115.5010009898878, -3.545299520128636, 0.0],
            [115.500999334020705, -3.536300365773843, 0.0],
            [115.514602134835499, -3.536297749737575, 0.0],
            [115.514599616947706, -3.518200242642467, 0.0],
            [115.532599668902606, -3.518200602467881, 0.0],
            [115.532599481961398, -3.509199349853453, 0.0],
            [115.541641655013905, -3.509228095023962, 0.0],
            [115.541599827827795, -3.500200339853857, 0.0],
            [115.577599166446404, -3.500199675893057, 0.0],
            [115.577599706645202, -3.509299212907206, 0.0],
            [115.604599070000702, -3.509301495077436, 0.0],
            [115.604600094546797, -3.518300046458291, 0.0],
            [115.613499987067996, -3.518300064005411, 0.0],
            [115.613499543131596, -3.54540116002996, 0.0],
            [115.604399949931505, -3.545400075547209, 0.0]
          ]
        ]
      }
    }
  ]
};

// API Configuration - Using environment variables
// Environment Configuration
const ENV_CONFIG = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  WS_URL: import.meta.env.VITE_WS_URL || 'http://localhost:3001',
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Fleet Monitor',
  COMPANY_NAME: import.meta.env.VITE_COMPANY_NAME || 'PT Borneo Indobara',
  AUTO_REFRESH_INTERVAL: parseInt(import.meta.env.VITE_AUTO_REFRESH_INTERVAL) || 30000,
  MAX_TRUCKS_DISPLAY: parseInt(import.meta.env.VITE_MAX_TRUCKS_DISPLAY) || 100,
  ENDPOINTS: {
    LOGIN: import.meta.env.VITE_API_LOGIN_ENDPOINT || '/api/auth/login',
    TRUCKS: import.meta.env.VITE_API_TRUCKS_ENDPOINT || '/api/trucks',
    DASHBOARD: import.meta.env.VITE_API_DASHBOARD_ENDPOINT || '/api/dashboard/stats',
    MINING_AREA: import.meta.env.VITE_API_MINING_AREA_ENDPOINT || '/api/mining-area',
    REALTIME_LOCATIONS: import.meta.env.VITE_API_REALTIME_LOCATIONS_ENDPOINT || '/api/trucks/realtime/locations'
  }
};


// API Client
class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('fleet_token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('fleet_token', token);
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('fleet_token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

async login(credentials) {
    const response = await this.request(ENV_CONFIG.ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.success && response.data.token) {
      this.setToken(response.data.token);
    }
    
    return response;
  }

  async getTrucks(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `${ENV_CONFIG.ENDPOINTS.TRUCKS}${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  async getDashboardStats() {
    return this.request(ENV_CONFIG.ENDPOINTS.DASHBOARD);
  }

  async getMiningArea() {
    return this.request(ENV_CONFIG.ENDPOINTS.MINING_AREA);
  }

  async getRealtimeLocations(status = 'all') {
    const endpoint = `${ENV_CONFIG.ENDPOINTS.REALTIME_LOCATIONS}?status=${status}`;
    return this.request(endpoint);
  }
}


// Initialize API client
const apiClient = new ApiClient(ENV_CONFIG.API_BASE_URL);

function App() {
  // Calculate center of mining area for initial map view
  const miningAreaCenter = useMemo(() => {
    if (BORNEO_INDOBARA_GEOJSON.features.length > 0) {
      const coordinates = BORNEO_INDOBARA_GEOJSON.features[0].geometry.coordinates[0];
      const lats = coordinates.map(coord => coord[1]);
      const lngs = coordinates.map(coord => coord[0]);
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
      return [centerLat, centerLng];
    }
    return [-3.6, 115.58]; // Default center for Borneo Indobara area
  }, []);

  // Style for mining area
  const miningAreaStyle = {
    color: "#2563eb",
    weight: 3,
    opacity: 0.8,
    fillColor: "#3b82f6",
    fillOpacity: 0.1,
    dashArray: "5, 5"
  };

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('fleet_token'));
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // Main application state
  const [trucks, setTrucks] = useState([]);
  // const [miningArea, setMiningArea] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState({
    active: true,
    inactive: true,
    maintenance: true
  });
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showTruckList, setShowTruckList] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Initialize WebSocket connection
  const initializeWebSocket = useCallback(() => {
    if (!isAuthenticated || socket) return;

    const token = localStorage.getItem('fleet_token');
    if (!token) return;

    console.log('Connecting to WebSocket...');
    const newSocket = io(ENV_CONFIG.WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      newSocket.emit('subscribeToTruckUpdates');
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    newSocket.on('trucksLocationUpdate', (data) => {
      console.log('Received real-time update:', data);
      setLastUpdate(new Date(data.timestamp));
      if (autoRefresh) {
        loadTrucks();
      }
    });

    newSocket.on('truckStatusUpdate', (data) => {
      console.log('Truck status updated:', data);
      setTrucks(prevTrucks => 
        prevTrucks.map(truck => 
          truck.id === data.truckId 
            ? { ...truck, status: data.status, lastUpdate: data.timestamp }
            : truck
        )
      );
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [isAuthenticated, socket, autoRefresh]);

  // Login function
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const response = await apiClient.login(loginForm);
      if (response.success) {
        setIsAuthenticated(true);
        setLoginForm({ username: '', password: '' });
      }
    } catch (error) {
      setLoginError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const handleLogout = () => {
    apiClient.removeToken();
    setIsAuthenticated(false);
    if (socket) {
      socket.close();
      setSocket(null);
    }
    setTrucks([]);
    setIsConnected(false);
  };

  // Load trucks data
  const loadTrucks = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const response = await apiClient.getTrucks({ limit: 1000 });
      if (response.success) {
        setTrucks(response.data.trucks || []);
        setError('');
      }
    } catch (err) {
      setError(`Failed to load trucks: ${err.message}`);
      console.error('Load trucks error:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Load dashboard stats
  const loadDashboardStats = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await apiClient.getDashboardStats();
      if (response.success) {
        setDashboardStats(response.data);
      }
    } catch (err) {
      console.error('Load dashboard stats error:', err);
    }
  }, [isAuthenticated]);

  // Load mining area
  // const loadMiningArea = useCallback(async () => {
  //   if (!isAuthenticated) return;

  //   try {
  //     const response = await apiClient.getMiningArea();
  //     if (response.success) {
  //       setMiningArea(response.data);
  //     }
  //   } catch (err) {
  //     console.error('Load mining area error:', err);
  //   }
  // }, [isAuthenticated]);

  // Initialize data on authentication
  useEffect(() => {
    if (isAuthenticated) {
      loadTrucks();
      loadDashboardStats();
      // loadMiningArea();
      initializeWebSocket();
    }
  }, [isAuthenticated, loadTrucks, loadDashboardStats, initializeWebSocket]);

  // Auto refresh data
  useEffect(() => {
    if (!isAuthenticated || !autoRefresh) return;

    const interval = setInterval(() => {
      loadTrucks();
      loadDashboardStats();
    }, 3000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, autoRefresh, loadTrucks, loadDashboardStats]);

  // Clean up WebSocket on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [socket]);

  // Filter trucks based on search and status
  const filteredTrucks = useMemo(() => {
    return trucks.filter(truck => {
      const matchesSearch = truck.truckNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (truck.driver && truck.driver.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter[truck.status];
      return matchesSearch && matchesStatus;
    });
  }, [trucks, searchQuery, statusFilter]);

  // Custom marker icons
  const createCustomIcon = (status, isSelected = false) => {
    const colors = {
      active: "bg-green-500",
      inactive: "bg-red-500", 
      maintenance: "bg-yellow-500"
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

  // Login form component
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Fleet Monitor</h1>
            <p className="text-gray-600">Sistem Monitoring Truk Tambang</p>
            <p className="text-sm text-blue-600 mt-2">PT Borneo Indobara</p>
          </div>
          
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Username
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={loginForm.username}
                onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                placeholder="Masukkan username"
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Password
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                placeholder="Masukkan password"
                required
              />
            </div>
            
            {loginError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {loginError}
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Connecting...' : 'Login'}
            </button>
          </form>
          
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>Demo: username: <code>admin</code>, password: <code>admin123</code></p>
            <p className="mt-2">Backend: {ENV_CONFIG.API_BASE_URL}</p>
          </div>
        </div>
      </div>
    );
  }

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
                <p className="text-blue-100 text-sm">PT Borneo Indobara</p>
                <p className="text-blue-100 text-xs">{filteredTrucks.length} dari {trucks.length} truck</p>
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
            <div className="p-4 border-b">
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
            <div className="flex-1 overflow-y-auto">
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 border-b">
          <div>
            <h1 className="font-bold text-xl text-gray-800">Fleet Monitoring System</h1>
            <p className="text-sm text-gray-500">PT Borneo Indobara - Real-time truck tracking & monitoring</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-1 rounded ${autoRefresh ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
              >
                Auto Refresh {autoRefresh ? 'ON' : 'OFF'}
              </button>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
              <Bell size={20} className="text-gray-600" />
              {dashboardStats.alertsCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <User size={18} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Logout</span>
            </button>
          </div>
        </header>

        {/* Map Container */}
        <div className="flex-1 relative">
          <MapContainer
            center={miningAreaCenter}
            zoom={11}
            style={{ height: "100%", width: "100%" }}
            className="z-0"
          >
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Tiles &copy; Esri"
            />

            
            {/* PT Borneo Indobara Mining Area */}
            <GeoJSON 
              data={BORNEO_INDOBARA_GEOJSON} 
              style={miningAreaStyle}
              onEachFeature={(feature, layer) => {
                if (feature.properties && feature.properties.Name) {
                  layer.bindPopup(`
                    <div style="font-family: Arial, sans-serif;">
                      <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 16px; font-weight: bold;">
                        ${feature.properties.Name}
                      </h3>
                      <div style="color: #6b7280; font-size: 14px;">
                        <p style="margin: 5px 0;"><strong>Wilayah:</strong> Area Operasional Tambang</p>
                        <p style="margin: 5px 0;"><strong>Perusahaan:</strong> ${feature.properties.company || 'PT Borneo Indobara'}</p>
                        <p style="margin: 5px 0;"><strong>Tipe:</strong> Area Penambangan</p>
                      </div>
                    </div>
                  `);
                }
              }}
            />
            
            {/* Mining Areas from API (if available) */}
            {/* {miningArea && (
              <GeoJSON 
                data={miningArea} 
                style={(feature) => ({
                  color: feature.properties.zone_type === "extraction" ? "#dc2626" : "#16a34a",
                  fillOpacity: 0.15,
                  weight: 2
                })} 
              />
            )}
             */}
            {/* Truck Markers */}
            {filteredTrucks.map((truck) => (
              <Marker
                key={truck.id}
                position={[truck.location.coordinates[1], truck.location.coordinates[0]]}
                icon={createCustomIcon(truck.status, selectedTruck?.id === truck.id)}
                eventHandlers={{
                  click: () => handleTruckSelect(truck)
                }}
              >
                <Popup>
                  <div className="w-64 p-2">
                    <div className="font-bold text-lg mb-3 border-b pb-2 flex items-center justify-between">
                      <span>{truck.truckNumber}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                        truck.status === "active" ? "bg-green-100 text-green-700" :
                        truck.status === "inactive" ? "bg-red-100 text-red-700" : 
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {truck.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div><strong>Model:</strong> {truck.model}</div>
                        <div><strong>Driver:</strong> {truck.driver || 'N/A'}</div>
                        <div><strong>Speed:</strong> {truck.speed} km/h</div>
                        <div><strong>Fuel:</strong> {truck.fuel}%</div>
                        <div><strong>Payload:</strong> {truck.payload} tons</div>
                        <div><strong>Engine Hours:</strong> {truck.engineHours}h</div>
                      </div>
                      
                      {truck.tirePressures && (
                        <div className="mt-3">
                          <strong className="block mb-1">Tire Pressure:</strong>
                          <div className="grid grid-cols-3 gap-1 text-xs">
                            {truck.tirePressures.slice(0, 6).map((tire, idx) => (
                              <div key={idx} className={`text-center p-1 rounded ${
                                tire.status === 'low' ? "bg-red-100 text-red-700" : 
                                tire.status === 'high' ? "bg-yellow-100 text-yellow-700" : 
                                "bg-green-100 text-green-700"
                              }`}>
                                {tire.pressure?.toFixed(1)} psi
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500 mt-2">
                        Last update: {new Date(truck.lastUpdate).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Map Controls Overlay */}
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-10">
            <div className="text-sm font-semibold mb-2">Legend</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span>Active ({dashboardStats.activeTrucks || 0})</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span>Inactive ({dashboardStats.inactiveTrucks || 0})</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span>Maintenance ({dashboardStats.maintenanceTrucks || 0})</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex items-center">
                  <div className="w-4 h-1 bg-blue-500 mr-2" style={{border: '1px dashed #2563eb'}}></div>
                  <span>Mining Area</span>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Truck Details */}
          {selectedTruck && (
            <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 z-10 w-80">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg">{selectedTruck.truckNumber}</h3>
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
                  <div className={`font-semibold capitalize ${
                    selectedTruck.status === "active" ? "text-green-600" :
                    selectedTruck.status === "inactive" ? "text-red-600" : "text-yellow-600"
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
                  <div className="font-semibold">{selectedTruck.driver || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-gray-600">Fuel Level</div>
                  <div className="font-semibold">{selectedTruck.fuel}%</div>
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