<!-- API Documentation -->

<!-- GET -->
{
    "name": "Fleet Management API",
    "version": "2.0.0",
    "description": "Mining truck fleet management system with Prisma integration",
    "status": "running",
    "database": "connected",
    "endpoints": {
        "health": "/health",
        "status": "/api/status",
        "auth": "/api/auth",
        "trucks": "/api/trucks",
        "dashboard": "/api/dashboard",
        "miningArea": "/api/mining-area"
    },
    "websocket": {
        "enabled": true,
        "events": [
            "trucksLocationUpdate",
            "newAlerts",
            "truckStatusUpdate"
        ]
    },
    "documentation": "https://github.com/your-repo/fleet-management-api"
}


# Fleet Management System - API Documentation

## Overview
RESTful API for Fleet Management System with real-time tracking, monitoring, and analytics capabilities.

**Base URL:** `http://localhost:3001/api`  
**API Version:** v1  
**Authentication:** JWT Bearer Token  
**Content-Type:** `application/json`

---

## Authentication

### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@company.com",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

### Register
```http
POST /auth/register
```

**Request Body:**
```json
{
  "username": "newuser",
  "email": "user@company.com",
  "password": "password123",
  "role": "operator"
}
```

### Refresh Token
```http
POST /auth/refresh
```

**Headers:**
```
Authorization: Bearer <token>
```

---

## Dashboard APIs

### Dashboard Overview
Get comprehensive dashboard statistics.

```http
GET /dashboard/overview
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalTrucks": 125,
      "activeTrucks": 98,
      "inactiveTrucks": 15,
      "maintenanceTrucks": 12,
      "averageFuelLevel": 67.5,
      "totalPayload": 2840.75,
      "activeAlerts": 23
    },
    "recentActivity": {
      "totalMovements": 1524,
      "averageSpeed": 28.4,
      "fuelConsumption": 1250.5,
      "maintenancesDue": 8
    },
    "systemHealth": {
      "dataLatency": "1.2s",
      "apiResponseTime": "120ms",
      "databaseConnections": 5,
      "lastUpdate": "2025-01-15T10:30:00Z"
    }
  }
}
```

### Fleet Status Distribution
```http
GET /dashboard/fleet-status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "statusDistribution": [
      { "status": "ACTIVE", "count": 98, "percentage": 78.4 },
      { "status": "INACTIVE", "count": 15, "percentage": 12.0 },
      { "status": "MAINTENANCE", "count": 12, "percentage": 9.6 }
    ],
    "hourlyActivity": [
      { "hour": 6, "activeTrucks": 45, "avgSpeed": 12.5 },
      { "hour": 7, "activeTrucks": 78, "avgSpeed": 25.3 },
      { "hour": 8, "activeTrucks": 95, "avgSpeed": 32.1 }
    ]
  }
}
```

---

## Truck Management APIs

