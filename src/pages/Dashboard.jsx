// src/pages/Dashboard.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import io from 'socket.io-client';

import { apiClient } from '../api/apiClient';
import { API_CONFIG } from '../api/config';
import Header from '../components/common/Header';
import Sidebar from '../components/dashboard/Sidebar';
import MapView from '../components/dashboard/MapView';

const Dashboard = () => {
  // Main application state
  const [trucks, setTrucks] = useState([]);
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

  // Load trucks data
  const loadTrucks = useCallback(async () => {
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
  }, []);

  // Load dashboard stats
  const loadDashboardStats = useCallback(async () => {
    try {
      const response = await apiClient.getDashboardStats();
      if (response.success) {
        setDashboardStats(response.data);
      }
    } catch (err) {
      console.error('Load dashboard stats error:', err);
    }
  }, []);

  // Initialize WebSocket connection
  const initializeWebSocket = useCallback(() => {
    if (socket) return;

    const token = localStorage.getItem('fleet_token');
    if (!token) return;

    console.log('Connecting to WebSocket...');
    const newSocket = io(API_CONFIG.WS_URL, {
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
  }, [socket, autoRefresh, loadTrucks]);

  // Initialize data on mount
  useEffect(() => {
    loadTrucks();
    loadDashboardStats();
    initializeWebSocket();
  }, [loadTrucks, loadDashboardStats, initializeWebSocket]);

  // Auto refresh data
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadTrucks();
      loadDashboardStats();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, loadTrucks, loadDashboardStats]);

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

  return (
    <div className="fixed inset-0 h-screen w-screen flex bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        showTruckList={showTruckList}
        setShowTruckList={setShowTruckList}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredTrucks={filteredTrucks}
        trucks={trucks}
        dashboardStats={dashboardStats}
        isConnected={isConnected}
        lastUpdate={lastUpdate}
        loadTrucks={loadTrucks}
        loading={loading}
        isFilterOpen={isFilterOpen}
        setIsFilterOpen={setIsFilterOpen}
        statusFilter={statusFilter}
        toggleStatusFilter={toggleStatusFilter}
        selectedTruck={selectedTruck}
        handleTruckSelect={handleTruckSelect}
        error={error}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
        {/* Header */}
        <Header
          autoRefresh={autoRefresh}
          setAutoRefresh={setAutoRefresh}
          dashboardStats={dashboardStats}
        />

        {/* Map Container */}
        <div className="flex-1 min-h-0 relative">
          <MapView
            trucks={filteredTrucks}
            selectedTruck={selectedTruck}
            handleTruckSelect={handleTruckSelect}
            dashboardStats={dashboardStats}
            setSelectedTruck={setSelectedTruck}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;