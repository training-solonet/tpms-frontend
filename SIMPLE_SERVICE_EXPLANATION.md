# 🍼 Penjelasan Service Layer dengan Bahasa Bayi

## 🎯 Analogi Sederhana: Restoran

Bayangkan aplikasi kita seperti restoran:

```
👨‍🍳 RESTORAN TPMS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. PELAYAN (Component - Devices.jsx)
   └─ Tugasnya: Terima pesanan dari pelanggan (user)
   └─ Contoh: "Pak, saya mau lihat daftar semua device"

2. KASIR (Service - devicesApi)
   └─ Tugasnya: Catat pesanan dan kirim ke dapur
   └─ Contoh: "Baik, saya catat pesanan Bapak dan saya kirim ke dapur"

3. DAPUR (Backend Server)
   └─ Tugasnya: Masak makanan (proses data dari database)
   └─ Contoh: "Oke, saya ambil data device dari database"

4. MAKANAN JADI (Response Data)
   └─ Dapur kirim makanan → Kasir → Pelayan → Pelanggan
   └─ Contoh: "Ini Pak, daftar devicenya sudah jadi!"
```

---

## 📁 Penjelasan Setiap File (Bahasa Bayi Mode ON 👶)

### 1️⃣ **File: `config.js`**

**Lokasi:** `src/services/management/config.js`

#### 🤔 Apa itu?

Ini seperti **nomor telepon restoran** dan **kartu anggota**.

#### 👶 Penjelasan Bayi:

```
Kamu tahu kan kalau mau pesan makanan lewat telepon?
Nah, file ini tugasnya:

1. Simpan nomor telepon dapur (Backend URL)
   📞 "https://be-tpms.connectis.my.id/api"

2. Selalu bawa kartu member (JWT Token) setiap telepon
   🎫 "Authorization: Bearer eyJhbGc..."

3. Kalau dapur bilang "Kamu bukan member!" (401 Error)
   👉 Langsung paksa logout dan suruh login lagi!
```

#### 📝 Kode Sederhana:

```javascript
// Nomor telepon dapur
const nomorTeleponDapur = 'https://be-tpms.connectis.my.id/api';

// Bikin alat telepon khusus
const telepon = axios.create({
  baseURL: nomorTeleponDapur,
});

// SEBELUM nelpon (Request Interceptor)
telepon.interceptors.request.use((config) => {
  // Ambil kartu member dari dompet
  const kartuMember = localStorage.getItem('authToken');

  // Tempel kartu member di pesanan
  if (kartuMember) {
    config.headers.Authorization = `Bearer ${kartuMember}`;
  }

  return config;
});

// SETELAH dapet jawaban (Response Interceptor)
telepon.interceptors.response.use(
  (response) => {
    // Kalau sukses, ambil makanannya aja
    return response.data;
  },
  (error) => {
    // Kalau ditolak karena bukan member (401)
    if (error.response?.status === 401) {
      // Buang kartu member dan suruh login lagi
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);
```

#### ✨ Kesimpulan:

- 📞 **Nomor telepon dapur** → API Base URL
- 🎫 **Kartu member** → JWT Token
- 📋 **Sebelum telepon** → Tempel kartu member (Request Interceptor)
- 📦 **Setelah terima makanan** → Buka kotak, cek isi (Response Interceptor)

---

### 2️⃣ **File: `devices.api.js`**

**Lokasi:** `src/services/management/modules/iot/devices.api.js`

#### 🤔 Apa itu?

Ini seperti **menu makanan khusus device**.

#### 👶 Penjelasan Bayi:

```
Ini tuh kayak menu di restoran yang khusus jual makanan device:

📖 MENU DEVICE:
1. getAll()    → "Saya mau lihat SEMUA device"       (GET)
2. getById()   → "Saya mau lihat device nomor 5"     (GET)
3. create()    → "Saya mau bikin device BARU"        (POST)
4. update()    → "Saya mau ubah device nomor 5"      (PUT)
5. delete()    → "Saya mau hapus device nomor 5"     (DELETE)

Tiap menu punya resep (function) sendiri!
```

