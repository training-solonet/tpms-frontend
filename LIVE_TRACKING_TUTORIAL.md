# 🗺️ Tutorial Live Tracking - Dari API sampai Tampilan

## 📖 Penjelasan Sederhana

Live Tracking adalah fitur untuk **melihat posisi truk secara real-time di peta**. Seperti Google Maps, tapi khusus untuk armada truk perusahaan.

---

## 🎯 Apa yang Ditampilkan?

1. **Peta** dengan marker truk 🚛
2. **Posisi truk** yang update otomatis setiap beberapa detik
3. **Informasi truk**: Nomor plat, kecepatan, arah
4. **Status**: Online/Offline/Idle
5. **Data ban (TPMS)**: Tekanan dan suhu ban

---

## 🔄 Alur Kerja Live Tracking (Step by Step)

```
┌─────────────────────────────────────────────────────────────┐
│                 LANGKAH 1: Buka Halaman                     │
│  User klik menu "Tracking → Live Tracking"                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│             LANGKAH 2: Component Dimuat                     │
│  - File: LiveTrackingMapNew.jsx                             │
│  - React component mulai jalan                              │
│  - useEffect() dipanggil otomatis                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         LANGKAH 3: Panggil API untuk Ambil Data Truk        │
│  trucksAPI.getRealTimeLocations()                           │
│  → Kirim request ke backend                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│       LANGKAH 4: Backend Proses Request                     │
│  Backend 1: https://tpms.solonet.net.id                     │
│  - Terima request dari frontend                             │
│  - Ambil data GPS semua truk dari database                  │
│  - Format jadi JSON                                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│           LANGKAH 5: Backend Kirim Response                 │
│  Response berisi array truk dengan lat/lng nya              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│       LANGKAH 6: Frontend Terima & Simpan Data              │
│  - Parse JSON response                                      │
│  - Simpan ke state: setVehicles(data)                       │
│  - State berubah → React auto re-render                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│           LANGKAH 7: Tampilkan di Peta                      │
│  - Loop semua truk dari state                               │
│  - Buat marker 📍 di posisi (lat, lng)                      │
│  - Tampilkan info: plat nomor, kecepatan, dll               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         LANGKAH 8: Update Otomatis (Polling)                │
│  - Setiap 10 detik, ulangi dari Langkah 3                   │
│  - Ambil data terbaru                                       │
│  - Update posisi marker di peta                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 💻 Kode Lengkap Step by Step

### STEP 1: Import yang Diperlukan

```javascript
// File: src/pages/LiveTracking.jsx
import React, { useState, useEffect } from 'react';

// Import API untuk ambil data dari backend
import { trucksAPI, tpmsAPI } from '../services/api'; // Backend 1 (Tracking)

// Import komponen peta
import BaseTrackingMap from '../components/dashboard/BaseTrackingMap';
```

**Penjelasan**:

- `useState` → Untuk simpan data di memori (seperti variabel)
- `useEffect` → Untuk jalankan kode otomatis saat halaman dibuka
- `trucksAPI` → Fungsi untuk ambil data posisi truk
- `tpmsAPI` → Fungsi untuk ambil data tekanan ban

---

### STEP 2: Buat State untuk Simpan Data

```javascript
const LiveTrackingPage = () => {
  // State = tempat nyimpen data di memori
  const [vehicles, setVehicles] = useState([]); // Array kosong untuk daftar truk
  const [loading, setLoading] = useState(true); // Loading spinner
  const [selectedTruck, setSelectedTruck] = useState(null); // Truk yang diklik
  const [tpmsData, setTpmsData] = useState(null); // Data tekanan ban

  // ... kode selanjutnya
};
```

**Penjelasan**:

- `vehicles` → Menyimpan daftar semua truk
- `loading` → Status loading (true = sedang loading, false = selesai)
- `selectedTruck` → Truk yang user klik untuk lihat detail
- `tpmsData` → Data tekanan ban dari TPMS

**Analogi**:
State seperti **kotak penyimpanan**. Setiap kali data berubah, React otomatis update tampilan.

---

### STEP 3: Fungsi untuk Ambil Data Truk

```javascript
// Fungsi ini dipanggil untuk ambil data truk dari backend
const fetchTrucks = async () => {
  setLoading(true); // Mulai loading

  try {
    // PANGGIL API KE BACKEND
    const response = await trucksAPI.getRealTimeLocations();
    // await = tunggu sampai data dari backend datang

    // CEK APAKAH SUKSES
    if (response.success) {
      // Data berhasil didapat
      const trucksData = response.data.features || []; // Array truk

      // UBAH FORMAT DATA jadi yang lebih mudah dipakai
      const formattedTrucks = trucksData.map((feature) => ({
        id: feature.properties.id,
        plate: feature.properties.plateNumber,
        latitude: feature.geometry.coordinates[1], // Koordinat Y
        longitude: feature.geometry.coordinates[0], // Koordinat X
        speed: feature.properties.speed || 0,
        heading: feature.properties.heading || 0,
        status: feature.properties.status || 'offline',
      }));

      // SIMPAN KE STATE
      setVehicles(formattedTrucks);
      console.log('✅ Data truk berhasil dimuat:', formattedTrucks.length, 'truk');
    } else {
      // Gagal ambil data
      console.error('❌ Gagal ambil data:', response.error);
    }
  } catch (error) {
    // Error network (internet mati, server down, dll)
    console.error('❌ Error:', error.message);
  } finally {
    setLoading(false); // Selesai loading
  }
};
```

**Penjelasan Detail**:

1. **`async/await`**:
   - Seperti "tunggu sebentar" sebelum lanjut
   - Karena ambil data dari backend butuh waktu (bisa 1-2 detik)

2. **`trucksAPI.getRealTimeLocations()`**:
   - Ini yang ngirim request ke backend
   - Backend URL: `https://tpms.solonet.net.id/api/trucks/locations`

