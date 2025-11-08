// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
// Import authentication dari Backend 2 (BE2) - Master Data & Management
import { authApi } from 'services/management'; // Auth ada di BE2
// Import connection utils jika diperlukan
// import { connectionUtils } from '../services/utils/connectionUtils.js';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      // Check Backend 2 authentication
      const token = authApi.getToken(); // Ambil token dari localStorage
      const currentUser = authApi.getCurrentUser(); // Ambil user data

      if (token && currentUser) {
        setIsAuthenticated(true);
        setUser(currentUser);
      }
      setLoading(false);
    };

    checkAuth();

    // Monitor connection status (optional)
    // Uncomment jika diperlukan connection monitoring
    // const connectionMonitor = connectionUtils.startConnectionMonitor(10000);
    // const checkConnection = async () => {
    //   const online = await connectionUtils.checkConnection();
    //   setIsOnline(online);
    // };
    // checkConnection();

    // return () => {
    //   if (connectionMonitor) {
    //     clearInterval(connectionMonitor);
    //   }
    // };
  }, []);

  const login = async (credentials) => {
    setLoading(true);

    try {
      // Use Backend 2 for authentication
      const response = await authApi.login(credentials); // Login via BE2

      if (response.success) {
        setIsAuthenticated(true);
        setUser(response.data.user);
        setIsOnline(true);

        console.log('✅ Login successful');

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
    await authApi.logout(); // Hapus token & user data

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
