// src/context/AuthContext.jsx
import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';
import { AuthContext } from './AuthContextDefinition';

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('fleet_token');
    if (token) {
      setIsAuthenticated(true);
      // You could also validate the token here
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await apiClient.login(credentials);
      if (response.success) {
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