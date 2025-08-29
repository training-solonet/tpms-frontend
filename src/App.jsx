// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import ErrorBoundary from './components/common/ErrorBoundary';
import Login from './components/auth/Login';
import Dashboard from './pages/Dashboard';
import FleetManagement from './pages/FleetManagement';
import LiveTracking from './pages/LiveTracking';
import Drivers from './pages/Drivers';
import Maintenance from './pages/Maintenance';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  console.log('🛡️ ProtectedRoute - isAuthenticated:', isAuthenticated, 'loading:', loading);
  
  // Skip loading screen to prevent flickering
  if (loading) {
    return null;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route Component (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  // Skip loading screen to prevent flickering
  if (loading) {
    return null;
  }
  
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/live-tracking" 
          element={
            <ProtectedRoute>
              <LiveTracking />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/fleet" 
          element={
            <ProtectedRoute>
              <FleetManagement />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/fleet/status" 
          element={
            <ProtectedRoute>
              <FleetManagement />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/fleet/add" 
          element={
            <ProtectedRoute>
              <FleetManagement />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/drivers" 
          element={
            <ProtectedRoute>
              <Drivers />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/maintenance" 
          element={
            <ProtectedRoute>
              <Maintenance />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/analytics" 
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/alerts" 
          element={
            <ProtectedRoute>
              <Alerts />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } 
        />
        
        {/* Default redirect */}
        <Route 
          path="/" 
          element={<Navigate to="/dashboard" replace />} 
        />
        
        {/* Catch all route - redirect to dashboard */}
        <Route 
          path="*" 
          element={<Navigate to="/dashboard" replace />} 
        />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  );
}

export default App;