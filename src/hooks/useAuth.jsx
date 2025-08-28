// src/hooks/useAuth.js
import { useState, useEffect, createContext, useContext } from 'react';
import { authAPI } from '../services/api';

// Create Auth Context
const AuthContext = createContext();

// Debug mode - set to true to bypass login
const getDebugMode = () => {
  try {
    return localStorage.getItem('debugMode') === 'true';
  } catch {
    return false;
  }
};
const DEBUG_MODE = getDebugMode();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(DEBUG_MODE);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check debug mode first
    if (DEBUG_MODE) {
      setIsAuthenticated(true);
      setUser({ 
        id: 'debug', 
        username: 'debug', 
        email: 'debug@borneo.com', 
        role: 'admin' 
      });
      setLoading(false);
      return;
    }

    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setIsAuthenticated(true);
        setUser(JSON.parse(userData));
      } catch (err) {
        console.error('Error parsing user data:', err);
        logout();
      }
    }
    
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.login(credentials);
      
      if (response.success) {
        const { token, user: userData } = response.data;
        
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setIsAuthenticated(true);
        setUser(userData);
        
        return { success: true };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (err) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Clear debug mode if active
    localStorage.removeItem('debugMode');
    
    // Clear auth data
    authAPI.logout();
    setIsAuthenticated(false);
    setUser(null);
    setError(null);
    
    // Force reload to reset all state
    window.location.href = '/login';
  };

  const toggleDebugMode = () => {
    const currentDebugMode = getDebugMode();
    const newDebugMode = !currentDebugMode;
    localStorage.setItem('debugMode', newDebugMode.toString());
    window.location.reload(); // Reload to apply debug mode
  };

  const value = {
    isAuthenticated,
    loading,
    user,
    error,
    login,
    logout,
    debugMode: DEBUG_MODE,
    toggleDebugMode
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;

// Debug utilities
export const enableDebugMode = () => {
  localStorage.setItem('debugMode', 'true');
  window.location.reload();
};

export const disableDebugMode = () => {
  localStorage.setItem('debugMode', 'false');
  window.location.reload();
};