#### 📝 Kode Sederhana:

```javascript
// Import telepon dari config.js
import telepon from '../../config';

// Daftar menu device
export const devicesApi = {
  // MENU 1: Minta semua device
  getAll: async (filter) => {
    // Bikin daftar pesanan
    let pesanan = '/iot/devices';

    // Kalau mau filter, tambahin di pesanan
    if (filter.status === 'active') {
      pesanan = '/iot/devices?status=active';
    }

    // Telepon dapur, minta device
    const jawaban = await telepon.get(pesanan);

    // Kembalikan jawabannya
    return jawaban;
  },

  // MENU 2: Minta 1 device aja
  getById: async (id) => {
    // Telepon: "Pak, mau device nomor berapa?"
    const jawaban = await telepon.get(`/iot/devices/${id}`);
    return jawaban;
  },

  // MENU 3: Bikin device baru
  create: async (dataBaru) => {
    // Siapkan data yang mau dikirim
    const paket = {
      sn: dataBaru.sn,
      truck_id: dataBaru.truck_id,
      sim_number: dataBaru.sim_number,
      status: 'active',
    };

    // Telepon: "Pak, tolong bikin device baru ya"
    const jawaban = await telepon.post('/iot/devices', paket);
    return jawaban;
  },

  // MENU 4: Ubah device yang sudah ada
  update: async (id, dataUpdate) => {
    // Siapkan data yang mau diubah
    const paket = {
      sim_number: dataUpdate.sim_number,
      status: dataUpdate.status,
    };

    // Telepon: "Pak, tolong ubah device nomor X ya"
    const jawaban = await telepon.put(`/iot/devices/${id}`, paket);
    return jawaban;
  },

  // MENU 5: Hapus device
  delete: async (id) => {
    // Telepon: "Pak, tolong hapus device nomor X ya"
    const jawaban = await telepon.delete(`/iot/devices/${id}`);
    return jawaban;
  },
};
```

#### ✨ Kesimpulan:

- 📖 **File ini = Menu restoran**
- 🍕 **Setiap function = 1 menu makanan**
- 📞 **Pakai telepon (axios) untuk pesan ke dapur**
- 📦 **Dapat jawaban, kasih ke pelayan (component)**

---

### 3️⃣ **File: `modules/index.js`**

**Lokasi:** `src/services/management/modules/index.js`

#### 🤔 Apa itu?

Ini seperti **daftar semua menu** di 1 tempat.

#### 👶 Penjelasan Bayi:

```
Bayangin kamu di restoran besar yang jual macam-macam:
- Menu Device  (devices.api.js)
- Menu Truck   (trucks.api.js)
- Menu Driver  (drivers.api.js)
- Menu Sensor  (sensors.api.js)

Daripada bawa 4 buku menu, mending digabung jadi 1 buku besar!

Nah file ini fungsinya: GABUNGIN SEMUA MENU!
```

#### 📝 Kode Sederhana:

```javascript
// KUMPULIN SEMUA MENU

// Menu Device
export { devicesApi } from './iot/devices.api.js';

// Menu Sensor
export { sensorsApi } from './iot/sensors.api.js';

// Menu Truck
export { trucksApi } from './fleet/trucks.api.js';

// Menu Driver
export { driversApi } from './fleet/drivers.api.js';

// Menu Vendor
export { vendorsApi } from './fleet/vendors.api.js';

// Menu Dashboard
export { dashboardApi } from './monitoring/dashboard.api.js';

// Menu Login
export { authApi } from './auth/auth.api.js';
```

#### ✨ Kesimpulan:

- 📚 **File ini = Buku menu besar**
- 📖 **Gabungin semua menu kecil jadi 1**
- 🎯 **Biar gampang, tinggal buka 1 buku aja**

