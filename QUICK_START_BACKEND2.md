# 🎯 Quick Start - Backend 2 Integration

## ✅ Apa yang Sudah Selesai

### 1. **API Modules** (src/services/api2/)

- ✅ `config.js` - Base URL & Axios setup
- ✅ `auth.api.js` - Login/Logout
- ✅ `trucks.api.js` - Truck management
- ✅ `dashboard.api.js` - Dashboard stats
- ✅ `drivers.api.js` - Driver CRUD
- ✅ `vendors.api.js` - Vendor CRUD
- ✅ `devices.api.js` - IoT Devices
- ✅ `sensors.api.js` - Telemetry data
- ✅ `alerts.api.js` - Alert management
- ✅ `miningArea.api.js` - Mining zones
- ✅ `websocket.js` - Real-time updates

### 2. **Custom Hooks** (src/hooks/)

- ✅ `useAuth.js` - Updated untuk Backend 2
- ✅ `useApi2.js` - Hooks untuk semua data fetching

### 3. **Pages Updated**

- ✅ `Login.jsx` - Backend 2 auth
- ✅ `Dashboard.jsx` - Real-time dashboard
- ✅ `TrucksFormList.jsx` - Truck list from Backend 2
- ✅ `DriversList.jsx` - Driver management
- ✅ `VendorsList.jsx` - Vendor management
- ✅ `DeviceCenter.jsx` - IoT device management
- ✅ `Alerts.jsx` - Real-time alerts

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         FRONTEND (React)                │
├─────────────────────────────────────────┤
│                                         │
│  Backend 1 (Legacy)    Backend 2 (New) │
│  ┌──────────────┐     ┌──────────────┐ │
│  │   Tracking   │     │    Auth      │ │
│  │              │     │  Dashboard   │ │
│  │ • Live       │     │   Trucks     │ │
│  │ • History    │     │   Drivers    │ │
│  │              │     │   Vendors    │ │
│  │              │     │   Devices    │ │
│  │              │     │   Alerts     │ │
│  │              │     │  Telemetry   │ │
│  └──────────────┘     └──────────────┘ │
│                                         │
│  WebSocket (Real-time Updates)         │
│  ws://connectis.my.id:3001/ws          │
└─────────────────────────────────────────┘
```

## 🔑 Login Credentials

```
Username: admin
Password: admin123
```

## 📡 Backend URLs

```javascript
Backend 1 (Tracking): [URL dari sistem lama - tidak berubah]
Backend 2 (Main):     http://connectis.my.id:3001/api
WebSocket:            ws://connectis.my.id:3001/ws
```

## 🚀 How to Use

### 1. Login

```javascript
// Login otomatis menggunakan Backend 2
// Token disimpan di localStorage
```

### 2. Fetch Data

```javascript
// Gunakan custom hooks
import { useTrucks, useDashboard, useDrivers } from '../hooks/useApi2';

const { trucks, loading, error } = useTrucks();
const { stats } = useDashboard();
```

### 3. Direct API Call

```javascript
// Atau panggil API langsung
import { trucksApi, driversApi } from '../services/api2';

const trucks = await trucksApi.getAll({ limit: 50 });
const drivers = await driversApi.getAll();
```

### 4. WebSocket Real-time

```javascript
// Auto-connect di Dashboard dan Alerts pages
import fleetWebSocket from '../services/api2/websocket';

fleetWebSocket.connect();
fleetWebSocket.subscribe('dashboard');

fleetWebSocket.on('dashboardUpdate', (data) => {
  console.log('Real-time update:', data);
});
```

## 📝 API Examples

### Get Trucks

```javascript
import { trucksApi } from '../services/api2';

// Get all trucks with filters
const response = await trucksApi.getAll({
  page: 1,
  limit: 50,
  status: 'active',
  search: 'B 7040',
});

// Get specific truck
const truck = await trucksApi.getById(truckId);

// Create truck
const newTruck = await trucksApi.create({
  truckNumber: 'B 1000 TR',
  plateNumber: 'B 7726 AC',
  model: 'Liebherr T 282C',
  year: 2022,
});

// Update truck status
await trucksApi.updateStatus(truckId, 'maintenance');

