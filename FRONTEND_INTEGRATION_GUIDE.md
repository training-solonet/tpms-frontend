# 🎨 Frontend Integration Guide - TPMS Backend API

**Document Version**: 1.0  
**Last Updated**: November 7, 2025  
**Backend Version**: 2.0.0  
**Base URL**: `http://localhost:3001/api` (Development)  
**Production URL**: `https://be-tpms.connectis.my.id/api`

---

## Table of Contents

1. [Authentication](#authentication)
2. [API Response Format](#api-response-format)
3. [Trucks Module](#trucks-module)
4. [Devices Module](#devices-module)
5. [Sensors Module](#sensors-module)
6. [Drivers Module](#drivers-module)
7. [Vendors Module](#vendors-module)
8. [Dashboard Module](#dashboard-module)
9. [IoT Data Ingestion](#iot-data-ingestion)
10. [WebSocket Real-time Updates](#websocket-real-time-updates)
11. [Error Handling](#error-handling)
12. [Frontend Implementation Examples](#frontend-implementation-examples)

---

## Authentication

### 1. Login

**Endpoint**: `POST /auth/login`

**Request:**

```javascript
const login = async (email, password) => {
  const response = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: email, // Note: username field expects email
      password: password,
    }),
  });

  const data = await response.json();

  if (data.success) {
    // Store token
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
  }

  return data;
};
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "Admin User",
      "email": "admin@tpms.com",
      "role": "admin"
    }
  }
}
```

### 2. Get Current User Profile

**Endpoint**: `GET /auth/profile`

**Request:**

```javascript
const getProfile = async () => {
  const token = localStorage.getItem('token');

  const response = await fetch('http://localhost:3001/api/auth/profile', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return await response.json();
};
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@tpms.com",
    "role": "admin",
    "lastLogin": "2025-11-07T09:00:00.000Z",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-11-07T09:00:00.000Z"
  }
}
```

---

## API Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    /* response data */
  },
  "message": "Operation completed successfully"
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "error": "Technical error details (development only)"
}
```

### Paginated Response

```json
{
  "success": true,
  "data": {
    "trucks": [
      /* array of items */
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 50,
      "total": 150,
      "total_pages": 3
    }
  },
  "message": "Retrieved 50 trucks successfully"
}
```

---

## Trucks Module

### 1. Get All Trucks (with Pagination & Filters)

**Endpoint**: `GET /trucks`

**Query Parameters:**

```javascript
{
  page: 1,           // Page number (default: 1)
  limit: 50,         // Items per page (default: 50, max: 200)
  status: 'active',  // Filter by status: active, inactive, maintenance
  search: 'truck',   // Search in name, model, plate
  vendor: 'PT ABC',  // Filter by vendor name
  vendorId: 1        // Filter by vendor ID
}
```

**Implementation:**

```javascript
const getAllTrucks = async (filters = {}) => {
  const token = localStorage.getItem('token');

  // Build query string
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.status) params.append('status', filters.status);
  if (filters.search) params.append('search', filters.search);
  if (filters.vendorId) params.append('vendorId', filters.vendorId);

  const response = await fetch(`http://localhost:3001/api/trucks?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return await response.json();
};
```

**Response:**

```json
{
  "success": true,
  "data": {
    "trucks": [
      {
        "id": 1,
        "name": "Dump Truck 01",
        "vin": "1HGBH41JXMN109186",
        "plate": "B 1234 ABC",
        "model": "Hino Ranger",
        "year": 2023,
        "type": "Dump Truck",
        "status": "active",
        "vendor_id": 1,
        "driver_id": 1,
        "image": "/uploads/trucks/truck-1.jpg",
        "vendor": {
          "id": 1,
          "name": "PT. Vendor A",
          "telephone": "021-12345678",
          "email": "vendor.a@example.com"
        },
        "driver": {
          "id": 1,
          "name": "John Doe",
          "phone": "081234567890",
          "license_number": "A12345678"
        },
        "devices": [
          {
            "id": 1,
            "sn": "DEV-SN-0001",
            "bat1": 85,
            "bat2": 82,
            "bat3": 88,
            "lock": 1,
            "status": "active"
          }
        ],
        "created_at": "2025-01-01T00:00:00.000Z",
        "updated_at": "2025-11-07T08:00:00.000Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 50,
      "total": 10,
      "total_pages": 1
    },
    "summary": {
      "totalTrucks": 10,
      "activeTrucks": 8,
      "inactiveTrucks": 1,
      "maintenanceTrucks": 1
    }
  },
  "message": "Retrieved 10 trucks successfully"
}
```

**Frontend Display Example:**

```jsx
// React Component Example
const TruckList = () => {
  const [trucks, setTrucks] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({ page: 1, limit: 50 });

  useEffect(() => {
    loadTrucks();
  }, [filters]);

  const loadTrucks = async () => {
    const response = await getAllTrucks(filters);
    if (response.success) {
      setTrucks(response.data.trucks);
      setPagination(response.data.pagination);
    }
  };

  return (
    <div>
      <h1>Trucks ({pagination.total})</h1>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Plate</th>
            <th>Model</th>
            <th>Year</th>
            <th>Vendor</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {trucks.map((truck) => (
            <tr key={truck.id}>
              <td>{truck.name}</td>
              <td>{truck.plate}</td>
              <td>{truck.model || '-'}</td>
              <td>{truck.year || '-'}</td>
              <td>{truck.vendor?.name || '-'}</td>
              <td>
                <span className={`badge badge-${truck.status}`}>{truck.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Component */}
      <Pagination
        current={pagination.current_page}
        total={pagination.total_pages}
        onChange={(page) => setFilters({ ...filters, page })}
      />
    </div>
  );
};
```

---

### 2. Get Single Truck Detail

**Endpoint**: `GET /trucks/:id`

**Implementation:**

```javascript
const getTruckById = async (truckId) => {
  const token = localStorage.getItem('token');

  const response = await fetch(`http://localhost:3001/api/trucks/${truckId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return await response.json();
};
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Dump Truck 01",
    "vin": "1HGBH41JXMN109186",
    "plate": "B 1234 ABC",
    "model": "Hino Ranger",
    "year": 2023,
    "type": "Dump Truck",
    "status": "active",
    "image": "/uploads/trucks/truck-1.jpg",
    "vendor": {
      "id": 1,
      "name": "PT. Vendor A",
      "telephone": "021-12345678",
      "email": "vendor.a@example.com"
    },
    "driver": {
      "id": 1,
      "name": "John Doe",
      "phone": "081234567890",
      "license_number": "A12345678",
      "license_expiry": "2026-12-31"
    },
    "devices": [
      {
        "id": 1,
        "sn": "DEV-SN-0001",
        "sim_number": "081234567890",
        "bat1": 85,
        "bat2": 82,
        "bat3": 88,
        "lock": 1,
        "status": "active",
        "sensors": [
          {
            "id": 1,
            "sn": "SN-0001",
            "tireNo": 1,
            "tempValue": 65.5,
            "tirepValue": 850.0,
            "exType": "normal",
            "bat": 85,
            "status": "active"
          }
        ]
      }
    ],
    "locations": [
      {
        "id": 100,
        "lat": -6.2088,
        "long": 106.8456,
        "recorded_at": "2025-11-07T09:00:00.000Z"
      }
    ],
    "active_alerts": 3,
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-11-07T08:00:00.000Z"
  },
  "message": "Truck retrieved successfully"
}
```

---

### 3. Get Truck Tires (Sensors)

**Endpoint**: `GET /trucks/:id/tires`

**Implementation:**

```javascript
const getTruckTires = async (truckId) => {
  const token = localStorage.getItem('token');

  const response = await fetch(`http://localhost:3001/api/trucks/${truckId}/tires`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return await response.json();
};
```

**Response:**

```json
{
  "success": true,
  "data": {
    "truck_id": 1,
    "truck_name": "Dump Truck 01",
    "truck_plate": "B 1234 ABC",
    "device": {
      "id": 1,
      "sn": "DEV-SN-0001",
      "bat1": 85,
      "bat2": 82,
      "bat3": 88
    },
    "tires": [
      {
        "tireNo": 1,
        "position": "Front Left",
        "sensor": {
          "id": 1,
          "sn": "SN-0001",
          "tempValue": 65.5,
          "tirepValue": 850.0,
          "exType": "normal",
          "bat": 85,
          "status": "active",
          "updated_at": "2025-11-07T09:00:00.000Z"
        }
      },
      {
        "tireNo": 2,
        "position": "Front Right",
        "sensor": {
          "id": 2,
          "sn": "SN-0002",
          "tempValue": 67.2,
          "tirepValue": 855.0,
          "exType": "normal",
          "bat": 88,
          "status": "active",
          "updated_at": "2025-11-07T09:01:00.000Z"
        }
      }
    ],
    "total_tires": 20,
    "monitored_tires": 18,
    "unmonitored_tires": 2
  },
  "message": "Truck tires retrieved successfully"
}
```

**Frontend Tire Monitor Display:**

```jsx
const TireMonitor = ({ truckId }) => {
  const [tires, setTires] = useState([]);

  useEffect(() => {
    const loadTires = async () => {
      const response = await getTruckTires(truckId);
      if (response.success) {
        setTires(response.data.tires);
      }
    };

    loadTires();

    // Refresh every 30 seconds
    const interval = setInterval(loadTires, 30000);
    return () => clearInterval(interval);
  }, [truckId]);

  const getTireStatus = (sensor) => {
    if (!sensor) return 'no-sensor';
    if (sensor.exType === 'critical') return 'critical';
    if (sensor.exType === 'warning') return 'warning';
    return 'normal';
  };

  return (
    <div className="tire-monitor">
      <h2>Tire Monitoring</h2>

      <div className="tire-grid">
        {tires.map((tire) => (
          <div key={tire.tireNo} className={`tire-card ${getTireStatus(tire.sensor)}`}>
            <div className="tire-number">Tire {tire.tireNo}</div>
            <div className="tire-position">{tire.position}</div>

            {tire.sensor ? (
              <>
                <div className="tire-metric">
                  <span className="label">Pressure:</span>
                  <span className="value">{tire.sensor.tirepValue} kPa</span>
                </div>
                <div className="tire-metric">
                  <span className="label">Temp:</span>
                  <span className="value">{tire.sensor.tempValue}°C</span>
                </div>
                <div className="tire-metric">
                  <span className="label">Battery:</span>
                  <span className="value">{tire.sensor.bat}%</span>
                </div>
              </>
            ) : (
              <div className="no-sensor">No Sensor</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

### 4. Get Truck Location History

**Endpoint**: `GET /trucks/:id/history`

**Query Parameters:**

```javascript
{
  days: 7,        // Last N days (default: 7)
  limit: 100      // Max points (default: 100)
}
```

**Implementation:**

```javascript
const getTruckLocationHistory = async (truckId, days = 7) => {
  const token = localStorage.getItem('token');

  const response = await fetch(`http://localhost:3001/api/trucks/${truckId}/history?days=${days}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return await response.json();
};
```

**Response:**

```json
{
  "success": true,
  "data": {
    "truck_id": 1,
    "truck_name": "Dump Truck 01",
    "locations": [
      {
        "id": 100,
        "lat": -6.2088,
        "long": 106.8456,
        "recorded_at": "2025-11-07T09:00:00.000Z"
      },
      {
        "id": 99,
        "lat": -6.209,
        "long": 106.846,
        "recorded_at": "2025-11-07T08:55:00.000Z"
      }
    ],
    "total_locations": 288
  },
  "message": "Location history retrieved successfully"
}
```

---

### 5. Get Realtime All Trucks Locations

**Endpoint**: `GET /trucks/realtime/locations`

**Implementation:**

```javascript
const getRealtimeLocations = async () => {
  const token = localStorage.getItem('token');

  const response = await fetch('http://localhost:3001/api/trucks/realtime/locations', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return await response.json();
};
```

**Response:**

```json
{
  "success": true,
  "data": {
    "trucks": [
      {
        "truck_id": 1,
        "truck_name": "Dump Truck 01",
        "truck_plate": "B 1234 ABC",
        "status": "active",
        "latest_location": {
          "lat": -6.2088,
          "long": 106.8456,
          "recorded_at": "2025-11-07T09:00:00.000Z"
        },
        "device": {
          "id": 1,
          "sn": "DEV-SN-0001",
          "bat1": 85,
          "bat2": 82,
          "bat3": 88,
          "lock": 1
        }
      }
    ],
    "timestamp": "2025-11-07T09:05:00.000Z"
  },
  "message": "Retrieved 10 truck locations"
}
```

**Frontend Map Display:**

```jsx
// Using Leaflet or Google Maps
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

const TruckMap = () => {
  const [trucks, setTrucks] = useState([]);

  useEffect(() => {
    const loadLocations = async () => {
      const response = await getRealtimeLocations();
      if (response.success) {
        setTrucks(response.data.trucks);
      }
    };

    loadLocations();

    // Auto refresh every 10 seconds
    const interval = setInterval(loadLocations, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <MapContainer center={[-6.2088, 106.8456]} zoom={13}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {trucks.map(
        (truck) =>
          truck.latest_location && (
            <Marker
              key={truck.truck_id}
              position={[truck.latest_location.lat, truck.latest_location.long]}
            >
              <Popup>
                <strong>{truck.truck_name}</strong>
                <br />
                Plate: {truck.truck_plate}
                <br />
                Status: {truck.status}
                <br />
                Battery: {truck.device?.bat1}%
              </Popup>
            </Marker>
          )
      )}
    </MapContainer>
  );
};
```

---

### 6. Create New Truck

**Endpoint**: `POST /trucks`

**Implementation:**

```javascript
const createTruck = async (truckData) => {
  const token = localStorage.getItem('token');

  const response = await fetch('http://localhost:3001/api/trucks', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(truckData),
  });

  return await response.json();
};
```

**Request Body:**

```json
{
  "name": "Dump Truck 10",
  "plate": "B 9999 ZZZ",
  "vin": "1HGBH41JXMN999999",
  "model": "Hino Ranger",
  "year": 2024,
  "type": "Dump Truck",
  "vendor_id": 1,
  "driver_id": 5,
  "status": "active"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 11,
    "name": "Dump Truck 10",
    "plate": "B 9999 ZZZ",
    "vin": "1HGBH41JXMN999999",
    "model": "Hino Ranger",
    "year": 2024,
    "type": "Dump Truck",
    "vendor_id": 1,
    "driver_id": 5,
    "status": "active",
    "created_at": "2025-11-07T09:30:00.000Z"
  },
  "message": "Truck created successfully"
}
```

---

### 7. Update Truck

**Endpoint**: `PUT /trucks/:id`

**Implementation:**

```javascript
const updateTruck = async (truckId, updateData) => {
  const token = localStorage.getItem('token');

  const response = await fetch(`http://localhost:3001/api/trucks/${truckId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData),
  });

  return await response.json();
};
```

**Request Body (Partial Update):**

```json
{
  "status": "maintenance",
  "driver_id": 3
}
```

---

### 8. Delete Truck (Soft Delete)

**Endpoint**: `DELETE /trucks/:id`

**Implementation:**

```javascript
const deleteTruck = async (truckId) => {
  const token = localStorage.getItem('token');

  const response = await fetch(`http://localhost:3001/api/trucks/${truckId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return await response.json();
};
```

---

## Devices Module

### 1. Get All Devices

**Endpoint**: `GET /iot/devices`

**Query Parameters:**

```javascript
{
  page: 1,
  limit: 50,
  truck_id: 1,      // Filter by truck
  status: 'active',  // Filter by status
  search: 'DEV'     // Search in serial number
}
```

**Implementation:**

```javascript
const getAllDevices = async (filters = {}) => {
  const token = localStorage.getItem('token');

  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.truck_id) params.append('truck_id', filters.truck_id);
  if (filters.status) params.append('status', filters.status);

  const response = await fetch(`http://localhost:3001/api/iot/devices?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return await response.json();
};
```

**Response:**

```json
{
  "success": true,
  "data": {
    "devices": [
      {
        "id": 1,
        "truck_id": 1,
        "sn": "DEV-SN-0001",
        "sim_number": "081234567890",
        "status": "active",
        "bat1": 85,
        "bat2": 82,
        "bat3": 88,
        "lock": 1,
        "truck": {
          "id": 1,
          "plate": "B 1234 ABC",
          "name": "Dump Truck 01"
        },
        "sensor": [
          {
            "id": 1,
            "sn": "SN-0001",
            "tireNo": 1
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  },
  "message": "Devices retrieved successfully"
}
```

---

### 2. Get Single Device

**Endpoint**: `GET /iot/devices/:id`

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "truck_id": 1,
    "sn": "DEV-SN-0001",
    "sim_number": "081234567890",
    "status": "active",
    "bat1": 85,
    "bat2": 82,
    "bat3": 88,
    "lock": 1,
    "truck": {
      "id": 1,
      "plate": "B 1234 ABC",
      "name": "Dump Truck 01",
      "type": "Dump Truck"
    },
    "sensor": [
      {
        "id": 1,
        "sn": "SN-0001",
        "tireNo": 1,
        "sensorNo": 1,
        "status": "active"
      }
    ],
    "location": [
      {
        "id": 100,
        "lat": -6.2088,
        "long": 106.8456,
        "recorded_at": "2025-11-07T09:00:00.000Z"
      }
    ]
  },
  "message": "Device retrieved successfully"
}
```

---

### 3. Create Device

**Endpoint**: `POST /iot/devices`

**Request:**

```json
{
  "truck_id": 1,
  "sn": "DEV-NEW-001",
  "sim_number": "081999999999",
  "status": "active"
}
```

---

### 4. Update Device

**Endpoint**: `PUT /iot/devices/:id`

**Request:**

```json
{
  "truck_id": 2,
  "sim_number": "089999999999",
  "status": "maintenance"
}
```

---

### 5. Delete Device

**Endpoint**: `DELETE /iot/devices/:id`

---

## Sensors Module

### 1. Get All Sensors

**Endpoint**: `GET /iot/sensors`

**Query Parameters:**

```javascript
{
  page: 1,
  limit: 50,
  device_id: 1,     // Filter by device
  status: 'active'   // Filter by status
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "sensors": [
      {
        "id": 1,
        "device_id": 1,
        "sn": "SN-0001",
        "tireNo": 1,
        "sensorNo": 1,
        "simNumber": "081234567890",
        "status": "active",
        "tirepValue": 850.5,
        "tempValue": 65.2,
        "exType": "normal",
        "bat": 85,
        "device": {
          "id": 1,
          "sn": "DEV-SN-0001",
          "truck": {
            "id": 1,
            "plate": "B 1234 ABC",
            "name": "Dump Truck 01"
          }
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 20,
      "totalPages": 1
    }
  },
  "message": "Sensors retrieved successfully"
}
```

---

### 2. Create Sensor

**Endpoint**: `POST /iot/sensors`

**Request:**

```json
{
  "device_id": 1,
  "sn": "SN-NEW-001",
  "tireNo": 5,
  "simNumber": "081234567891",
  "sensorNo": 5,
  "status": "active"
}
```

---

### 3. Update Sensor

**Endpoint**: `PUT /iot/sensors/:id`

**Request:**

```json
{
  "tireNo": 6,
  "status": "maintenance"
}
```

---

### 4. Delete Sensor

**Endpoint**: `DELETE /iot/sensors/:id`

---

## Drivers Module

### 1. Get All Drivers

**Endpoint**: `GET /drivers`

**Query Parameters:**

```javascript
{
  page: 1,
  limit: 50,
  status: 'aktif',    // aktif, tidak aktif
  search: 'john',     // Search in name
  vendor_id: 1        // Filter by vendor
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "drivers": [
      {
        "id": 1,
        "name": "John Doe",
        "phone": "081234567890",
        "email": "john@example.com",
        "license_number": "A12345678",
        "license_type": "B1",
        "license_expiry": "2026-12-31",
        "status": "aktif",
        "vendor_id": 1,
        "vendor": {
          "id": 1,
          "name": "PT. Vendor A"
        },
        "created_at": "2025-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 10,
      "totalPages": 1
    }
  },
  "message": "Retrieved 10 drivers successfully"
}
```

---

### 2. Get Drivers with Expiring Licenses

**Endpoint**: `GET /drivers/expiring-licenses`

**Query Parameters:**

```javascript
{
  days: 30; // Expire dalam N hari (default: 30)
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "expiring_drivers": [
      {
        "id": 5,
        "name": "Jane Smith",
        "license_number": "B98765432",
        "license_expiry": "2025-12-01",
        "days_until_expiry": 25,
        "phone": "081987654321"
      }
    ],
    "count": 1
  },
  "message": "Found 1 drivers with expiring licenses"
}
```

---

## Vendors Module

### 1. Get All Vendors

**Endpoint**: `GET /vendors`

**Response:**

```json
{
  "success": true,
  "data": {
    "vendors": [
      {
        "id": 1,
        "name_vendor": "PT. Vendor A",
        "telephone": "021-12345678",
        "email": "vendor.a@example.com",
        "address": "Jakarta",
        "contact_person": "Mr. Admin",
        "truck_count": 5,
        "driver_count": 10
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 6,
      "totalPages": 1
    }
  }
}
```

---

### 2. Get Vendor with Trucks

**Endpoint**: `GET /vendors/:id/trucks`

**Response:**

```json
{
  "success": true,
  "data": {
    "vendor": {
      "id": 1,
      "name_vendor": "PT. Vendor A",
      "telephone": "021-12345678"
    },
    "trucks": [
      {
        "id": 1,
        "name": "Dump Truck 01",
        "plate": "B 1234 ABC",
        "status": "active"
      }
    ]
  }
}
```

---

## Dashboard Module

### 1. Get Dashboard Statistics

**Endpoint**: `GET /dashboard/stats`

**Response:**

```json
{
  "success": true,
  "data": {
    "totalTrucks": 10,
    "activeTrucks": 8,
    "inactiveTrucks": 1,
    "maintenanceTrucks": 1,
    "averageFuel": 0,
    "totalPayload": 0,
    "alertsCount": 5,
    "lowTirePressureCount": 2,
    "metadata": {
      "dataFreshness": "real-time",
      "lastUpdated": "2025-11-07T09:30:00.000Z",
      "cacheStatus": "live"
    }
  },
  "message": "Dashboard statistics retrieved successfully"
}
```

---

### 2. Get Fleet Performance

**Endpoint**: `GET /dashboard/fleet-performance`

**Response:**

```json
{
  "success": true,
  "data": {
    "trucks": [
      {
        "truck_id": 1,
        "truck_name": "Dump Truck 01",
        "plate": "B 1234 ABC",
        "status": "active",
        "active_alerts": 2,
        "device_battery": 85,
        "sensor_count": 18,
        "last_update": "2025-11-07T09:00:00.000Z"
      }
    ]
  }
}
```

---

### 3. Get Recent Alerts

**Endpoint**: `GET /dashboard/recent-alerts`

**Query Parameters:**

```javascript
{
  limit: 10; // Max alerts (default: 10)
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": 100,
        "alert_code": "TIRE_PRESSURE_LOW",
        "alert_name": "Low Tire Pressure",
        "severity": "warning",
        "truck_id": 1,
        "truck_name": "Dump Truck 01",
        "truck_plate": "B 1234 ABC",
        "sensor_sn": "SN-0001",
        "tire_no": 1,
        "value": 750.0,
        "message": "Tire pressure below threshold",
        "status": "active",
        "created_at": "2025-11-07T08:55:00.000Z"
      }
    ]
  }
}
```

---

## IoT Data Ingestion

### Unified Endpoint for IoT Hardware

**Endpoint**: `POST /iot/data`

**⚠️ Note**: This endpoint is for IoT hardware only. Do NOT use from frontend.

### 1. Tire Pressure Data (TPDATA)

**Request:**

```json
{
  "sn": "SN-0001",
  "cmd": "tpdata",
  "data": {
    "tireNo": 1,
    "tiprValue": 850.5,
    "tempValue": 65.2,
    "exType": "normal",
    "bat": 85,
    "simNumber": "081234567890"
  }
}
```

---

### 2. Device Location (DEVICE)

**Request:**

```json
{
  "sn": "DEV-SN-0001",
  "cmd": "device",
  "data": {
    "lng": 106.8456,
    "lat": -6.2088,
    "bat1": 85,
    "bat2": 82,
    "bat3": 88,
    "lock": 1
  }
}
```

---

## WebSocket Real-time Updates

### Connection Setup

```javascript
// WebSocket Connection
const ws = new WebSocket('ws://localhost:3001');

ws.onopen = () => {
  console.log('WebSocket connected');

  // Subscribe to truck updates
  ws.send(
    JSON.stringify({
      type: 'subscribe',
      channel: 'trucks',
    })
  );

  // Subscribe to sensor updates
  ws.send(
    JSON.stringify({
      type: 'subscribe',
      channel: 'sensors',
    })
  );
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case 'sensor_update':
      handleSensorUpdate(message.data);
      break;

    case 'device_update':
      handleDeviceUpdate(message.data);
      break;

    case 'alert':
      handleAlert(message.data);
      break;
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('WebSocket disconnected');
  // Implement reconnection logic
};
```

---

### Message Types

#### 1. Sensor Update

```json
{
  "type": "sensor_update",
  "data": {
    "sensor_id": 1,
    "sensor_sn": "SN-0001",
    "tireNo": 1,
    "device_id": 1,
    "truck_id": 1,
    "truck_plate": "B 1234 ABC",
    "tempValue": 65.5,
    "tirepValue": 850.0,
    "exType": "normal",
    "bat": 85,
    "updated_at": "2025-11-07T09:00:00.000Z"
  },
  "timestamp": "2025-11-07T09:00:00.000Z"
}
```

#### 2. Device Update

```json
{
  "type": "device_update",
  "data": {
    "device_id": 1,
    "device_sn": "DEV-SN-0001",
    "truck_id": 1,
    "truck_plate": "B 1234 ABC",
    "bat1": 85,
    "bat2": 82,
    "bat3": 88,
    "lock": 1,
    "location": {
      "location_id": 100,
      "lat": -6.2088,
      "lng": 106.8456,
      "recorded_at": "2025-11-07T09:00:00.000Z"
    },
    "updated_at": "2025-11-07T09:00:00.000Z"
  },
  "timestamp": "2025-11-07T09:00:00.000Z"
}
```

---

### React Hook Example

```jsx
import { useEffect, useState } from 'react';

const useWebSocket = () => {
  const [ws, setWs] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:3001');

    socket.onopen = () => {
      console.log('Connected to WebSocket');
      socket.send(
        JSON.stringify({
          type: 'subscribe',
          channel: 'sensors',
        })
      );
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages((prev) => [...prev, message]);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('WebSocket closed');
      // Reconnect after 5 seconds
      setTimeout(() => {
        setWs(new WebSocket('ws://localhost:3001'));
      }, 5000);
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, []);

  return { ws, messages };
};

// Usage in component
const Dashboard = () => {
  const { messages } = useWebSocket();

  useEffect(() => {
    messages.forEach((message) => {
      if (message.type === 'sensor_update') {
        // Update sensor data in state
        console.log('Sensor update:', message.data);
      }
    });
  }, [messages]);

  return <div>Dashboard with real-time updates</div>;
};
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning      | Action                                       |
| ---- | ------------ | -------------------------------------------- |
| 200  | OK           | Request successful                           |
| 201  | Created      | Resource created                             |
| 400  | Bad Request  | Check request payload                        |
| 401  | Unauthorized | Token missing or invalid - redirect to login |
| 403  | Forbidden    | Insufficient permissions                     |
| 404  | Not Found    | Resource doesn't exist                       |
| 409  | Conflict     | Duplicate data (e.g., plate number)          |
| 500  | Server Error | Backend error - show error message           |

---

### Error Response Format

```json
{
  "success": false,
  "message": "User-friendly error message",
  "error": "Technical details (development only)"
}
```

---

### Frontend Error Handling

```javascript
const handleApiError = (error, response) => {
  if (response.status === 401) {
    // Unauthorized - redirect to login
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }

  if (response.status === 403) {
    // Forbidden
    alert('You do not have permission to perform this action');
    return;
  }

  if (response.status === 404) {
    // Not found
    alert('Resource not found');
    return;
  }

  if (response.status === 409) {
    // Conflict (e.g., duplicate)
    alert(error.message || 'Data conflict. Please check your input.');
    return;
  }

  // Generic error
  alert(error.message || 'An error occurred. Please try again.');
};

// Usage
const createTruck = async (truckData) => {
  try {
    const response = await fetch('http://localhost:3001/api/trucks', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(truckData),
    });

    const data = await response.json();

    if (!response.ok) {
      handleApiError(data, response);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Network error:', error);
    alert('Network error. Please check your connection.');
    return null;
  }
};
```

---

## Frontend Implementation Examples

### Complete React Service Layer

```javascript
// services/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  getToken() {
    return localStorage.getItem('token');
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(data.message, response.status, data);
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Network error', 0, error);
    }
  }

  // Auth
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: email, password }),
    });
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  // Trucks
  async getTrucks(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/trucks?${params}`);
  }

  async getTruck(id) {
    return this.request(`/trucks/${id}`);
  }

  async createTruck(data) {
    return this.request('/trucks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTruck(id, data) {
    return this.request(`/trucks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTruck(id) {
    return this.request(`/trucks/${id}`, {
      method: 'DELETE',
    });
  }

  async getTruckTires(id) {
    return this.request(`/trucks/${id}/tires`);
  }

  async getRealtimeLocations() {
    return this.request('/trucks/realtime/locations');
  }

  // Dashboard
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  async getRecentAlerts(limit = 10) {
    return this.request(`/dashboard/recent-alerts?limit=${limit}`);
  }

  // Devices
  async getDevices(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/iot/devices?${params}`);
  }

  // Sensors
  async getSensors(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/iot/sensors?${params}`);
  }

  // Drivers
  async getDrivers(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/drivers?${params}`);
  }

  async getExpiringLicenses(days = 30) {
    return this.request(`/drivers/expiring-licenses?days=${days}`);
  }

  // Vendors
  async getVendors(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/vendors?${params}`);
  }
}

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export default new ApiService();
```

---

### React Context for Authentication

```javascript
// context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.getProfile();
      if (response.success) {
        setUser(response.data);
      }
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await api.login(email, password);

    if (response.success) {
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
    }

    return response;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

---

## Best Practices

### 1. Token Management

```javascript
// Store token securely
localStorage.setItem('token', token);

// Always check token expiry
const isTokenValid = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
};

// Auto logout on token expiry
setInterval(() => {
  if (!isTokenValid()) {
    logout();
  }
}, 60000); // Check every minute
```

---

### 2. Request Caching

```javascript
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedData = async (key, fetchFn) => {
  const cached = cache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const data = await fetchFn();
  cache.set(key, { data, timestamp: Date.now() });

  return data;
};

// Usage
const trucks = await getCachedData('trucks', () => api.getTrucks());
```

---

### 3. Loading States

```javascript
const TruckList = () => {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTrucks = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.getTrucks();

        if (response.success) {
          setTrucks(response.data.trucks);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadTrucks();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return <TruckTable trucks={trucks} />;
};
```

---

### 4. Real-time Updates Integration

```javascript
const TruckMonitor = () => {
  const [trucks, setTrucks] = useState([]);
  const { messages } = useWebSocket();

  useEffect(() => {
    // Initial load
    loadTrucks();
  }, []);

  useEffect(() => {
    // Update truck data from WebSocket
    messages.forEach((message) => {
      if (message.type === 'device_update') {
        setTrucks((prev) =>
          prev.map((truck) =>
            truck.id === message.data.truck_id ? { ...truck, device: message.data } : truck
          )
        );
      }
    });
  }, [messages]);

  return <TruckList trucks={trucks} />;
};
```

---

## Troubleshooting

### Common Issues

#### 1. CORS Error

**Problem**: `Access to fetch blocked by CORS policy`

**Solution**: Backend already configured. Check if using correct URL.

---

#### 2. 401 Unauthorized

**Problem**: All requests return 401

**Solution**:

```javascript
// Check token exists
const token = localStorage.getItem('token');
console.log('Token:', token);

// Check token format
const isValidFormat = token && token.startsWith('ey');
console.log('Valid format:', isValidFormat);

// Re-login if token invalid
if (!token || !isValidFormat) {
  window.location.href = '/login';
}
```

---

#### 3. Empty Data Response

**Problem**: API returns success but empty data

**Solution**:

- Check soft delete filter (deleted_at = null)
- Check database has data
- Check query filters not too restrictive

---

#### 4. WebSocket Disconnects

**Problem**: WebSocket connection drops frequently

**Solution**:

```javascript
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

const connectWebSocket = () => {
  const ws = new WebSocket('ws://localhost:3001');

  ws.onclose = () => {
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      setTimeout(connectWebSocket, 5000 * reconnectAttempts);
    }
  };

  ws.onopen = () => {
    reconnectAttempts = 0; // Reset on successful connection
  };

  return ws;
};
```

---

## API Rate Limits

- **IoT Hardware Endpoint**: 100 requests/minute
- **Admin CRUD Endpoints**: 60 requests/minute
- **Dashboard Endpoints**: 30 requests/minute

**Handling Rate Limit:**

```javascript
if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  alert(`Rate limit exceeded. Retry after ${retryAfter} seconds`);
}
```

---

## Environment Configuration

```javascript
// .env file
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_WS_URL=ws://localhost:3001
REACT_APP_ENV=development

// Production
REACT_APP_API_URL=https://be-tpms.connectis.my.id/api
REACT_APP_WS_URL=wss://be-tpms.connectis.my.id/ws
REACT_APP_ENV=production
```

---

## Testing

### Postman Collection

Import Postman collection from: `docs/POSTMAN_API_GUIDE.md`

### Manual Testing Checklist

- [ ] Login and receive token
- [ ] Get trucks list with pagination
- [ ] Get single truck detail
- [ ] Get truck tires with sensor data
- [ ] Get realtime locations
- [ ] Create/Update/Delete truck
- [ ] WebSocket connection and messages
- [ ] Error handling (401, 404, 500)

---

## Support

For issues or questions:

- Repository: `training-solonet/tpms-backend`
- Branch: `rendhi-develop-tpms`
- Documentation: `/docs` folder

---

**Happy Coding! 🚀**
