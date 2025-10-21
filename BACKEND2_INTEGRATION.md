# Backend 2 Integration - Implementation Guide

## 📋 Overview

Implementasi integrasi Backend 2 (`http://connectis.my.id:3001/api`) untuk Fleet Management System. Backend 2 menangani semua fitur kecuali **Tracking** (Live Tracking & History Tracking yang tetap menggunakan Backend 1).

## 🏗 Architecture

```
Frontend
├── Backend 1 (Legacy) → Hanya untuk Tracking
│   ├── Live Tracking
│   └── History Tracking
│
└── Backend 2 (New) → Semua fitur lainnya
    ├── Authentication
    ├── Dashboard
    ├── Fleet Management (Trucks, Drivers, Vendors)
    ├── IoT Devices
    ├── Telemetry
    ├── Alerts
    └── Settings
```

## 📁 File Structure

### Backend 2 API Modules (`src/services/api2/`)

```
src/services/api2/
├── config.js              # Base URL & Axios configuration
├── auth.api.js            # Login, Logout, Token management
├── trucks.api.js          # Truck CRUD operations
├── dashboard.api.js       # Dashboard statistics
├── drivers.api.js         # Driver CRUD operations
├── vendors.api.js         # Vendor CRUD operations
├── devices.api.js         # IoT Device & Sensor management
├── sensors.api.js         # Sensor data ingestion
├── alerts.api.js          # Alert management
├── miningArea.api.js      # Mining area/geofencing
├── websocket.js           # WebSocket client for real-time updates
└── index.js               # Central export
```

### Custom Hooks (`src/hooks/`)

```
src/hooks/
├── useAuth.js             # Updated for Backend 2 authentication
└── useApi2.js             # Custom hooks for data fetching
    ├── useTrucks()
    ├── useDashboard()
    ├── useDrivers()
    ├── useVendors()
    ├── useDevices()
    ├── useAlerts()
    ├── useMiningAreas()
    └── useRealtimeLocations()
```

### Updated Pages

```
src/pages/
├── Login.jsx              # ✅ Connected to Backend 2
├── Dashboard.jsx          # ✅ Real-time dashboard with WebSocket
├── TrucksFormList.jsx     # ✅ Truck management
├── DriversList.jsx        # ✅ Driver management
├── VendorsList.jsx        # ✅ Vendor management
├── DeviceCenter.jsx       # ✅ IoT device management
└── Alerts.jsx             # ✅ Real-time alerts with WebSocket

# Tracking pages unchanged (still using Backend 1)
├── LiveTracking.jsx       # ⚡ Backend 1
└── HistoryTracking.jsx    # ⚡ Backend 1
```

## 🔌 API Endpoints Implemented

### Authentication
- `POST /api/auth/login` - Login with JWT
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/fleet-summary` - Fleet summary
- `GET /api/dashboard/alerts` - Alert summary
- `GET /api/dashboard/fuel` - Fuel report
- `GET /api/dashboard/maintenance` - Maintenance report

### Trucks
- `GET /api/trucks` - Get all trucks (with pagination & filters)
- `GET /api/trucks/:id` - Get specific truck
- `POST /api/trucks` - Create truck
- `PUT /api/trucks/:id` - Update truck
- `PUT /api/trucks/:id/status` - Update truck status
- `DELETE /api/trucks/:id` - Delete truck
- `GET /api/trucks/:id/tires` - Get tire pressures
- `GET /api/trucks/:id/history` - Get location history
- `GET /api/trucks/:id/alerts` - Get truck alerts
- `GET /api/trucks/realtime/locations` - Real-time GeoJSON locations

### Drivers
- `GET /api/drivers` - Get all drivers
- `GET /api/drivers/:id` - Get specific driver
- `POST /api/drivers` - Create driver
- `PUT /api/drivers/:id` - Update driver
- `DELETE /api/drivers/:id` - Delete driver

### Vendors
- `GET /api/vendors` - Get all vendors
- `GET /api/vendors/:id` - Get specific vendor
- `POST /api/vendors` - Create vendor
- `PUT /api/vendors/:id` - Update vendor
- `DELETE /api/vendors/:id` - Delete vendor

### Devices
- `GET /api/devices` - Get all devices
- `GET /api/devices/:id` - Get specific device
- `POST /api/devices` - Create device
- `PUT /api/devices/:id` - Update device
- `DELETE /api/devices/:id` - Delete device
- `GET /api/devices/sensors/all` - Get all sensors
- `GET /api/devices/:id/sensors` - Get device sensors

### Sensors/Telemetry
- `POST /api/sensors/tire-pressure` - Ingest tire pressure data
- `POST /api/sensors/tire-temperature` - Ingest tire temperature
- `POST /api/sensors/gps` - Ingest GPS data
- `POST /api/sensors/raw` - Ingest raw sensor data
- `GET /api/sensors/last` - Get last sensor data

### Alerts
- `GET /api/dashboard/alerts` - Get all alerts
- `GET /api/trucks/:id/alerts` - Get truck alerts
- `PUT /api/trucks/:truckId/alerts/:alertId/resolve` - Resolve alert

### Mining Areas
- `GET /api/mining-area` - Get all mining areas
- `GET /api/mining-area/:zoneName/trucks` - Get trucks in zone
- `POST /api/mining-area` - Create mining zone
- `PUT /api/mining-area/:zoneName` - Update zone
- `DELETE /api/mining-area/:zoneName` - Delete zone

## 🔄 WebSocket Integration

### Connection
```javascript
import fleetWebSocket from '../services/api2/websocket';

// Connect
fleetWebSocket.connect();

