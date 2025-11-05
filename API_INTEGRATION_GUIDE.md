# API Integration Guide - Frontend Integration

**Last Updated:** November 4, 2025  
**Version:** 2.0  
**Branch:** rendhi-develop-tpms

## 🎯 Overview

This document provides comprehensive guidance for frontend developers integrating with the TPMS Backend API after the November 2025 update. All endpoints now use **INTEGER IDs** instead of UUID format.

---

## 🔄 Breaking Changes (November 2025 Update)

### **CRITICAL: ID Format Changed**

❌ **OLD (Before Update):**

```javascript
// UUID format
const truckId = '550e8400-e29b-41d4-a716-446655440000';
```

✅ **NEW (After Update):**

```javascript
// Integer format
const truckId = 1; // or "1" as string
```

### **Affected Resources:**

- ✅ Trucks: `id` is now `Int`
- ✅ Devices: `id` is now `Int`
- ✅ Sensors: `id` is now `Int`
- ✅ Vendors: `id` is now `Int`
- ✅ Drivers: `id` is now `Int`
- ✅ Mining Areas: `zoneId` is now `Int`

---

## 🔐 Authentication

All protected endpoints require Bearer token authentication.

### Login Example

```javascript
// POST /api/auth/login
const response = await fetch('https://be-tpms.connectis.my.id/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'admin@tpms.com',
    password: 'your_password',
  }),
});

const data = await response.json();
const token = data.token;

// Store token for subsequent requests
localStorage.setItem('authToken', token);
```

### Using Token in Requests