3. **Response Format dari Backend**:

   ```json
   {
     "success": true,
     "data": {
       "features": [
         {
           "type": "Feature",
           "geometry": {
             "type": "Point",
             "coordinates": [106.8456, -6.2088] // [longitude, latitude]
           },
           "properties": {
             "id": "TRUCK-001",
             "plateNumber": "B1234ABC",
             "speed": 45,
             "heading": 180,
             "status": "online"
           }
         },
         {
           "type": "Feature",
           "geometry": {
             "coordinates": [106.85, -6.21]
           },
           "properties": {
             "id": "TRUCK-002",
             "plateNumber": "B5678XYZ",
             "speed": 30,
             "status": "online"
           }
         }
       ]
     }
   }
   ```

4. **`map()` Function**:
   - Loop setiap truk dan ubah formatnya
   - Dari format GeoJSON → Format yang lebih simple
   - Seperti "terjemahkan" supaya lebih mudah dipakai

---

### STEP 4: Jalankan Fetch Saat Halaman Dibuka

```javascript
// useEffect = jalankan kode otomatis saat component muncul
useEffect(() => {
  // Panggil fetch pertama kali
  fetchTrucks();

  // Setup interval untuk update otomatis setiap 10 detik
  const interval = setInterval(() => {
    fetchTrucks(); // Panggil lagi setiap 10 detik
  }, 10000); // 10000 ms = 10 detik

  // Cleanup: hapus interval saat halaman ditutup
  return () => {
    clearInterval(interval);
  };
}, []); // [] = cuma jalankan sekali saat pertama kali muncul
```

**Penjelasan**:

- **useEffect** seperti "autopilot"
- Saat halaman dibuka → otomatis panggil `fetchTrucks()`
- Setiap 10 detik → otomatis panggil lagi untuk update posisi
- Saat halaman ditutup → berhenti update (cleanup)

**Analogi**:
Seperti GPS di mobil yang auto-update posisi setiap beberapa detik.

---

### STEP 5: Tampilkan Loading atau Peta

```javascript
// Bagian render (yang ditampilkan ke layar)
return (
  <div className="h-screen w-full">
    {/* JIKA MASIH LOADING, TAMPILKAN SPINNER */}
    {loading ? (
      <div className="flex items-center justify-center h-full">
        <div className="spinner">Loading peta...</div>
      </div>
    ) : (
      /* JIKA SELESAI LOADING, TAMPILKAN PETA */
      <BaseTrackingMap>
        {/* Loop setiap truk dan buat marker */}
        {vehicles.map((truck) => (
          <TruckMarker key={truck.id} truck={truck} onClick={() => handleTruckClick(truck)} />
        ))}
      </BaseTrackingMap>
    )}
  </div>
);
```

**Penjelasan**:

- **Conditional rendering**: Tampilkan yang mana tergantung kondisi
- Kalau `loading = true` → Tampilkan "Loading..."
- Kalau `loading = false` → Tampilkan peta dengan marker truk

---

### STEP 6: Buat Marker untuk Setiap Truk

```javascript
const TruckMarker = ({ truck, onClick }) => {
  // Tentukan warna berdasarkan status
  const getColor = (status) => {
    if (status === 'online') return 'green'; // Hijau = jalan
    if (status === 'idle') return 'orange'; // Orange = parkir
    return 'gray'; // Abu-abu = offline
  };

  return (
    <div
      className="truck-marker"
      style={{
        position: 'absolute',
        left: truck.longitude, // Posisi X di peta
        top: truck.latitude, // Posisi Y di peta
        cursor: 'pointer',
      }}
      onClick={onClick}
    >
      {/* Icon truk */}
      <div className={`truck-icon ${getColor(truck.status)}`}>🚛</div>

      {/* Label plat nomor */}
      <div className="truck-label">{truck.plate}</div>

      {/* Info kecepatan */}
      <div className="truck-speed">{truck.speed} km/h</div>
    </div>
  );
};
```