---

### 4️⃣ **File: `management/index.js`**

**Lokasi:** `src/services/management/index.js`

#### 🤔 Apa itu?

Ini seperti **pintu masuk restoran**.

#### 👶 Penjelasan Bayi:

```
Kamu kan gak bisa langsung masuk ke dapur atau ke kasir.
Harus lewat PINTU DEPAN dulu!

Nah file ini = PINTU DEPAN restoran!

Dari pintu ini, kamu bisa:
1. Lihat semua menu (modules)
2. Ambil nomor telepon dapur (config)
3. Akses WiFi restoran (websocket)
```

#### 📝 Kode Sederhana:

```javascript
// PINTU DEPAN RESTORAN

// 1. Kasih akses ke SEMUA MENU
export * from './modules/index.js';
// Ini artinya: devicesApi, trucksApi, driversApi, dll bisa diakses dari sini

// 2. Kasih nomor telepon dapur (kalau ada yang butuh)
export { default as managementClient } from './config.js';

// 3. Kasih akses WiFi (WebSocket)
export { default as managementWebSocket } from './websocket.js';
```

#### ✨ Kesimpulan:

- 🚪 **File ini = Pintu depan restoran**
- 📖 **Kasih akses ke semua menu**
- 📞 **Kasih nomor telepon dapur**
- 📡 **Kasih WiFi restoran (WebSocket)**

---

### 5️⃣ **File: `services/index.js`**

**Lokasi:** `src/services/index.js`

#### 🤔 Apa itu?

Ini seperti **papan nama di depan mall** yang ada banyak restoran.

#### 👶 Penjelasan Bayi:

```
Bayangkan ada MALL yang isinya:
- Restoran Management (management/)
- Restoran Tracking (tracking/)
- Toko Utility (utils/)

File ini = PAPAN NAMA di depan mall!

Jadi kalau orang mau ke Restoran Management,
tinggal liat papan nama ini!
```

#### 📝 Kode Sederhana:

```javascript
// PAPAN NAMA MALL

// Restoran Management (Ada di lantai 1)
export * from './management/index.js';

// Restoran Tracking (Ada di lantai 2)
export * from './tracking/index.js';

// Toko Utility (Ada di lantai 3)
export * from './utils/index.js';
```

#### ✨ Kesimpulan:

- 🏬 **File ini = Papan nama mall**
- 🗺️ **Tunjukin semua restoran yang ada**
- 🎯 **Biar gampang cari mau ke mana**

---

## 🔄 Alur Kerja Lengkap (Step by Step)

### 📱 Contoh: User mau lihat daftar device