// Subscribe to channels
fleetWebSocket.subscribe('dashboard');
fleetWebSocket.subscribe('alerts');
fleetWebSocket.subscribe('truck_updates');
```

### Available Channels
- `dashboard` - Dashboard statistics updates (every 30s)
- `alerts` - New alerts and alert resolution
- `truck_updates` / `truck_locations_update` - Real-time truck location updates

### Event Listeners
```javascript
fleetWebSocket.on('dashboardUpdate', (data) => {
  console.log('Dashboard updated:', data);
});

fleetWebSocket.on('newAlerts', (alerts) => {
  console.log('New alerts:', alerts);
});

fleetWebSocket.on('truckUpdate', (locations) => {
  console.log('Truck locations updated:', locations);
});
```

## 🔐 Authentication Flow

1. **Login**: User enters credentials → Backend 2 returns JWT token
2. **Token Storage**: Token stored in `localStorage` as `authToken`
3. **Auto-attach**: Axios interceptor automatically attaches token to all requests
4. **Token Expiry**: Expired tokens redirect to login page (401 handling)
5. **Logout**: Clears token from `localStorage`

### Token Management
```javascript
import { authApi } from '../services/api2';

// Check if authenticated
const isAuth = authApi.isAuthenticated();

// Get current user
const user = authApi.getCurrentUser();

// Get token
const token = authApi.getToken();
```

## 📊 Custom Hooks Usage

### Dashboard Hook
```javascript
import { useDashboard } from '../hooks/useApi2';

const { stats, loading, error, refetch } = useDashboard();
```

### Trucks Hook
```javascript
import { useTrucks } from '../hooks/useApi2';

const { trucks, loading, error, refetch, totalPages, stats } = useTrucks({
  page: 1,
  limit: 50,
  status: 'active',
  search: 'B 7040'
});
```

### Drivers Hook
```javascript
import { useDrivers } from '../hooks/useApi2';

const { drivers, loading, error, refetch, totalPages } = useDrivers({
  page: 1,
  limit: 25
});
```

## 🚨 Error Handling

### Global Error Interceptor
Axios interceptor handles common errors:
- **401 Unauthorized**: Auto-redirect to login
- **Network errors**: Error message displayed
- **API errors**: Error message from backend shown

### Page-level Error Handling
```javascript
try {
  const response = await trucksApi.getAll();
  // Handle success
} catch (error) {
  console.error('Error:', error.message);
  alert('Failed to load data: ' + error.message);
}
```

## 🔧 Configuration

### Backend 2 Base URL
```javascript
// src/services/api2/config.js
export const API_BASE_URL = 'http://connectis.my.id:3001/api';
export const WS_BASE_URL = 'ws://connectis.my.id:3001/ws';
```

### Axios Configuration
- **Timeout**: 30 seconds
- **Headers**: JSON content-type
- **Auth**: Bearer token auto-attached

## 📝 Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    "trucks": [...],
    "pagination": {
      "page": 1,
      "limit": 50,
      "totalPages": 10,
      "totalItems": 500
    }
  },
  "message": "Data retrieved successfully"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (dev only)"
}
```

## 🧪 Testing

### Test Login
```bash
curl -X POST http://connectis.my.id:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Test API with Token
```bash
curl http://connectis.my.id:3001/api/trucks \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🎯 Implementation Checklist

- [✅] Backend 2 API configuration
- [✅] Authentication module (login, logout, token)
- [✅] All CRUD endpoints (trucks, drivers, vendors, devices)
- [✅] Dashboard API integration
- [✅] WebSocket real-time updates
- [✅] Custom React hooks
- [✅] Login page updated
- [✅] Dashboard with real-time data
- [✅] Trucks management page
- [✅] Drivers management page
- [✅] Vendors management page
- [✅] Device center page
- [✅] Alerts page with real-time updates
- [✅] Error handling & interceptors
- [✅] Token management

## 📌 Important Notes

1. **Tracking Pages**: `LiveTracking.jsx` dan `HistoryTracking.jsx` **TIDAK DIUBAH** - masih menggunakan Backend 1
2. **Dual Backend**: Aplikasi sekarang menjalankan 2 backend secara bersamaan
3. **Token Storage**: JWT token disimpan di `localStorage`
4. **WebSocket**: Auto-reconnect jika koneksi terputus
5. **Real-time Updates**: Dashboard dan Alerts mendapat update real-time via WebSocket

## 🔍 Debugging

### Check Backend 2 Connection
```javascript
import { api2Instance } from '../services/api2';

// Test connection
api2Instance.get('/trucks')
  .then(res => console.log('✅ Connected:', res))
  .catch(err => console.error('❌ Error:', err));
```

### Check WebSocket Connection
```javascript
import fleetWebSocket from '../services/api2/websocket';

console.log('Connected:', fleetWebSocket.isConnected());
```

### Browser Console Logs
- 📡 Loading data from Backend 2
- ✅ Success responses
- ❌ Error responses
- 🔄 Real-time WebSocket updates

## 🚀 Next Steps

1. **Form Pages**: Update TruckForm, DriverForm, VendorForm untuk CREATE/UPDATE operations
2. **Telemetry Pages**: Connect telemetry forms ke sensor endpoints
3. **Fleet Groups**: Implement fleet groups management
4. **Settings**: Implement settings page
5. **Reports**: Implement reports with Backend 2 data

## 📞 Support

Jika ada masalah atau pertanyaan:
1. Check browser console untuk error logs
2. Verify Backend 2 is running: `http://connectis.my.id:3001/api`
3. Check network tab untuk request/response details
4. Verify JWT token in localStorage

---

**Last Updated**: October 20, 2025
**Backend 2 URL**: http://connectis.my.id:3001/api
**WebSocket URL**: ws://connectis.my.id:3001/ws
