# Services Refactor - Migration Guide

## 📋 Overview

Services telah direstrukturisasi untuk memisahkan backend 1 (Tracking & TPMS) dan backend 2 (Management & Master Data). Struktur baru lebih modular dan mudah dimaintain.

## 🗂️ Struktur Baru

```
src/services/
├── tracking/                   # Backend 1 - Tracking & TPMS
│   ├── base/
│   ├── config.js
│   ├── tpms.api.js
│   └── index.js
│
├── management/                 # Backend 2 - Master Data & Management
│   ├── base/
│   │   └── BaseApi.js
│   ├── modules/
│   │   ├── auth/
│   │   │   └── auth.api.js
│   │   ├── fleet/
│   │   │   ├── trucks.api.js
│   │   │   ├── drivers.api.js
│   │   │   ├── vendors.api.js
│   │   │   └── fleet.api.js
│   │   ├── iot/
│   │   │   ├── devices.api.js
│   │   │   ├── sensors.api.js
│   │   │   └── iot.api.js
│   │   ├── monitoring/
│   │   │   ├── alerts.api.js
│   │   │   └── dashboard.api.js
│   │   └── operations/
│   │       └── miningArea.api.js
│   ├── config.js
│   └── index.js
│
├── websocket/
│   └── FleetWebSocket.js
│
└── index.js                    # Main barrel export
```

## 🔄 Import Changes

### Before (OLD)

```javascript
// OLD - dari api2
import { trucksApi } from '../../services/api2';
import api2Instance from '../../services/api2/config';

// OLD - dari api
import { tpmsAPI } from '../../services/api';
```

### After (NEW)

```javascript
// NEW - dari services root
import { trucksApi, devicesApi, authApi } from 'services';
import { managementClient } from 'services/management';

// NEW - dari specific backend
import { tpmsAPI } from 'services/tracking';

// NEW - import everything from one backend
import * as management from 'services/management';
// usage: management.trucksApi.list()
```

## 📝 Migration Steps

### Step 1: Update Imports di Components/Pages

**Find and Replace Pattern:**

| Old Pattern                  | New Pattern                  |
| ---------------------------- | ---------------------------- |
| `from '../../services/api2'` | `from 'services/management'` |
| `from '../services/api2'`    | `from 'services/management'` |
| `from '@/services/api2'`     | `from 'services/management'` |
| `import api2Instance`        | `import managementClient`    |
| `from '../../services/api'`  | `from 'services/tracking'`   |

### Step 2: Update Config Imports

```javascript
// OLD
import { API_BASE_URL } from '../../services/api2/config';

// NEW
import { MANAGEMENT_CONFIG } from 'services/management';
// atau
import managementClient from 'services/management/config';
```

### Step 3: Update Hooks

```javascript
// File: src/hooks/useManagementApi.js (renamed from useApi2.js)

// OLD
import api2Instance from '../services/api2/config';

// NEW
import managementClient from 'services/management/config';
```

## 🎯 Import Examples by Use Case

### Authentication

```javascript
import { authApi } from 'services';

authApi.login({ username, password });
authApi.logout();
```

### Fleet Management

```javascript
import { trucksApi, driversApi, vendorsApi } from 'services';

// List trucks
const trucks = await trucksApi.list();

// Create driver
await driversApi.create({ name: 'John Doe' });
```

### IoT & Devices

```javascript
import { devicesApi, sensorsApi } from 'services';

const devices = await devicesApi.list();
const sensors = await sensorsApi.getById(123);
```

### Tracking & TPMS

```javascript
import { tpmsAPI } from 'services/tracking';

const tpmsData = await tpmsAPI.getRealTimeData();
```

### WebSocket

```javascript
import { FleetWebSocket } from 'services';

const ws = new FleetWebSocket(url);
```

## 🛠️ Automated Migration Script

```powershell
# Run this script dari root project untuk update imports otomatis
# (Gunakan dengan hati-hati, backup dulu!)

# Update api2 imports to management
Get-ChildItem -Path "src" -Recurse -Include *.jsx,*.js |
  ForEach-Object {
    (Get-Content $_.FullName) `
      -replace "from '(.*)services/api2'", "from 'services/management'" `
      -replace "api2Instance", "managementClient" |
    Set-Content $_.FullName
  }

# Update api imports to tracking
Get-ChildItem -Path "src" -Recurse -Include *.jsx,*.js |
  ForEach-Object {
    (Get-Content $_.FullName) `
      -replace "from '(.*)services/api'", "from 'services/tracking'" |
    Set-Content $_.FullName
  }
```

## ✅ Verification Checklist

- [ ] Semua imports di `src/pages` sudah diupdate
- [ ] Semua imports di `src/components` sudah diupdate
- [ ] Hooks (`useApi2.js` dll) sudah diupdate
- [ ] Config imports sudah menggunakan path baru
- [ ] `npm run dev` berjalan tanpa error
- [ ] Login/auth flow masih berfungsi
- [ ] CRUD operations (trucks, drivers, dll) masih berfungsi
- [ ] TPMS/tracking features masih berfungsi

## 🔍 Common Issues & Fixes

### Issue 1: Module not found error

```
Error: Cannot find module 'services/management'
```

**Fix:** Pastikan path alias sudah dikonfigurasi di `vite.config.js` atau `jsconfig.json`:

```javascript
// vite.config.js
resolve: {
  alias: {
    'services': '/src/services'
  }
}
```

### Issue 2: api2Instance undefined

```
Error: api2Instance is not defined
```

**Fix:** Update import:

```javascript
// OLD
import api2Instance from './services/api2/config';

// NEW
import managementClient from 'services/management/config';
```

### Issue 3: Axios interceptor tidak jalan

**Check:** Pastikan `managementClient` di-import dari config, bukan membuat instance baru.

## 🎓 Best Practices

1. **Gunakan barrel imports** dari `services/` untuk imports yang clean
2. **Group imports** by backend (management vs tracking)
3. **Use BaseApi** untuk API modules baru (contoh ada di `BaseApi.js`)
4. **Konsisten** dengan naming: `managementClient`, bukan `api2Instance`

## 📞 Support

Jika ada masalah setelah migrasi:

1. Check console untuk error messages
2. Verify import paths
3. Run `npm run dev` dan cek terminal output
4. Check network tab di browser devtools

---

**Updated:** November 7, 2025
**Status:** ✅ Migration Ready
