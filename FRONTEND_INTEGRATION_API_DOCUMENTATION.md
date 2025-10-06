# TPMS Backend API Documentation
## Frontend Integration Guide

### Base Configuration
- **Base URL**: `https://be-tpms.connectis.my.id/api` (Production) / `http://localhost:3001/api` (Development)
- **WebSocket URL**: `wss://be-tpms.connectis.my.id/ws` (Production) / `ws://localhost:3001/ws` (Development)
- **Authentication**: JWT Bearer Token
- **Content-Type**: `application/json`

---

## 🔐 Authentication Endpoints

### POST /api/auth/login
Login to get JWT token for API access.

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "00000000-0000-0000-0000-000000000001",
      "username": "admin",
      "email": "admin@fleet.com",
      "role": "admin"
    }
  }
}
```

### POST /api/auth/logout
Logout (client-side token removal).

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## 🚛 Truck Management Endpoints

### GET /api/trucks
Get all trucks with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 50, max: 200)
- `status` (string): Filter by status (active, inactive, maintenance)
- `search` (string): Search by truck name or code
- `vendor` (string): Filter by vendor name
- `vendorId` (string): Filter by vendor ID
- `hasAlerts` (boolean): Filter trucks with active alerts

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "trucks": [
      {
        "id": "uuid",
        "name": "Truck-001",
        "code": "T001",
        "model": "Caterpillar 797F",
        "year": 2020,
        "status": "active",
        "vendor": {
          "id": "vendor-uuid",
          "nama_vendor": "PT Mining Solutions"
        },
        "currentLocation": {
          "latitude": -6.2088,
          "longitude": 106.8456,
          "timestamp": "2024-01-15T10:30:00Z"
        },
        "alerts": [],
        "fuelLevel": 75.5,
        "lastUpdate": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1000,
      "totalPages": 20,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "message": "Retrieved 50 trucks successfully"
}
```

### GET /api/trucks/realtime/locations
Get real-time truck locations in GeoJSON format.

**Query Parameters:**
- `status` (string): Filter by truck status

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": {
          "truckId": "uuid",
          "truckName": "Truck-001",
          "status": "active",
          "speed": 25.5,
          "heading": 180,
          "fuelLevel": 75.5,
          "lastUpdate": "2024-01-15T10:30:00Z"
        },
        "geometry": {
          "type": "Point",
          "coordinates": [106.8456, -6.2088]
        }
      }
    ]
  },
  "message": "Retrieved 100 truck locations",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### GET /api/trucks/:id
Get specific truck details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Truck-001",
    "code": "T001",
    "model": "Caterpillar 797F",
    "year": 2020,
    "status": "active",
    "vendor": {
      "id": "vendor-uuid",
      "nama_vendor": "PT Mining Solutions"
    },
    "fleet_group": {
      "id": "group-uuid",
      "name": "Mining Fleet A"
    },
    "currentLocation": {
      "latitude": -6.2088,
      "longitude": 106.8456,
      "speed": 25.5,
      "heading": 180,
      "timestamp": "2024-01-15T10:30:00Z"
    },
    "fuelLevel": 75.5,
    "tireConfig": "18R33",
    "alerts": [
      {
        "id": "alert-uuid",
        "type": "tire_pressure_low",
        "severity": 2,
        "message": "Low tire pressure detected",
        "occurredAt": "2024-01-15T09:15:00Z",
        "acknowledged": false
      }
    ],
    "lastUpdate": "2024-01-15T10:30:00Z"
  },
  "message": "Truck details retrieved successfully"
}
```

### GET /api/trucks/:id/tires
Get truck tire pressure data.

**Response:**
```json
{
  "success": true,
  "data": {
    "truckId": "uuid",
    "truckName": "Truck-001",
    "tires": [
      {
        "position": 1,
        "pressure": 850.5,
        "temperature": 45.2,
        "status": "normal",
        "lastUpdate": "2024-01-15T10:30:00Z"
      }
    ],
    "summary": {
      "totalTires": 6,
      "normalTires": 5,
      "warningTires": 1,
      "criticalTires": 0
    }
  },
  "message": "Tire pressure data retrieved successfully"
}
```

### GET /api/trucks/:truckName/locations
Get truck location history by truck name.

**Query Parameters:**
- `timeRange` (string): Time range (1h, 24h, 7d, 30d) - default: 24h
- `limit` (number): Maximum points to return - default: 200
- `minSpeed` (number): Minimum speed filter - default: 0

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "position-id",
      "latitude": -6.2088,
      "longitude": 106.8456,
      "speed": 25.5,
      "heading": 180,
      "hdop": 1.2,
      "timestamp": "2024-01-15T10:30:00Z",
      "source": "gps"
    }
  ],
  "truck": {
    "id": "uuid",
    "truckName": "Truck-001",
    "model": "Caterpillar 797F"
  },
  "track": {
    "type": "Feature",
    "properties": {
      "truckName": "Truck-001",
      "truckId": "uuid",
      "timeRange": "24h",
      "totalPoints": 150
    },
    "geometry": {
      "type": "LineString",
      "coordinates": [[106.8456, -6.2088], [106.8457, -6.2089]]
    }
  },
  "summary": {
    "totalPoints": 150,
    "timeRange": "24 hours",
    "avgSpeed": "23.5"
  }
}
```

