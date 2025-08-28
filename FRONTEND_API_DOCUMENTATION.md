# Fleet Management API Documentation for Frontend

## 📋 Overview

This documentation provides comprehensive information for frontend developers to integrate with the Fleet Management backend system. The API includes both REST endpoints and WebSocket real-time communication.

**Base URL**: `http://localhost:3001`  
**WebSocket URL**: `ws://localhost:3001/ws`

---

## 🔐 Authentication

### Login
**POST** `/api/auth/login`

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
      "id": 1,
      "username": "admin",
      "role": "admin"
    }
  }
}
```

### Authorization Header
Include the JWT token in all authenticated requests:
```
Authorization: Bearer <your-jwt-token>
```

---

## 🚛 Truck Management API

### Get All Trucks
**GET** `/api/trucks`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Filter by status (`active`, `inactive`, `maintenance`)
- `minFuel` (optional): Minimum fuel level
- `search` (optional): Search by truck number

**Response:**
```json
{
  "success": true,
  "data": {
    "trucks": [
      {
        "id": 1,
        "truckNumber": "T001",
        "status": "active",
        "fuel": 85.5,
        "location": {
          "latitude": -6.2088,
          "longitude": 106.8456,
          "address": "Jakarta, Indonesia"
        },
        "lastUpdate": "2025-08-28T08:15:30Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 100,
      "items_per_page": 20
    },
    "summary": {
      "total": 100,
      "active": 85,
      "inactive": 10,
      "maintenance": 5
    }
  }
}
```

### Get Specific Truck
**GET** `/api/trucks/{id}`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "truckNumber": "T001",
    "status": "active",
    "fuel": 85.5,
    "location": {
      "latitude": -6.2088,
      "longitude": 106.8456,
      "address": "Jakarta, Indonesia"
    },
    "tirePressures": [
      {
        "position": "front_left",
        "pressure": 32.5,
        "status": "normal"
      }
    ],
    "alerts": [
      {
        "id": 1,
        "type": "low_fuel",
        "severity": "medium",
        "message": "Fuel level below 20%",
        "createdAt": "2025-08-28T08:00:00Z"
      }
    ]
  }
}
```

### Update Truck Status
**PUT** `/api/trucks/{id}/status`

```json
{
  "status": "maintenance"
}
```

### Get Truck Tire Pressures
**GET** `/api/trucks/{id}/tires`

**Response:**
```json
{
  "success": true,
  "data": {
    "truckNumber": "T001",
    "tirePressures": [
      {
        "position": "front_left",
        "pressure": 32.5,
        "status": "normal",
        "lastUpdate": "2025-08-28T08:15:30Z"
      },
      {
        "position": "front_right",
        "pressure": 31.8,
        "status": "normal",
        "lastUpdate": "2025-08-28T08:15:30Z"
      }
    ]
  }
}
```

### Get Real-time Truck Locations (GeoJSON)
**GET** `/api/trucks/realtime/locations`

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [106.8456, -6.2088]
        },
        "properties": {
          "truckNumber": "T001",
          "status": "active",
          "fuel": 85.5,
          "speed": 45.2,
          "heading": 180
        }
      }
    ]
  }
}
```

---

## 🏭 Mining Area API

### Get Mining Area Boundaries
**GET** `/api/mining-area`

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [[[106.8456, -6.2088], [106.8556, -6.2088], [106.8556, -6.1988], [106.8456, -6.1988], [106.8456, -6.2088]]]
        },
        "properties": {
          "name": "Mining Area A",
          "type": "extraction_zone",
          "capacity": 1000
        }
      }
    ]
  }
}
```

---

## 📊 Dashboard API

### Get Dashboard Statistics
**GET** `/api/dashboard/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTrucks": 100,
    "activeTrucks": 85,
    "inactiveTrucks": 10,
    "maintenanceTrucks": 5,
    "averageFuel": 72.5,
    "alertsCount": 12,
    "todayDistance": 15420.5,
    "fuelConsumption": 2850.3
  }
}
```

---

## 🔌 WebSocket Real-time API

### Connection
Connect to: `ws://localhost:3001/ws`

### Message Format
All WebSocket messages use JSON format:
```json
{
  "type": "message_type",
  "data": { /* message data */ },
  "requestId": "unique-request-id",
  "timestamp": "2025-08-28T08:15:30Z"
}
```

### Client Messages (Send to Server)

#### 1. Subscribe to Channel
```json
{
  "type": "subscribe",
  "data": {
    "channel": "truck_updates"
  },
  "requestId": "sub-001"
}
```

**Available Channels:**
- `truck_updates`: Real-time truck location and status updates
- `alerts`: New alerts and alert resolutions
- `dashboard`: Dashboard statistics updates

#### 2. Unsubscribe from Channel
```json
{
  "type": "unsubscribe",
  "data": {
    "channel": "truck_updates"
  },
  "requestId": "unsub-001"
}
```

#### 3. Get Trucks Data
```json
{
  "type": "get_trucks",
  "data": {
    "filters": {
      "status": "active",
      "limit": 10
    }
  },
  "requestId": "trucks-001"
}
```

#### 4. Get Dashboard Data
```json
{
  "type": "get_dashboard",
  "requestId": "dash-001"
}
```

#### 5. Ping (Health Check)
```json
{
  "type": "ping",
  "requestId": "ping-001"
}
```

### Server Messages (Receive from Server)