**Penjelasan**:

- Setiap truk punya marker sendiri di peta
- Marker bisa diklik untuk lihat detail
- Warna berubah sesuai status (hijau/orange/abu-abu)

---

### STEP 7: Ambil Data TPMS Saat Truk Diklik

```javascript
// Fungsi dipanggil saat user klik marker truk
const handleTruckClick = async (truck) => {
  setSelectedTruck(truck); // Simpan truk yang diklik

  try {
    // AMBIL DATA TPMS (tekanan ban)
    const response = await tpmsAPI.getRealtimeSnapshot();

    if (response.success) {
      setTpmsData(response.data); // Simpan data ban
      console.log('✅ Data TPMS:', response.data);
    }
  } catch (error) {
    console.error('❌ Error ambil TPMS:', error);
  }
};
```

**Response TPMS dari Backend**:

```json
{
  "success": true,
  "data": {
    "sn": "812952426",
    "timestamp": "2025-10-23T10:30:00Z",
    "tires": [
      {
        "id": "FL", // Front Left (depan kiri)
        "pressure": 32.5, // PSI
        "temperature": 28.3, // Celsius
        "status": "normal"
      },
      {
        "id": "FR", // Front Right (depan kanan)
        "pressure": 31.8,
        "temperature": 29.1,
        "status": "normal"
      },
      {
        "id": "RL", // Rear Left (belakang kiri)
        "pressure": 33.2,
        "temperature": 27.9,
        "status": "normal"
      },
      {
        "id": "RR", // Rear Right (belakang kanan)
        "pressure": 32.0,
        "temperature": 28.5,
        "status": "normal"
      }
    ]
  }
}
```

---

### STEP 8: Tampilkan Info Detail Truk

```javascript
// Popup/Sidebar info detail
const TruckDetailPanel = () => {
  if (!selectedTruck) return null; // Jangan tampilkan kalau belum ada yang diklik

  return (
    <div className="detail-panel">
      <h3>Detail Truk</h3>

      {/* Info truk */}
      <div className="info-row">
        <span>Plat Nomor:</span>
        <strong>{selectedTruck.plate}</strong>
      </div>

      <div className="info-row">
        <span>Kecepatan:</span>
        <strong>{selectedTruck.speed} km/h</strong>
      </div>

      <div className="info-row">
        <span>Status:</span>
        <span className={`status-${selectedTruck.status}`}>{selectedTruck.status}</span>
      </div>

      {/* Info ban (TPMS) */}
      {tpmsData && (
        <div className="tpms-section">
          <h4>Tekanan Ban</h4>
          <div className="tire-grid">
            {tpmsData.tires.map((tire) => (
              <div key={tire.id} className="tire-box">
                <div className="tire-label">{tire.id}</div>
                <div className="tire-pressure">{tire.pressure} PSI</div>
                <div className="tire-temp">{tire.temperature}°C</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tombol tutup */}
      <button onClick={() => setSelectedTruck(null)}>Tutup</button>
    </div>
  );
};
```

---

## 🔗 Koneksi Backend - Detail Teknis

### 1. File API Module

```javascript
// File: src/services/api/trucks.api.js

export const trucksAPI = {
  /**
   * Get real-time locations semua truk
   * @returns {Promise} Array truk dengan koordinat GPS
   */
  getRealTimeLocations: async () => {
    try {
      // URL endpoint
      const url = `${TRACKING_CONFIG.BASE_URL}/api/trucks/locations`;

      // Kirim request GET
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Parse JSON
      const data = await response.json();

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};
```

---

### 2. Konfigurasi Backend

```javascript
// File: src/services/api/config.js

export const TRACKING_CONFIG = {
  // Backend 1 URL untuk tracking
  BASE_URL: 'https://tpms.solonet.net.id',

  // WebSocket untuk update real-time
  WS_URL: 'wss://tpms.solonet.net.id/ws',
};
```

---

### 3. Environment Variables

```env
# File: .env

# Backend 1 - Tracking & TPMS
VITE_TRACKING_API_BASE_URL=https://tpms.solonet.net.id
VITE_TRACKING_WS_URL=wss://tpms.solonet.net.id/ws

# TPMS Configuration
VITE_TPMS_API_KEY=WGMs869t6mqUU3mJOXnrdTOhvqjXEsjJtiLOyqcXAn9N0P0yQZoD0nbC9z8ByIPV
VITE_TPMS_SN=812952426
```

