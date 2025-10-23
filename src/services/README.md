# Services Directory Structure

## Backend Separation

Aplikasi ini menggunakan **2 backend terpisah** dengan fungsi berbeda:

---

### 🟢 **Backend 1 (BE1) - Tracking & TPMS**
**Folder**: `src/services/api/`  
**Base URL**: `VITE_TRACKING_API_BASE_URL`  
**WebSocket**: `VITE_TRACKING_WS_URL`

#### Fungsi:
- ✅ **Live Tracking** - Real-time GPS location tracking
- ✅ **History Tracking** - Historical route & location data
- ✅ **TPMS** - Tire Pressure Monitoring System
- ✅ **Telemetry** - Tire, Temperature, Fuel telemetry data

#### Modul API:
```javascript
// src/services/api/
├── tpms.api.js          // TPMS tire pressure & location
├── trucks.api.js        // Truck tracking (location, routes)
├── config.js            // BE1 configuration (TRACKING_CONFIG, TPMS_CONFIG)
└── index.js             // Export tpmsAPI, trucksAPI
```

#### Usage:
```javascript
import { tpmsAPI, trucksAPI, TPMS_CONFIG } from '@/services/api';

// Get real-time tire pressure
const tpmsData = await tpmsAPI.getRealtimeSnapshot();

// Get truck live location
const location = await trucksAPI.getCurrentLocation('TRUCK-001');
```

---

### 🔵 **Backend 2 (BE2) - Master Data & Management**
**Folder**: `src/services/api2/`  
**Base URL**: `VITE_API_BASE_URL`  
**WebSocket**: `VITE_WS_URL`

#### Fungsi:
- ✅ **Dashboard** - Analytics & statistics
- ✅ **Fleet Management** - Trucks, Drivers, Vendors master data (CRUD)
- ✅ **IoT Devices** - Device management & configuration
- ✅ **Alerts** - Notifications & alert management
- ✅ **Settings** - Application settings
- ✅ **Authentication** - Login, register, user management

#### Modul API:
```javascript
// src/services/api2/
├── auth.api.js          // Authentication (login, register)
├── trucks.api.js        // Truck master data (CRUD)
├── drivers.api.js       // Driver master data (CRUD)
├── vendors.api.js       // Vendor master data (CRUD)
├── devices.api.js       // IoT device management
├── sensors.api.js       // Sensor configuration
├── miningArea.api.js    // Mining area master data
├── dashboard.api.js     // Dashboard analytics
├── alerts.api.js        // Alert management
├── config.js            // BE2 configuration (API_BASE_URL)
└── index.js             // Export all BE2 APIs
```

#### Usage:
```javascript
import { driversApi, trucksApi, authApi } from '@/services/api2';

// Login
await authApi.login({ username: 'admin', password: 'password' });

// Get all drivers
const drivers = await driversApi.getAll();

// Create new truck (master data)
await trucksApi.create({
  plate: 'B1234XYZ',
  model: 'Dump Truck',
  capacity: 50
});
```

---

## Environment Variables

### Development (.env)
```env
# Backend 2 - Master Data & Management
VITE_API_BASE_URL=https://be-tpms.connectis.my.id/api
VITE_WS_URL=wss://be-tpms.connectis.my.id/ws

# Backend 1 - Tracking & TPMS
VITE_TRACKING_API_BASE_URL=https://tpms.solonet.net.id
VITE_TRACKING_WS_URL=wss://tpms.solonet.net.id/ws

# TPMS Configuration
VITE_TPMS_API_KEY=your_api_key_here
VITE_TPMS_SN=your_serial_number
VITE_API_TPMS_REALTIME_ENDPOINT=/tpms/realtime
VITE_API_TPMS_LOCATION_ENDPOINT=/tpms/location
VITE_TPMS_WS_URL=wss://tpms.solonet.net.id/ws
```

---

## Mapping dengan Sidebar

Berdasarkan navigasi sidebar [`TailwindSidebar.jsx`](../components/layout/TailwindSidebar.jsx):

