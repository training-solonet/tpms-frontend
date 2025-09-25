# TPMS Backend - Complete CRUD API Documentation

## Base URL
- **Development**: `http://localhost:3001/api`
- **Production**: `https://be-tpms.connectis.my.id/api`

## Authentication
All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

---

## 🏢 Vendors API

### Create Vendor
```http
POST /api/vendors
Content-Type: application/json
Authorization: Bearer <token>

{
  "nama_vendor": "PT Vendor Example",
  "address": "Jl. Contoh No. 123, Jakarta",
  "nomor_telepon": "+62-21-1234567",
  "email": "contact@vendor.com",
  "kontak_person": "John Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nama_vendor": "PT Vendor Example",
    "address": "Jl. Contoh No. 123, Jakarta",
    "nomor_telepon": "+62-21-1234567",
    "email": "contact@vendor.com",
    "kontak_person": "John Doe",
    "created_at": "2025-09-22T04:52:50.000Z",
    "updated_at": "2025-09-22T04:52:50.000Z"
  },
  "message": "Vendor created successfully"
}
```

### Get All Vendors
```http
GET /api/vendors?page=1&limit=50
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "PT Vendor Example",
      "address": "Jl. Contoh No. 123, Jakarta",
      "phone": "+62-21-1234567",
      "email": "contact@vendor.com",
      "contact_person": "John Doe",
      "created_at": "2025-09-22T04:52:50.000Z",
      "updated_at": "2025-09-22T04:52:50.000Z",
      "truck_count": 5,
      "driver_count": 12,
      "trucks": [...],
      "drivers": [...]
    }
  ],
  "message": "Vendors retrieved successfully"
}
```

### Get Vendor by ID
```http
GET /api/vendors/{vendorId}
Authorization: Bearer <token>
```

### Update Vendor
```http
PUT /api/vendors/{vendorId}
Content-Type: application/json
Authorization: Bearer <token>

{
  "nama_vendor": "PT Updated Vendor",
  "address": "New Address"
}
```

### Delete Vendor
```http
DELETE /api/vendors/{vendorId}
Authorization: Bearer <token>
```

**Response (400) - If has associated data:**
```json
{
  "success": false,
  "message": "Cannot delete vendor with associated trucks or drivers. Please reassign or remove them first.",
  "data": {
    "truck_count": 5,
    "driver_count": 12
  }
}
```

---

## 🚛 Trucks API

### Create Truck
```http
POST /api/trucks
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Truck Mining 001",
  "code": "T001",
  "vin": "1HGBH41JXMN109186",
  "model": "Caterpillar 797F",
  "year": 2023,
  "tire_config": "18.00R33",
  "vendor_id": 1,
  "fleet_group_id": "uuid-fleet-group-id"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-truck-id",
    "name": "Truck Mining 001",
    "code": "T001",
    "vin": "1HGBH41JXMN109186",
    "model": "Caterpillar 797F",
    "year": 2023,
    "tire_config": "18.00R33",
    "vendor_id": 1,
    "fleet_group_id": "uuid-fleet-group-id",
    "created_at": "2025-09-22T04:52:50.000Z",
    "vendor": {
      "id": 1,
      "nama_vendor": "PT Vendor Example"
    },
    "fleet_group": {
      "id": "uuid-fleet-group-id",
      "name": "Fleet A"
    }
  },
  "message": "Truck created successfully"
}
```

### Get All Trucks
```http
GET /api/trucks?page=1&limit=50&status=active&vendor_id=1&search=mining
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 200)
- `status`: Filter by status (active, inactive, maintenance)
- `vendor_id`: Filter by vendor ID
- `search`: Search in truck name/code
- `hasAlerts`: Filter trucks with alerts (true/false)

### Get Truck by ID
```http
GET /api/trucks/{truckId}
Authorization: Bearer <token>
```

### Update Truck
```http
PUT /api/trucks/{truckId}
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Updated Truck Name",
  "model": "New Model",
  "vendor_id": 2
}
```

### Update Truck Status
```http
PUT /api/trucks/{truckId}/status
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "maintenance"
}
```

**Valid statuses:** `active`, `inactive`, `maintenance`

### Delete Truck
```http
DELETE /api/trucks/{truckId}
Authorization: Bearer <token>
```

**Response (400) - If has associated data:**
```json
{
  "success": false,
  "message": "Cannot delete truck with associated sensor data, GPS positions, or alerts. Consider deactivating instead.",
  "data": {
    "device_count": 2,
    "has_gps_data": true,
    "has_tire_data": true,
    "has_alerts": false
  }
}
```

---

## 📱 Devices API

### Create Device
```http
POST /api/devices
Content-Type: application/json
Authorization: Bearer <token>

{
  "truck_id": "uuid-truck-id",
  "sn": "DEV001234567",
  "sim_number": "628123456789"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-device-id",
    "truck_id": "uuid-truck-id",
    "sn": "DEV001234567",
    "sim_number": "628123456789",
    "installed_at": "2025-09-22T04:52:50.000Z",
    "removed_at": null,
    "truck": {
      "id": "uuid-truck-id",
      "name": "Truck Mining 001",
      "code": "T001",
      "model": "Caterpillar 797F"
    }
  },
  "message": "Device created successfully"
}
```

### Get All Devices
```http
GET /api/devices?page=1&limit=50&truck_id=uuid&status=active&search=DEV001
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `truck_id`: Filter by truck ID
- `status`: Filter by status (active/inactive)
- `search`: Search in serial number or SIM number

### Get Device by ID
```http
GET /api/devices/{deviceId}
Authorization: Bearer <token>
```

