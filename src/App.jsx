// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { useAuth } from './hooks/useAuth';
import ErrorBoundary from './components/common/ErrorBoundary';
// import Login from './components/auth/Login';
import Dashboard from './pages/Dashboard';
import FleetManagement from './pages/FleetManagement';
import FleetGroups from './pages/FleetGroups.jsx';
import DeviceCenter from './pages/DeviceCenter.jsx';
import TelemetryDashboard from './pages/TelemetryDashboard.jsx';
import LiveTracking from './pages/LiveTracking';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import './App.css';

// Protected/Public Route Components disabled: passthrough (login off)
const ProtectedRoute = ({ children }) => children;
const PublicRoute = ({ children }) => children;

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        {/* <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        /> */}
        
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
          path="/fleet/groups" 
          element={
            <ProtectedRoute>
              <FleetGroups />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/fleet/vehicles" 
          element={
            <ProtectedRoute>
              <FleetManagement />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/devices" 
          element={
            <ProtectedRoute>
              <DeviceCenter />
            </ProtectedRoute>
          } 
        />
        
        
        
        
        
        
        <Route 
          path="/telemetry/tires" 
          element={
            <ProtectedRoute>
              <TelemetryDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/telemetry/temperature" 
          element={
            <ProtectedRoute>
              <TelemetryDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/telemetry/fuel" 
          element={
            <ProtectedRoute>
              <TelemetryDashboard />
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