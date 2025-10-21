// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { authAPI, connectionUtils } from '../services/api.js';
// Import Backend 2 authentication
import { authApi as authApi2 } from '../services/api2';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      // Check Backend 2 first
      const token = authApi2.getToken();
      const currentUser = authApi2.getCurrentUser();
      
      if (token && currentUser) {
        setIsAuthenticated(true);
        setUser(currentUser);
      } else {
        // Fallback to old auth for backward compatibility
        const result = authAPI.getCurrentUser();
        if (result.success) {
          setIsAuthenticated(true);
          setUser(result.data);
        }
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
      // Use Backend 2 for authentication
      const response = await authApi2.login(credentials);

      if (response.success) {
        setIsAuthenticated(true);
        setUser(response.data.user);
        setIsOnline(true);

        console.log('✅ Login successful with Backend 2');

        return {
          success: true,
          message: response.message || 'Login successful',
          online: true,
        };
      } else {
        return {
          success: false,
          message: response.message || 'Login failed',
          online: true,
        };
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      
      // Try fallback to old backend for tracking if Backend 2 fails
      try {
        const result = await authAPI.login(credentials);
        
        if (result.success) {
          setIsAuthenticated(true);
          setUser(result.data.user);
          setIsOnline(result.online !== false);

          console.log('⚠️ Login successful with fallback backend');

          return {
            success: true,
            message: result.online === false ? 'Logged in (Offline Mode)' : 'Login successful',
            online: result.online !== false,
          };
        }
      } catch (fallbackError) {
        console.error('❌ Fallback login also failed:', fallbackError);
      }

      return {
        success: false,
        message: error.message || 'Network error - please try again',
        online: false,
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    // Logout from Backend 2
    await authApi2.logout();
    
    // Logout from old backend as well
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
