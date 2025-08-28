// src/hooks/useWebSocket.jsx
import { useState, useEffect, useRef } from 'react';
import websocketService from '../services/websocket.js';

export const useWebSocket = () => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastMessage, setLastMessage] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Connection status handlers
    const handleConnected = () => {
      setConnectionStatus('connected');
      setError(null);
      setIsDemoMode(false);
    };

    const handleDisconnected = () => {
      setConnectionStatus('disconnected');
    };

    const handleError = (error) => {
      setError(error);
      setConnectionStatus('error');
    };

    const handleDemoMode = () => {
      setIsDemoMode(true);
      setConnectionStatus('demo');
      setError(null);
    };

    // Data handlers
    const handleVehicleUpdate = (vehicleData) => {
      setVehicles(vehicleData);
      setLastMessage({
        type: 'vehicle_update',
        data: vehicleData,
        timestamp: new Date().toISOString()
      });
    };

    const handleAlert = (alertData) => {
      setAlerts(prev => [alertData, ...prev.slice(0, 9)]); // Keep last 10 alerts
      setLastMessage({
        type: 'alert',
        data: alertData,
        timestamp: new Date().toISOString()
      });
    };

    // Subscribe to events
    websocketService.subscribe('connected', handleConnected);
    websocketService.subscribe('disconnected', handleDisconnected);
    websocketService.subscribe('error', handleError);
    websocketService.subscribe('demo_mode_started', handleDemoMode);
    websocketService.subscribe('vehicle_update', handleVehicleUpdate);
    websocketService.subscribe('alert', handleAlert);

    // Start connection
    websocketService.connect();

    // Cleanup on unmount
    return () => {
      websocketService.unsubscribe('connected', handleConnected);
      websocketService.unsubscribe('disconnected', handleDisconnected);
      websocketService.unsubscribe('error', handleError);
      websocketService.unsubscribe('demo_mode_started', handleDemoMode);
      websocketService.unsubscribe('vehicle_update', handleVehicleUpdate);
      websocketService.unsubscribe('alert', handleAlert);
    };
  }, []);

  const sendMessage = (message) => {
    websocketService.send(message);
  };

  const reconnect = () => {
    websocketService.disconnect();
    websocketService.connect();
  };

  return {
    connectionStatus,
    lastMessage,
    vehicles,
    alerts,
    error,
    isDemoMode,
    sendMessage,
    reconnect,
    isConnected: connectionStatus === 'connected',
    isDemo: connectionStatus === 'demo'
  };
};