### PUT /api/trucks/:id/status
Update truck status.

**Request:**
```json
{
  "status": "maintenance"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "maintenance",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "message": "Truck status updated successfully"
}
```

### POST /api/trucks
Create new truck.

**Request:**
```json
{
  "name": "Truck-002",
  "code": "T002",
  "model": "Caterpillar 797F",
  "year": 2021,
  "tire_config": "18R33",
  "vendor_id": "vendor-uuid",
  "fleet_group_id": "group-uuid"
}
```

---

## 📊 Dashboard Endpoints

### GET /api/dashboard/stats
Get basic dashboard statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "fleet": {
      "total": 1000,
      "active": 850,
      "inactive": 100,
      "maintenance": 50
    },
    "alerts": {
      "unresolved": 25,
      "critical": 5,
      "warning": 15,
      "info": 5
    },
    "fuel": {
      "averageLevel": 68.5,
      "lowFuelCount": 12,
      "criticalFuelCount": 3
    },
    "performance": {
      "averageSpeed": 22.5,
      "totalDistance": 15420.5,
      "activeHours": 18.5
    },
    "metadata": {
      "dataFreshness": "real-time",
      "lastUpdated": "2024-01-15T10:30:00Z",
      "cacheStatus": "live"
    }
  },
  "message": "Dashboard statistics retrieved successfully"
}
```

### GET /api/dashboard/fleet-summary
Get comprehensive fleet summary.

**Response:**
```json
{
  "success": true,
  "data": {
    "fleetOverview": {
      "fleet": {
        "total": 1000,
        "active": 850,
        "inactive": 150
      },
      "alerts": {
        "unresolved": 25
      }
    },
    "recentAlerts": [
      {
        "id": "alert-uuid",
        "type": "tire_pressure_low",
        "severity": 2,
        "message": "Low tire pressure detected",
        "truckName": "Truck-001",
        "createdAt": "2024-01-15T09:15:00Z"
      }
    ],
    "fuelAnalytics": {
      "averageFuel": 68.5,
      "lowFuelCount": 12,
      "criticalFuelCount": 3
    },
    "performance": {
      "averageSpeed": 22.5,
      "maxSpeed": 45.0,
      "averagePayload": 0,
      "totalPayload": 0
    },
    "generatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### GET /api/dashboard/alerts
Get alert summary with time range filtering.

**Query Parameters:**
- `timeRange` (string): Time range (1h, 24h, 7d, 30d) - default: 24h

**Response:**
```json
{
  "success": true,
  "data": {
    "timeRange": "24h",
    "totalAlerts": 45,
    "severityBreakdown": {
      "1": 5,
      "2": 15,
      "3": 20,
      "4": 5
    },
    "topAlertTypes": [
      {
        "type": "tire_pressure_low",
        "count": 15
      },
      {
        "type": "fuel_low",
        "count": 12
      }
    ],
    "generatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## 🔧 Sensor Data Ingestion Endpoints

### POST /api/sensors/tpdata
Ingest tire pressure sensor data.

**Request:**
```json
{
  "sn": "DEVICE123",
  "truckId": "truck-uuid",
  "data": {
    "tireNo": 1,
    "tiprValue": 850.5,
    "tempValue": 45.2,
    "bat": 85
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tire pressure data received successfully",
  "data": {
    "rawDataId": "raw-data-id",
    "deviceSn": "DEVICE123",
    "processingStatus": "queued"
  }
}
```

### POST /api/sensors/device
Ingest GPS and device status data.

**Request:**
```json
{
  "sn": "DEVICE123",
  "data": {
    "lat": -6.2088,
    "lng": 106.8456,
    "bat1": 85,
    "bat2": 78,
    "bat3": 82,
    "lock": 1
  }
}
```

### GET /api/sensors/queue/stats
Get sensor processing queue statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "queue": {
      "totalItems": 1500,
      "pendingItems": 25,
      "processedItems": 1475,
      "oldestItem": "2024-01-15T09:00:00Z",
      "newestItem": "2024-01-15T10:30:00Z"
    },
    "breakdown": {
      "gpsItems": 800,
      "tirePressureItems": 500,
      "hubTempItems": 150,
      "lockStateItems": 50
    }
  }
}
```

---

## 🌐 WebSocket Real-time API

### Connection
Connect to WebSocket server for real-time updates.

**URL:** `ws://localhost:3001/ws` or `wss://be-tpms.connectis.my.id/ws`

### Connection Acknowledgment
Received immediately after connection.

```json
{
  "type": "connection_ack",
  "data": {
    "clientId": "client-uuid",
    "serverTime": "2024-01-15T10:30:00Z",
    "availableSubscriptions": ["truck_updates", "alerts", "dashboard"]
  }
}
```

### Subscribe to Channels
Subscribe to real-time data streams.

**Send:**
```json
{
  "type": "subscribe",
  "channel": "truck_updates",
  "requestId": "req-123"
}
```

**Receive:**
```json
{
  "type": "subscription_ack",
  "requestId": "req-123",
  "data": {
    "channel": "truck_updates",
    "status": "subscribed"
  }
}
```

### Real-time Truck Location Updates
Received every 30 seconds when subscribed to `truck_updates`.

```json
{
  "type": "truck_locations_update",
  "data": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": {
          "truckId": "uuid",
          "truckName": "Truck-001",
          "status": "active",
          "speed": 25.5,
          "fuelLevel": 75.5
        },
        "geometry": {
          "type": "Point",
          "coordinates": [106.8456, -6.2088]
        }
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Real-time Alert Updates
Received when subscribed to `alerts` channel.

```json
{
  "type": "new_alerts",
  "data": [
    {
      "id": "alert-uuid",
      "type": "tire_pressure_low",
      "severity": 2,
      "detail": "Low tire pressure detected",
      "truckName": "Truck-001",
      "occurredAt": "2024-01-15T10:30:00Z"
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Dashboard Updates
Received every minute when subscribed to `dashboard`.

```json
{
  "type": "dashboard_update",
  "data": {
    "fleet": {
      "total": 1000,
      "active": 850,
      "inactive": 150
    },
    "alerts": {
      "unresolved": 25
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Request Truck Details
Get specific truck information via WebSocket.

**Send:**
```json
{
  "type": "get_truck_details",
  "data": {
    "truckId": "truck-uuid"
  },
  "requestId": "req-456"
}
```

**Receive:**
```json
{
  "type": "truck_details",
  "requestId": "req-456",
  "data": {
    "id": "truck-uuid",
    "name": "Truck-001",
    "status": "active",
    "currentLocation": {
      "latitude": -6.2088,
      "longitude": 106.8456
    }
  }
}
```

---

## 🚨 Error Handling

### HTTP Error Responses
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (development only)"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

### WebSocket Error Messages
```json
{
  "type": "error",
  "requestId": "req-123",
  "error": {
    "code": "INVALID_MESSAGE",
    "message": "Invalid JSON format"
  }
}
```

---

## 🔧 Frontend Integration Examples

### JavaScript/React Example
```javascript
// API Client Setup
const API_BASE_URL = 'https://be-tpms.connectis.my.id/api';
const WS_URL = 'wss://be-tpms.connectis.my.id/ws';

class TPMSApiClient {
  constructor() {
    this.token = localStorage.getItem('tpms_token');
    this.ws = null;
  }

  // Authentication
  async login(username, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    if (data.success) {
      this.token = data.data.token;
      localStorage.setItem('tpms_token', this.token);
    }
    return data;
  }

  // Get trucks with filters
  async getTrucks(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE_URL}/trucks?${params}`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return response.json();
  }

  // WebSocket connection
  connectWebSocket() {
    this.ws = new WebSocket(WS_URL);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleWebSocketMessage(message);
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      // Implement reconnection logic
    };
  }

  // Subscribe to real-time updates
  subscribe(channel) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        channel: channel,
        requestId: `req-${Date.now()}`
      }));
    }
  }

  handleWebSocketMessage(message) {
    switch (message.type) {
      case 'truck_locations_update':
        // Update map with new truck positions
        this.updateTruckLocations(message.data);
        break;
      case 'new_alerts':
        // Show new alerts to user
        this.showNewAlerts(message.data);
        break;
      case 'dashboard_update':
        // Update dashboard statistics
        this.updateDashboard(message.data);
        break;
    }
  }
}

// Usage
const client = new TPMSApiClient();

// Login
await client.login('admin', 'admin123');

// Get trucks
const trucks = await client.getTrucks({ status: 'active', limit: 100 });

// Connect WebSocket for real-time updates
client.connectWebSocket();
client.subscribe('truck_updates');
client.subscribe('alerts');
```

---

## 📝 Notes

1. **Authentication**: All protected endpoints require JWT token in Authorization header
2. **Rate Limiting**: API has built-in rate limiting for sensor data ingestion
3. **Real-time Updates**: Use WebSocket for live truck tracking and alerts
4. **Pagination**: Most list endpoints support pagination with `page` and `limit` parameters
5. **Error Handling**: Always check `success` field in response
6. **Data Freshness**: Real-time data is updated every 15-60 seconds depending on the endpoint
7. **CORS**: API supports CORS for web frontend integration

For additional endpoints and detailed parameter specifications, refer to the individual controller files in the codebase.
