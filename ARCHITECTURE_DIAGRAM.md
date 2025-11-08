# Services Architecture Diagram

## 🏗️ New Structure Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    src/services/                             │
│                                                              │
│  ┌──────────────────────┐    ┌─────────────────────────┐   │
│  │   Backend 1 (BE1)    │    │   Backend 2 (BE2)       │   │
│  │   Tracking & TPMS    │    │   Management & Master   │   │
│  └──────────────────────┘    └─────────────────────────┘   │
│           │                              │                   │
│           ▼                              ▼                   │
│  ┌──────────────────┐          ┌──────────────────────┐    │
│  │  tracking/       │          │  management/         │    │
│  │                  │          │                      │    │
│  │  • tpms.api.js   │          │  • base/BaseApi.js   │    │
│  │  • config.js     │          │  • config.js         │    │
│  │  • index.js      │          │  • websocket.js      │    │
│  │                  │          │  • modules/          │    │
│  │  Endpoints:      │          │    ├─ auth/         │    │
│  │  - getRealTime() │          │    ├─ fleet/        │    │
│  │  - getHistory()  │          │    ├─ iot/          │    │
│  │  - getTelemetry()│          │    ├─ monitoring/   │    │
│  └──────────────────┘          │    └─ operations/   │    │
│                                 │                      │    │
│                                 │  • index.js          │    │
│                                 └──────────────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              index.js (Main Barrel Export)           │  │
│  │  Exports: tracking/* + management/* + websocket      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Module Organization

### Backend 1 (Tracking)

```
services/tracking/
├── tpms.api.js         # Real-time TPMS data, telemetry, history
├── config.js           # TRACKING_CONFIG, TPMS_CONFIG
└── index.js            # Barrel export

Used by:
- LiveTrackingMapNew.jsx
- HistoryTrackingMap.jsx
- Real-time monitoring features
```

### Backend 2 (Management)

```
services/management/
├── base/
│   └── BaseApi.js              # CRUD base class
│
├── modules/
│   ├── auth/
│   │   └── auth.api.js         # login, logout, refreshToken
│   │
│   ├── fleet/
│   │   ├── trucks.api.js       # Truck CRUD, status, locations
│   │   ├── drivers.api.js      # Driver CRUD, assignments
│   │   ├── vendors.api.js      # Vendor CRUD
│   │   └── fleet.api.js        # Fleet summary, groups
│   │
│   ├── iot/
│   │   ├── devices.api.js      # Device CRUD, status
│   │   ├── sensors.api.js      # Sensor CRUD, telemetry
│   │   └── iot.api.js          # IoT configurations
│   │
│   ├── monitoring/
│   │   ├── alerts.api.js       # Alert CRUD, subscriptions
│   │   └── dashboard.api.js    # Dashboard stats, analytics
│   │
│   └── operations/
│       └── miningArea.api.js   # Mining area master data
│
├── config.js           # managementClient axios instance
├── websocket.js        # FleetWebSocket for real-time updates
└── index.js            # Barrel export
```

## 🔄 Data Flow

```
┌─────────────┐
│  React App  │
└──────┬──────┘
       │
       │ imports
       ▼
┌─────────────────────────────────┐
│  services/management or         │
│  services/tracking               │
└────────┬────────────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌─────────┐ ┌──────────┐
│  BE1    │ │   BE2    │
│ TPMS    │ │ Master   │
│ Tracking│ │ Data     │
└─────────┘ └──────────┘
```

## 🎯 Import Examples

### Before Refactor

```javascript
// Messy imports from different depths
import { trucksApi } from '../../services/api2';
import { tpmsAPI } from '../../../services/api';
import api2Instance from '../../services/api2/config';
```

### After Refactor

```javascript
// Clean barrel imports
import { trucksApi, devicesApi, authApi } from 'services/management';
import { tpmsAPI } from 'services/tracking';
import { managementClient } from 'services/management/config';
```

## 📊 Module Dependencies

```
Login.jsx
  └─> useAuth.js
       └─> services/management/modules/auth/auth.api.js
            └─> managementClient (axios)
                 └─> VITE_API_BASE_URL

TrucksList.jsx
  └─> services/management
       ├─> trucksApi (fleet/trucks.api.js)
       ├─> driversApi (fleet/drivers.api.js)
       └─> vendorsApi (fleet/vendors.api.js)

LiveTrackingMapNew.jsx
  ├─> services/tracking/tpms.api.js (BE1 - real-time data)
  └─> services/management/miningArea.api.js (BE2 - master data)
```

## 🔐 Authentication Flow

```
┌──────────┐
│ Login.jsx│
└────┬─────┘
     │
     ▼
┌─────────────────┐
│ useAuth.js      │
│ (hook)          │
└────┬────────────┘
     │
     ▼
┌────────────────────────┐
│ authApi.login()        │
│ (management/auth)      │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│ managementClient       │
│ (axios with JWT        │
│  interceptor)          │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│ BE2 API                │
│ POST /api/auth/login   │
└────────────────────────┘
```

## 🌐 WebSocket Integration

```
┌─────────────────────┐
│ TailwindFleet       │
│ Overview.jsx        │
└──────┬──────────────┘
       │
       ▼
┌───────────────────────────┐
│ fleetWebSocket            │
│ (management/websocket.js) │
└──────┬────────────────────┘
       │
       ├─> connect(WS_BASE_URL)
       ├─> subscribe(['trucks', 'alerts'])
       ├─> on('message', callback)
       └─> disconnect()
```

## 🎨 Best Practices Applied

1. **Separation of Concerns**
   - BE1 (tracking) strictly for real-time data
   - BE2 (management) strictly for master data & CRUD

2. **Domain-Driven Design**
   - Modules organized by business domain
   - fleet/, iot/, monitoring/, operations/

3. **DRY Principle**
   - BaseApi eliminates code duplication
   - Barrel exports reduce import boilerplate

4. **Single Responsibility**
   - Each API module handles one domain
   - Clear boundaries between modules

5. **Open/Closed Principle**
   - Easy to add new modules without modifying existing code
   - Extend BaseApi for custom behaviors

---

**Last Updated:** November 7, 2025  
**Architecture Version:** 2.0  
**Status:** ✅ Production Ready