### Update Device
```http
PUT /api/devices/{deviceId}
Content-Type: application/json
Authorization: Bearer <token>

{
  "truck_id": "new-truck-id",
  "sim_number": "628987654321"
}
```

### Delete Device
```http
DELETE /api/devices/{deviceId}
Authorization: Bearer <token>
```

**Note:** Devices with associated data will be soft-deleted (marked as removed).

---

## 🔧 Sensors API

### Create Sensor
```http
POST /api/devices/sensors
Content-Type: application/json
Authorization: Bearer <token>

{
  "device_id": "uuid-device-id",
  "type": "tire_pressure",
  "position_no": 1,
  "sn": "SENS001234567"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-sensor-id",
    "device_id": "uuid-device-id",
    "type": "tire_pressure",
    "position_no": 1,
    "sn": "SENS001234567",
    "installed_at": "2025-09-22T04:52:50.000Z",
    "removed_at": null,
    "device": {
      "id": "uuid-device-id",
      "sn": "DEV001234567",
      "truck": {
        "id": "uuid-truck-id",
        "name": "Truck Mining 001",
        "code": "T001"
      }
    }
  },
  "message": "Sensor created successfully"
}
```

### Get All Sensors
```http
GET /api/devices/sensors/all?page=1&limit=50&device_id=uuid&type=tire_pressure&status=active
Authorization: Bearer <token>
```

### Get Sensor by ID
```http
GET /api/devices/sensors/{sensorId}
Authorization: Bearer <token>
```

### Update Sensor
```http
PUT /api/devices/sensors/{sensorId}
Content-Type: application/json
Authorization: Bearer <token>

{
  "type": "hub_temperature",
  "position_no": 2
}
```

### Delete Sensor
```http
DELETE /api/devices/sensors/{sensorId}
Authorization: Bearer <token>
```

**Note:** Sensors are soft-deleted (marked as removed).

---

## 👨‍💼 Drivers API

### Create Driver
```http
POST /api/drivers
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "John Driver",
  "phone": "+62812345678",
  "email": "john@example.com",
  "address": "Jl. Driver No. 123",
  "license_number": "LIC123456789",
  "license_type": "SIM A",
  "license_expiry": "2025-12-31",
  "id_card_number": "1234567890123456",
  "vendor_id": 1,
  "status": "aktif"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Driver",
    "phone": "+62812345678",
    "email": "john@example.com",
    "address": "Jl. Driver No. 123",
    "license_number": "LIC123456789",
    "license_type": "SIM A",
    "license_expiry": "2025-12-31T00:00:00.000Z",
    "id_card_number": "1234567890123456",
    "vendor_id": 1,
    "status": "aktif",
    "created_at": "2025-09-22T04:52:50.000Z",
    "updated_at": "2025-09-22T04:52:50.000Z"
  },
  "message": "Driver created successfully"
}
```

### Get All Drivers
```http
GET /api/drivers?page=1&limit=50&status=aktif&vendor_id=1
Authorization: Bearer <token>
```

### Get Driver by ID
```http
GET /api/drivers/{driverId}
Authorization: Bearer <token>
```

### Update Driver
```http
PUT /api/drivers/{driverId}
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Updated Driver Name",
  "phone": "+62812345679",
  "license_expiry": "2026-12-31"
}
```

### Delete Driver (Soft Delete)
```http
DELETE /api/drivers/{driverId}
Authorization: Bearer <token>
```

**Note:** Drivers are soft-deleted by setting status to "nonaktif".

---

## 📊 Common Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

### Validation Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "nama_vendor",
      "message": "Vendor name is required",
      "value": ""
    }
  ]
}
```

### Pagination Response
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "message": "Items retrieved successfully"
}
```

---

## 🔒 HTTP Status Codes

- **200**: Success (GET, PUT)
- **201**: Created (POST)
- **400**: Bad Request (validation errors, business logic errors)
- **401**: Unauthorized (missing/invalid token)
- **404**: Not Found
- **409**: Conflict (duplicate data)
- **500**: Internal Server Error

---

## 🚀 Quick Start Examples

### Frontend Integration Example (JavaScript)

```javascript
// Base API configuration
const API_BASE = 'https://be-tpms.connectis.my.id/api';
const token = localStorage.getItem('authToken');

const apiCall = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    },
    ...options
  });
  return response.json();
};

// Create vendor
const createVendor = async (vendorData) => {
  return apiCall('/vendors', {
    method: 'POST',
    body: JSON.stringify(vendorData)
  });
};

// Get trucks with pagination
const getTrucks = async (page = 1, limit = 50, filters = {}) => {
  const params = new URLSearchParams({
    page,
    limit,
    ...filters
  });
  return apiCall(`/trucks?${params}`);
};

// Update truck status
const updateTruckStatus = async (truckId, status) => {
  return apiCall(`/trucks/${truckId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
};
```

### React Hook Example

```javascript
import { useState, useEffect } from 'react';

const useVendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const response = await apiCall('/vendors');
      if (response.success) {
        setVendors(response.data);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  return { vendors, loading, error, refetch: fetchVendors };
};
```

---

## 📝 Notes

1. **Authentication**: All endpoints require valid JWT token
2. **Validation**: Input validation is enforced on all CREATE/UPDATE operations
3. **Soft Delete**: Entities with historical data use soft delete (marked as inactive/removed)
4. **Relationships**: Foreign key validation ensures data integrity
5. **Pagination**: All list endpoints support pagination with metadata
6. **Search**: Most list endpoints support search functionality
7. **Error Handling**: Comprehensive error responses with appropriate HTTP status codes

This API is designed to be frontend-friendly with consistent response formats and comprehensive validation.
