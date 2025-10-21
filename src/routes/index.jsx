// src/routes/index.jsx

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';

// Auth
import Login from '../components/auth/Login';

// Pages
import Dashboard from '../pages/Dashboard';
import FleetManagement from '../pages/FleetManagement';
import FleetGroups from '../pages/FleetGroups';
import DeviceCenter from '../pages/DeviceCenter';
import VehicleDeviceStatus from '../pages/VehicleDeviceStatus';
import LiveTracking from '../pages/LiveTracking';
import HistoryTracking from '../pages/HistoryTracking';
import Analytics from '../pages/Analytics';
import Reports from '../pages/Reports';
import Alerts from '../pages/Alerts';
import Settings from '../pages/Settings';
import TrucksFormList from '../pages/TrucksFormList';
import TruckForm from '../pages/TruckForm';
import TelemetryTiresForm from '../pages/TelemetryTiresForm';
import TelemetryTemperatureForm from '../pages/TelemetryTemperatureForm';
import TelemetryFuelForm from '../pages/TelemetryFuelForm';
import VendorsList from '../pages/VendorsList';
import VendorForm from '../pages/VendorForm';
import DriversList from '../pages/DriversList';
import DriverForm from '../pages/DriverForm';

/**
 * Application Routes Configuration
 */
const AppRoutes = () => {
  return (
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

      {/* Protected Routes - Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes - Tracking */}
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

      {/* Protected Routes - Fleet Management */}
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

      {/* Protected Routes - Devices */}
      <Route
        path="/devices"
        element={
          <ProtectedRoute>
            <DeviceCenter />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes - Trucks */}
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

      {/* Protected Routes - Telemetry */}
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

      {/* Protected Routes - Vendors */}
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

      {/* Protected Routes - Drivers */}
      <Route
        path="/drivers"
        element={
          <ProtectedRoute>
            <DriversList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/drivers/:id"
        element={
          <ProtectedRoute>
            <DriverForm />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes - Analytics & Reports */}
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

      {/* Protected Routes - Alerts */}
      <Route
        path="/alerts"
        element={
          <ProtectedRoute>
            <Alerts />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes - Settings */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Catch all route - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
