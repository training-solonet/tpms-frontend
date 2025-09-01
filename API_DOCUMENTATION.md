# Fleet Management System - Complete API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Database Schema](#database-schema)
4. [REST API Endpoints](#rest-api-endpoints)
5. [WebSocket API](#websocket-api)
6. [Environment Variables](#environment-variables)
7. [Error Handling](#error-handling)
8. [Frontend Integration Guide](#frontend-integration-guide)

---

## Overview

**Base URL:** `http://localhost:3001/api`  
**WebSocket URL:** `ws://localhost:3001/ws`  
**Server Version:** 2.0.0  
**Database:** PostgreSQL with PostGIS extension  
**Authentication:** JWT Bearer Token  
**Real-time:** Native WebSocket implementation  

### Key Features
- Real-time truck location tracking
- Alert management system
- Dashboard analytics
- Mining zone management
- Tire pressure monitoring
- Maintenance tracking
- Admin activity logging

---

## Authentication

### JWT Token Authentication
All API endpoints (except `/health` and `/api/auth/login`) require JWT authentication.

**Header Format:**
```
Authorization: Bearer <jwt_token>
```

**Token Payload:**
```json
{
  "userId": 1,
  "username": "admin",
  "role": "admin",
  "iat": 1640995200,
  "exp": 1641081600
}
```

**Token Expiry:** 24 hours

### Demo Credentials
```json
{
  "username": "admin",
  "password": "admin123"
}
```

---

## Database Schema

### Core Tables

#### Users
```sql
Table: users
- id: SERIAL PRIMARY KEY
- username: VARCHAR(50) UNIQUE
- email: VARCHAR(100) UNIQUE  
- password_hash: VARCHAR(255)
- role: VARCHAR(20) DEFAULT 'operator'
- is_active: BOOLEAN DEFAULT true
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### Trucks
```sql
Table: trucks
- id: SERIAL PRIMARY KEY
- truck_number: VARCHAR(20) UNIQUE
- model_id: INTEGER (FK to truck_models)
- status: ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE')
- latitude: DECIMAL(10,8)
- longitude: DECIMAL(11,8)
- speed: DECIMAL(5,2)
- heading: INTEGER
- fuel_percentage: DECIMAL(5,2)
- payload_tons: DECIMAL(6,2)
- driver_name: VARCHAR(100)
- engine_hours: INTEGER
- odometer: INTEGER
- last_maintenance: DATE
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### Truck Models
```sql
Table: truck_models
- id: SERIAL PRIMARY KEY
- name: VARCHAR(50)
- manufacturer: VARCHAR(50)
- capacity_tons: INTEGER
- fuel_tank_capacity: INTEGER
- tire_count: INTEGER DEFAULT 6
- created_at: TIMESTAMP
```

#### Tire Pressures
```sql
Table: tire_pressures
- id: SERIAL PRIMARY KEY
- truck_id: INTEGER (FK to trucks)
- tire_position: VARCHAR(20)
- tire_number: INTEGER
- pressure_psi: DECIMAL(5,1)
- status: ENUM('NORMAL', 'LOW', 'HIGH')
- temperature: DECIMAL(5,2)
- recorded_at: TIMESTAMP
```

#### Truck Alerts
```sql
Table: truck_alerts
- id: SERIAL PRIMARY KEY
- truck_id: INTEGER (FK to trucks)
- alert_type: VARCHAR(50)
- severity: ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
- message: TEXT
- is_resolved: BOOLEAN DEFAULT false
- created_at: TIMESTAMP
- resolved_at: TIMESTAMP
```

#### Location History
```sql
Table: location_history
- id: SERIAL PRIMARY KEY
- truck_id: INTEGER (FK to trucks)
- latitude: DECIMAL(10,8)
- longitude: DECIMAL(11,8)
- speed: DECIMAL(5,2)
- heading: INTEGER
- fuel_percentage: DECIMAL(5,2)
- recorded_at: TIMESTAMP
```

#### Mining Zones
```sql
Table: mining_zones
- id: SERIAL PRIMARY KEY
- name: VARCHAR(100)
- zone_type: VARCHAR(50)
- is_active: BOOLEAN DEFAULT true
- created_at: TIMESTAMP
-- Note: PostGIS GEOMETRY field handled via raw SQL
```

#### Maintenance Records
```sql
Table: maintenance_records
- id: SERIAL PRIMARY KEY
- truck_id: INTEGER (FK to trucks)
- maintenance_type: VARCHAR(50)
- description: TEXT
- start_date: TIMESTAMP
- end_date: TIMESTAMP
- cost: DECIMAL(10,2)
- technician_name: VARCHAR(100)
- is_completed: BOOLEAN DEFAULT false
- created_at: TIMESTAMP
```

---

## REST API Endpoints

### Health Check

#### GET /health
Check server health status (no authentication required).

**Response:**
```json
{
  "success": true,
  "message": "Fleet Management Server is running",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "server_ip": "127.0.0.1",
  "client_ip": "127.0.0.1"
}
```

### Authentication Endpoints

#### POST /api/auth/login
Authenticate user and receive JWT token.

**Request Body:**
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
      "email": "admin@fleet.com",
      "role": "admin"
    }
  }
}
```

#### POST /api/auth/logout
Logout user (client-side token removal).

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### Truck Endpoints

#### GET /api/trucks
Get all trucks with optional filters.

**Query Parameters:**
- `status`: Filter by truck status (ACTIVE, INACTIVE, MAINTENANCE)
- `limit`: Number of results (default: 100)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "truckNumber": "T001",
      "status": "ACTIVE",
      "latitude": "-6.200000",
      "longitude": "106.816666",
      "speed": "45.50",
      "heading": 180,
      "fuelPercentage": "85.50",
      "payloadTons": "25.00",
      "driverName": "John Doe",
      "engineHours": 1250,
      "odometer": 45000,
      "lastMaintenance": "2024-01-15"
    }
  ]
}
```

#### GET /api/trucks/realtime/locations
Get real-time truck locations in GeoJSON format.

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
          "coordinates": [106.816666, -6.200000]
        },
        "properties": {
          "truckId": 1,
          "truckNumber": "T001",
          "status": "ACTIVE",
          "speed": 45.5,
          "heading": 180,
          "fuelPercentage": 85.5,
          "driverName": "John Doe"
        }
      }
    ]
  }
}
```

#### GET /api/trucks/:id
Get specific truck details.

#### GET /api/trucks/:id/tires
Get truck tire pressure data.

#### GET /api/trucks/:id/history
Get truck location history.

#### GET /api/trucks/:id/alerts
Get truck alerts.

#### PUT /api/trucks/:id/status
Update truck status.

**Request Body:**
```json
{
  "status": "MAINTENANCE"
}
```

#### PUT /api/trucks/:id/alerts/:alertId/resolve
Resolve a truck alert.

### Dashboard Endpoints

#### GET /api/dashboard/stats
Get basic dashboard statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "fleet": {
      "total": 1000,
      "active": 850,
      "inactive": 150
    },
    "alerts": {
      "unresolved": 35
    }
  }
}
```