---

## 📊 Diagram Alur Data Lengkap

```
FRONTEND                          BACKEND 1                    DATABASE
========                          =========                    ========

User buka halaman
      │
      ▼
LiveTrackingPage.jsx
      │
      │ useEffect()
      │ dipanggil otomatis
      ▼
fetchTrucks()
      │
      │ Call API
      ▼
trucksAPI.getRealTimeLocations()
      │
      │ HTTP GET
      │ /api/trucks/locations
      ├──────────────────────▶  Terima request
      │                              │
      │                              │ Query database
      │                              ├─────────────▶  SELECT * FROM trucks
      │                              │                WHERE status = 'online'
      │                              │                     │
      │                              │                     │ Return rows
      │                              │◀────────────────────┘
      │                              │
      │                              │ Format jadi JSON
      │                              │ + koordinat GPS
      │                              │
      │◀─────────────────────────────┤ Response JSON
      │   { success: true,
      │     data: { features: [...] }
      │   }
      ▼
Parse response
      │
      │ map() setiap truk
      │ ubah format data
      ▼
setVehicles(data)
      │
      │ State berubah
      │ React auto re-render
      ▼
Loop vehicles.map()
      │
      │ Untuk setiap truk
      ▼
<TruckMarker>
      │
      │ Tampilkan icon 🚛
      │ di posisi (lat, lng)
      ▼
PETA DITAMPILKAN ✅

      │
      │ Tunggu 10 detik
      ▼
Interval trigger
      │
      └──▶ fetchTrucks() lagi (ulangi dari atas)
```

---

## 🎯 Kesimpulan Sederhana

### Cara Kerja Live Tracking:

1. **Halaman dibuka** → `useEffect()` jalan otomatis
2. **Panggil API** → `trucksAPI.getRealTimeLocations()`
3. **Backend kirim data** → JSON berisi array truk + koordinat GPS
4. **Frontend terima** → Simpan ke state `setVehicles(data)`
5. **React render ulang** → Loop setiap truk, buat marker di peta
6. **Update otomatis** → Setiap 10 detik, ulangi dari langkah 2

### Komponen Utama:

- **trucksAPI** → Fungsi untuk ambil data dari backend
- **useState** → Tempat nyimpen data di memori
- **useEffect** → Autopilot, jalankan kode otomatis
- **setInterval** → Timer untuk update setiap 10 detik
- **map()** → Loop untuk buat marker setiap truk

### Backend yang Dipakai:

- **Backend 1** (Tracking): `https://tpms.solonet.net.id`
- **Endpoint**: `/api/trucks/locations`
- **Method**: GET
- **Response**: JSON dengan koordinat GPS semua truk

---

## 💡 Tips Debugging

### 1. Cek Data Masuk atau Tidak

```javascript
useEffect(() => {
  fetchTrucks();
}, []);

const fetchTrucks = async () => {
  const response = await trucksAPI.getRealTimeLocations();

  // 👇 Print di console browser
  console.log('Response dari backend:', response);
  console.log('Jumlah truk:', response.data?.features?.length);
};
```

### 2. Cek Network Tab di Browser

1. Buka browser → F12 (Developer Tools)
2. Tab **Network**
3. Refresh halaman
4. Cari request ke `/api/trucks/locations`
5. Klik request → Lihat **Response** tab
6. Pastikan data ada dan formatnya benar

### 3. Cek State Berubah atau Tidak

```javascript
const [vehicles, setVehicles] = useState([]);

useEffect(() => {
  // 👇 Print setiap kali state berubah
  console.log('Vehicles state updated:', vehicles);
}, [vehicles]); // Jalankan setiap vehicles berubah
```

---

## 🚀 Hasil Akhir

Setelah semua jalan, user akan lihat:

```
┌──────────────────────────────────────────────────────┐
│  🗺️ PETA LIVE TRACKING                              │
│                                                      │
│    🚛 B1234ABC  (45 km/h) ─── Online                │
│         ↓                                            │
│                                                      │
│              🚛 B5678XYZ  (30 km/h) ─── Online      │
│                   ↓                                  │
│                                                      │
│    🚛 B9012DEF  (0 km/h) ─── Idle                   │
│         ↓                                            │
│                                                      │
│         Update otomatis setiap 10 detik              │
└──────────────────────────────────────────────────────┘
```

---

**Dokumentasi ini menjelaskan Live Tracking dari awal sampai akhir dengan bahasa sederhana!** 🎉

Untuk file lengkap, lihat:

- `src/pages/LiveTracking.jsx` - Halaman utama
- `src/services/api/trucks.api.js` - API module
- `src/components/dashboard/BaseTrackingMap.jsx` - Komponen peta
