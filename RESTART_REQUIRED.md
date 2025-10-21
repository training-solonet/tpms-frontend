# ⚠️ PENTING - Restart Development Server

## 🔧 Perubahan yang Dilakukan

### 1. Environment Variables (`.env`)
```properties
# Backend 2 (Main) - For all features except tracking
VITE_API_BASE_URL=http://connectis.my.id:3001/api
VITE_WS_URL=ws://connectis.my.id:3001/ws

# Backend 1 (Legacy) - Only for tracking
VITE_TRACKING_API_BASE_URL=https://be-tpms.connectis.my.id
VITE_TRACKING_WS_URL=wss://be-tpms.connectis.my.id/ws
```

### 2. Pages Updated to Backend 2
- ✅ `TelemetryFuelForm.jsx`
- ✅ `TelemetryTemperatureForm.jsx`
- ✅ `TelemetryTiresForm.jsx`
- ✅ `FleetManagement.jsx`
- ✅ `FleetGroups.jsx`

## 🚀 Cara Restart Server

### Option 1: Stop & Start
```bash
# Tekan Ctrl+C di terminal untuk stop server
# Kemudian run lagi:
npm run dev
```

### Option 2: Restart Vite
```bash
# Di terminal yang running dev server, tekan:
r + Enter
```

## ✅ Verifikasi Setelah Restart

1. **Cek Console Browser**
   - Seharusnya tidak ada error 400/404 lagi
   - Lihat log: "📡 Loading data from Backend 2..."
   - Lihat log: "✅ ... response:" dengan data

2. **Cek Network Tab**
   - Request harus ke: `http://connectis.my.id:3001/api/...`
   - Bukan lagi ke: `https://be-tpms.connectis.my.id/...`

3. **Test Login**
   ```
   Username: admin
   Password: admin123
   ```

4. **Test Pages**
   - Dashboard → Should load stats
   - Trucks → Should show list
   - Drivers → Should show list
   - Vendors → Should show list
   - Telemetry → Should show data
   - Alerts → Should show alerts

## 🐛 Troubleshooting

### Jika Masih Error 400/404:

1. **Clear Cache**
   ```bash
   # Stop server, then:
   rm -rf node_modules/.vite
   npm run dev
   ```

2. **Hard Refresh Browser**
   - Windows: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

3. **Check .env File**
   - Pastikan tidak ada trailing spaces
   - Pastikan format benar

4. **Check Token**
   ```javascript
   // Di browser console:
   localStorage.getItem('authToken')
   // Jika null, login ulang
   ```

### Jika Data Tidak Muncul:

1. **Verify Backend 2 is Running**
   ```bash
   curl http://connectis.my.id:3001/api/trucks
   ```

2. **Check Authorization**
   - Login ulang untuk get new token
   - Token mungkin expired

3. **Check Browser Console**
   - Look for error messages
   - Check network tab for failed requests

## 📝 Summary Perubahan

### Backend URLs:
- **Backend 1** (Tracking only): `https://be-tpms.connectis.my.id`
- **Backend 2** (All other features): `http://connectis.my.id:3001/api`

### API Imports Changed:
```javascript
// OLD (❌)
import { trucksAPI } from '../services/api.js';

// NEW (✅)
import { trucksApi } from '../services/api2';
```

### Field Names Updated:
Backend 2 uses camelCase:
- `plate_number` → `plateNumber`
- `truck_number` → `truckNumber`  
- `fuel_level` → `fuelLevel`
- `updated_at` → `updatedAt`

## 🎯 Next Steps After Restart

1. Test login dengan credentials di atas
2. Navigate ke setiap page dan verify data loads
3. Check browser console untuk errors
4. Jika ada error, share screenshot/log nya

---

**RESTART SERVER SEKARANG!** 🔄