```javascript
const token = localStorage.getItem('authToken');

const response = await fetch('https://be-tpms.connectis.my.id/api/trucks', {
  method: 'GET',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

---

## 📋 API Endpoints Reference

### Base URL

```
Production: https://be-tpms.connectis.my.id
```

---

## 🚚 TRUCKS API

### 1. Get All Trucks

```javascript
// GET /api/trucks?page=1&limit=10
const response = await fetch('https://be-tpms.connectis.my.id/api/trucks?page=1&limit=10', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const data = await response.json();
// Response:
// {
//   success: true,
//   data: {
//     trucks: [...],
//     pagination: { total, page, limit, totalPages }
//   }
// }
```

### 2. Get Truck by ID

```javascript
// GET /api/trucks/:id
const truckId = 1; // INTEGER ID
const response = await fetch(`https://be-tpms.connectis.my.id/api/trucks/${truckId}`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const data = await response.json();
// Response:
// {
//   success: true,
//   data: {
//     id: 1,
//     name: "Truck A",
//     plate: "B1234XYZ",
//     vin: "ABC123456",
//     status: "active",
//     vendor_id: 5,
//     driver_id: 10,
//     ...
//   }
// }
```

### 3. Create Truck

```javascript
// POST /api/trucks
const formData = new FormData();
formData.append('name', 'Truck New');
formData.append('plate', 'B9999XYZ');
formData.append('vin', 'VIN12345678901234');
formData.append('model', 'Dump Truck HD');
formData.append('type', 'Heavy Duty');
formData.append('year', '2024');
formData.append('vendor_id', '5'); // INTEGER
formData.append('driver_id', '10'); // INTEGER
formData.append('status', 'active');
// Optional: formData.append('image', fileInput.files[0]);

const response = await fetch('https://be-tpms.connectis.my.id/api/trucks', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});

const data = await response.json();
// Response:
// {
//   success: true,
//   message: "Truck created successfully",
//   data: { id: 15, name: "Truck New", ... }
// }
```

### 4. Update Truck

```javascript
// PUT /api/trucks/:id
const truckId = 1; // INTEGER ID
const formData = new FormData();
formData.append('name', 'Updated Truck Name');
formData.append('status', 'maintenance');
// Add other fields as needed

const response = await fetch(`https://be-tpms.connectis.my.id/api/trucks/${truckId}`, {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});
```

### 5. Delete Truck

```javascript
// DELETE /api/trucks/:id
const truckId = 1; // INTEGER ID
const response = await fetch(`https://be-tpms.connectis.my.id/api/trucks/${truckId}`, {
  method: 'DELETE',
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const data = await response.json();
// Response:
// {
//   success: true,
//   message: "Truck deleted successfully"
// }
```

### 6. Get Truck Tire Pressures

```javascript
// GET /api/trucks/:id/tires
const truckId = 1; // INTEGER ID
const response = await fetch(`https://be-tpms.connectis.my.id/api/trucks/${truckId}/tires`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const data = await response.json();
// Response:
// {
//   success: true,
//   data: {
//     truck_id: 1,
//     truck_name: "Truck A",
//     device: { id: 5, sn: "DEV001" },
//     sensors: [
//       { tireNo: 1, tirepValue: 35.5, tempValue: 45.2, status: "normal" },
//       { tireNo: 2, tirepValue: 34.8, tempValue: 44.5, status: "normal" },
//       ...
//     ]
//   }
// }
```

### 7. Update Truck Status

```javascript
// PUT /api/trucks/:id/status
const truckId = 1; // INTEGER ID
const response = await fetch(`https://be-tpms.connectis.my.id/api/trucks/${truckId}/status`, {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    status: 'inactive', // active | inactive | maintenance
  }),
});
```

### 8. Get Truck Location History

```javascript
// GET /api/trucks/:id/history?startDate=2025-01-01&endDate=2025-01-31
const truckId = 1; // INTEGER ID
const response = await fetch(
  `https://be-tpms.connectis.my.id/api/trucks/${truckId}/history?startDate=2025-01-01&endDate=2025-01-31`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

const data = await response.json();
// Response:
// {
//   success: true,
//   data: [
//     { lat: -6.2088, long: 106.8456, recorded_at: "2025-01-01T10:00:00Z" },
//     ...
//   ]
// }
```

### 9. Get Truck Alerts

```javascript
// GET /api/trucks/:id/alerts
const truckId = 1; // INTEGER ID
const response = await fetch(`https://be-tpms.connectis.my.id/api/trucks/${truckId}/alerts`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const data = await response.json();
// Response:
// {
//   success: true,
//   data: [
//     {
//       id: 100,
//       alert_code: "TIRE_PRESSURE_LOW",
//       message: "Low tire pressure detected",
//       severity: "warning",
//       status: "active",
//       created_at: "2025-11-04T10:00:00Z"
//     },
//     ...
//   ]
// }
```

---

## 📟 DEVICES API

### 1. Get All Devices

```javascript
// GET /api/devices?page=1&limit=10
const response = await fetch('https://be-tpms.connectis.my.id/api/devices?page=1&limit=10', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

### 2. Get Device by ID

```javascript
// GET /api/devices/:deviceId
const deviceId = 1; // INTEGER ID
const response = await fetch(`https://be-tpms.connectis.my.id/api/devices/${deviceId}`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const data = await response.json();
// Response:
// {
//   success: true,
//   data: {
//     id: 1,
//     sn: "DEV001",
//     truck_id: 5,
//     sim_number: "081234567890",
//     bat1: 95,
//     bat2: 92,
//     bat3: 90,
//     status: "active",
//     sensor: [
//       { id: 1, tireNo: 1, tirepValue: 35.5, ... },
//       ...
//     ]
//   }
// }
```

### 3. Create Device

```javascript
// POST /api/devices
const response = await fetch('https://be-tpms.connectis.my.id/api/devices', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    truck_id: 5, // INTEGER
    sn: 'DEV999',
    sim_number: '081234567890',
  }),
});

const data = await response.json();
// Response:
// {
//   success: true,
//   message: "Device created successfully",
//   data: { id: 20, sn: "DEV999", ... }
// }
```

### 4. Update Device

```javascript
// PUT /api/devices/:deviceId
const deviceId = 1; // INTEGER ID
const response = await fetch(`https://be-tpms.connectis.my.id/api/devices/${deviceId}`, {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    sim_number: '089876543210',
    status: 'inactive',
  }),
});
```

### 5. Delete Device

```javascript
// DELETE /api/devices/:deviceId
const deviceId = 1; // INTEGER ID
const response = await fetch(`https://be-tpms.connectis.my.id/api/devices/${deviceId}`, {
  method: 'DELETE',
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

---

## 🔧 SENSORS API

### 1. Get All Sensors

```javascript
// GET /api/sensors?page=1&limit=10
const response = await fetch('https://be-tpms.connectis.my.id/api/sensors?page=1&limit=10', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

### 2. Get Sensor by ID

```javascript
// GET /api/sensors/:id
const sensorId = 1; // INTEGER ID
const response = await fetch(`https://be-tpms.connectis.my.id/api/sensors/${sensorId}`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const data = await response.json();
// Response:
// {
//   success: true,
//   data: {
//     id: 1,
//     device_id: 5,
//     sn: "SEN001",
//     tireNo: 1,
//     tempValue: 45.2,
//     tirepValue: 35.5,
//     exType: "normal",
//     bat: 85,
//     status: "active"
//   }
// }
```

### 3. Create Sensor

```javascript
// POST /api/sensors/create
const response = await fetch('https://be-tpms.connectis.my.id/api/sensors/create', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    device_id: 5, // INTEGER
    sn: 'SEN999',
    tireNo: 10,
    simNumber: '081299999999',
  }),
});

