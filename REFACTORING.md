# 🔧 Refactoring Documentation

## Overview
Proyek ini telah di-refactor untuk meningkatkan struktur kode, maintainability, dan scalability.

## 📁 Struktur Baru

### Sebelum Refactoring
```
src/
├── services/
│   ├── api.js (960+ lines - TERLALU BESAR!)
│   └── dataService.js
├── App.jsx (200+ lines - routing tercampur)
└── hooks/
    └── useAuth.js
```

### Setelah Refactoring
```
src/
├── services/
│   ├── api.js (backward compatibility wrapper)
│   ├── dataService.js
│   ├── api/
│   │   ├── index.js (re-exports all APIs)
│   │   ├── config.js
│   │   ├── auth.api.js
│   │   ├── trucks.api.js
│   │   ├── vendors.api.js
│   │   ├── drivers.api.js
│   │   ├── devices.api.js
│   │   ├── sensors.api.js
│   │   ├── dashboard.api.js
│   │   ├── mining-area.api.js
│   │   ├── alerts.api.js
│   │   └── tpms.api.js
│   ├── websocket/
│   │   └── FleetWebSocket.js
│   └── utils/
│       ├── apiRequest.js
│       └── connectionUtils.js
├── routes/
│   ├── index.jsx (centralized routing)
│   ├── ProtectedRoute.jsx
│   └── PublicRoute.jsx
├── App.jsx (simplified)
└── hooks/
    └── useAuth.js
```

## 🎯 Keuntungan Refactoring

### 1. **Modularitas**
- Setiap API endpoint memiliki file sendiri
- Lebih mudah untuk menemukan dan memodifikasi kode
- Mengurangi merge conflicts saat bekerja tim

### 2. **Maintainability**
- File lebih kecil dan fokus (< 300 lines per file)
- Easier to test individual modules
- Clear separation of concerns

### 3. **Scalability**
- Mudah menambahkan API endpoint baru
- Struktur yang konsisten
- Better code organization

### 4. **Developer Experience**
- Autocomplete yang lebih baik di IDE
- Faster file navigation
- Clear module boundaries

## 📝 Migration Guide

### Importing APIs

#### Old Way (Still Works - Backward Compatible)
```javascript
import { authAPI, trucksAPI } from '../services/api.js';
```

#### New Way (Recommended)
```javascript
// Import dari index
import { authAPI, trucksAPI } from '../services/api';

// Atau import langsung dari module spesifik
import { authAPI } from '../services/api/auth.api.js';
import { trucksAPI } from '../services/api/trucks.api.js';
```

### Menggunakan Routes

#### Old Way
```javascript
// Di App.jsx - routes tercampur dengan component
<Route path="/dashboard" element={
  <ProtectedRoute><Dashboard /></ProtectedRoute>
} />
```

#### New Way
```javascript
// Di App.jsx - simplified
import AppRoutes from './routes';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppRoutes />
      </Router>
    </ErrorBoundary>
  );
}

// Routes configuration di src/routes/index.jsx
```

## 📚 Module Documentation

### API Modules

#### **config.js**
Contains all API configuration constants
- `API_CONFIG` - Main API configuration
- `TPMS_CONFIG` - TPMS system configuration

#### **auth.api.js**
Authentication operations
- `login(credentials)` - User login
- `logout()` - User logout
- `getCurrentUser()` - Get current user info

#### **trucks.api.js**
Truck management operations
- `getAll(params)` - Get all trucks
- `getById(id)` - Get single truck
- `create(payload)` - Create truck
- `update(id, payload)` - Update truck
- `remove(id)` - Delete truck
- `getTirePressures(id)` - Get tire pressure data
- `getRealTimeLocations()` - Get real-time locations
- `getLocationHistory(id, params)` - Get location history

#### **vendors.api.js**
Vendor management (CRUD operations)

#### **drivers.api.js**
Driver management (CRUD operations)

#### **devices.api.js**
Device management (CRUD operations)

#### **sensors.api.js**
Sensor data operations (CRUD operations)

#### **dashboard.api.js**
Dashboard data and statistics
- `getStats()` - Dashboard statistics
- `getFleetSummary()` - Fleet summary
- `getAlerts()` - Alert notifications
- `getFuelReport()` - Fuel consumption report
- `getMaintenanceReport()` - Maintenance report

#### **mining-area.api.js**
Mining area boundaries and zones
- `getBoundaries()` - Get area boundaries
- `getZoneStatistics()` - Zone statistics
- `getTrucksInZone(zoneName)` - Trucks in zone

#### **alerts.api.js**
Alert notifications
- `getAll(params)` - Get all alerts
- `resolve(alertId)` - Resolve alert

#### **tpms.api.js**
TPMS (Tire Pressure Monitoring System)
- `getRealtimeWSUrl()` - WebSocket URL
- `getRealtimeSnapshot()` - Real-time snapshot
- `getLocationHistory(params)` - Location history

### Utility Modules

#### **apiRequest.js**
Generic API request handler with:
- Authentication headers
- Error handling
- Timeout management
- Automatic retry logic

#### **connectionUtils.js**
Connection monitoring utilities:
- `checkBackendConnection()` - Check backend availability
- `isConnectionOnline()` - Get online status
- `startConnectionMonitor(interval)` - Start monitoring

### WebSocket

#### **FleetWebSocket.js**
WebSocket connection for real-time updates:
- `connect()` - Connect to WebSocket
- `subscribe(channel, handler)` - Subscribe to channel
- `send(message)` - Send message
- `disconnect()` - Disconnect

### Routes

#### **ProtectedRoute.jsx**
Route wrapper that requires authentication

#### **PublicRoute.jsx**
Route wrapper that redirects authenticated users

#### **routes/index.jsx**
Centralized routing configuration

## 🔄 Backward Compatibility

File `src/services/api.js` masih ada dan berfungsi sebagai wrapper yang me-re-export semua module baru. Ini memastikan kode lama tetap berjalan tanpa perlu perubahan immediate.

## ✅ Testing Checklist

Setelah refactoring, pastikan:

- [ ] Login/Logout masih berfungsi
- [ ] Dashboard data ter-load dengan benar
- [ ] Live tracking map berfungsi
- [ ] History tracking berfungsi
- [ ] CRUD operations (Trucks, Vendors, Drivers, Devices) berfungsi
- [ ] Alerts system berfungsi
- [ ] TPMS data ter-load
- [ ] WebSocket connection berfungsi
- [ ] Route protection (ProtectedRoute/PublicRoute) berfungsi

## 🚀 Next Steps

1. **Gradual Migration**: Perlahan-lahan update import statements di file-file lama
2. **Add Tests**: Tambahkan unit tests untuk setiap module
3. **Documentation**: Update dokumentasi API sesuai struktur baru
4. **TypeScript**: Consider migrating to TypeScript untuk better type safety

## 📞 Support

Jika ada masalah atau pertanyaan setelah refactoring, silakan hubungi tim development.

---
**Last Updated**: October 20, 2025
**Refactored By**: AI Assistant
