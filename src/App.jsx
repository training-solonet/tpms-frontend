// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import ErrorBoundary from './components/common/ErrorBoundary';
import Login from './components/auth/Login';
import Dashboard from './pages/Dashboard';
import FleetManagement from './pages/FleetManagement';
import FleetGroups from './pages/FleetGroups.jsx';
import DeviceCenter from './pages/DeviceCenter.jsx';
import VehicleDeviceStatus from './pages/VehicleDeviceStatus.jsx';
import TelemetryDashboard from './pages/TelemetryDashboard.jsx';
import LiveTracking from './pages/LiveTracking';
import HistoryTracking from './pages/HistoryTracking.jsx';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import TrucksFormList from './pages/TrucksFormList.jsx';
import TruckForm from './pages/TruckForm.jsx';
import TelemetryTiresForm from './pages/TelemetryTiresForm.jsx';
import TelemetryTemperatureForm from './pages/TelemetryTemperatureForm.jsx';
import TelemetryFuelForm from './pages/TelemetryFuelForm.jsx';
import VendorsList from './pages/VendorsList.jsx';
import VendorForm from './pages/VendorForm.jsx';
import './App.css';

// Protected/Public Route Components
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null; // could render a loader here
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
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
          path="/history-tracking" 
          element={
            <ProtectedRoute>
              <HistoryTracking />
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
              <VehicleDeviceStatus />
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
              <TrucksFormList />
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
        
        {/* Trucks forms */}
        <Route 
          path="/trucks" 
          element={
            <ProtectedRoute>
              <TrucksFormList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/trucks/:id" 
          element={
            <ProtectedRoute>
              <TruckForm />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/telemetry/tires" 
          element={
            <ProtectedRoute>
              <TelemetryTiresForm />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/telemetry/temperature" 
          element={
            <ProtectedRoute>
              <TelemetryTemperatureForm />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/telemetry/fuel" 
          element={
            <ProtectedRoute>
              <TelemetryFuelForm />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/vendors" 
          element={
            <ProtectedRoute>
              <VendorsList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/vendors/:id" 
          element={
            <ProtectedRoute>
              <VendorForm />
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