const data = await response.json();
// Response:
// {
//   success: true,
//   message: "Sensor created successfully",
//   data: { id: 50, sn: "SEN999", ... }
// }
```

### 4. Update Sensor

```javascript
// PUT /api/sensors/:id
const sensorId = 1; // INTEGER ID
const response = await fetch(`https://be-tpms.connectis.my.id/api/sensors/${sensorId}`, {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    tireNo: 2,
    status: 'inactive',
  }),
});
```

### 5. Delete Sensor

```javascript
// DELETE /api/sensors/:id
const sensorId = 1; // INTEGER ID
const response = await fetch(`https://be-tpms.connectis.my.id/api/sensors/${sensorId}`, {
  method: 'DELETE',
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

---

## 👥 VENDORS API

### 1. Get All Vendors

```javascript
// GET /api/vendors?page=1&limit=10
const response = await fetch('https://be-tpms.connectis.my.id/api/vendors?page=1&limit=10', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const data = await response.json();
// Response:
// {
//   success: true,
//   data: {
//     vendors: [
//       {
//         id: 1,
//         name_vendor: "PT ABC",
//         email: "abc@vendor.com",
//         telephone: "021123456",
//         address: "Jakarta",
//         contact_person: "John Doe",
//         truck: [ ... ] // Related trucks
//       },
//       ...
//     ],
//     pagination: { ... }
//   }
// }
```

### 2. Get Vendor by ID

```javascript
// GET /api/vendors/:id
const vendorId = 1; // INTEGER ID
const response = await fetch(`https://be-tpms.connectis.my.id/api/vendors/${vendorId}`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

### 3. Create Vendor

```javascript
// POST /api/vendors
const response = await fetch('https://be-tpms.connectis.my.id/api/vendors', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name_vendor: 'PT New Vendor',
    email: 'new@vendor.com',
    telephone: '021999999',
    address: 'Bandung',
    contact_person: 'Jane Smith',
  }),
});

const data = await response.json();
// Response:
// {
//   success: true,
//   message: "Vendor created successfully",
//   data: { id: 10, name_vendor: "PT New Vendor", ... }
// }
```

### 4. Update Vendor

```javascript
// PUT /api/vendors/:id
const vendorId = 1; // INTEGER ID
const response = await fetch(`https://be-tpms.connectis.my.id/api/vendors/${vendorId}`, {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name_vendor: 'PT Updated Vendor',
    email: 'updated@vendor.com',
  }),
});
```

### 5. Delete Vendor

```javascript
// DELETE /api/vendors/:id
const vendorId = 1; // INTEGER ID
const response = await fetch(`https://be-tpms.connectis.my.id/api/vendors/${vendorId}`, {
  method: 'DELETE',
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

---

## 👨‍✈️ DRIVERS API

### 1. Get All Drivers

```javascript
// GET /api/drivers?page=1&limit=10
const response = await fetch('https://be-tpms.connectis.my.id/api/drivers?page=1&limit=10', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

### 2. Get Driver by ID

```javascript
// GET /api/drivers/:id
const driverId = 1; // INTEGER ID
const response = await fetch(`https://be-tpms.connectis.my.id/api/drivers/${driverId}`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

### 3. Create Driver

```javascript
// POST /api/drivers
const formData = new FormData();
formData.append('name', 'John Driver');
formData.append('phone', '081234567890');
formData.append('email', 'john@driver.com');
formData.append('license_number', 'SIM1234567');
formData.append('license_type', 'B2');
formData.append('license_expiry', '2026-12-31');
formData.append('vendor_id', '5'); // INTEGER
formData.append('status', 'aktif');
// Optional: formData.append('image', fileInput.files[0]);

const response = await fetch('https://be-tpms.connectis.my.id/api/drivers', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});
```

### 4. Update Driver

```javascript
// PUT /api/drivers/:id
const driverId = 1; // INTEGER ID
const formData = new FormData();
formData.append('name', 'Updated Driver Name');
formData.append('phone', '089999999999');
formData.append('status', 'nonaktif');

const response = await fetch(`https://be-tpms.connectis.my.id/api/drivers/${driverId}`, {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});
```

### 5. Delete Driver

```javascript
// DELETE /api/drivers/:id
const driverId = 1; // INTEGER ID
const response = await fetch(`https://be-tpms.connectis.my.id/api/drivers/${driverId}`, {
  method: 'DELETE',
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

---

## 🗺️ MINING AREA API

### 1. Get All Mining Areas (GeoJSON)

```javascript
// GET /api/mining-area
const response = await fetch('https://be-tpms.connectis.my.id/api/mining-area', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const data = await response.json();
// Response: GeoJSON FeatureCollection
// {
//   type: "FeatureCollection",
//   features: [
//     {
//       type: "Feature",
//       geometry: { type: "Polygon", coordinates: [...] },
//       properties: { id: 1, name: "Zone A", type: "mining", ... }
//     },
//     ...
//   ]
// }
```

### 2. Create Mining Zone

```javascript
// POST /api/mining-area
const response = await fetch('https://be-tpms.connectis.my.id/api/mining-area', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'New Mining Zone',
    type: 'mining', // mining | loading | dumping | restricted | maintenance
    coordinates: [
      [-6.2088, 106.8456],
      [-6.209, 106.846],
      [-6.2085, 106.8465],
      [-6.2088, 106.8456], // Close polygon
    ],
    radius: 500, // meters
  }),
});
```

### 3. Update Mining Zone

```javascript
// PUT /api/mining-area/:zoneId
const zoneId = 1; // INTEGER ID
const response = await fetch(`https://be-tpms.connectis.my.id/api/mining-area/${zoneId}`, {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Updated Zone Name',
    type: 'loading',
  }),
});
```

### 4. Delete Mining Zone

```javascript
// DELETE /api/mining-area/:zoneId
const zoneId = 1; // INTEGER ID
const response = await fetch(`https://be-tpms.connectis.my.id/api/mining-area/${zoneId}`, {
  method: 'DELETE',
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

---

## 📊 DASHBOARD API

### 1. Get Dashboard Summary

```javascript
// GET /api/dashboard/summary
const response = await fetch('https://be-tpms.connectis.my.id/api/dashboard/summary', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const data = await response.json();
// Response:
// {
//   success: true,
//   data: {
//     totalTrucks: 50,
//     activeTrucks: 45,
//     totalDevices: 50,
//     totalSensors: 500,
//     activeSensors: 480,
//     activeAlerts: 5,
//     totalVendors: 10,
//     totalDrivers: 60
//   }
// }
```

---

## ⚠️ Error Handling

### Standard Error Response Format

```javascript
{
  success: false,
  message: "Error message here",
  errors: [ // For validation errors
    { field: "email", message: "Invalid email format" }
  ]
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

### Example Error Handling

```javascript
try {
  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }

  const data = await response.json();
  return data;
} catch (error) {
  console.error('API Error:', error.message);
  // Handle error in UI
  alert(`Error: ${error.message}`);
}
```

---

## 🔄 React/Vue Integration Examples

### React Hook Example

```javascript
import { useState, useEffect } from 'react';

function useTrucks() {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrucks = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('https://be-tpms.connectis.my.id/api/trucks', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch trucks');

        const data = await response.json();
        setTrucks(data.data.trucks);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTrucks();
  }, []);

  return { trucks, loading, error };
}

// Usage in component
function TruckList() {
  const { trucks, loading, error } = useTrucks();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {trucks.map((truck) => (
        <div key={truck.id}>
          <h3>{truck.name}</h3>
          <p>Plate: {truck.plate}</p>
          <p>Status: {truck.status}</p>
        </div>
      ))}
    </div>
  );
}
```

### Vue Composition API Example

```javascript
import { ref, onMounted } from 'vue';

