# 📊 Panduan Menampilkan Data dari Backend ke UI

## 🎯 Overview

Panduan lengkap cara mengambil data dari Backend API dan menampilkannya di User Interface (UI) menggunakan React.

---

## 🏗️ Arsitektur Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐                                            │
│  │   UI Component   │  ← Tampilan data ke user                  │
│  │  (TrucksList.jsx)│                                            │
│  └────────┬─────────┘                                            │
│           │                                                       │
│           │ 1. Panggil Hook                                      │
│           ↓                                                       │
│  ┌──────────────────┐                                            │
│  │  Custom Hook     │  ← State management & logic               │
│  │  (useApi2.js)    │                                            │
│  └────────┬─────────┘                                            │
│           │                                                       │
│           │ 2. Gunakan API Service                               │
│           ↓                                                       │
│  ┌──────────────────┐                                            │
│  │  API Service     │  ← HTTP request functions                 │
│  │  (trucks.api.js) │                                            │
│  └────────┬─────────┘                                            │
│           │                                                       │
│           │ 3. Request via Axios                                 │
│           ↓                                                       │
│  ┌──────────────────┐                                            │
│  │  Axios Instance  │  ← HTTP client with interceptors          │
│  │  (config.js)     │     - Add auth token                      │
│  └────────┬─────────┘     - Handle errors                       │
│           │                 - Format response                    │
└───────────┼─────────────────────────────────────────────────────┘
            │
            │ 4. HTTP Request
            ↓
┌───────────────────────────────────────────────────────────────────┐
│                      INTERNET                                      │
└───────────────────────────────────────────────────────────────────┘
            │
            │ 5. Response
            ↓
┌───────────────────────────────────────────────────────────────────┐
│                  BACKEND API SERVER                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Database   │  │   Business   │  │     API      │           │
│  │   (MySQL)    │←→│     Logic    │←→│   Endpoints  │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└───────────────────────────────────────────────────────────────────┘
```

---

## 📁 Struktur File

```
src/
├── services/
│   ├── api2/
│   │   ├── config.js           ← Axios instance & interceptors
│   │   ├── trucks.api.js       ← API functions untuk trucks
│   │   ├── drivers.api.js      ← API functions untuk drivers
│   │   └── index.js            ← Export semua API
│   │
├── hooks/
│   └── useApi2.js              ← Custom React Hooks
│
└── pages/
    └── listdata/
        └── TrucksList.jsx      ← UI Component
```

---

## 🔧 Langkah-langkah Detail

### **1️⃣ Konfigurasi Axios Instance** (`config.js`)

File ini mengatur koneksi ke backend dan menangani autentikasi.

```javascript
// src/services/api2/config.js
import axios from 'axios';

