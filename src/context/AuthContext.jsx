// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user already logged in
    const token = localStorage.getItem('fleet_token');
    if (token) {
      setIsAuthenticated(true);
      // Optional: validate token with backend
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await apiClient.login(credentials);

      if (response.success) {
        // simpan token
        localStorage.setItem('fleet_token', response.data.token);

        setIsAuthenticated(true);
        setUser(response.data.user);
        return { success: true };
      }

      return { success: false, message: response.message || 'Login failed' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    apiClient.removeToken();
    localStorage.removeItem('fleet_token');
    setIsAuthenticated(false);
    setUser(null);
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ useAuth dipindahkan ke file terpisah: useAuth.js