```
┌──────────────────────────────────────────────────────────────────┐
│  STEP 1: User klik menu "Devices"                                │
└──────────────────────────────────────────────────────────────────┘

User Browser
    │
    └─ Klik: Menu "Devices" di sidebar


┌──────────────────────────────────────────────────────────────────┐
│  STEP 2: React Router buka halaman Devices                       │
└──────────────────────────────────────────────────────────────────┘

React Router
    │
    └─ URL berubah: /devices
    └─ Buka component: Devices.jsx


┌──────────────────────────────────────────────────────────────────┐
│  STEP 3: Component import menu device                            │
└──────────────────────────────────────────────────────────────────┘

File: Devices.jsx (PELAYAN)
    │
    ├─ import { devicesApi } from 'services/management';
    │   │
    │   └─ Artinya: "Saya mau pinjam buku menu device"


┌──────────────────────────────────────────────────────────────────┐
│  STEP 4: Vite alias resolve                                      │
└──────────────────────────────────────────────────────────────────┘

Vite Config (vite.config.js)
    │
    ├─ 'services/management' → 'src/services/management/index.js'
    │                              │
    │                              └─ (PINTU DEPAN RESTORAN)


┌──────────────────────────────────────────────────────────────────┐
│  STEP 5: Pintu depan kasih akses ke menu                         │
└──────────────────────────────────────────────────────────────────┘

File: src/services/management/index.js (PINTU DEPAN)
    │
    ├─ export * from './modules/index.js';
    │                     │
    │                     └─ (BUKU MENU BESAR)


┌──────────────────────────────────────────────────────────────────┐
│  STEP 6: Buku menu besar kasih menu device                       │
└──────────────────────────────────────────────────────────────────┘

File: src/services/management/modules/index.js (BUKU MENU)
    │
    ├─ export { devicesApi } from './iot/devices.api.js';
    │                                    │
    │                                    └─ (MENU DEVICE)


┌──────────────────────────────────────────────────────────────────┐
│  STEP 7: Component panggil fungsi getAll                         │
└──────────────────────────────────────────────────────────────────┘

File: Devices.jsx (PELAYAN)
    │
    ├─ const fetchDevices = async () => {
    │     // Panggil kasir, minta data device
    │     const response = await devicesApi.getAll();
    │   };
    │
    └─ Artinya: "Pak kasir, saya mau daftar semua device dong!"


┌──────────────────────────────────────────────────────────────────┐
│  STEP 8: Menu device terima pesanan                              │
└──────────────────────────────────────────────────────────────────┘

File: devices.api.js (KASIR)
    │
    ├─ getAll: async () => {
    │     // Telepon dapur
    │     const response = await telepon.get('/iot/devices');
    │     return response;
    │   }
    │
    └─ Artinya: "Baik, saya catat dan saya telepon dapur!"


┌──────────────────────────────────────────────────────────────────┐
│  STEP 9: Telepon (Axios) siap-siap nelpon                       │
└──────────────────────────────────────────────────────────────────┘

File: config.js (TELEPON)
    │
    ├─ REQUEST INTERCEPTOR jalan:
    │   ├─ Ambil kartu member: localStorage.getItem('authToken')
    │   └─ Tempel di pesanan: Authorization: Bearer abc123...
    │
    └─ Artinya: "Sebelum telepon, tempel dulu kartu member!"


┌──────────────────────────────────────────────────────────────────┐
│  STEP 10: Telepon ke dapur (Backend)                            │
└──────────────────────────────────────────────────────────────────┘

HTTP Request dikirim:
    │
    ├─ GET https://be-tpms.connectis.my.id/api/iot/devices
    ├─ Header: Authorization: Bearer abc123...
    │
    └─ Artinya: "Halo dapur, saya mau daftar device ya!"


┌──────────────────────────────────────────────────────────────────┐
│  STEP 11: Dapur proses pesanan                                   │
└──────────────────────────────────────────────────────────────────┘

Backend Server (DAPUR)
    │
    ├─ Cek kartu member (JWT token)
    ├─ Ambil data dari database: SELECT * FROM devices
    ├─ Gabung data dengan truck dan sensor
    ├─ Masukin ke kotak (JSON)
    │
    └─ Artinya: "Oke, saya ambil dari database dulu ya!"


┌──────────────────────────────────────────────────────────────────┐
│  STEP 12: Dapur kirim makanan (Response)                         │
└──────────────────────────────────────────────────────────────────┘

HTTP Response:
    │
    ├─ Status: 200 OK
    ├─ Body: {
    │     "success": true,
    │     "data": {
    │       "devices": [
    │         { "id": 1, "sn": "DEV-001", ... },
    │         { "id": 2, "sn": "DEV-002", ... }
    │       ]
    │     }
    │   }
    │
    └─ Artinya: "Nih, makanannya udah jadi!"


┌──────────────────────────────────────────────────────────────────┐
│  STEP 13: Telepon terima jawaban                                 │
└──────────────────────────────────────────────────────────────────┘

File: config.js (TELEPON)
    │
    ├─ RESPONSE INTERCEPTOR jalan:
    │   ├─ Buka kotak makanan
    │   ├─ Ambil isi: response.data
    │   └─ Kasih ke kasir
    │
    └─ Artinya: "Makanan udah datang, saya buka kotaknya dulu!"


┌──────────────────────────────────────────────────────────────────┐
│  STEP 14: Kasir terima makanan                                   │
└──────────────────────────────────────────────────────────────────┘

File: devices.api.js (KASIR)
    │
    ├─ const response = await telepon.get('/iot/devices');
    ├─ Log: "✅ Devices data loaded: 2"
    ├─ return response;
    │
    └─ Artinya: "Makanan udah jadi, saya kasih ke pelayan!"


┌──────────────────────────────────────────────────────────────────┐
│  STEP 15: Pelayan terima makanan                                 │
└──────────────────────────────────────────────────────────────────┘

File: Devices.jsx (PELAYAN)
    │
    ├─ const response = await devicesApi.getAll();
    ├─ const devices = response.data.devices;
    ├─ setDevices(devices); // Simpan di piring
    │
    └─ Artinya: "Terima kasih kasir, saya taruh di piring ya!"


┌──────────────────────────────────────────────────────────────────┐
│  STEP 16: React render ulang                                     │
└──────────────────────────────────────────────────────────────────┘

React Component
    │
    ├─ State berubah: devices = [DEV-001, DEV-002]
    ├─ Component render ulang
    ├─ Loop data: devices.map((device) => ...)
    │
    └─ Artinya: "Data udah ada, saya tampilkan di layar!"


┌──────────────────────────────────────────────────────────────────┐
│  STEP 17: User lihat data di layar                               │
└──────────────────────────────────────────────────────────────────┘

Browser
    │
    ├─ Tabel muncul dengan 2 device:
    │   │
    │   ├─ Device 1: DEV-001
    │   └─ Device 2: DEV-002
    │
    └─ Artinya: "Ini pak, pesanan Bapak sudah jadi! 🎉"
```