// Base URL dari environment variable
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Buat axios instance
const api2Instance = axios.create({
  baseURL: API_BASE_URL, // Base URL untuk semua request
  timeout: 30000, // Timeout 30 detik
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor - Tambahkan token ke setiap request
api2Instance.interceptors.request.use(
  (config) => {
    // Ambil token dari localStorage
    const token = localStorage.getItem('authToken');
    if (token) {
      // Tambahkan token ke header Authorization
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor - Handle errors globally
api2Instance.interceptors.response.use(
  (response) => {
    // Return data langsung jika sukses
    return response.data;
  },
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }

    // Parse error message
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';

    return Promise.reject({
      status: error.response?.status,
      message: errorMessage,
    });
  }
);

export default api2Instance;
```

**Penjelasan:**

- ✅ `baseURL`: URL dasar backend API
- ✅ `interceptors.request`: Menambahkan JWT token otomatis ke setiap request
- ✅ `interceptors.response`: Menangani error secara global dan redirect jika unauthorized

---

### **2️⃣ Definisi API Service** (`trucks.api.js`)

File ini berisi semua fungsi untuk mengakses endpoint trucks.

```javascript
// src/services/api2/trucks.api.js
import api2Instance from './config';

export const trucksApi = {
  /**
   * GET /trucks - Ambil semua trucks dengan filter
   * @param {Object} params - { page, limit, status, search }
   * @returns {Promise} - Response dari backend
   */
  getAll: async (params = {}) => {
    try {
      // Buat query parameters
      const queryParams = new URLSearchParams();

      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.status) queryParams.append('status', params.status);
      if (params.search) queryParams.append('search', params.search);

      // Build URL dengan query string
      const queryString = queryParams.toString();
      const url = queryString ? `/trucks?${queryString}` : '/trucks';

      console.log('🚛 Fetching trucks from:', url);

      // Panggil API
      const response = await api2Instance.get(url);

      console.log('✅ Trucks loaded:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to load trucks:', error);
      throw error;
    }
  },

  /**
   * GET /trucks/:id - Ambil truck berdasarkan ID
   */
  getById: async (truckId) => {
    const response = await api2Instance.get(`/trucks/${truckId}`);
    return response;
  },

  /**
   * POST /trucks - Buat truck baru
   */
  create: async (truckData) => {
    const response = await api2Instance.post('/trucks', truckData);
    return response;
  },

  /**
   * PUT /trucks/:id - Update truck
   */
  update: async (truckId, truckData) => {
    const response = await api2Instance.put(`/trucks/${truckId}`, truckData);
    return response;
  },

  /**
   * DELETE /trucks/:id - Hapus truck
   */
  delete: async (truckId) => {
    const response = await api2Instance.delete(`/trucks/${truckId}`);
    return response;
  },
};

export default trucksApi;
```

**Penjelasan:**

- ✅ Setiap fungsi mewakili satu endpoint API
- ✅ Menggunakan `async/await` untuk asynchronous operations
- ✅ Parameter query dibangun dengan `URLSearchParams`
- ✅ Error handling dengan try-catch

---

### **3️⃣ Custom React Hook** (`useApi2.js`)

Hook ini mempermudah penggunaan API dalam komponen React.

```javascript
// src/hooks/useApi2.js
import { useState, useEffect, useCallback } from 'react';
import { trucksApi } from '../services/api2';

/**
 * Custom Hook untuk fetch trucks dengan auto-loading state
 * @param {Object} filters - Filter parameters
 * @returns {Object} - { trucks, loading, error, refetch }
 */
export const useTrucks = (filters = {}) => {
  // State management
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch function dengan useCallback untuk mencegah re-render berlebihan
  const fetchTrucks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Panggil API
      const response = await trucksApi.getAll(filters);

      // Update state dengan data dari response
      setTrucks(response.data?.trucks || []);
    } catch (err) {
      // Set error jika gagal
      setError(err.message || 'Failed to fetch trucks');
      console.error('Error fetching trucks:', err);
    } finally {
      // Set loading false setelah selesai (berhasil/gagal)
      setLoading(false);
    }
  }, [filters]);

  // Auto-fetch saat component mount atau filters berubah
  useEffect(() => {
    fetchTrucks();
  }, [fetchTrucks]);

  // Return state dan function
  return {
    trucks, // Data trucks
    loading, // Status loading
    error, // Error message (jika ada)
    refetch: fetchTrucks, // Function untuk refresh data
  };
};
```

**Penjelasan:**

- ✅ `useState`: Menyimpan data, loading state, dan error
- ✅ `useCallback`: Mencegah re-creation function yang tidak perlu
- ✅ `useEffect`: Auto-fetch data saat component mount
- ✅ Return object dengan data dan helper functions

---

### **4️⃣ Implementasi di UI Component** (`TrucksList.jsx`)

Component ini menampilkan data trucks dalam bentuk tabel.

```jsx
// src/pages/listdata/TrucksList.jsx
import React from 'react';
import { trucksApi } from '../../services/api2';