| Sidebar Menu | Backend | Import From |
|--------------|---------|-------------|
| **Dashboard** | BE2 | `@/services/api2` (dashboardApi) |
| **Tracking → Live Tracking** | BE1 | `@/services/api` (trucksAPI) |
| **Tracking → History** | BE1 | `@/services/api` (trucksAPI) |
| **Fleet Management → Fleet Groups** | BE2 | `@/services/api2` |
| **Fleet Management → All Vehicles** | BE2 | `@/services/api2` (trucksApi) |
| **Fleet Management → Vehicle & IoT Status** | BE2 | `@/services/api2` (devicesApi) |
| **Fleet Management → Drivers** | BE2 | `@/services/api2` (driversApi) |
| **Fleet Management → Vendors** | BE2 | `@/services/api2` (vendorsApi) |
| **IoT Devices** | BE2 | `@/services/api2` (devicesApi) |
| **Telemetry → Tire Pressure** | BE1 | `@/services/api` (tpmsAPI) |
| **Telemetry → Hub Temperature** | BE1 | `@/services/api` (trucksAPI) |
| **Telemetry → Fuel Levels** | BE1 | `@/services/api` (trucksAPI) |
| **Alerts** | BE2 | `@/services/api2` (alertsApi) |
| **Settings** | BE2 | `@/services/api2` |

---

## Best Practices

### ✅ DO:
- Use BE1 (`api/`) untuk **tracking real-time** dan **TPMS data**
- Use BE2 (`api2/`) untuk **master data CRUD** dan **management**
- Gunakan **absolute imports**: `@/services/api` atau `@/services/api2`
- Cek **environment variables** sudah benar di production

### ❌ DON'T:
- Jangan import driver/vendor dari BE1 (tidak ada!)
- Jangan campur tracking logic dengan master data
- Jangan hardcode URL - selalu pakai env variables

---

## Troubleshooting

### ❌ Error: "Cannot find module driversAPI from @/services/api"
**Solusi**: Driver master data ada di BE2, gunakan:
```javascript
import { driversApi } from '@/services/api2'; // ✅ Benar
```

### ❌ TPMS data salah di production
**Penyebab**: Environment variables tidak diset dengan benar
**Solusi**: 
1. Cek `VITE_TRACKING_API_BASE_URL` sudah diset
2. Cek `VITE_TPMS_API_KEY` dan `VITE_TPMS_SN` benar
3. Rebuild: `npm run build`
4. Clear cache browser

### ❌ 404 Error pada endpoint tracking
**Penyebab**: Salah base URL
**Solusi**: Pastikan endpoint tracking pakai `VITE_TRACKING_API_BASE_URL`, bukan `VITE_API_BASE_URL`

---

## File Structure Summary

```
src/services/
├── api/                      # 🟢 BE1 - Tracking & TPMS
│   ├── config.js            # TRACKING_CONFIG, TPMS_CONFIG
│   ├── tpms.api.js          # Tire pressure monitoring
│   ├── trucks.api.js        # Truck tracking
│   └── index.js             # Export tpmsAPI, trucksAPI
│
├── api2/                     # 🔵 BE2 - Master Data & Management
│   ├── config.js            # API_BASE_URL, api2Instance (axios)
│   ├── auth.api.js          # Authentication
│   ├── trucks.api.js        # Truck master data (CRUD)
│   ├── drivers.api.js       # Driver master data (CRUD)
│   ├── vendors.api.js       # Vendor master data (CRUD)
│   ├── devices.api.js       # Device management
│   ├── sensors.api.js       # Sensor config
│   ├── miningArea.api.js    # Mining area
│   ├── dashboard.api.js     # Dashboard
│   ├── alerts.api.js        # Alerts
│   └── index.js             # Export all BE2 APIs
│
├── utils/                    # Shared utilities
│   ├── apiRequest.js        # API request helper
│   └── connectionUtils.js   # Connection monitoring
│
├── websocket/                # WebSocket connections
│   └── FleetWebSocket.js    # Fleet tracking WebSocket
│
├── api-legacy.js            # ⚠️ Legacy code (deprecated)
├── api.js                   # ⚠️ Legacy wrapper (deprecated)
└── dataService.js           # ⚠️ Legacy data layer (deprecated)
```

---

**Last Updated**: October 23, 2025  
**Maintainer**: Development Team
