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
import Devices from '../pages/listdata/Devices';
import Sensors from '../pages/listdata/Sensors';
import VehicleDeviceStatus from '../pages/VehicleDeviceStatus';
import LiveTracking from '../pages/LiveTracking';
import HistoryTracking from '../pages/HistoryTracking';
import Analytics from '../pages/Analytics';
import Reports from '../pages/Reports';
import Alerts from '../pages/Alerts';
import Settings from '../pages/Settings';
import TrucksFormList from '../pages/listdata/TrucksList';
import TruckForm from '../pages/form/TruckForm';
// Monitoring Pages with All Vehicles Design
import TirePressureMonitoring from '../pages/monitoring/TirePressureMonitoring';
import TemperatureMonitoring from '../pages/monitoring/TemperatureMonitoring';
import FuelMonitoring from '../pages/monitoring/FuelMonitoring';
import LiveTireView from '../pages/monitoring/LiveTireView';
import VendorsList from '../pages/listdata/VendorsList';
import VendorForm from '../pages/form/VendorForm';
import DriversList from '../pages/listdata/DriversList';
import DriverForm from '../pages/form/DriverForm';

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

      {/* Protected Routes - IoT Devices */}
      <Route
        path="/devices"
        element={
          <ProtectedRoute>
            <Devices />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sensors"
        element={
          <ProtectedRoute>
            <Sensors />
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

      {/* Protected Routes - Telemetry (Old) - REDIRECT to Monitoring */}
      <Route path="/telemetry/tires" element={<Navigate to="/monitoring/tires" replace />} />
      <Route
        path="/telemetry/temperature"
        element={<Navigate to="/monitoring/temperature" replace />}
      />
      <Route path="/telemetry/fuel" element={<Navigate to="/monitoring/fuel" replace />} />

      {/* Protected Routes - Monitoring (New Design) */}
      <Route
        path="/monitoring/tires"
        element={
          <ProtectedRoute>
            <TirePressureMonitoring />
          </ProtectedRoute>
        }
      />
      <Route
        path="/monitoring/temperature"
        element={
          <ProtectedRoute>
            <TemperatureMonitoring />
          </ProtectedRoute>
        }
      />
      <Route
        path="/monitoring/fuel"
        element={
          <ProtectedRoute>
            <FuelMonitoring />
          </ProtectedRoute>
        }
      />
      <Route
        path="/monitoring/live-view"
        element={
          <ProtectedRoute>
            <LiveTireView />
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