#### GET /api/dashboard/fleet-summary
Get comprehensive fleet summary.

#### GET /api/dashboard/alerts
Get alert summary.

#### GET /api/dashboard/fuel
Get fuel report.

#### GET /api/dashboard/maintenance
Get maintenance report.

### Mining Area Endpoints

#### GET /api/mining-area
Get all mining areas in GeoJSON format.

#### GET /api/mining-area/:zoneName/trucks
Get trucks in specific mining zone.

#### GET /api/mining-area/statistics
Get zone statistics.

#### POST /api/mining-area
Create new mining zone.

#### PUT /api/mining-area/:zoneId
Update mining zone.

#### DELETE /api/mining-area/:zoneId
Delete/deactivate mining zone.

---

## WebSocket API

### Connection
Connect to WebSocket server at `ws://localhost:3001/ws`

### Message Format
All WebSocket messages use JSON format:

```json
{
  "type": "message_type",
  "data": {},
  "requestId": "optional_request_id",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Connection Flow

#### 1. Connection Acknowledgment
Server sends upon successful connection:

```json
{
  "type": "connection_ack",
  "data": {
    "clientId": "550e8400-e29b-41d4-a716-446655440000",
    "serverTime": "2024-01-01T12:00:00.000Z",
    "availableSubscriptions": ["truck_updates", "alerts", "dashboard"]
  }
}
```

#### 2. Subscribe to Channels
Client sends subscription request:

```json
{
  "type": "subscribe",
  "channel": "truck_updates",
  "requestId": "req_001"
}
```

Server confirms subscription:

```json
{
  "type": "subscription_ack",
  "requestId": "req_001",
  "data": {
    "channel": "truck_updates",
    "status": "subscribed"
  }
}
```

### Available Subscriptions

#### truck_updates
Real-time truck location and status updates.

**Update Messages:**
```json
{
  "type": "truck_locations_update",
  "data": [
    {
      "truckId": 1,
      "truckNumber": "T001",
      "latitude": -6.200000,
      "longitude": 106.816666,
      "speed": 45.5,
      "heading": 180,
      "fuelPercentage": 85.5,
      "status": "ACTIVE"
    }
  ]
}
```

#### alerts
Real-time alert notifications.

**Alert Messages:**
```json
{
  "type": "new_alerts",
  "data": [
    {
      "id": 1,
      "type": "low_fuel",
      "severity": "MEDIUM",
      "message": "Fuel level below 20%",
      "truckNumber": "T001"
    }
  ]
}
```

#### dashboard
Real-time dashboard updates.

### Client Commands

#### Ping/Pong
```json
{
  "type": "ping",
  "requestId": "ping_001"
}
```

#### Get Trucks
```json
{
  "type": "get_trucks",
  "data": {
    "filters": {
      "status": "ACTIVE"
    }
  }
}
```

#### Update Truck Status
```json
{
  "type": "update_truck_status",
  "data": {
    "truckId": 1,
    "status": "MAINTENANCE"
  }
}
```

#### Resolve Alert
```json
{
  "type": "resolve_alert",
  "data": {
    "alertId": 1
  }
}
```

### Update Frequencies
- **Truck Locations:** Every 30 seconds
- **Alerts:** Every 15 seconds  
- **Dashboard:** Every 60 seconds
- **Connection Health:** Every 30 seconds (ping/pong)

---

## Environment Variables

Create `.env` file in project root:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/fleet_management"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN="*"

# Admin Configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_EMAIL=admin@fleet.com
```