### Get All Trucks
```http
GET /trucks
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Records per page (default: 20)
- `status` (string): Filter by status (ACTIVE, INACTIVE, MAINTENANCE)
- `search` (string): Search by truck number or driver name
- `sortBy` (string): Sort field (truckNumber, status, lastUpdate)
- `sortOrder` (string): Sort direction (asc, desc)

**Example:**
```http
GET /trucks?page=1&limit=10&status=ACTIVE&search=TR001&sortBy=truckNumber&sortOrder=asc
```

**Response:**
```json
{
  "success": true,
  "data": {
    "trucks": [
      {
        "id": 1,
        "truckNumber": "TR001",
        "status": "ACTIVE",
        "location": {
          "latitude": -3.545400,
          "longitude": 115.604400,
          "lastUpdate": "2025-01-15T10:28:00Z"
        },
        "movement": {
          "speed": 25.5,
          "heading": 145,
          "isMoving": true
        },
        "fuel": {
          "percentage": 75.2,
          "status": "normal",
          "estimatedRange": 285
        },
        "payload": {
          "currentTons": 45.5,
          "capacityTons": 60.0,
          "utilizationPercent": 75.8
        },
        "driver": {
          "name": "John Smith",
          "contactNumber": "+62812345678"
        },
        "model": {
          "name": "Caterpillar 797F",
          "manufacturer": "Caterpillar",
          "capacity": 60
        },
        "maintenance": {
          "lastService": "2025-01-10T00:00:00Z",
          "nextServiceDue": "2025-02-10T00:00:00Z",
          "engineHours": 2450,
          "odometer": 125670
        },
        "alerts": {
          "activeCount": 2,
          "highPriorityCount": 0,
          "lastAlert": "2025-01-15T09:15:00Z"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 13,
      "totalRecords": 125,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Get Single Truck
```http
GET /trucks/{truckId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "truck": {
      "id": 1,
      "truckNumber": "TR001",
      "status": "ACTIVE",
      "currentLocation": {
        "latitude": -3.545400,
        "longitude": 115.604400,
        "address": "Main Pit Area, Mining Zone A",
        "lastUpdate": "2025-01-15T10:28:00Z"
      },
      "realTimeData": {
        "speed": 25.5,
        "heading": 145,
        "fuelPercentage": 75.2,
        "payloadTons": 45.5,
        "engineRPM": 1800,
        "engineTemperature": 82.5,
        "isMoving": true
      },
      "specifications": {
        "model": {
          "name": "Caterpillar 797F",
          "manufacturer": "Caterpillar",
          "year": 2022,
          "capacity": 60,
          "fuelTankCapacity": 1200,
          "tireCount": 6
        }
      },
      "operational": {
        "driver": {
          "name": "John Smith",
          "license": "B2-123456",
          "contactNumber": "+62812345678",
          "shiftStart": "2025-01-15T06:00:00Z"
        },
        "shift": {
          "type": "day",
          "startTime": "06:00",
          "endTime": "18:00"
        }
      },
      "maintenance": {
        "lastService": "2025-01-10T00:00:00Z",
        "nextServiceDue": "2025-02-10T00:00:00Z",
        "serviceInterval": 500,
        "engineHours": 2450,
        "odometer": 125670,
        "maintenanceStatus": "good"
      },
      "alerts": {
        "activeAlerts": 2,
        "criticalAlerts": 0,
        "recentAlerts": [
          {
            "id": 101,
            "type": "maintenance_reminder",
            "severity": "medium",
            "message": "Scheduled maintenance due in 5 days",
            "createdAt": "2025-01-15T09:15:00Z",
            "isResolved": false
          }
        ]
      }
    }
  }
}
```

### Update Truck Status
```http
PATCH /trucks/{truckId}/status
```

**Request Body:**
```json
{
  "status": "MAINTENANCE",
  "reason": "Scheduled maintenance",
  "estimatedDowntime": 240
}
```

### Assign Driver
```http
PATCH /trucks/{truckId}/driver
```

**Request Body:**
```json
{
  "driverName": "Mike Johnson",
  "contactNumber": "+62812345679",
  "shiftType": "night"
}
```

---

## Real-Time Tracking APIs

### Get Live Locations
```http
GET /tracking/live
```

**Query Parameters:**
- `bounds` (string): Geographic bounds (minLat,minLng,maxLat,maxLng)
- `status` (string): Filter by status
- `lastUpdate` (string): Only trucks updated after this time

**Response:**
```json
{
  "success": true,
  "data": {
    "livePositions": [
      {
        "truckId": 1,
        "truckNumber": "TR001",
        "position": {
          "latitude": -3.545400,
          "longitude": 115.604400,
          "heading": 145,
          "speed": 25.5,
          "timestamp": "2025-01-15T10:28:00Z"
        },
        "status": "ACTIVE",
        "fuel": 75.2,
        "payload": 45.5,
        "isMoving": true
      }
    ],
    "lastUpdate": "2025-01-15T10:28:30Z",
    "totalTracked": 98
  }
}
```

### Get Truck Route History
```http
GET /tracking/history/{truckId}
```

**Query Parameters:**
- `startDate` (string): Start date (ISO format)
- `endDate` (string): End date (ISO format)
- `interval` (number): Data interval in minutes (default: 5)

**Response:**
```json
{
  "success": true,
  "data": {
    "route": [
      {
        "latitude": -3.545400,
        "longitude": 115.604400,
        "speed": 25.5,
        "heading": 145,
        "fuelPercentage": 75.2,
        "timestamp": "2025-01-15T10:00:00Z"
      },
      {
        "latitude": -3.545500,
        "longitude": 115.604500,
        "speed": 28.1,
        "heading": 150,
        "fuelPercentage": 75.1,
        "timestamp": "2025-01-15T10:05:00Z"
      }
    ],
    "summary": {
      "totalDistance": 25.7,
      "averageSpeed": 26.8,
      "maxSpeed": 45.2,
      "fuelConsumed": 12.5,
      "duration": "8h 15m",
      "stops": 3
    }
  }
}
```

### Get Fleet Heatmap
```http
GET /tracking/heatmap
```

**Query Parameters:**
- `timeRange` (string): Time range (1h, 6h, 24h, 7d, 30d)
- `bounds` (string): Geographic bounds

**Response:**
```json
{
  "success": true,
  "data": {
    "heatmapData": [
      {
        "latitude": -3.545400,
        "longitude": 115.604400,
        "intensity": 0.8,
        "count": 145
      }
    ],
    "metadata": {
      "totalPoints": 1250,
      "timeRange": "24h",
      "generatedAt": "2025-01-15T10:30:00Z"
    }
  }
}
```

---

## Analytics APIs

### Fleet Performance
```http
GET /analytics/performance
```

**Query Parameters:**
- `period` (string): Time period (today, week, month, custom)
- `startDate` (string): Start date for custom period
- `endDate` (string): End date for custom period

**Response:**
```json
{
  "success": true,
  "data": {
    "performance": {
      "productivity": {
        "totalOperatingHours": 1856,
        "averageUtilization": 78.5,
        "peakHours": [8, 9, 10, 14, 15, 16],
        "downtime": 245
      },
      "efficiency": {
        "fuelEfficiency": 2.3,
        "averageSpeed": 28.4,
        "payloadUtilization": 82.1,
        "routeOptimization": 76.8
      },
      "maintenance": {
        "scheduledMaintenance": 15,
        "unscheduledMaintenance": 8,
        "averageRepairTime": 4.2,
        "maintenanceCost": 125000
      }
    },
    "trends": {
      "daily": [
        { "date": "2025-01-14", "utilization": 76.2, "efficiency": 81.5 },
        { "date": "2025-01-15", "utilization": 78.5, "efficiency": 83.1 }
      ]
    }
  }
}
```

### Fuel Analytics
```http
GET /analytics/fuel
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fuelAnalytics": {
      "consumption": {
        "totalConsumed": 15750.5,
        "averageConsumption": 126.0,
        "efficiencyRating": "B+",
        "costEstimate": 47251.50
      },
      "trends": {
        "hourly": [
          { "hour": 6, "consumption": 145.2 },
          { "hour": 7, "consumption": 189.7 }
        ],
        "weekly": [
          { "week": "2025-W02", "consumption": 8950.2, "cost": 26850.60 }
        ]
      },
      "alerts": {
        "lowFuelTrucks": 3,
        "inefficientTrucks": 5,
        "fuelTheftSuspected": 0
      }
    }
  }
}
```

### Operational Reports
```http
GET /analytics/reports/{reportType}
```

**Report Types:**
- `daily-summary`
- `fleet-utilization`
- `maintenance-schedule`
- `fuel-consumption`
- `driver-performance`

**Query Parameters:**
- `date` (string): Report date
- `format` (string): Response format (json, pdf, excel)

---

## Alert Management APIs

### Get Alerts
```http
GET /alerts
```

**Query Parameters:**
- `severity` (string): Filter by severity (LOW, MEDIUM, HIGH, CRITICAL)
- `type` (string): Filter by alert type
- `status` (string): Filter by status (active, resolved)
- `truckId` (number): Filter by truck
- `page` (number): Page number
- `limit` (number): Records per page

**Response:**
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": 101,
        "truckId": 1,
        "truckNumber": "TR001",
        "type": "low_fuel",
        "severity": "HIGH",
        "message": "Fuel level critically low: 8.5%",
        "location": {
          "latitude": -3.545400,
          "longitude": 115.604400,
          "zone": "Transport Route A"
        },
        "isResolved": false,
        "createdAt": "2025-01-15T10:15:00Z",
        "updatedAt": "2025-01-15T10:15:00Z",
        "resolvedAt": null,
        "acknowledgedBy": null,
        "priority": 1
      }
    ],
    "summary": {
      "total": 23,
      "critical": 2,
      "high": 8,
      "medium": 11,
      "low": 2,
      "unresolved": 21
    },
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "hasNext": true
    }
  }
}
```

### Create Manual Alert
```http
POST /alerts
```

**Request Body:**
```json
{
  "truckId": 1,
  "type": "manual_inspection",
  "severity": "MEDIUM",
  "message": "Routine inspection required",
  "description": "Driver reported unusual engine noise",
  "location": {
    "latitude": -3.545400,
    "longitude": 115.604400
  }
}
```

### Resolve Alert
```http
PATCH /alerts/{alertId}/resolve
```

**Request Body:**
```json
{
  "resolution": "Fuel tank refilled to 95%",
  "resolvedBy": "operator1",
  "actionsTaken": ["Dispatched fuel truck", "Refueled vehicle"]
}
```

### Acknowledge Alert
```http
PATCH /alerts/{alertId}/acknowledge
```

**Request Body:**
```json
{
  "acknowledgedBy": "supervisor1",
  "notes": "Maintenance team notified"
}
```

---

## Maintenance APIs

### Get Maintenance Records
```http
GET /maintenance
```

**Query Parameters:**
- `truckId` (number): Filter by truck
- `status` (string): Filter by status (pending, in_progress, completed)
- `type` (string): Maintenance type
- `startDate` (string): Start date range
- `endDate` (string): End date range

**Response:**
```json
{
  "success": true,
  "data": {
    "maintenanceRecords": [
      {
        "id": 201,
        "truckId": 1,
        "truckNumber": "TR001",
        "type": "scheduled_service",
        "description": "500-hour maintenance service",
        "status": "completed",
        "priority": "medium",
        "scheduledDate": "2025-01-10T08:00:00Z",
        "startDate": "2025-01-10T08:15:00Z",
        "endDate": "2025-01-10T16:30:00Z",
        "duration": "8h 15m",
        "technician": {
          "name": "Robert Chen",
          "id": "TECH001",
          "specialization": "Heavy Machinery"
        },
        "tasks": [
          {
            "id": 1,
            "description": "Oil change",
            "status": "completed",
            "duration": "45m"
          },
          {
            "id": 2,
            "description": "Tire inspection",
            "status": "completed",
            "duration": "30m"
          }
        ],
        "parts": [
          {
            "partNumber": "OIL-15W40-20L",
            "description": "Engine Oil 15W-40",
            "quantity": 2,
            "unitCost": 150.00,
            "totalCost": 300.00
          }
        ],
        "cost": {
          "labor": 800.00,
          "parts": 1250.00,
          "total": 2050.00
        },
        "notes": "All systems functioning normally after service"
      }
    ],
    "summary": {
      "totalRecords": 45,
      "pending": 8,
      "inProgress": 3,
      "completed": 34,
      "totalCost": 125750.00
    }
  }
}
```

### Schedule Maintenance
```http
POST /maintenance/schedule
```

**Request Body:**
```json
{
  "truckId": 1,
  "type": "scheduled_service",
  "description": "1000-hour maintenance service",
  "scheduledDate": "2025-01-20T08:00:00Z",
  "priority": "high",
  "estimatedDuration": 480,
  "technicianId": "TECH001",
  "tasks": [
    {
      "description": "Engine inspection",
      "estimatedDuration": 60
    },
    {
      "description": "Hydraulic system check",
      "estimatedDuration": 90
    }
  ],
  "requiredParts": [
    {
      "partNumber": "FILTER-HYD-001",
      "quantity": 2
    }
  ]
}
```

### Update Maintenance Status
```http
PATCH /maintenance/{maintenanceId}/status
```

**Request Body:**
```json
{
  "status": "in_progress",
  "notes": "Started maintenance work",
  "actualStartTime": "2025-01-20T08:15:00Z"
}
```

---

## Mining Zone APIs

### Get Mining Zones
```http
GET /zones
```

**Response:**
```json
{
  "success": true,
  "data": {
    "zones": [
      {
        "id": 1,
        "name": "Main Pit Area",
        "type": "excavation",
        "isActive": true,
        "boundary": {
          "type": "Polygon",
          "coordinates": [
            [
              [115.604000, -3.545000],
              [115.605000, -3.545000],
              [115.605000, -3.546000],
              [115.604000, -3.546000],
              [115.604000, -3.545000]
            ]
          ]
        },
        "currentActivity": {
          "trucksInZone": 12,
          "averageSpeed": 15.2,
          "lastActivity": "2025-01-15T10:25:00Z"
        },
        "restrictions": {
          "maxSpeed": 25,
          "requiresEscort": false,
          "operatingHours": "06:00-18:00"
        }
      }
    ]
  }
}
```

### Get Trucks in Zone
```http
GET /zones/{zoneId}/trucks
```

**Response:**
```json
{
  "success": true,
  "data": {
    "trucksInZone": [
      {
        "truckId": 1,
        "truckNumber": "TR001",
        "entryTime": "2025-01-15T09:45:00Z",
        "duration": "45m",
        "currentSpeed": 12.5,
        "purpose": "loading"
      }
    ],
    "zoneStatistics": {
      "totalTrucks": 12,
      "averageDwellTime": "32m",
      "peakOccupancy": 18
    }
  }
}
```

---

## Settings & Configuration APIs

### Get System Settings
```http
GET /settings
```

### Update Settings
```http
PUT /settings
```

**Request Body:**
```json
{
  "alerts": {
    "lowFuelThreshold": 15,
    "speedLimitThreshold": 60,
    "maintenanceReminderDays": 7
  },
  "tracking": {
    "updateInterval": 30,
    "historyRetentionDays": 90
  },
  "notifications": {
    "emailEnabled": true,
    "smsEnabled": false,
    "pushEnabled": true
  }
}
```

---

## WebSocket Events

### Real-Time Updates
**Connection:** `ws://localhost:3001/ws`