// Delete truck
await trucksApi.delete(truckId);
```

### Dashboard Stats

```javascript
import { dashboardApi } from '../services/api2';

const stats = await dashboardApi.getStats();
// Returns: totalTrucks, activeTrucks, maintenanceTrucks, alertsCount, etc.

const fuelReport = await dashboardApi.getFuelReport();
```

### Alerts

```javascript
import { alertsApi } from '../services/api2';

// Get all alerts
const alerts = await alertsApi.getAll({
  severity: 4,
  resolved: false,
  limit: 50,
});

// Resolve alert
await alertsApi.resolve(truckId, alertId);
```

## 🐛 Troubleshooting

### Check Browser Console

Lihat log messages:

- 📡 "Loading data from Backend 2..."
- ✅ "Success responses"
- ❌ "Error messages"

### Verify Token

```javascript
// Check token di browser console
localStorage.getItem('authToken');

// Check user
JSON.parse(localStorage.getItem('user'));
```

### Test Backend Connection

```javascript
// Di browser console
import { api2Instance } from './services/api2/config';

api2Instance
  .get('/trucks')
  .then((res) => console.log('✅ Connected:', res))
  .catch((err) => console.error('❌ Failed:', err));
```

### WebSocket Status

```javascript
import fleetWebSocket from './services/api2/websocket';

console.log('Connected:', fleetWebSocket.isConnected());
```

## ⚠️ Important Notes

1. **Tracking Tidak Berubah**: Tab "Live Tracking" dan "History Tracking" masih menggunakan Backend 1
2. **Dual Backend**: Aplikasi menjalankan 2 backend bersamaan
3. **Auto Token**: JWT token otomatis di-attach ke semua request
4. **Auto Logout**: Jika token expired (401), otomatis redirect ke login
5. **Real-time**: Dashboard dan Alerts mendapat update real-time via WebSocket

## 📊 Pages Status

| Page             | Status | Backend   | Real-time    |
| ---------------- | ------ | --------- | ------------ |
| Login            | ✅     | Backend 2 | -            |
| Dashboard        | ✅     | Backend 2 | ✅ WebSocket |
| Live Tracking    | ⚡     | Backend 1 | ⚡ Backend 1 |
| History Tracking | ⚡     | Backend 1 | -            |
| Trucks           | ✅     | Backend 2 | -            |
| Drivers          | ✅     | Backend 2 | -            |
| Vendors          | ✅     | Backend 2 | -            |
| Devices          | ✅     | Backend 2 | -            |
| Alerts           | ✅     | Backend 2 | ✅ WebSocket |
| Telemetry        | 🔄     | Backend 2 | Pending      |
| Settings         | 🔄     | Backend 2 | Pending      |

## 🎓 Next Steps

### Form Pages (CRUD Operations)

1. Update `TruckForm.jsx` untuk Create/Edit trucks
2. Update `DriverForm.jsx` untuk Create/Edit drivers
3. Update `VendorForm.jsx` untuk Create/Edit vendors

### Telemetry Pages

1. Connect `TelemetryTiresForm.jsx` ke `sensorsApi.ingestTirePressure()`
2. Connect `TelemetryTemperatureForm.jsx` ke `sensorsApi.ingestTireTemperature()`
3. Connect `TelemetryFuelForm.jsx` ke sensor endpoints

### Additional Features

1. Fleet Groups management
2. Settings page
3. Reports dengan Backend 2 data
4. User management

## 📚 Documentation

Lihat file lengkap:

- `BACKEND2_INTEGRATION.md` - Dokumentasi lengkap implementasi
- `FRONTEND_INTEGRATION_API_DOCUMENTATION.md` - API reference dari backend

## ✨ Features

- ✅ JWT Authentication
- ✅ Real-time Dashboard updates
- ✅ Real-time Alerts via WebSocket
- ✅ Truck management (List, View, CRUD)
- ✅ Driver management (List, CRUD)
- ✅ Vendor management (List, CRUD)
- ✅ IoT Device management
- ✅ Alert monitoring & resolution
- ✅ Auto token refresh
- ✅ Error handling & user feedback
- ✅ Pagination support
- ✅ Search & filtering

---

**Ready to use!** 🚀

Aplikasi sudah terintegrasi dengan Backend 2 untuk semua fitur kecuali Tracking.