const TrucksList = () => {
  // State untuk menyimpan data
  const [trucks, setTrucks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  // State untuk filter
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');

  // Function untuk load data
  const loadTrucks = React.useCallback(async () => {
    try {
      setLoading(true);
      console.log('📡 Loading trucks...');

      // Panggil API dengan filter
      const response = await trucksApi.getAll({
        search: searchQuery,
        status: statusFilter,
        limit: 50,
      });

      console.log('✅ Response:', response);

      // Extract data dari response
      const trucksData = response?.data?.trucks || [];

      // Update state
      setTrucks(trucksData);
      setError('');
    } catch (error) {
      console.error('❌ Failed to load trucks:', error);
      setError(error.message || 'Failed to load trucks');
      setTrucks([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  // Auto-load saat component mount atau filter berubah
  React.useEffect(() => {
    loadTrucks();
  }, [loadTrucks]);

  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="ml-4">Loading trucks...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
        <button onClick={loadTrucks} className="mt-2 px-4 py-2 bg-red-600 text-white rounded">
          Retry
        </button>
      </div>
    );
  }

  // Render data
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Trucks List</h1>

      {/* Filters */}
      <div className="mb-4 flex gap-4">
        <input
          type="text"
          placeholder="Search trucks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 border rounded"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="maintenance">Maintenance</option>
          <option value="idle">Idle</option>
        </select>
      </div>

      {/* Table */}
      <table className="min-w-full border">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 border">No</th>
            <th className="px-4 py-2 border">Name</th>
            <th className="px-4 py-2 border">Plate</th>
            <th className="px-4 py-2 border">Status</th>
            <th className="px-4 py-2 border">Vendor</th>
          </tr>
        </thead>
        <tbody>
          {trucks.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center py-8 text-gray-500">
                No trucks found
              </td>
            </tr>
          ) : (
            trucks.map((truck, index) => (
              <tr key={truck.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border">{index + 1}</td>
                <td className="px-4 py-2 border">{truck.name}</td>
                <td className="px-4 py-2 border">{truck.plate}</td>
                <td className="px-4 py-2 border">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      truck.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {truck.status}
                  </span>
                </td>
                <td className="px-4 py-2 border">{truck.vendor_name}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Info */}
      <div className="mt-4 text-sm text-gray-600">Total: {trucks.length} trucks</div>
    </div>
  );
};

export default TrucksList;
```

---

## 🎨 Alternatif: Menggunakan Custom Hook

Cara yang lebih sederhana dengan menggunakan custom hook:

```jsx
// Versi dengan Custom Hook
import React from 'react';
import { useTrucks } from '../../hooks/useApi2';

const TrucksListSimple = () => {
  const [filters, setFilters] = React.useState({
    search: '',
    status: '',
  });

  // Gunakan custom hook - lebih simple!
  const { trucks, loading, error, refetch } = useTrucks(filters);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Trucks List</h1>

      {/* Filter */}
      <input
        placeholder="Search..."
        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
      />

      {/* Display */}
      {trucks.map((truck) => (
        <div key={truck.id}>
          {truck.name} - {truck.status}
        </div>
      ))}

      {/* Refresh button */}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
};
```

---

## 🔄 Flow Diagram Detail

### **GET Request Flow:**

```
Component
    │
    ├─→ 1. Call Hook/API
    │      useTrucks() atau trucksApi.getAll()
    │
    ↓
API Service (trucks.api.js)
    │
    ├─→ 2. Build URL & Parameters
    │      /trucks?page=1&limit=10&status=active
    │
    ↓
Axios Instance (config.js)
    │
    ├─→ 3. Add Auth Token (Interceptor)
    │      Headers: { Authorization: "Bearer xxx" }
    │
    ├─→ 4. Send HTTP GET Request
    │
    ↓
Backend API
    │
    ├─→ 5. Process Request
    │      - Validate token
    │      - Query database
    │      - Format response
    │
    ├─→ 6. Send Response
    │      {
    │        success: true,
    │        data: {
    │          trucks: [...],
    │          pagination: {...}
    │        }
    │      }
    │
    ↓
Axios Instance
    │
    ├─→ 7. Response Interceptor
    │      - Extract data
    │      - Handle errors
    │
    ↓
API Service
    │
    ├─→ 8. Return Promise
    │
    ↓
Component
    │
    ├─→ 9. Update State
    │      setTrucks(response.data.trucks)
    │
    ├─→ 10. Re-render UI
    │      Display data in table/list
```

---

## 💡 Best Practices

### ✅ **DO's:**

1. **Gunakan try-catch untuk error handling**

   ```javascript
   try {
     const data = await trucksApi.getAll();
   } catch (error) {
     console.error('Error:', error);
     setError(error.message);
   }
   ```

2. **Tampilkan loading state**

   ```jsx
   {
     loading && <div>Loading...</div>;
   }
   {
     !loading && <DataTable />;
   }
   ```

3. **Validasi response data**

   ```javascript
   const trucks = response?.data?.trucks || [];
   ```

4. **Gunakan useCallback untuk optimize**

   ```javascript
   const fetchData = useCallback(async () => {
     // fetch logic
   }, [dependencies]);
   ```

5. **Cleanup pada unmount**

   ```javascript
   useEffect(() => {
     let cancelled = false;

     fetchData().then((data) => {
       if (!cancelled) setData(data);
     });

     return () => {
       cancelled = true;
     };
   }, []);
   ```

### ❌ **DON'Ts:**

1. **Jangan panggil API di render function**

   ```javascript
   // ❌ WRONG
   function Component() {
     trucksApi.getAll(); // Infinite loop!
     return <div>...</div>;
   }
   ```

2. **Jangan hardcode URLs**

   ```javascript
   // ❌ WRONG
   axios.get('http://localhost:3000/trucks');

   // ✅ CORRECT
   api2Instance.get('/trucks');
   ```

3. **Jangan abaikan error handling**

   ```javascript
   // ❌ WRONG
   const data = await trucksApi.getAll();
   setTrucks(data.trucks); // Crash jika error!

   // ✅ CORRECT
   try {
     const data = await trucksApi.getAll();
     setTrucks(data?.trucks || []);
   } catch (error) {
     handleError(error);
   }
   ```

---

## 🧪 Testing di Console

Test API di browser console:

```javascript
// 1. Import API
import { trucksApi } from './services/api2';

// 2. Test get all
trucksApi
  .getAll()
  .then((data) => console.log('Trucks:', data))
  .catch((err) => console.error('Error:', err));

// 3. Test dengan filter
trucksApi
  .getAll({ status: 'active', limit: 10 })
  .then((data) => console.log('Active Trucks:', data));

// 4. Test get by ID
trucksApi.getById('truck-123').then((data) => console.log('Truck Detail:', data));
```

---

## 🔍 Debugging Tips

### 1. **Periksa Network Tab**

- Buka DevTools → Network
- Lihat request URL, headers, dan response

### 2. **Tambahkan Console Logs**

```javascript
console.log('📡 Request:', url, params);
console.log('✅ Response:', response);
console.log('❌ Error:', error);
```

### 3. **Cek Response Structure**

```javascript
console.log('Response structure:', {
  success: response.success,
  data: response.data,
  pagination: response.data?.pagination,
});
```

### 4. **Validasi Environment Variables**

```javascript
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
console.log('Token:', localStorage.getItem('authToken'));
```

---

## 📊 Response Format Contoh

### Success Response:

```json
{
  "success": true,
  "data": {
    "trucks": [
      {
        "id": "truck-001",
        "name": "Dump Truck 01",
        "plate": "KT 1234 AB",
        "status": "active",
        "vendor_id": "vendor-001",
        "vendor_name": "PT Vendor A",
        "year": 2022,
        "model": "HD785-7",
        "type": "Dump Truck"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

### Error Response:

```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

---

## 🎯 Kesimpulan

**Alur Lengkap:**

1. **Component** → Panggil hook/API
2. **Hook** → Manage state & lifecycle
3. **API Service** → Build request & call axios
4. **Axios Config** → Add token & send HTTP request
5. **Backend** → Process & return data
6. **Interceptor** → Handle response/error
7. **Hook** → Update state
8. **Component** → Re-render dengan data baru

**Key Points:**

- ✅ Gunakan axios instance untuk konsistensi
- ✅ Manfaatkan custom hooks untuk reusability
- ✅ Handle loading, error, dan success states
- ✅ Validasi data sebelum digunakan
- ✅ Optimize dengan useCallback & useMemo

---

## 📚 Resources

- [Axios Documentation](https://axios-http.com/)
- [React Hooks Documentation](https://react.dev/reference/react)
- [React Query (Alternative)](https://tanstack.com/query)

---

**Happy Coding! 🚀**