**Authentication:**
```javascript
// Send token after connection
ws.send(JSON.stringify({
  type: 'auth',
  token: 'your-jwt-token'
}));
```

### Event Types:

#### Truck Location Update
```json
{
  "type": "truck_location",
  "data": {
    "truckId": 1,
    "truckNumber": "TR001",
    "latitude": -3.545400,
    "longitude": 115.604400,
    "speed": 25.5,
    "heading": 145,
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

#### New Alert
```json
{
  "type": "new_alert",
  "data": {
    "alertId": 102,
    "truckId": 1,
    "severity": "HIGH",
    "message": "Speed limit exceeded: 67 km/h",
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

#### Status Change
```json
{
  "type": "truck_status_change",
  "data": {
    "truckId": 1,
    "oldStatus": "ACTIVE",
    "newStatus": "MAINTENANCE",
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

---

## Error Responses

All API errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "TRUCK_NOT_FOUND",
    "message": "Truck with ID 999 not found",
    "details": {
      "truckId": 999,
      "timestamp": "2025-01-15T10:30:00Z"
    }
  }
}
```

### Common Error Codes:
- `AUTHENTICATION_REQUIRED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `VALIDATION_ERROR` (400)
- `RATE_LIMIT_EXCEEDED` (429)
- `INTERNAL_SERVER_ERROR` (500)

---

## Rate Limiting

- **Authentication endpoints:** 5 requests/minute
- **Real-time tracking:** 100 requests/minute
- **General APIs:** 1000 requests/hour
- **Analytics/Reports:** 50 requests/hour

Headers included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1642248000
```

---

## SDK Examples

### JavaScript/React
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Get all trucks
const trucks = await api.get('/trucks');

// Get real-time locations
const liveData = await api.get('/tracking/live');

// Subscribe to WebSocket updates
const ws = new WebSocket('ws://localhost:3001/ws');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'truck_location') {
    updateTruckPosition(data.data);
  }
};
```

### cURL Examples
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'

# Get trucks with authorization
curl -X GET http://localhost:3001/api/trucks \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create alert
curl -X POST http://localhost:3001/api/alerts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"truckId":1,"type":"manual_inspection","severity":"MEDIUM","message":"Inspection required"}'
```

---

## Changelog

### Version 1.0.0
- Initial API release
- Basic CRUD operations for trucks
- Real-time tracking
- Alert management
- Authentication system

### Planned Features
- Mobile app API endpoints
- Advanced analytics
- Integration with IoT sensors
- Predictive maintenance APIs
- Route optimization APIs