export function useTrucks() {
  const trucks = ref([]);
  const loading = ref(true);
  const error = ref(null);

  const fetchTrucks = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://be-tpms.connectis.my.id/api/trucks', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch trucks');

      const data = await response.json();
      trucks.value = data.data.trucks;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  onMounted(() => {
    fetchTrucks();
  });

  return { trucks, loading, error, refetch: fetchTrucks };
}
```

---

## 📝 Validation Rules

### Truck Validation

- `name`: Required, 1-255 characters
- `plate`: Required, 1-50 characters
- `vin`: Optional, exactly 17 characters, alphanumeric only
- `model`: Optional, max 255 characters
- `type`: Optional, max 100 characters
- `year`: Optional, integer between 1900 and current year + 1
- `vendor_id`: Optional, integer (must exist in vendors table)
- `driver_id`: Optional, integer (must exist in drivers table)
- `status`: Optional, must be: `active`, `inactive`, or `maintenance`

### Device Validation

- `truck_id`: Required, integer (must exist in trucks table)
- `sn`: Required, 1-255 characters, alphanumeric with hyphens/underscores
- `sim_number`: Optional, max 50 characters, digits/spaces/hyphens/plus signs

### Sensor Validation

- `device_id`: Required, integer (must exist in devices table)
- `sn`: Required, max 255 characters, alphanumeric with hyphens/underscores
- `tireNo`: Required, integer between 1-50
- `simNumber`: Optional, max 50 characters

### Vendor Validation

- `name_vendor`: Required, 3-255 characters
- `email`: Optional, valid email format
- `telephone`: Optional, max 50 characters
- `address`: Optional, max 500 characters
- `contact_person`: Optional, max 255 characters

### Driver Validation

- `name`: Required, 3-255 characters
- `phone`: Optional, max 50 characters
- `email`: Optional, valid email format
- `license_number`: Required, 5-50 characters
- `license_type`: Required, must be: `A`, `B1`, `B2`, or `C`
- `license_expiry`: Required, valid date format (YYYY-MM-DD)
- `vendor_id`: Optional, integer
- `status`: Optional, must be: `aktif` or `nonaktif`

---

## 🚀 Best Practices

### 1. Always Handle Errors

```javascript
const apiCall = async (url, options) => {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
```

### 2. Use Interceptors for Token Management

```javascript
// Axios example
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 3. Debounce Search Queries

```javascript
import { debounce } from 'lodash';

const searchTrucks = debounce(async (query) => {
  const response = await fetch(`https://be-tpms.connectis.my.id/api/trucks?search=${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  return data;
}, 300);
```

### 4. Cache Static Data

```javascript
// Simple cache implementation
const cache = new Map();