---

## 🎨 Diagram Visual Simpel

```
┌─────────────────────────────────────────────────────────────────┐
│                    ANALOGI RESTORAN                             │
└─────────────────────────────────────────────────────────────────┘

1. USER (Pelanggan)
      │
      │ "Saya mau lihat daftar device"
      ▼
2. DEVICES.JSX (Pelayan)
      │
      │ import devicesApi
      ▼
3. services/index.js (PINTU DEPAN MALL)
      │
      │ export * from management
      ▼
4. management/index.js (PINTU DEPAN RESTORAN)
      │
      │ export * from modules
      ▼
5. modules/index.js (BUKU MENU BESAR)
      │
      │ export devicesApi
      ▼
6. devices.api.js (KASIR - MENU DEVICE)
      │
      │ devicesApi.getAll()
      │ "Oke, saya catat pesanan!"
      ▼
7. config.js (TELEPON)
      │
      │ Axios Request Interceptor
      │ "Tempel kartu member dulu!"
      │
      │ axios.get(url)
      │ "Halo dapur, pesan ya!"
      ▼
8. BACKEND (DAPUR)
      │
      │ "Saya ambil dari database!"
      │ SELECT * FROM devices
      │
      │ "Makanan jadi!"
      ▼
9. config.js (TELEPON)
      │
      │ Axios Response Interceptor
      │ "Buka kotak makanan!"
      ▼
10. devices.api.js (KASIR)
      │
      │ "Terima makanan dari dapur!"
      │ return response
      ▼
11. DEVICES.JSX (PELAYAN)
      │
      │ "Terima makanan dari kasir!"
      │ setDevices(response.data.devices)
      ▼
12. REACT RENDER
      │
      │ "Tampilkan di piring!"
      │ devices.map(...)
      ▼
13. USER (Pelanggan)
      │
      │ "Wah, makanan udah datang! 🎉"
      └─ Lihat tabel device di layar
```

---

## 📝 Ringkasan Super Simpel

### **Setiap File Tugasnya:**