#### 1. Connection Acknowledgment
```json
{
  "type": "connection_ack",
  "data": {
    "clientId": "client-uuid",
    "serverTime": "2025-08-28T08:15:30Z",
    "availableSubscriptions": ["truck_updates", "alerts", "dashboard"]
  }
}
```

#### 2. Subscription Acknowledgment
```json
{
  "type": "subscription_ack",
  "requestId": "sub-001",
  "data": {
    "channel": "truck_updates",
    "status": "subscribed"
  }
}
```

#### 3. Truck Location Updates
```json
{
  "type": "truck_locations_update",
  "data": [
    {
      "truckId": 1,
      "truckNumber": "T001",
      "latitude": -6.2088,
      "longitude": 106.8456,
      "status": "active",
      "fuel": 85.5,
      "speed": 45.2,
      "heading": 180
    }
  ],
  "timestamp": "2025-08-28T08:15:30Z"
}
```

#### 4. New Alerts
```json
{
  "type": "new_alerts",
  "data": [
    {
      "id": 123,
      "type": "low_fuel",
      "severity": "medium",
      "message": "Fuel level below 20%",
      "truckNumber": "T001",
      "createdAt": "2025-08-28T08:15:30Z"
    }
  ],
  "timestamp": "2025-08-28T08:15:30Z"
}
```

#### 5. Dashboard Updates
```json
{
  "type": "dashboard_update",
  "data": {
    "fleet": {
      "total": 100,
      "active": 85,
      "inactive": 15
    },
    "alerts": {
      "unresolved": 12
    },
    "maintenance": {
      "recentCount": 3
    }
  },
  "timestamp": "2025-08-28T08:15:30Z"
}
```

#### 6. Error Messages
```json
{
  "type": "error",
  "requestId": "req-001",
  "error": {
    "code": "INVALID_MESSAGE",
    "message": "Invalid JSON format"
  }
}
```

---

## 💻 Frontend Integration Examples

### JavaScript WebSocket Client
```javascript
class FleetWebSocketClient {
  constructor(url, token) {
    this.url = url;
    this.token = token;
    this.ws = null;
    this.subscriptions = new Set();
  }

  connect() {
    this.ws = new WebSocket(this.url);
    
    this.ws.onopen = () => {
      console.log('Connected to Fleet Management WebSocket');
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket connection closed');
      // Implement reconnection logic
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  subscribe(channel) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        data: { channel },
        requestId: `sub-${Date.now()}`
      }));
      this.subscriptions.add(channel);
    }
  }

  handleMessage(message) {
    switch (message.type) {
      case 'truck_locations_update':
        this.onTruckLocationUpdate(message.data);
        break;
      case 'new_alerts':
        this.onNewAlerts(message.data);
        break;
      case 'dashboard_update':
        this.onDashboardUpdate(message.data);
        break;
    }
  }

  onTruckLocationUpdate(trucks) {
    // Update map markers
    trucks.forEach(truck => {
      updateTruckMarker(truck);
    });
  }

  onNewAlerts(alerts) {
    // Show notifications
    alerts.forEach(alert => {
      showNotification(alert);
    });
  }

  onDashboardUpdate(data) {
    // Update dashboard widgets
    updateDashboardStats(data);
  }
}

// Usage
const client = new FleetWebSocketClient('ws://localhost:3001/ws', 'your-jwt-token');
client.connect();
client.subscribe('truck_updates');
client.subscribe('alerts');
```

### React Hook Example
```javascript
import { useState, useEffect, useRef } from 'react';

export const useFleetWebSocket = (url, token) => {
  const [isConnected, setIsConnected] = useState(false);
  const [trucks, setTrucks] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket(url);
    
    ws.current.onopen = () => {
      setIsConnected(true);
      // Subscribe to channels
      ws.current.send(JSON.stringify({
        type: 'subscribe',
        data: { channel: 'truck_updates' },
        requestId: 'sub-trucks'
      }));
    };
    
    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'truck_locations_update') {
        setTrucks(message.data);
      } else if (message.type === 'new_alerts') {
        setAlerts(prev => [...prev, ...message.data]);
      }
    };
    
    ws.current.onclose = () => {
      setIsConnected(false);
    };
    
    return () => {
      ws.current.close();
    };
  }, [url]);

  return { isConnected, trucks, alerts };
};
```

---

## 🚨 Error Handling

### HTTP Error Responses
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Detailed error information"
  }
}
```

### Common HTTP Status Codes
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized (invalid or missing token)
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

### WebSocket Error Codes
- `INVALID_MESSAGE`: Malformed JSON message
- `UNKNOWN_MESSAGE_TYPE`: Unsupported message type
- `INTERNAL_ERROR`: Server-side error
- `UNAUTHORIZED`: Invalid authentication

---

## 🔄 Rate Limiting

API endpoints are rate-limited to prevent abuse:
- **Authentication**: 5 requests per minute
- **General API**: 100 requests per minute
- **WebSocket**: No rate limiting on messages

---

## 🧪 Testing

Use the provided test script to verify API functionality:
```bash
npm run test:api
```

For load testing:
```bash
npm run test:load -- --users 20 --duration 60
```

---

## 📞 Support

For technical support or questions about the API, please refer to:
- **Repository**: Fleet Management Backend
- **Environment**: Development (`localhost:3001`)
- **WebSocket Path**: `/ws`

---

*Last updated: 2025-08-28*