async function fetchWithCache(url, options, ttl = 60000) {
  const cached = cache.get(url);

  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }

  const response = await fetch(url, options);
  const data = await response.json();

  cache.set(url, {
    data,
    timestamp: Date.now(),
  });

  return data;
}
```

### 5. Pagination Helper

```javascript
function buildPaginatedUrl(baseUrl, page = 1, limit = 10, filters = {}) {
  const url = new URL(baseUrl);
  url.searchParams.set('page', page);
  url.searchParams.set('limit', limit);

  Object.entries(filters).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });

  return url.toString();
}

// Usage
const url = buildPaginatedUrl('https://be-tpms.connectis.my.id/api/trucks', 1, 20, {
  status: 'active',
  vendor_id: 5,
});
```

---

## 🔧 Troubleshooting

### Issue: "401 Unauthorized"

**Solution:** Check if token is valid and properly formatted

```javascript
const token = localStorage.getItem('authToken');
if (!token) {
  // Redirect to login
  window.location.href = '/login';
}
```

### Issue: "400 Bad Request - Invalid ID format"

**Solution:** Ensure you're sending INTEGER IDs, not UUIDs

```javascript
// ❌ Wrong
const truckId = '550e8400-e29b-41d4-a716-446655440000';

// ✅ Correct
const truckId = 1; // or "1" as string
```

### Issue: CORS errors

**Solution:** Ensure your frontend domain is whitelisted in backend CORS config. Contact backend team if needed.

### Issue: Token expired

**Solution:** Implement token refresh logic

```javascript
async function refreshToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await response.json();
  localStorage.setItem('authToken', data.token);
  return data.token;
}
```

---

## 📞 Support

For issues or questions:

- **Backend Team:** backend-team@tpms.com
- **API Issues:** Report via GitHub Issues
- **Documentation:** Check `/docs` folder in repository

---

## 📋 Changelog

### Version 2.0 (November 4, 2025)

- ✅ Changed all ID fields from UUID to INTEGER format
- ✅ Fixed Prisma relation names (plural → singular)
- ✅ Updated all validation rules to accept integers
- ✅ Added parseInt() protection in all controllers
- ✅ Improved error handling and validation messages

### Version 1.0 (Initial Release)

- Initial API implementation with UUID IDs

---

**End of Documentation**
