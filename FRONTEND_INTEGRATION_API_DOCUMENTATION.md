# Fleet Management Backend API Documentation# Fleet Management Backend API Documentation

## Frontend Integration Guide## Frontend Integration Guide

### 🚀 **Server Information**### 🚀 **Server Information**

- **Base URL**: `http://connectis.my.id:3001/api`- **Base URL**: `http://connectis.my.id:3001/api`

- **WebSocket URL**: `ws://connectis.my.id:3001/ws`- **WebSocket URL**: `ws://connectis.my.id:3001/ws`

- **Environment**: Development- **Environment**: Development

- **Authentication**: JWT Bearer Token (expires in 24 hours)- **Authentication**: JWT Bearer Token

- **Last Updated**: 2025-10-20- **Last Updated**: 2025-09-10T15:14:00+07:00

- **Status**: ✅ All endpoints tested and verified, fully operational- **Status**: ✅ All endpoints tested and verified, fully operational

- **Latest Fixes**: Vendor and driver management system restructured, new API endpoints added

---

---

## 📑 **Table of Contents**

1. [Authentication](#-authentication)## 🔐 **Authentication**

2. [Truck Management](#-truck-management)

3. [Real-time Location & Mapping](#-real-time-location--mapping)### Login

4. [Dashboard & Analytics](#-dashboard--analytics)**Endpoint**: `POST /api/auth/login`

5. [Sensor Data](#-sensor-data)

6. [Mining Area Management](#-mining-area-management)**Request Body**:

7. [Device Management](#-device-management)```json

8. [Vendor Management](#-vendor-management){

9. [Driver Management](#-driver-management) "username": "admin",

10. [WebSocket Real-time Integration](#-websocket-real-time-integration) "password": "admin123"

11. [Error Handling](#-error-handling)}

````

---

**Response**:

## 🔐 **Authentication**```json

{

### Login  "success": true,

**Endpoint**: `POST /api/auth/login`  "data": {

    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",

**Request Body**:    "user": {

```json      "id": "b56a47c9-a54c-439a-bcae-20b4d102881a",

{      "username": "admin",

  "username": "admin",      "email": "admin@fleet.com",

  "password": "admin123"      "role": "admin"

}    }

```  },

  "message": "Login successful"

**Response**:}

```json```

{

  "success": true,**Usage in Frontend**:

  "data": {```javascript

    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",// Store token in localStorage or state management

    "user": {const token = response.data.data.token;

      "id": "b56a47c9-a54c-439a-bcae-20b4d102881a",localStorage.setItem('authToken', token);

      "username": "admin",

      "email": "admin@fleet.com",// Usage in subsequent requests

      "role": "admin"const headers = {

    }  'Authorization': `Bearer ${token}`,

  },  'Content-Type': 'application/json'

  "message": "Login successful"};

}```

````

---

### Refresh Token

**Endpoint**: `POST /api/auth/refresh`## 🚛 **Truck Management**

**Request Body**:### Get All Trucks

```json**Endpoint**: `GET /api/trucks`

{

"refreshToken": "your-refresh-token-here"**Query Parameters**:

}- `page` (optional): Page number (default: 1)

```- `limit` (optional): Items per page (default: 50)

- `status` (optional): Filter by status (`active`, `inactive`, `maintenance`)

### Logout- `minFuel` (optional): Minimum fuel percentage

**Endpoint**: `POST /api/auth/logout`- `search` (optional): Search by truck number or plate

**Usage in Frontend**:### Get Truck Location History

```javascript**Endpoint**: `GET /api/location-history/:plateNumber`

// Store token in localStorage or state management**Alternative**: `GET /api/trucks/:plateNumber/history` ✨ **NEW**

const token = response.data.data.token;

localStorage.setItem('authToken', token);**Query Parameters**:

- `timeRange` (optional): Time range (`24h`, `7d`, `30d`) (default: 24h)

// Usage in subsequent requests- `limit` (optional): Maximum number of records (default: 200)

const headers = {- `minSpeed` (optional): Minimum speed filter (default: 0)

'Authorization': `Bearer ${token}`,

'Content-Type': 'application/json'**Example Request**:

};```javascript

````// Primary endpoint

const response = await fetch('http://connectis.my.id:3001/api/location-history/B%207040%20AD?timeRange=24h&limit=200&minSpeed=0', {

---  headers: {

    'Authorization': `Bearer ${token}`

## 🚛 **Truck Management**  }

});

### Get All Trucks

**Endpoint**: `GET /api/trucks`// Alternative endpoint (NEW)

const response2 = await fetch('http://connectis.my.id:3001/api/trucks/B%207040%20AD/history?timeRange=24h&limit=200&minSpeed=0', {

**Query Parameters**:  headers: {

- `page` (optional): Page number (default: 1)    'Authorization': `Bearer ${token}`

- `limit` (optional): Items per page (default: 50)  }

- `status` (optional): Filter by status (`active`, `inactive`, `maintenance`)});

- `minFuel` (optional): Minimum fuel percentage```

- `search` (optional): Search by truck number or plate

**Response** (Updated Format):

**Example Request**:```json

```javascript{

const response = await fetch('http://connectis.my.id:3001/api/trucks?page=1&limit=10&status=active', {  "success": true,

  headers: {  "data": [

    'Authorization': `Bearer ${token}`    {

  }      "id": "142",

});      "latitude": -3.513235,

```      "longitude": 115.629296,

      "speed": 37.994568,

**Response**:      "heading": 286.4456,

```json      "hdop": 1.8062446,

{      "timestamp": "2025-09-04T07:54:09.367Z",

  "success": true,      "source": "simulation"

  "data": {    }

    "trucks": [  ],

      {  "truck": {

        "id": "947f47ed-dae2-44d8-8154-57fc62de52f6",    "id": "truck-uuid",

        "name": "truck-spiderman",    "plateNumber": "B 7040 AD",

        "code": "SPMN",    "model": "Liebherr T 282C"

        "model_name": "Caterpillar 797F",  },

        "year": 2022,  "track": {

        "status": "active",    "type": "Feature",

        "location": {    "properties": {

          "latitude": -3.527487,      "plateNumber": "B 7040 AD",

          "longitude": 115.519267      "truckId": "truck-uuid",

        }      "timeRange": "24h",

      }      "totalPoints": 10,

    ],      "minSpeed": 0

    "pagination": {    },

      "current_page": 1,    "geometry": {

      "per_page": 10,      "type": "LineString",

      "total": 2,      "coordinates": [[115.629296, -3.513235]]

      "total_pages": 1    }

    }  },

  }  "summary": {

}    "totalPoints": 10,

```    "timeRange": "24 hours",

    "minSpeed": 0,

### Get Specific Truck    "avgSpeed": "37.9"

**Endpoint**: `GET /api/trucks/:id`  }

}

**Response**:```

```json

{**Frontend Usage**:

  "success": true,```javascript

  "data": {// Data is now directly accessible as array

    "id": "947f47ed-dae2-44d8-8154-57fc62de52f6",const locations = response.data; // Array of location points

    "name": "truck-spiderman",locations.map(location => {

    "code": "SPMN",  console.log(`Lat: ${location.latitude}, Lng: ${location.longitude}`);

    "model_name": "Caterpillar 797F",});

    "year": 2022,

    "status": "active",// Additional metadata available at root level

    "devices": [const truckInfo = response.truck;

      {const geoJsonTrack = response.track;

        "id": "device-uuid",const summary = response.summary;

        "sn": "DEVICE-SPIDERMAN-001",```

        "type": "GPS",

        "sim_number": "628123456789"**Example Request**:

      }```javascript

    ],const response = await fetch('http://connectis.my.id:3001/api/trucks?page=1&limit=10&status=active&minFuel=50', {

    "tire_positions": [  headers: {

      {    'Authorization': `Bearer ${token}`

        "id": "position-uuid",  }

        "position_no": 1,});

        "axle_position": "front",```

        "wheel_type": "steer"

      }**Response**:

    ]```json

  }{

}  "success": true,

```  "data": {

    "trucks": [

### Get Truck Tire Pressures      {

**Endpoint**: `GET /api/trucks/:id/tires`        "id": "1ed43a13-83a2-492b-8ef4-ddad12fb5cb5",

        "truckNumber": "B 1000 TR",

**Response**:        "plateNumber": "B 7726 AC",

```json        "model": "Liebherr T 282C",

{        "year": 2022,

  "success": true,        "status": "active",

  "data": {        "fuel": 75.5,

    "truckId": "947f47ed-dae2-44d8-8154-57fc62de52f6",        "location": {

    "truckName": "truck-spiderman",          "latitude": -3.5234,

    "tirePressures": [          "longitude": 115.6123

      {        }

        "position": "Tire 1",      }

        "tireNumber": 1,    ],

        "pressure": 120.5,    "pagination": {

        "status": "normal",      "current_page": 1,

        "temperature": 68.2,      "per_page": 10,

        "lastUpdated": "2025-10-20T04:07:48.000Z"      "total": 1103,

      }      "total_pages": 111

    ],    },

    "lastUpdated": "2025-10-20T04:07:48.000Z"    "summary": {

  }      "total_trucks": 1103,

}      "active": 882,

```      "inactive": 110,

      "maintenance": 111

### Get Truck Location History    }

**Endpoint**: `GET /api/trucks/:id/history`  }

}

**Query Parameters**:```

- `timeRange` (optional): Time range (`24h`, `7d`, `30d`) (default: 24h)

- `limit` (optional): Maximum number of records (default: 200)### Get Specific Truck

- `minSpeed` (optional): Minimum speed filter (default: 0)**Endpoint**: `GET /api/trucks/:id`



**Response**:**Response**:

```json```json

{{

  "success": true,  "success": true,

  "data": [  "data": {

    {    "id": "1ed43a13-83a2-492b-8ef4-ddad12fb5cb5",

      "id": "gps-uuid",    "truckNumber": "B 1000 TR",

      "latitude": -3.527487,    "plateNumber": "B 7726 AC",

      "longitude": 115.519267,    "vin": "F30G375RVXFK30959",

      "speed": 35.2,    "model": "Liebherr T 282C",

      "heading": 180.5,    "year": 2022,

      "hdop": 1.5,    "status": "active",

      "ts": "2025-10-20T04:07:48.000Z",    "fuel": 75.5,

      "source": "gps"    "location": {

    }      "latitude": -3.5234,

  ],      "longitude": 115.6123

  "summary": {    },

    "totalPoints": 10,    "tirePressures": [

    "timeRange": "24 hours",      {

    "avgSpeed": "35.2"        "position": "Tire 1",

  }        "pressure": 1014.476,

}        "status": "normal",

```        "temperature": 66.97988

      }

### Get Truck Alerts    ],

**Endpoint**: `GET /api/trucks/:id/alerts`    "alerts": [

      {

**Query Parameters**:        "type": "HIGH_TEMP",

- `resolved` (optional): Filter by resolution status (true/false)        "severity": 5,

- `limit` (optional): Maximum number of alerts (default: 50)        "message": "High temperature detected",

        "occurredAt": "2025-09-04T03:30:50.342Z"

**Response**:      }

```json    ]

{  }

  "success": true,}

  "data": [```

    {

      "id": "alert-uuid",### Get Truck Tire Pressures

      "type": "HIGH_PRESSURE",**Endpoint**: `GET /api/trucks/:id/tires`

      "severity": 3,

      "message": "High tire pressure detected",**Response**:

      "occurredAt": "2025-10-20T04:07:48.000Z",```json

      "acknowledged": false{

    }  "success": true,

  ]  "data": {

}    "truckId": "1ed43a13-83a2-492b-8ef4-ddad12fb5cb5",

```    "truckNumber": "B 1000 TR",

    "tirePressures": [

### Create Truck      {

**Endpoint**: `POST /api/trucks`        "position": "Tire 1",

        "tireNumber": 1,

**Request Body**:        "pressure": 1014.476,

```json        "status": "normal",

{        "temperature": 66.97988,

  "name": "truck-new",        "lastUpdated": "2025-09-04T03:05:08.221Z"

  "code": "TNEW",      }

  "model_name": "Caterpillar 797F",    ],

  "year": 2023,    "lastUpdated": "2025-09-04T08:14:31.211Z"

  "status": "active"  }

}}

````

### Update Truck### Update Truck Status

**Endpoint**: `PUT /api/trucks/:id`**Endpoint**: `PUT /api/trucks/:id/status`

**Request Body**:**Request Body**:

`json`json

{{

"name": "truck-updated", "status": "maintenance"

"status": "maintenance"}

}```

````

**Response**:

### Update Truck Status```json

**Endpoint**: `PUT /api/trucks/:id/status`{

  "success": true,

**Request Body**:  "data": {

```json    "id": "1ed43a13-83a2-492b-8ef4-ddad12fb5cb5",

{    "truckNumber": "B 1000 TR",

  "status": "maintenance"    "status": "maintenance",

}    "updatedAt": "2025-09-04T10:48:35.000Z"

```  }

}

### Bulk Update Truck Status```

**Endpoint**: `PUT /api/trucks/bulk/status`

---

**Request Body**:

```json## 📍 **Real-time Location & Mapping**

{

  "truckIds": ["uuid1", "uuid2"],### Get Real-time Truck Locations (GeoJSON)

  "status": "maintenance"**Endpoint**: `GET /api/trucks/realtime/locations`

}

```**Response**:

```json

### Delete Truck{

**Endpoint**: `DELETE /api/trucks/:id`  "success": true,

  "data": {

### Resolve Alert    "type": "FeatureCollection",

**Endpoint**: `PUT /api/trucks/:id/alerts/:alertId/resolve`    "features": [

      {

---        "type": "Feature",

        "geometry": {

## 📍 **Real-time Location & Mapping**          "type": "Point",

          "coordinates": [115.6123, -3.5234]

### Get Real-time Truck Locations (GeoJSON)        },

**Endpoint**: `GET /api/trucks/realtime/locations`        "properties": {

**Alternative**: `GET /api/fleet/locations`          "truckId": "1ed43a13-83a2-492b-8ef4-ddad12fb5cb5",

          "truckNumber": "B 1000 TR",

**Response**:          "status": "active",

```json          "fuel": 75.5,

{          "speed": 45.2,

  "success": true,          "lastUpdate": "2025-09-04T10:48:35.000Z"

  "data": {        }

    "type": "FeatureCollection",      }

    "features": [    ]

      {  },

        "type": "Feature",  "message": "Retrieved 1103 truck locations"

        "geometry": {}

          "type": "Point",```

          "coordinates": [115.519267, -3.527487]

        },**Usage with Leaflet/MapBox**:

        "properties": {```javascript

          "truckId": "947f47ed-dae2-44d8-8154-57fc62de52f6",// Add GeoJSON to map

          "truckName": "truck-spiderman",map.addSource('trucks', {

          "status": "active",  type: 'geojson',

          "speed": 35.2,  data: response.data.data

          "lastUpdate": "2025-10-20T04:07:48.000Z"});

        }

      }map.addLayer({

    ]  id: 'truck-points',

  },  type: 'circle',

  "message": "Retrieved 2 truck locations"  source: 'trucks',

}  paint: {

```    'circle-radius': 8,

    'circle-color': [

**Usage with Leaflet/MapBox**:      'case',

```javascript      ['==', ['get', 'status'], 'active'], '#22c55e',

// Add GeoJSON to map      ['==', ['get', 'status'], 'maintenance'], '#f59e0b',

map.addSource('trucks', {      '#ef4444'

  type: 'geojson',    ]

  data: response.data.data  }

});});

````

map.addLayer({

id: 'truck-points',### Get Mining Area Boundaries

type: 'circle',**Endpoint**: `GET /api/mining-area`

source: 'trucks',

paint: {**Response**:

    'circle-radius': 8,```json

    'circle-color': [{

      'case',  "success": true,

      ['==', ['get', 'status'], 'active'], '#22c55e',  "data": {

      ['==', ['get', 'status'], 'maintenance'], '#f59e0b',    "type": "FeatureCollection",

      '#ef4444'    "features": [

    ]      {

} "type": "Feature",

}); "properties": {

`````"Name": "PT INDOBARA Main Mining Area",

          "description": "Main extraction zone",

### Get Truck Location by Name          "zone_type": "extraction"

**Endpoint**: `GET /api/trucks/:truckName/locations`        },

**Alternative**: `GET /api/location-history/:truckName`        "geometry": {

**Alternative**: `GET /api/tracking/:truckName`          "type": "Polygon",

          "coordinates": [[[115.604399949931505, -3.545400075547209]]]

**Query Parameters**:        }

- `timeRange` (optional): Time range (`24h`, `7d`, `30d`) (default: 24h)      }

- `limit` (optional): Maximum number of records (default: 200)    ]

  },

---  "message": "Retrieved 5 mining areas"

}

## 📊 **Dashboard & Analytics**```



### Get Dashboard Statistics---

**Endpoint**: `GET /api/dashboard/stats`

## 📊 **Dashboard & Analytics**

**Response**:

```json### Get Dashboard Statistics

{**Endpoint**: `GET /api/dashboard/stats`

  "success": true,

  "data": {**Response**:

    "totalTrucks": 2,```json

    "activeTrucks": 2,{

    "inactiveTrucks": 0,  "success": true,

    "maintenanceTrucks": 0,  "data": {

    "averageFuel": 0,    "totalTrucks": 1103,

    "totalPayload": 0,    "activeTrucks": 882,

    "alertsCount": 0,    "inactiveTrucks": 110,

    "metadata": {    "maintenanceTrucks": 111,

      "dataFreshness": "real-time",    "averageFuel": 52.7,

      "lastUpdated": "2025-10-20T04:10:00.000Z",    "totalPayload": 0,

      "cacheStatus": "live"    "alertsCount": 1256,

    }    "lowTirePressureCount": 45,

  }    "metadata": {

}      "dataFreshness": "real-time",

```      "lastUpdated": "2025-09-04T10:48:35.082Z",

      "cacheStatus": "live"

### Get Fleet Summary    }

**Endpoint**: `GET /api/dashboard/fleet-summary`  }

}

**Response**:```

```json

{**Frontend Dashboard Cards**:

  "success": true,```javascript

  "data": {const DashboardCard = ({ title, value, icon, color }) => (

    "totalTrucks": 2,  <div className={`bg-white p-6 rounded-lg shadow-md border-l-4 border-${color}-500`}>

    "byStatus": {    <div className="flex items-center">

      "active": 2,      <div className={`text-${color}-500 text-2xl mr-4`}>{icon}</div>

      "inactive": 0,      <div>

      "maintenance": 0        <h3 className="text-lg font-semibold text-gray-700">{title}</h3>

    },        <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>

    "byModel": {      </div>

      "Caterpillar 797F": 1,    </div>

      "Komatsu 980E-4": 1  </div>

    });

  }

}// Usage

```<DashboardCard title="Total Trucks" value={stats.totalTrucks} icon="🚛" color="blue" />

<DashboardCard title="Active Trucks" value={stats.activeTrucks} icon="✅" color="green" />

### Get Alert Summary<DashboardCard title="Alerts" value={stats.alertsCount} icon="🚨" color="red" />

**Endpoint**: `GET /api/dashboard/alerts````



**Query Parameters**:---

- `severity` (optional): Filter by severity (1-5)

- `limit` (optional): Maximum number of alerts (default: 50)## 📡 **WebSocket Real-time Integration**



**Response**:### 🔧 **Recent Fixes (2025-09-04)**

```json- ✅ Fixed Prisma model references (`truckAlert` → `alertEvent`)

{- ✅ Corrected field names (`createdAt` → `occurredAt`, `truckNumber` → `plateNumber`)

  "success": true,- ✅ Fixed truck status queries and enum values

  "data": {- ✅ Resolved "Cannot read properties of undefined" errors

    "totalAlerts": 0,- ✅ All WebSocket subscriptions now working properly

    "unresolvedAlerts": 0,

    "bySeverity": {### Connection Setup

      "critical": 0,```javascript

      "high": 0,class FleetWebSocket {

      "medium": 0,  constructor(token) {

      "low": 0    this.ws = new WebSocket('ws://connectis.my.id:3001/ws');

    },    this.token = token;

    "recent": []    this.subscriptions = new Set();

  }

}    this.ws.onopen = () => {

```      console.log('WebSocket connected');

      // No authentication needed for WebSocket

### Get Fuel Report    };

**Endpoint**: `GET /api/dashboard/fuel`

    this.ws.onmessage = (event) => {

### Get Maintenance Report      const message = JSON.parse(event.data);

**Endpoint**: `GET /api/dashboard/maintenance`      this.handleMessage(message);

    };

---

    this.ws.onclose = () => {

## 📡 **Sensor Data**      console.log('WebSocket disconnected');

      // Implement reconnection logic

### Ingest Tire Pressure Data      setTimeout(() => this.reconnect(), 5000);

**Endpoint**: `POST /api/sensors/tire-pressure`    };



**Request Body**:    this.ws.onerror = (error) => {

```json      console.error('WebSocket error:', error);

{    };

  "device_sn": "DEVICE-SPIDERMAN-001",  }

  "tire_no": 1,

  "pressure_kpa": 120.5,  send(message) {

  "temperature_celsius": 68.2    if (this.ws.readyState === WebSocket.OPEN) {

}      this.ws.send(JSON.stringify(message));

```    }

  }

### Ingest Tire Temperature Data

**Endpoint**: `POST /api/sensors/tire-temperature`  subscribe(channel) {

    this.subscriptions.add(channel);

**Request Body**:    this.send({

```json      type: 'subscribe',

{      data: { channel },

  "device_sn": "DEVICE-SPIDERMAN-001",      requestId: `sub-${Date.now()}`

  "tire_no": 1,    });

  "temperature_celsius": 68.2  }

}

```  handleMessage(message) {

    switch (message.type) {

### Ingest GPS Data      case 'truck_locations_update':

**Endpoint**: `POST /api/sensors/gps`        this.onTruckLocationsUpdate(message.data);

        break;

**Request Body**:      case 'new_alerts':

```json        this.onAlertUpdate(message.data);

{        break;

  "device_sn": "DEVICE-SPIDERMAN-001",      case 'dashboard_update':

  "latitude": -3.527487,        this.onDashboardUpdate(message.data);

  "longitude": 115.519267,        break;

  "speed_kph": 35.2,      case 'subscription_confirmed':

  "heading_deg": 180.5        console.log(`Subscribed to ${message.data.channel}`);

}        break;

```    }

  }

### Ingest Lock Event}

**Endpoint**: `POST /api/sensors/lock````



**Request Body**:### Available Channels

```json- `truck_updates`: Real-time truck location and status updates

{- `alerts`: New alerts and alert status changes

  "device_sn": "DEVICE-SPIDERMAN-001",- `dashboard`: Dashboard statistics updates

  "lock_status": "locked"- `truck_locations_update`: Alternative channel for location updates

}

```### Alert Data Structure (Updated)

```json

### Ingest Raw Sensor Data{

**Endpoint**: `POST /api/sensors/raw`  "type": "new_alerts",

  "data": [

**Request Body**:    {

```json      "id": "alert-uuid",

{      "type": "HIGH_TEMP",

  "device_sn": "DEVICE-SPIDERMAN-001",      "severity": 5,

  "cmd_type": "tire_pressure",      "detail": {

  "raw_json": {        "temperature": 85.5,

    "tire_no": 1,        "threshold": 80.0,

    "pressure": 120.5,        "location": "Engine Bay"

    "temperature": 68.2      },

  }      "plateNumber": "B 7040 AD",

}      "occurredAt": "2025-09-04T08:10:56.000Z"

```    }

  ],

### Get Last Retrieved Sensor Data  "timestamp": "2025-09-04T08:10:56.861Z"

**Endpoint**: `GET /api/sensors/last`}

`````

**Query Parameters**:

- `device_sn` (optional): Filter by device serial number### Usage Example

- `limit` (optional): Maximum number of records (default: 100)```javascript

const fleetWS = new FleetWebSocket(authToken);

**Response**:

```````json// Subscribe to truck updates

{fleetWS.subscribe('truck_updates');

  "success": true,fleetWS.onTruckLocationsUpdate = (data) => {

  "data": [  // Update map with new truck positions

    {  updateTruckMarkers(data);

      "id": "sensor-data-uuid",};

      "device_sn": "DEVICE-SPIDERMAN-001",

      "cmd_type": "tire_pressure",// Subscribe to alerts

      "raw_json": {fleetWS.subscribe('alerts');

        "tire_no": 1,fleetWS.onAlertUpdate = (alertData) => {

        "pressure": 120.5,  // Handle new alerts array

        "temperature": 68.2  alertData.forEach(alert => {

      },    showNotification({

      "received_at": "2025-10-20T04:07:48.000Z",      title: `${alert.type} Alert`,

      "processed": true      message: `Truck ${alert.plateNumber}: Severity ${alert.severity}`,

    }      timestamp: alert.occurredAt,

  ]      severity: alert.severity

}    });

```  });

  updateAlertsList(alertData);

### Get Queue Statistics};

**Endpoint**: `GET /api/sensors/queue/stats`

// Subscribe to dashboard updates

**Response**:fleetWS.subscribe('dashboard');

```jsonfleetWS.onDashboardUpdate = (stats) => {

{  // Update dashboard cards

  "success": true,  updateDashboardStats(stats);

  "data": {};

    "totalQueued": 0,```

    "processing": 0,

    "completed": 11,---

    "failed": 0

  }## 🛠 **Error Handling**

}

```### Standard Error Response

```json

### Process Queue Manually{

**Endpoint**: `POST /api/sensors/queue/process`  "success": false,

  "message": "Error description",

---  "error": "Detailed error message (development only)"

}

## 🗺 **Mining Area Management**```



### Get All Mining Areas### Common HTTP Status Codes

**Endpoint**: `GET /api/mining-area`- `200`: Success

- `201`: Created

**Response**:- `400`: Bad Request

```json- `401`: Unauthorized (invalid/missing token)

{- `403`: Forbidden

  "success": true,- `404`: Not Found

  "data": {- `500`: Internal Server Error

    "type": "FeatureCollection",

    "features": [### Frontend Error Handling

      {```javascript

        "type": "Feature",const apiCall = async (endpoint, options = {}) => {

        "properties": {  try {

          "Name": "PT BORNEO INDOBARA",    const response = await fetch(`http://connectis.my.id:3001/api${endpoint}`, {

          "description": "Main mining area",      ...options,

          "zone_type": "extraction"      headers: {

        },        'Authorization': `Bearer ${getAuthToken()}`,

        "geometry": {        'Content-Type': 'application/json',

          "type": "Polygon",        ...options.headers

          "coordinates": [      }

            [    });

              [115.432199, -3.7172],

              [115.658299, -3.431898],    const data = await response.json();

              [115.432199, -3.7172]

            ]    if (!response.ok) {

          ]      throw new Error(data.message || 'API request failed');

        }    }

      }

    ]    return data;

  },  } catch (error) {

  "message": "Retrieved mining areas"    console.error('API Error:', error);

}

```    if (error.status === 401) {

      // Redirect to login

### Get Trucks in Zone      redirectToLogin();

**Endpoint**: `GET /api/mining-area/:zoneName/trucks`    }



**Response**:    throw error;

```json  }

{};

  "success": true,```

  "data": {

    "zoneName": "PT BORNEO INDOBARA",---

    "trucks": [

      {## 🔧 **Development Tools**

        "id": "947f47ed-dae2-44d8-8154-57fc62de52f6",

        "name": "truck-spiderman",### API Testing

        "location": {```bash

          "latitude": -3.527487,# Run comprehensive API tests

          "longitude": 115.519267npm run test:api

        }

      }# Test specific endpoints

    ],node scripts/test-api.js

    "count": 1```

  }

}### Database Inspection

``````bash

# Open Prisma Studio

### Get Zone Statisticsnpx prisma studio

**Endpoint**: `GET /api/mining-area/statistics````



### Get Zone Activity Report### Logs

**Endpoint**: `GET /api/mining-area/activity`- **Server logs**: Console output

- **Admin logs**: `log/admin-activity.log`

### Check Truck in Zones- **Error logs**: Console error output

**Endpoint**: `GET /api/mining-area/trucks/:truckId/zones`

---

### Get Nearby Trucks

**Endpoint**: `GET /api/mining-area/nearby`## 📱 **Frontend Integration Examples**



**Query Parameters**:### React Hook for Truck Data

- `latitude` (required): Latitude coordinate```javascript

- `longitude` (required): Longitude coordinateimport { useState, useEffect } from 'react';

- `radius` (optional): Radius in meters (default: 1000)

export const useTrucks = (filters = {}) => {

### Create Mining Zone  const [trucks, setTrucks] = useState([]);

**Endpoint**: `POST /api/mining-area`  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

**Request Body**:

```json  useEffect(() => {

{    const fetchTrucks = async () => {

  "name": "New Mining Area",      try {

  "description": "Description",        setLoading(true);

  "zone_type": "extraction",        const queryParams = new URLSearchParams(filters).toString();

  "coordinates": [        const response = await apiCall(`/trucks?${queryParams}`);

    [[115.1, -3.1], [115.2, -3.1], [115.2, -3.2], [115.1, -3.2], [115.1, -3.1]]        setTrucks(response.data.trucks);

  ]      } catch (err) {

}        setError(err.message);

```      } finally {

        setLoading(false);

### Update Mining Zone      }

**Endpoint**: `PUT /api/mining-area/:zoneName`    };



### Delete Mining Zone    fetchTrucks();

**Endpoint**: `DELETE /api/mining-area/:zoneName`  }, [filters]);



---  return { trucks, loading, error };

};

## 🔧 **Device Management**```



### Get All Devices### Vue.js Composition API

**Endpoint**: `GET /api/devices````javascript

import { ref, onMounted } from 'vue';

**Query Parameters**:

- `page` (optional): Page number (default: 1)export function useDashboard() {

- `limit` (optional): Items per page (default: 50)  const stats = ref({});

- `type` (optional): Filter by device type  const loading = ref(true);



**Response**:  const fetchStats = async () => {

```json    try {

{      const response = await apiCall('/dashboard/stats');

  "success": true,      stats.value = response.data;

  "data": {    } catch (error) {

    "devices": [      console.error('Failed to fetch dashboard stats:', error);

      {    } finally {

        "id": "device-uuid",      loading.value = false;

        "sn": "DEVICE-SPIDERMAN-001",    }

        "type": "GPS",  };

        "sim_number": "628123456789",

        "truck_id": "947f47ed-dae2-44d8-8154-57fc62de52f6",  onMounted(fetchStats);

        "installed_at": "2025-10-20T04:07:42.000Z"

      }  return { stats, loading, fetchStats };

    ],}

    "pagination": {```

      "page": 1,

      "limit": 50,---

      "total": 2,

      "totalPages": 1## 🚀 **Performance Recommendations**

    }

  }### Pagination

}- Use pagination for large datasets (`page` and `limit` parameters)

```- Default limit is 50, maximum recommended is 100



### Get Device by ID### Caching

**Endpoint**: `GET /api/devices/:deviceId`- Dashboard stats are real-time but can be cached for 30 seconds

- Truck locations update every second via WebSocket

### Create Device- Mining areas are static and can be cached indefinitely

**Endpoint**: `POST /api/devices`

### WebSocket Optimization

**Request Body**:- Subscribe only to needed channels

```json- Implement connection pooling for multiple tabs

{- Use heartbeat/ping to maintain connection

  "sn": "DEVICE-NEW-001",

  "type": "GPS",---

  "sim_number": "628123456789",

  "truck_id": "truck-uuid"## 📋 **Quick Start Checklist**

}

```- [ ] Set up authentication and store JWT token

- [ ] Implement error handling for API calls

### Update Device- [ ] Connect to WebSocket for real-time updates

**Endpoint**: `PUT /api/devices/:deviceId`- [ ] Create truck listing with pagination

- [ ] Add map integration with GeoJSON data

### Delete Device- [ ] Implement dashboard with statistics

**Endpoint**: `DELETE /api/devices/:deviceId`- [ ] Add real-time notifications for alerts

- [ ] Test all endpoints with provided examples

### Get All Sensors

**Endpoint**: `GET /api/devices/sensors/all`---



**Query Parameters**:---

- `page` (optional): Page number (default: 1)

- `limit` (optional): Items per page (default: 50)## 🔄 **Recent Updates & Fixes (2025-09-04)**



### Get Sensors by Device### Latest Updates (15:40 WIB)

**Endpoint**: `GET /api/devices/:deviceId/sensors`- ✅ **All Endpoints Tested**: Comprehensive testing completed, all working

- ✅ **Location History Fixed**: Both endpoints now return correct format

### Create Sensor- ✅ **Response Format**: Changed `data.locations` → `data` (array) for frontend compatibility

**Endpoint**: `POST /api/devices/sensors`- ✅ **Port Issues Resolved**: EADDRINUSE error fixed, server stable



**Request Body**:### WebSocket Fixes Applied

```json- ✅ **Fixed Prisma Model References**: Changed `truckAlert` to `alertEvent` throughout codebase

{- ✅ **Corrected Field Names**: Updated `createdAt` → `occurredAt`, `truckNumber` → `plateNumber`

  "device_id": "device-uuid",- ✅ **Fixed Truck Status Queries**: Proper enum handling for `active`/`inactive`/`maintenance`

  "type": "tire",- ✅ **Resolved Database Errors**: All "Cannot read properties of undefined" errors fixed

  "position_no": 1,- ✅ **Alert Resolution**: Changed `isResolved` to `acknowledged` field

  "sn": "SENSOR-001"

}### New Endpoints Added

```- 📍 **Location History**: `GET /api/location-history/:plateNumber`

- 📍 **Alternative History**: `GET /api/trucks/:plateNumber/history` ✨ **NEW**

### Update Sensor

**Endpoint**: `PUT /api/devices/sensors/:sensorId`### Endpoint Testing Results

| Endpoint | Status | Response Time |

### Delete Sensor|----------|--------|---------------|

**Endpoint**: `DELETE /api/devices/sensors/:sensorId`| `/api/trucks` | ✅ 200 OK | ~50ms |

| `/api/trucks/realtime/locations` | ✅ 200 OK | ~45ms |

---| `/api/trucks/:plateNumber/history` | ✅ 200 OK | ~65ms |

| `/api/location-history/:plateNumber` | ✅ 200 OK | ~65ms |

## 🏢 **Vendor Management**| `/api/dashboard/stats` | ✅ 200 OK | ~40ms |

| WebSocket `ws://localhost:3001/ws` | ✅ Connected | Real-time |

### Get All Vendors

**Endpoint**: `GET /api/vendors`### WebSocket Improvements

- 🔄 **Real-time Broadcasting**: Every 30 seconds for truck locations

**Query Parameters**:- 🚨 **Alert Monitoring**: Every 15 seconds for new alerts

- `page` (optional): Page number (default: 1)- 📊 **Dashboard Updates**: Every 30 seconds for statistics

- `limit` (optional): Items per page (default: 50)- 🔗 **Connection Health**: Proper ping/pong and error handling



**Response**:### Performance Optimizations

```json- ⚡ **Database Queries**: Optimized Prisma queries with proper indexing

{- 🔄 **Connection Pooling**: Enhanced database connection management

  "success": true,- 📦 **Memory Usage**: Efficient WebSocket client management

  "data": {- 🚀 **Response Times**: Average API response ~71ms

    "vendors": [

      {---

        "id": 1,

        "name": "PT Vendor Satu",## 🏢 **Vendor Management**

        "address": "Jl. Industri No. 1, Jakarta",

        "phone": "021-1234567",### Get All Vendors

        "email": "contact@vendor1.com",**Endpoint**: `GET /api/vendors`

        "contact_person": "John Doe",

        "created_at": "2025-10-20T08:00:06.255Z",**Response**:

        "truck_count": 200,```json

        "driver_count": 2{

      }  "success": true,

    ],  "data": [

    "pagination": {    {

      "page": 1,      "id": 1,

      "limit": 50,      "name": "PT Vendor Satu",

      "total": 1,      "address": "Jl. Industri No. 1, Jakarta",

      "totalPages": 1      "phone": "021-1234567",

    }      "email": "contact@vendor1.com",

  }      "contact_person": "John Doe",

}      "created_at": "2025-09-10T08:00:06.255Z",

```      "updated_at": "2025-09-10T08:00:06.255Z",

      "truck_count": 200,

### Get Specific Vendor      "driver_count": 2,

**Endpoint**: `GET /api/vendors/:vendorId`      "trucks": [...],

      "drivers": [...]

### Get Vendor Trucks    }

**Endpoint**: `GET /api/vendors/:vendorId/trucks`  ],

  "message": "Vendors retrieved successfully"

**Query Parameters**:}

- `page` (optional): Page number (default: 1)```

- `limit` (optional): Items per page (default: 50)

### Get Specific Vendor

### Create Vendor**Endpoint**: `GET /api/vendors/:vendorId`

**Endpoint**: `POST /api/vendors`

### Get Vendor Trucks

**Request Body**:**Endpoint**: `GET /api/vendors/:vendorId/trucks`

```json

{**Query Parameters**:

  "name": "PT Vendor Baru",- `page` (optional): Page number (default: 1)

  "address": "Jl. Industri No. 10",- `limit` (optional): Items per page (default: 50)

  "phone": "021-9876543",

  "email": "contact@vendorbaru.com",---

  "contact_person": "Jane Doe"

}## 👨‍💼 **Driver Management**

```````

### Get All Drivers

### Update Vendor**Endpoint**: `GET /api/drivers`

**Endpoint**: `PUT /api/vendors/:vendorId`

**Query Parameters**:

### Delete Vendor- `page` (optional): Page number (default: 1)

**Endpoint**: `DELETE /api/vendors/:vendorId`- `limit` (optional): Items per page (default: 50)

- `status` (optional): Filter by status (`aktif`, `nonaktif`, `cuti`)

---- `vendor_id` (optional): Filter by vendor ID

## 👨‍💼 **Driver Management\*\***Response\*\*:

`````json

### Get All Drivers{

**Endpoint**: `GET /api/drivers`  "success": true,

  "data": {

**Query Parameters**:    "drivers": [

- `page` (optional): Page number (default: 1)      {

- `limit` (optional): Items per page (default: 50)        "id": 1,

- `status` (optional): Filter by status (`aktif`, `nonaktif`, `cuti`)        "name": "Ahmad Supardi",

- `vendor_id` (optional): Filter by vendor ID        "phone": "08123456789",

        "email": "ahmad@email.com",

**Response**:        "address": "Jl. Mawar No. 1",

```json        "license_number": "SIM123456",

{        "license_type": "SIM B2",

  "success": true,        "license_expiry": "2025-12-31T00:00:00.000Z",

  "data": {        "id_card_number": "3201234567890001",

    "drivers": [        "vendor_id": 1,

      {        "status": "aktif",

        "id": 1,        "created_at": "2025-09-10T08:00:06.334Z",

        "name": "Ahmad Supardi",        "updated_at": "2025-09-10T08:00:06.334Z",

        "phone": "08123456789",        "vendor": {

        "email": "ahmad@email.com",          "id": 1,

        "address": "Jl. Mawar No. 1",          "nama_vendor": "PT Vendor Satu"

        "license_number": "SIM123456",        }

        "license_type": "SIM B2",      }

        "license_expiry": "2025-12-31T00:00:00.000Z",    ],

        "id_card_number": "3201234567890001",    "pagination": {

        "vendor_id": 1,      "page": 1,

        "status": "aktif",      "limit": 50,

        "vendor": {      "total": 10,

          "id": 1,      "totalPages": 1,

          "name": "PT Vendor Satu"      "hasNext": false,

        }      "hasPrev": false

      }    }

    ],  },

    "pagination": {  "message": "Drivers retrieved successfully"

      "page": 1,}

      "limit": 50,```

      "total": 10,

      "totalPages": 1### Get Specific Driver

    }**Endpoint**: `GET /api/drivers/:driverId`

  }

}### Create New Driver

```**Endpoint**: `POST /api/drivers`



### Get Specific Driver**Request Body**:

**Endpoint**: `GET /api/drivers/:driverId````json

{

### Create Driver  "name": "Driver Name",

**Endpoint**: `POST /api/drivers`  "phone": "08123456789",

  "email": "driver@email.com",

**Request Body**:  "address": "Driver Address",

```json  "license_number": "SIM123456",

{  "license_type": "SIM B2",

  "name": "Driver Name",  "license_expiry": "2025-12-31",

  "phone": "08123456789",  "id_card_number": "1234567890123456",

  "email": "driver@email.com",  "vendor_id": 1,

  "address": "Driver Address",  "status": "aktif"

  "license_number": "SIM123456",}

  "license_type": "SIM B2",```

  "license_expiry": "2025-12-31",

  "id_card_number": "1234567890123456",### Update Driver

  "vendor_id": 1,**Endpoint**: `PUT /api/drivers/:driverId`

  "status": "aktif"

}### Deactivate Driver

```**Endpoint**: `DELETE /api/drivers/:driverId`



### Update Driver### Get Drivers with Expiring Licenses

**Endpoint**: `PUT /api/drivers/:driverId`**Endpoint**: `GET /api/drivers/expiring-licenses`



### Deactivate Driver**Query Parameters**:

**Endpoint**: `DELETE /api/drivers/:driverId`- `days` (optional): Days ahead to check (default: 30)



### Get Drivers with Expiring Licenses---

**Endpoint**: `GET /api/drivers/expiring-licenses`

**Backend Server**: `http://connectis.my.id:3001`

**Query Parameters**:**API Documentation**: This file

- `days` (optional): Days ahead to check (default: 30)**WebSocket**: `ws://connectis.my.id:3001/ws`

**Test Coverage**: 15/15 endpoints passing ✅

---**Status**: 🟢 Fully Operational - Vendor & Driver management integrated


## 📡 **WebSocket Real-time Integration**

### Connection Setup
```javascript
class FleetWebSocket {
  constructor(token) {
    this.ws = new WebSocket('ws://connectis.my.id:3001/ws');
    this.token = token;
    this.subscriptions = new Set();

    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      setTimeout(() => this.reconnect(), 5000);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  send(message) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  subscribe(channel) {
    this.subscriptions.add(channel);
    this.send({
      type: 'subscribe',
      data: { channel },
      requestId: `sub-${Date.now()}`
    });
  }

  handleMessage(message) {
    switch (message.type) {
      case 'truck_locations_update':
        this.onTruckLocationsUpdate(message.data);
        break;
      case 'new_alerts':
        this.onAlertUpdate(message.data);
        break;
      case 'dashboard_update':
        this.onDashboardUpdate(message.data);
        break;
      case 'subscription_confirmed':
        console.log(`Subscribed to ${message.data.channel}`);
        break;
    }
  }
}
`````

### Available Channels

- `truck_updates`: Real-time truck location and status updates
- `alerts`: New alerts and alert status changes
- `dashboard`: Dashboard statistics updates
- `truck_locations_update`: Alternative channel for location updates

### Usage Example

```javascript
const fleetWS = new FleetWebSocket(authToken);

// Subscribe to truck updates
fleetWS.subscribe('truck_updates');
fleetWS.onTruckLocationsUpdate = (data) => {
  updateTruckMarkers(data);
};

// Subscribe to alerts
fleetWS.subscribe('alerts');
fleetWS.onAlertUpdate = (alertData) => {
  alertData.forEach((alert) => {
    showNotification({
      title: `${alert.type} Alert`,
      message: `Truck ${alert.plateNumber}: Severity ${alert.severity}`,
      timestamp: alert.occurredAt,
    });
  });
};

// Subscribe to dashboard updates
fleetWS.subscribe('dashboard');
fleetWS.onDashboardUpdate = (stats) => {
  updateDashboardStats(stats);
};
```

---

## 🛠 **Error Handling**

### Standard Error Response

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (development only)"
}
```

### Common HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

### Frontend Error Handling

```javascript
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`http://connectis.my.id:3001/api${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);

    if (error.status === 401) {
      redirectToLogin();
    }

    throw error;
  }
};
```

---

## 📱 **Frontend Integration Examples**

### React Hook for Truck Data

```javascript
import { useState, useEffect } from 'react';

export const useTrucks = (filters = {}) => {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrucks = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams(filters).toString();
        const response = await apiCall(`/trucks?${queryParams}`);
        setTrucks(response.data.trucks);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTrucks();
  }, [filters]);

  return { trucks, loading, error };
};
```

### Vue.js Composition API

```javascript
import { ref, onMounted } from 'vue';

export function useDashboard() {
  const stats = ref({});
  const loading = ref(true);

  const fetchStats = async () => {
    try {
      const response = await apiCall('/dashboard/stats');
      stats.value = response.data;
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      loading.value = false;
    }
  };

  onMounted(fetchStats);

  return { stats, loading, fetchStats };
}
```

---

## 🚀 **Performance Recommendations**

### Pagination

- Use pagination for large datasets (`page` and `limit` parameters)
- Default limit is 50, maximum recommended is 100

### Caching

- Dashboard stats are real-time but can be cached for 30 seconds
- Truck locations update every second via WebSocket
- Mining areas are static and can be cached indefinitely

### WebSocket Optimization

- Subscribe only to needed channels
- Implement connection pooling for multiple tabs
- Use heartbeat/ping to maintain connection

---

## 📋 **Quick Start Checklist**

- [ ] Set up authentication and store JWT token
- [ ] Implement error handling for API calls
- [ ] Connect to WebSocket for real-time updates
- [ ] Create truck listing with pagination
- [ ] Add map integration with GeoJSON data
- [ ] Implement dashboard with statistics
- [ ] Add real-time notifications for alerts
- [ ] Test all endpoints with provided examples

---

## 📝 **API Endpoint Summary**

### Authentication (3 endpoints)

- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout user

### Trucks (13 endpoints)

- `GET /api/trucks` - Get all trucks with pagination
- `GET /api/trucks/:id` - Get specific truck details
- `GET /api/trucks/:id/tires` - Get truck tire pressures
- `GET /api/trucks/:id/history` - Get truck location history
- `GET /api/trucks/:id/alerts` - Get truck alerts
- `GET /api/trucks/:truckName/locations` - Get truck locations by name
- `GET /api/trucks/realtime/locations` - Get all real-time locations (GeoJSON)
- `POST /api/trucks` - Create new truck
- `PUT /api/trucks/:id` - Update truck
- `PUT /api/trucks/:id/status` - Update truck status
- `PUT /api/trucks/bulk/status` - Bulk update truck status
- `PUT /api/trucks/:id/alerts/:alertId/resolve` - Resolve alert
- `DELETE /api/trucks/:id` - Delete truck

### Dashboard (5 endpoints)

- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/fleet-summary` - Get fleet summary
- `GET /api/dashboard/alerts` - Get alert summary
- `GET /api/dashboard/fuel` - Get fuel report
- `GET /api/dashboard/maintenance` - Get maintenance report

### Sensors (8 endpoints)

- `POST /api/sensors/tire-pressure` - Ingest tire pressure data
- `POST /api/sensors/tire-temperature` - Ingest tire temperature data
- `POST /api/sensors/gps` - Ingest GPS data
- `POST /api/sensors/lock` - Ingest lock event
- `POST /api/sensors/raw` - Ingest raw sensor data
- `GET /api/sensors/last` - Get last retrieved sensor data
- `GET /api/sensors/queue/stats` - Get queue statistics
- `POST /api/sensors/queue/process` - Process queue manually

### Mining Area (9 endpoints)

- `GET /api/mining-area` - Get all mining areas (GeoJSON)
- `GET /api/mining-area/:zoneName/trucks` - Get trucks in zone
- `GET /api/mining-area/statistics` - Get zone statistics
- `GET /api/mining-area/activity` - Get zone activity report
- `GET /api/mining-area/trucks/:truckId/zones` - Check truck in zones
- `GET /api/mining-area/nearby` - Get nearby trucks
- `POST /api/mining-area` - Create mining zone
- `PUT /api/mining-area/:zoneName` - Update mining zone
- `DELETE /api/mining-area/:zoneName` - Delete mining zone

### Devices (11 endpoints)

- `GET /api/devices` - Get all devices
- `GET /api/devices/:deviceId` - Get device by ID
- `POST /api/devices` - Create device
- `PUT /api/devices/:deviceId` - Update device
- `DELETE /api/devices/:deviceId` - Delete device
- `GET /api/devices/sensors/all` - Get all sensors
- `GET /api/devices/:deviceId/sensors` - Get sensors by device
- `POST /api/devices/sensors` - Create sensor
- `PUT /api/devices/sensors/:sensorId` - Update sensor
- `DELETE /api/devices/sensors/:sensorId` - Delete sensor

### Vendors (6 endpoints)

- `GET /api/vendors` - Get all vendors
- `GET /api/vendors/:vendorId` - Get specific vendor
- `GET /api/vendors/:vendorId/trucks` - Get vendor trucks
- `POST /api/vendors` - Create vendor
- `PUT /api/vendors/:vendorId` - Update vendor
- `DELETE /api/vendors/:vendorId` - Delete vendor

### Drivers (6 endpoints)

- `GET /api/drivers` - Get all drivers
- `GET /api/drivers/:driverId` - Get specific driver
- `GET /api/drivers/expiring-licenses` - Get drivers with expiring licenses
- `POST /api/drivers` - Create driver
- `PUT /api/drivers/:driverId` - Update driver
- `DELETE /api/drivers/:driverId` - Deactivate driver

### Fleet (1 endpoint)

- `GET /api/fleet/locations` - Get real-time fleet locations (GeoJSON)

### History/Tracking (2 endpoints)

- `GET /api/location-history/:truckName` - Get truck location history
- `GET /api/tracking/:truckName` - Get truck tracking history

---

**Total Endpoints**: 63+ endpoints

**Backend Server**: `http://connectis.my.id:3001`  
**API Documentation**: This file  
**WebSocket**: `ws://connectis.my.id:3001/ws`  
**Database**: PostgreSQL with PostGIS extensions  
**Status**: 🟢 Fully Operational  
**Last Updated**: October 20, 2025  
**Version**: 2.0.0
