/* eslint-disable no-unused-vars */
// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { authAPI, connectionUtils } from '../services/api.js';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const result = authAPI.getCurrentUser();
      if (result.success) {
        setIsAuthenticated(true);
        setUser(result.data);
      }
      setLoading(false);
    };

    checkAuth();

    // Monitor connection status
    const connectionMonitor = connectionUtils.startConnectionMonitor(10000);

    const checkConnection = async () => {
      const online = await connectionUtils.checkConnection();
      setIsOnline(online);
    };

    checkConnection();

    return () => {
      if (connectionMonitor) {
        clearInterval(connectionMonitor);
      }
    };
  }, []);

  const login = async (credentials) => {
    setLoading(true);

    try {
      const result = await authAPI.login(credentials);

      if (result.success) {
        setIsAuthenticated(true);
        setUser(result.data.user);
        setIsOnline(result.online !== false);

        return {
          success: true,
          message: result.online === false ? 'Logged in (Offline Mode)' : 'Login successful',
          online: result.online !== false,
        };
      } else {
        return {
          success: false,
          message: result.message || 'Login failed',
          online: result.online !== false,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Network error - please try again',
        online: false,
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authAPI.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  return {
    isAuthenticated,
    loading,
    user,
    login,
    logout,
    isOnline,
  };
};