| File                  | Analogi                   | Tugas                              | Bahasa Bayi                                           |
| --------------------- | ------------------------- | ---------------------------------- | ----------------------------------------------------- |
| `config.js`           | 📞 Telepon + Kartu Member | Bikin Axios instance, tempel token | "Ini nomor telepon dapur + kartu member kita!"        |
| `devices.api.js`      | 📖 Menu Device            | Semua fungsi CRUD device           | "Ini menu khusus device: lihat, tambah, ubah, hapus!" |
| `modules/index.js`    | 📚 Buku Menu Besar        | Gabungin semua menu                | "Ini buku yang isinya SEMUA menu!"                    |
| `management/index.js` | 🚪 Pintu Depan Restoran   | Kasih akses ke menu                | "Ini pintu masuk restoran!"                           |
| `services/index.js`   | 🏬 Papan Nama Mall        | Tunjukin semua restoran            | "Ini papan nama di depan mall!"                       |

### **Alur Kerja:**

1. 👤 **User** klik → "Mau lihat device"
2. 📄 **Component** → "Oke, saya panggil kasir"
3. 🚪 **Pintu depan** → "Silakan masuk"
4. 📚 **Buku menu** → "Ini halaman menu device"
5. 📖 **Menu device** → "Pilih mau yang mana?"
6. 💼 **Kasir** → "Oke, saya telepon dapur"
7. 📞 **Telepon** → "Tempel kartu member, telepon dapur"
8. 🍳 **Dapur** → "Oke, saya masak (ambil dari database)"
9. 📦 **Makanan jadi** → "Kirim balik lewat telepon"
10. 📞 **Telepon** → "Buka kotak, kasih ke kasir"
11. 💼 **Kasir** → "Terima, kasih ke pelayan"
12. 📄 **Component** → "Terima, tampilkan ke user"
13. 👤 **User** → "Wah, datanya udah muncul! 🎉"

---

## 🎯 Kenapa Dipisah-pisah?

### ❌ **Kalau Gak Dipisah (Buruk):**

```javascript
// Semua di 1 file component - RIBETTT!
const Devices = () => {
  const fetchDevices = async () => {
    // Ambil token
    const token = localStorage.getItem('authToken');

    // Bikin URL
    const url = 'https://be-tpms.connectis.my.id/api/iot/devices';

    // Telepon backend
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Cek error
    if (response.status === 401) {
      // Logout
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }

    // Ambil data
    const devices = response.data.data.devices;
    setDevices(devices);
  };
};
```

**Masalah:**

- 😵 Ribet banget!
- 😫 Kalau mau pakai di component lain, harus copy-paste!
- 😱 Kalau URL berubah, harus ubah di semua tempat!

### ✅ **Kalau Dipisah (Bagus):**

```javascript
// Component cuma fokus tampilan
const Devices = () => {
  const fetchDevices = async () => {
    const response = await devicesApi.getAll();
    setDevices(response.data.devices);
  };
};
```

**Keuntungan:**

- 😊 Simpel dan bersih!
- 🎉 Bisa dipake di component lain tinggal import!
- 🚀 Kalau URL berubah, cuma ubah 1 file!

---

## 💡 Kesimpulan Akhir

```
┌──────────────────────────────────────────────────────────────┐
│  INTINYA:                                                     │
│                                                               │
│  Service layer = KASIR & TELEPON di restoran                 │
│  Component = PELAYAN yang terima pesanan customer            │
│  Backend = DAPUR yang masak makanan                          │
│                                                               │
│  Setiap orang punya tugas sendiri, jadi gak ribet!          │
└──────────────────────────────────────────────────────────────┘
```

**Jadi inget:**

- 📞 `config.js` = Telepon + kartu member
- 📖 `*.api.js` = Menu makanan
- 📚 `index.js` = Buku menu / pintu depan
- 📄 Component = Pelayan
- 🍳 Backend = Dapur

Mudah kan? 👶🍼