---

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional error details"
  }
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

### Common Error Codes
- `VALIDATION_ERROR` - Request validation failed
- `AUTHENTICATION_REQUIRED` - JWT token missing
- `INVALID_TOKEN` - JWT token invalid or expired
- `RESOURCE_NOT_FOUND` - Requested resource not found
- `DATABASE_ERROR` - Database operation failed
- `WEBSOCKET_ERROR` - WebSocket connection error

---

## Frontend Integration Guide

### 1. Authentication Setup

```javascript
// Login function
async function login(username, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  if (data.success) {
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
  }
  return data;
}

// API request with authentication
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  };
  
  const response = await fetch(`/api${endpoint}`, config);
  return response.json();
}
```

### 2. WebSocket Connection

```javascript
class FleetWebSocket {
  constructor() {
    this.ws = null;
    this.subscriptions = new Set();
    this.messageHandlers = new Map();
  }
  
  connect() {
    this.ws = new WebSocket('ws://localhost:3001/ws');
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      // Implement reconnection logic
    };
  }
  
  subscribe(channel, handler) {
    this.send({
      type: 'subscribe',
      channel: channel
    });
    
    this.messageHandlers.set(channel, handler);
    this.subscriptions.add(channel);
  }
  
  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
  
  handleMessage(message) {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message.data);
    }
  }
}

// Usage example
const fleetWS = new FleetWebSocket();
fleetWS.connect();

// Subscribe to truck updates
fleetWS.subscribe('truck_updates', (data) => {
  updateTruckMarkers(data);
});

// Subscribe to alerts
fleetWS.subscribe('alerts', (alerts) => {
  showAlertNotifications(alerts);
});
```

### 3. Map Integration Example

```javascript
// Initialize map
const map = L.map('map').setView([-6.2, 106.816666], 10);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

const truckMarkers = new Map();

// Update truck markers
function updateTruckMarkers(trucks) {
  trucks.forEach(truck => {
    const { truckId, truckNumber, latitude, longitude, status } = truck;
    
    if (truckMarkers.has(truckId)) {
      // Update existing marker
      const marker = truckMarkers.get(truckId);
      marker.setLatLng([latitude, longitude]);
      marker.setPopupContent(`${truckNumber} - ${status}`);
    } else {
      // Create new marker
      const marker = L.marker([latitude, longitude])
        .bindPopup(`${truckNumber} - ${status}`)
        .addTo(map);
      truckMarkers.set(truckId, marker);
    }
  });
}
```

### 4. Dashboard Components

```javascript
// Dashboard data fetching
async function loadDashboardData() {
  try {
    const [stats, alerts] = await Promise.all([
      apiRequest('/dashboard/stats'),
      apiRequest('/dashboard/alerts')
    ]);
    
    updateDashboardStats(stats.data);
    updateAlertsSummary(alerts.data);
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
  }
}

// Update dashboard stats
function updateDashboardStats(data) {
  document.getElementById('total-trucks').textContent = data.fleet.total;
  document.getElementById('active-trucks').textContent = data.fleet.active;
  document.getElementById('inactive-trucks').textContent = data.fleet.inactive;
  document.getElementById('unresolved-alerts').textContent = data.alerts.unresolved;
}
```

---

## Quick Start

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Test API endpoints:**
   ```bash
   curl http://localhost:3001/health
   ```

3. **Login and get token:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'
   ```

4. **Connect to WebSocket:**
   ```javascript
   const ws = new WebSocket('ws://localhost:3001/ws');
   ```

5. **Subscribe to real-time updates:**
   ```javascript
   ws.send(JSON.stringify({
     type: 'subscribe',
     channel: 'truck_updates'
   }));
   ```

---

## Support

For technical support or questions about the API, please refer to:
- Server logs: `log/server.log`
- Admin activity logs: `log/admin-activity.log`
- Database schema: `prisma/schema.prisma`
- API tests: `test/` directory

**Server Status:** Production-ready for frontend integration  
**Last Updated:** January 2024
