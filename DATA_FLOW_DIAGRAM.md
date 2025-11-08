# 📊 Data Flow Diagram - TPMS System

## 🔄 Overview Alur Data Sistem

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        TPMS IoT Hardware Layer                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐             │
│  │ Tire Sensors │───▶│ Hub Device   │───▶│ GSM Module   │             │
│  │  (Pressure/  │    │   (Gateway)  │    │ (SIM Card)   │             │
│  │   Temp)      │    └──────────────┘    └──────────────┘             │
│  └──────────────┘                              │                        │
└────────────────────────────────────────────────┼────────────────────────┘
                                                  │ GPRS/4G
                                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Backend API Server                             │
│                     (be-tpms.connectis.my.id)                          │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    API Endpoints Layer                          │  │
│  │                                                                 │  │
│  │  POST /api/iot/data?cmd=tpdata  ◀── IoT Hardware Telemetry    │  │
│  │  POST /api/iot/data?cmd=hubdata ◀── Hub Status Data           │  │
│  │  POST /api/iot/data?cmd=state   ◀── Device State Updates      │  │
│  │  POST /api/iot/data?cmd=lock    ◀── Lock/Unlock Commands      │  │
│  │                                                                 │  │
│  │  GET  /api/iot/devices          ◀── Frontend CRUD Operations  │  │
│  │  POST /api/iot/devices          ◀── Frontend CRUD Operations  │  │
│  │  PUT  /api/iot/devices/:id      ◀── Frontend CRUD Operations  │  │
│  │  DELETE /api/iot/devices/:id    ◀── Frontend CRUD Operations  │  │
│  │                                                                 │  │
│  │  GET  /api/iot/sensors          ◀── Frontend CRUD Operations  │  │
│  │  POST /api/iot/sensors          ◀── Frontend CRUD Operations  │  │
│  │  PUT  /api/iot/sensors/:id      ◀── Frontend CRUD Operations  │  │
│  │  DELETE /api/iot/sensors/:id    ◀── Frontend CRUD Operations  │  │
│  │                                                                 │  │
│  │  GET  /api/drivers              ◀── Frontend CRUD Operations  │  │
│  │  GET  /api/vendors              ◀── Frontend CRUD Operations  │  │
│  │  GET  /api/trucks               ◀── Frontend CRUD Operations  │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                  │                                      │
│                                  ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    Database Layer (MySQL)                       │  │
│  │                                                                 │  │
│  │  Tables:                                                        │  │
│  │  • devices       (Hub devices assigned to trucks)              │  │
│  │  • sensor        (Tire sensors)                                │  │
│  │  • trucks        (Fleet vehicles)                              │  │
│  │  • drivers       (Driver master data)                          │  │
│  │  • vendors       (Vendor master data)                          │  │
│  │  • location      (GPS tracking data)                           │  │
│  │  • telemetry_*   (Sensor data: tire, fuel, temp)              │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                  │                                      │
│                                  ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    WebSocket Server                             │  │
│  │  wss://be-tpms.connectis.my.id/ws                              │  │
│  │                                                                 │  │
│  │  • Real-time data broadcasting                                 │  │
│  │  • Live tracking updates                                       │  │
│  │  • Sensor readings push                                        │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────┬────────────────────────────────┘
                                         │ HTTP/REST API + WebSocket
                                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Frontend Application Layer                       │
│                     (React + Vite + TailwindCSS)                       │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    Service Layer                                │  │
│  │                                                                 │  │
│  │  src/services/management/                                      │  │
│  │  ├── config.js              (Axios instance with JWT)          │  │
│  │  ├── modules/                                                  │  │
│  │  │   ├── fleet/                                                │  │
│  │  │   │   ├── trucks.api.js   (GET /trucks)                    │  │
│  │  │   │   ├── drivers.api.js  (GET /drivers)                   │  │
│  │  │   │   └── vendors.api.js  (GET /vendors)                   │  │
│  │  │   └── iot/                                                  │  │
│  │  │       └── devices.api.js  (GET/POST/PUT/DELETE devices)    │  │
│  │  │                           (GET/POST/PUT/DELETE sensors)    │  │
│  │  └── websocket.js            (WebSocket client)               │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                  │                                      │
│                                  ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    Component Layer                              │  │
│  │                                                                 │  │
│  │  src/pages/                                                    │  │
│  │  ├── Dashboard.jsx           (Overview & statistics)           │  │
│  │  ├── LiveTracking.jsx        (Real-time GPS tracking)          │  │
│  │  ├── listdata/                                                 │  │
│  │  │   ├── Devices.jsx         (Device list & management)        │  │
│  │  │   ├── Sensors.jsx         (Sensor list & management)        │  │
│  │  │   ├── TrucksList.jsx      (Fleet management)               │  │
│  │  │   ├── DriversList.jsx     (Driver management)              │  │
│  │  │   └── VendorsList.jsx     (Vendor management)              │  │
│  │  ├── form/                                                     │  │
│  │  │   ├── DeviceForm.jsx      (Add/Edit device)                │  │
│  │  │   ├── SensorForm.jsx      (Add/Edit sensor)                │  │
│  │  │   ├── TruckForm.jsx       (Add/Edit truck)                 │  │
│  │  │   ├── DriverForm.jsx      (Add/Edit driver)                │  │
│  │  │   └── VendorForm.jsx      (Add/Edit vendor)                │  │
│  │  └── monitoring/                                               │  │
│  │      ├── TirePressureMonitoring.jsx                           │  │
│  │      ├── FuelMonitoring.jsx                                   │  │
│  │      └── TemperatureMonitoring.jsx                            │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                  │                                      │
│                                  ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    State Management                             │  │
│  │                                                                 │  │
│  │  • React Hooks (useState, useEffect)                           │  │
│  │  • Custom Hooks (useCRUD, useAlert, useAuth)                  │  │
│  │  • LocalStorage (authToken, user data)                        │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                            End User (Browser)
```

---

## 📋 Detailed Data Flow Sequences

### 1️⃣ **IoT Device Data Ingestion Flow**

```
Tire Sensor ──▶ Hub Device ──▶ GSM Module ──▶ Backend API ──▶ Database ──▶ WebSocket ──▶ Frontend
   (BLE)         (Gateway)       (GPRS/4G)      (/iot/data)     (MySQL)      (Push)      (Display)

Step-by-step:
1. Tire sensors measure pressure & temperature (every 5 minutes)
2. Hub device collects data from all sensors via BLE
3. Hub sends data to backend via GPRS/4G (POST /api/iot/data?cmd=tpdata)
4. Backend validates & stores in telemetry_tires table
5. Backend broadcasts to WebSocket clients
6. Frontend receives real-time update and displays on UI
```

**Payload Example:**

```json
POST /api/iot/data?cmd=tpdata
{
  "sn": "DEV-SN-0001",
  "data": [
    {
      "tireNo": 1,
      "pressure": 850.5,
      "temp": 65.2,
      "bat": 85,
      "exType": "normal"
    }
  ]
}
```

---

### 2️⃣ **Device Management CRUD Flow**

```
User Action ──▶ DeviceForm ──▶ devicesApi ──▶ Backend API ──▶ Database ──▶ Response ──▶ UI Update
  (Click Add)    (Form Input)   (POST)       (/iot/devices)   (INSERT)     (Success)     (Navigate)

Create Device Flow:
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. User navigates to /devices/new                                       │
│ 2. DeviceForm.jsx loads truck list (GET /trucks)                       │
│ 3. User fills form:                                                     │
│    • Device SN: "DEV-001"                                               │
│    • SIM Number: "628123456789"                                         │
│    • Truck: Select from dropdown                                        │
│    • Status: "active"                                                   │
│ 4. User clicks "Add Data"                                               │
│ 5. Frontend validates input                                             │
│ 6. Frontend calls: devicesApi.create(formData)                         │
│ 7. POST /api/iot/devices with payload                                  │
│ 8. Backend validates & inserts to devices table                        │
│ 9. Backend returns: { success: true, data: { device }, message }      │
│ 10. Frontend shows success alert                                        │
│ 11. Frontend navigates to /devices (list page)                         │
│ 12. Devices.jsx fetches updated list (GET /api/iot/devices)           │
└─────────────────────────────────────────────────────────────────────────┘
```

**API Request:**

```javascript
// Frontend: src/pages/form/DeviceForm.jsx
const createData = {
  sn: 'DEV-001',
  truck_id: 5,
  sim_number: '628123456789',
  status: 'active',
};
await devicesApi.create(createData);
```

**API Service:**

```javascript
// Frontend: src/services/management/modules/iot/devices.api.js
create: async (deviceData) => {
  const payload = {
    sn: deviceData.sn,
    truck_id: parseInt(deviceData.truck_id),
    sim_number: deviceData.sim_number,
    status: deviceData.status || 'active',
  };
  return await api2Instance.post('/iot/devices', payload);
};
```

---

### 3️⃣ **Sensor Management CRUD Flow**

```
User Action ──▶ SensorForm ──▶ devicesApi ──▶ Backend API ──▶ Database ──▶ Response ──▶ UI Update
  (Add Sensor)   (Form Input)  (POST sensors) (/iot/sensors)  (INSERT)     (Success)    (Navigate)

Create Sensor Flow:
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. User navigates to /sensors/new                                       │
│ 2. SensorForm.jsx loads device list (GET /iot/devices)                 │
│ 3. User fills form:                                                     │
│    • Sensor SN: "SN-0001"                                               │
│    • Device: Select from dropdown                                       │
│    • Tire Position: 1-20 (dropdown)                                     │
│    • Sensor No: Optional                                                │
│    • SIM Number: Optional                                               │
│    • Status: "active"                                                   │
│ 4. User clicks "Add Data"                                               │
│ 5. Frontend validates input                                             │
│ 6. Frontend calls: devicesApi.createSensor(formData)                   │
│ 7. POST /api/iot/sensors with payload                                  │
│ 8. Backend validates & inserts to sensor table                         │
│ 9. Backend returns: { success: true, data: { sensor }, message }      │
│ 10. Frontend shows success alert                                        │
│ 11. Frontend navigates to /sensors (list page)                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**API Request:**

```javascript
// Frontend: src/pages/form/SensorForm.jsx
const sensorData = {
  sn: 'SN-0001',
  device_id: 1,
  tireNo: 5,
  sensorNo: 5,
  simNumber: '628123456789',
  status: 'active',
};
await devicesApi.createSensor(sensorData);
```

---

### 4️⃣ **Live Tracking Data Flow**

```
GPS Module ──▶ Hub Device ──▶ Backend API ──▶ Database ──▶ WebSocket ──▶ Frontend Map
  (Location)    (Collect)      (/iot/data)     (location)   (Broadcast)   (Display)

Real-time Tracking Flow:
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. GPS module on truck captures coordinates every 30 seconds            │
│ 2. Hub device sends location data:                                      │
│    POST /api/iot/data?cmd=state                                         │
│    { "sn": "DEV-001", "lat": -6.2088, "long": 106.8456 }              │
│ 3. Backend stores in location table with timestamp                      │
│ 4. Backend broadcasts to WebSocket: ws://be-tpms.connectis.my.id/ws   │
│ 5. Frontend LiveTracking.jsx receives update via WebSocket             │
│ 6. Map component updates truck marker position                          │
│ 7. User sees truck moving in real-time on map                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 5️⃣ **Dashboard Data Aggregation Flow**

```
User Opens Dashboard ──▶ Multiple API Calls ──▶ Backend ──▶ Database Queries ──▶ Response ──▶ UI Render
                         (Parallel Fetch)                     (Aggregations)      (JSON)      (Charts)

Dashboard Load Flow:
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. User navigates to /dashboard                                         │
│ 2. Dashboard.jsx useEffect triggers multiple API calls in parallel:     │
│    • GET /api/dashboard/stats     (total trucks, devices, alerts)      │
│    • GET /api/iot/devices         (active device count)                │
│    • GET /api/trucks              (fleet status)                       │
│    • GET /api/drivers             (driver availability)                │
│ 3. Backend executes SQL aggregations:                                   │
│    • COUNT(*) for totals                                                │
│    • GROUP BY status for breakdowns                                     │
│    • Latest telemetry for real-time data                               │
│ 4. Backend returns JSON responses                                       │
│ 5. Frontend combines data for dashboard cards                           │
│ 6. Frontend renders:                                                    │
│    • Stat cards (Total Trucks, Active Devices)                         │
│    • Charts (Fleet status pie chart)                                   │
│    • Tables (Recent alerts, Active trips)                              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication Flow

```
Login Page ──▶ POST /api/auth/login ──▶ Backend Verify ──▶ JWT Token ──▶ LocalStorage ──▶ Protected Routes
  (Form)         (Credentials)            (Bcrypt)          (Generate)     (Store)         (Access Granted)

Authentication Process:
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. User enters email & password on Login.jsx                            │
│ 2. Frontend: POST /api/auth/login { username, password }               │
│ 3. Backend validates credentials (bcrypt.compare)                       │
│ 4. Backend generates JWT token (jsonwebtoken.sign)                     │
│ 5. Backend returns: { success: true, data: { token, user } }          │
│ 6. Frontend stores in LocalStorage:                                     │
│    • localStorage.setItem('authToken', token)                          │
│    • localStorage.setItem('user', JSON.stringify(user))                │
│ 7. Frontend redirects to /dashboard                                     │
│ 8. All subsequent API calls include:                                    │
│    headers: { Authorization: `Bearer ${token}` }                       │
│ 9. Backend validates JWT on every protected endpoint                    │
│ 10. If token invalid/expired, backend returns 401 Unauthorized         │
│ 11. Frontend interceptor catches 401, clears storage, redirects login  │
└─────────────────────────────────────────────────────────────────────────┘
```

**Axios Interceptor:**

```javascript
// Frontend: src/services/management/config.js
managementClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

managementClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 📊 Data Relationships

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Entity Relationships                          │
└──────────────────────────────────────────────────────────────────────┘

vendors (1) ────────┐
                    │ has many
                    ▼
drivers (N) ────────┐
                    │ assigned to
                    ▼
trucks (1) ─────────┼───────┐
    │               │       │ assigned to
    │ has many      │       ▼
    ▼               │   devices (1) ───────┐
location (N)        │       │               │ has many
telemetry_fuel (N)  │       │ sends data    ▼
telemetry_temp (N)  │       ▼           sensor (N)
                    └──▶ telemetry_tires (N)
                            │
                            │ contains data from
                            ▼
                        tire positions (1-20)

Data Flow Example:
Vendor → Driver → Truck → Device → Sensors → Telemetry Data
  PT ABC  John Doe  B1234XYZ  DEV-001   SN-0001    Pressure: 850kPa
                                        SN-0002    Temp: 65°C
                                        ...
                                        SN-0020
```

---

## 🌐 API Endpoint Summary

### **Management API (Backend 2)**

| Method   | Endpoint                    | Purpose                | Frontend Usage                  |
| -------- | --------------------------- | ---------------------- | ------------------------------- |
| `POST`   | `/api/auth/login`           | User authentication    | Login.jsx                       |
| `GET`    | `/api/auth/profile`         | Get current user       | Header.jsx                      |
| `GET`    | `/api/trucks`               | Get all trucks         | TrucksList.jsx, DeviceForm.jsx  |
| `POST`   | `/api/trucks`               | Create truck           | TruckForm.jsx                   |
| `PUT`    | `/api/trucks/:id`           | Update truck           | TruckForm.jsx                   |
| `DELETE` | `/api/trucks/:id`           | Delete truck           | TrucksList.jsx                  |
| `GET`    | `/api/drivers`              | Get all drivers        | DriversList.jsx, TruckForm.jsx  |
| `POST`   | `/api/drivers`              | Create driver          | DriverForm.jsx                  |
| `PUT`    | `/api/drivers/:id`          | Update driver          | DriverForm.jsx                  |
| `DELETE` | `/api/drivers/:id`          | Delete driver          | DriversList.jsx                 |
| `GET`    | `/api/vendors`              | Get all vendors        | VendorsList.jsx, DriverForm.jsx |
| `POST`   | `/api/vendors`              | Create vendor          | VendorForm.jsx                  |
| `PUT`    | `/api/vendors/:id`          | Update vendor          | VendorForm.jsx                  |
| `DELETE` | `/api/vendors/:id`          | Delete vendor          | VendorsList.jsx                 |
| `GET`    | `/api/iot/devices`          | Get all devices        | Devices.jsx, SensorForm.jsx     |
| `POST`   | `/api/iot/devices`          | Create device          | DeviceForm.jsx                  |
| `PUT`    | `/api/iot/devices/:id`      | Update device          | DeviceForm.jsx                  |
| `DELETE` | `/api/iot/devices/:id`      | Delete device          | Devices.jsx                     |
| `GET`    | `/api/iot/sensors`          | Get all sensors        | Sensors.jsx                     |
| `POST`   | `/api/iot/sensors`          | Create sensor          | SensorForm.jsx                  |
| `PUT`    | `/api/iot/sensors/:id`      | Update sensor          | SensorForm.jsx                  |
| `DELETE` | `/api/iot/sensors/:id`      | Delete sensor          | Sensors.jsx                     |
| `POST`   | `/api/iot/data?cmd=tpdata`  | Receive tire telemetry | IoT Hardware                    |
| `POST`   | `/api/iot/data?cmd=hubdata` | Receive hub status     | IoT Hardware                    |
| `POST`   | `/api/iot/data?cmd=state`   | Receive device state   | IoT Hardware                    |
| `POST`   | `/api/iot/data?cmd=lock`    | Device lock/unlock     | IoT Hardware                    |
| `GET`    | `/api/dashboard/stats`      | Dashboard statistics   | Dashboard.jsx                   |

---

## 🔄 WebSocket Real-time Events

```
WebSocket Connection: wss://be-tpms.connectis.my.id/ws

Event Types:
┌─────────────────────────────────────────────────────────────────────┐
│ 1. tire_pressure_update                                             │
│    { deviceSn: "DEV-001", tireNo: 5, pressure: 850.5, temp: 65.2 }│
│                                                                     │
│ 2. location_update                                                  │
│    { deviceSn: "DEV-001", lat: -6.2088, long: 106.8456 }          │
│                                                                     │
│ 3. device_status_change                                             │
│    { deviceSn: "DEV-001", status: "active", bat1: 85 }            │
│                                                                     │
│ 4. alert_triggered                                                  │
│    { type: "low_pressure", deviceSn: "DEV-001", tireNo: 3 }       │
└─────────────────────────────────────────────────────────────────────┘

Frontend WebSocket Client:
// src/services/management/websocket.js
const ws = new WebSocket('wss://be-tpms.connectis.my.id/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch(data.type) {
    case 'tire_pressure_update':
      updateTirePressureDisplay(data);
      break;
    case 'location_update':
      updateMapMarker(data);
      break;
    case 'device_status_change':
      updateDeviceStatus(data);
      break;
    case 'alert_triggered':
      showAlert(data);
      break;
  }
};
```

---

## 📱 Frontend Component Data Flow

```
App.jsx
  │
  ├─ TailwindLayout
  │   ├─ TailwindHeader (displays user info)
  │   ├─ TailwindSidebar (navigation)
  │   └─ Router Outlet
  │
  └─ Routes
      ├─ /dashboard ──▶ Dashboard.jsx
      │                  ├─ Fetches: dashboard stats, devices, trucks
      │                  └─ Displays: cards, charts, tables
      │
      ├─ /devices ──▶ Devices.jsx
      │                ├─ Fetches: GET /api/iot/devices
      │                ├─ Actions: Edit, Delete
      │                └─ Navigate: /devices/new, /devices/:id
      │
      ├─ /devices/new ──▶ DeviceForm.jsx
      │                    ├─ Fetches: GET /api/trucks (dropdown)
      │                    ├─ Action: POST /api/iot/devices
      │                    └─ Navigate: /devices (on success)
      │
      ├─ /devices/:id ──▶ DeviceForm.jsx (edit mode)
      │                    ├─ Fetches: GET /api/iot/devices/:id
      │                    ├─ Action: PUT /api/iot/devices/:id
      │                    └─ Navigate: /devices (on success)
      │
      ├─ /sensors ──▶ Sensors.jsx
      │                ├─ Fetches: GET /api/iot/sensors
      │                ├─ Actions: Edit, Delete
      │                └─ Navigate: /sensors/new, /sensors/:id
      │
      ├─ /sensors/new ──▶ SensorForm.jsx
      │                    ├─ Fetches: GET /api/iot/devices (dropdown)
      │                    ├─ Action: POST /api/iot/sensors
      │                    └─ Navigate: /sensors (on success)
      │
      └─ Similar patterns for:
          ├─ /trucks ──▶ TrucksList.jsx ──▶ TruckForm.jsx
          ├─ /drivers ──▶ DriversList.jsx ──▶ DriverForm.jsx
          └─ /vendors ──▶ VendorsList.jsx ──▶ VendorForm.jsx
```

---

## 🛠️ Custom Hooks Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                          useCRUD Hook                                │
│                                                                      │
│  Purpose: Handle CRUD operations with loading/error states          │
│                                                                      │
│  Usage in DeviceForm.jsx:                                           │
│  const { loading, error } = useCRUD(devicesApi);                   │
│                                                                      │
│  Flow:                                                               │
│  1. Component calls: devicesApi.create(data)                        │
│  2. useCRUD sets: loading = true                                    │
│  3. API call executes                                                │
│  4. On success: loading = false, error = null                       │
│  5. On error: loading = false, error = errorMessage                 │
│  6. Component displays loading spinner or error message             │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         useAlert Hook                                │
│                                                                      │
│  Purpose: Show user feedback modals (success, error, warning)       │
│                                                                      │
│  Usage in DeviceForm.jsx:                                           │
│  const { showAlert, alertState } = useAlert();                     │
│                                                                      │
│  Flow:                                                               │
│  1. Action completes (e.g., device created)                         │
│  2. Call: showAlert.success('Device created!', 'Success')          │
│  3. useAlert updates alertState:                                    │
│     { isOpen: true, type: 'success', message: '...' }              │
│  4. AlertModal component renders based on alertState                │
│  5. User clicks OK or Cancel                                         │
│  6. useAlert resets alertState: { isOpen: false }                  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         useAuth Hook                                 │
│                                                                      │
│  Purpose: Manage authentication state and user session              │
│                                                                      │
│  Usage in Header.jsx:                                                │
│  const { user, isAuthenticated, logout } = useAuth();              │
│                                                                      │
│  Flow:                                                               │
│  1. On app load, check LocalStorage for authToken                   │
│  2. If token exists: setUser(), setIsAuthenticated(true)           │
│  3. Display user info in header                                      │
│  4. On logout click: clearLocalStorage(), navigate('/login')       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Error Handling Flow

```
API Call ──▶ Axios Interceptor ──▶ Error Response ──▶ Handle Error ──▶ User Feedback
                                     (Status Code)      (Logic)         (Alert/Modal)

Error Handling Hierarchy:
┌─────────────────────────────────────────────────────────────────────┐
│ 1. Network Error (No connection)                                    │
│    ├─ Axios catches: Network Error                                  │
│    ├─ Frontend displays: "Connection failed, check internet"       │
│    └─ User Action: Retry button                                     │
│                                                                     │
│ 2. 401 Unauthorized (Invalid/Expired token)                         │
│    ├─ Interceptor catches: error.response.status === 401           │
│    ├─ Auto clear: localStorage.removeItem('authToken')             │
│    ├─ Auto redirect: window.location.href = '/login'               │
│    └─ User Action: Login again                                      │
│                                                                     │
│ 3. 404 Not Found (Endpoint doesn't exist)                           │
│    ├─ Error logged: "Management API Error: {status: 404...}"       │
│    ├─ Frontend displays: "Endpoint not found, check backend"       │
│    └─ User Action: Contact admin                                    │
│                                                                     │
│ 4. 500 Server Error (Backend crash)                                 │
│    ├─ Error logged: "Server error occurred"                        │
│    ├─ Frontend displays: "Server error, please try again later"   │
│    └─ User Action: Wait or contact support                          │
│                                                                     │
│ 5. Validation Error (Missing required fields)                       │
│    ├─ Frontend validates before API call                            │
│    ├─ Shows warning: "Please enter Device SN"                      │
│    └─ User Action: Fill missing fields                              │
└─────────────────────────────────────────────────────────────────────┘

Example Error Handler in Devices.jsx:
try {
  const response = await devicesApi.getAll(params);
  setDevices(response.data.devices);
} catch (error) {
  const errorStatus = error.status || error.response?.status;

  if (errorStatus === 404) {
    showAlert.error('Devices API endpoint not found...', 'API Error');
  } else if (errorStatus === 500) {
    showAlert.error('Server error occurred...', 'Server Error');
  } else {
    showAlert.error(error.message, 'Error');
  }
}
```

---

## 📈 Performance Optimization

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Data Loading Strategies                          │
└─────────────────────────────────────────────────────────────────────┘

1. Pagination
   └─ GET /api/iot/devices?page=1&limit=50
      ├─ Only fetch 50 records at a time
      ├─ User navigates pages using pagination controls
      └─ Reduces initial load time and memory usage

2. Lazy Loading
   └─ Components load data only when mounted
      ├─ Dashboard doesn't load until user navigates to /dashboard
      ├─ useEffect with empty dependency array []
      └─ Prevents unnecessary API calls

3. Caching (Future Enhancement)
   └─ Store frequently accessed data
      ├─ Truck list cached for 5 minutes
      ├─ Reduces redundant API calls in forms
      └─ Implementation: React Query or SWR

4. WebSocket for Real-time Data
   └─ Instead of polling every 5 seconds
      ├─ Open persistent WebSocket connection
      ├─ Backend pushes updates only when data changes
      └─ Reduces server load and bandwidth

5. Debouncing Search
   └─ In Devices.jsx search input
      ├─ Wait 500ms after user stops typing
      ├─ Then trigger API call: GET /api/iot/devices?search=query
      └─ Prevents excessive API calls while typing
```

---

## 🔒 Security Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Security Layers                                  │
└─────────────────────────────────────────────────────────────────────┘

1. Frontend Layer
   ├─ ProtectedRoute.jsx checks authToken in localStorage
   ├─ If no token: redirect to /login
   └─ Token included in all API requests via Axios interceptor

2. Backend Layer
   ├─ JWT token validation on every protected endpoint
   ├─ Bcrypt password hashing (never store plain text)
   ├─ Input validation & sanitization
   └─ SQL injection prevention (parameterized queries)

3. Transport Layer
   ├─ HTTPS/TLS encryption (https://be-tpms.connectis.my.id)
   ├─ Secure WebSocket (wss://)
   └─ CORS configured for trusted origins only

4. Data Layer
   ├─ Database user with limited privileges
   ├─ Soft deletes (deleted_at field) instead of hard deletes
   └─ Audit logs for critical operations

Token Flow:
Login ──▶ Backend generates JWT ──▶ Frontend stores in localStorage
   │
   └──▶ Every API call includes: Authorization: Bearer <token>
           │
           └──▶ Backend verifies JWT signature & expiry
                   │
                   ├─ Valid: Process request
                   └─ Invalid: Return 401 Unauthorized
```

---

## 📊 Database Schema (Simplified)

```sql
-- Main Tables

CREATE TABLE trucks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  truck_number VARCHAR(50),
  plate_number VARCHAR(20),
  type VARCHAR(50),
  vendor_id INT,
  driver_id INT,
  status ENUM('active', 'inactive', 'maintenance'),
  created_at TIMESTAMP
);

CREATE TABLE devices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  truck_id INT,
  sn VARCHAR(50) UNIQUE,
  sim_number VARCHAR(20),
  status ENUM('active', 'inactive', 'maintenance', 'offline'),
  bat1 INT,
  bat2 INT,
  bat3 INT,
  lock TINYINT(1),
  created_at TIMESTAMP,
  FOREIGN KEY (truck_id) REFERENCES trucks(id)
);

CREATE TABLE sensor (
  id INT PRIMARY KEY AUTO_INCREMENT,
  device_id INT,
  sn VARCHAR(50) UNIQUE,
  tireNo INT,
  sensorNo INT,
  simNumber VARCHAR(20),
  status ENUM('active', 'inactive'),
  created_at TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices(id)
);

CREATE TABLE telemetry_tires (
  id INT PRIMARY KEY AUTO_INCREMENT,
  device_sn VARCHAR(50),
  sensor_id INT,
  tireNo INT,
  tirepValue DECIMAL(10,2),  -- Pressure in kPa
  tempValue DECIMAL(5,2),    -- Temperature in °C
  bat INT,                   -- Battery %
  exType VARCHAR(20),        -- Exception type
  recorded_at TIMESTAMP,
  FOREIGN KEY (sensor_id) REFERENCES sensor(id)
);

CREATE TABLE location (
  id INT PRIMARY KEY AUTO_INCREMENT,
  device_sn VARCHAR(50),
  lat DECIMAL(10,8),
  long DECIMAL(11,8),
  speed INT,
  heading INT,
  recorded_at TIMESTAMP
);

CREATE TABLE drivers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100),
  phone VARCHAR(20),
  license_number VARCHAR(50),
  license_type VARCHAR(10),
  license_expiry DATE,
  status ENUM('aktif', 'nonaktif'),
  vendor_id INT
);

CREATE TABLE vendors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name_vendor VARCHAR(100),
  contact VARCHAR(20),
  address TEXT
);
```

---

## 🎨 Component State Management

```
DeviceForm.jsx State Flow:
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  [form] state ──▶ User input ──▶ update() ──▶ setForm()            │
│    ├─ sn                                                             │
│    ├─ imei (sim_number)                                              │
│    ├─ device_type                                                    │
│    ├─ status                                                         │
│    └─ truck_id                                                       │
│                                                                      │
│  [trucks] state ──▶ useEffect ──▶ trucksApi.getAll() ──▶ setTrucks()│
│                                                                      │
│  [loading] state ──▶ true during data fetch ──▶ false when done    │
│                                                                      │
│  [alertState] from useAlert() ──▶ controls AlertModal visibility    │
│                                                                      │
│  User clicks "Add Data" ──▶ onSave() ──▶ Validation ──▶ API Call   │
│                                           │                          │
│                                           ├─ Success: showAlert()   │
│                                           │            navigate()    │
│                                           │                          │
│                                           └─ Error: showAlert()     │
│                                                      stay on page    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Deployment Data Flow

```
Development:
  Frontend (localhost:5173) ──▶ Backend (localhost:3001)
                                    │
                                    └──▶ MySQL (localhost:3306)

Production:
  Frontend (Vercel/Netlify) ──▶ Backend (be-tpms.connectis.my.id)
                                    │
                                    ├──▶ MySQL (Production DB)
                                    └──▶ WebSocket Server (wss://)

Environment Variables:
  .env (Frontend)
  ├─ VITE_API_BASE_URL=https://be-tpms.connectis.my.id/api
  └─ VITE_WS_URL=wss://be-tpms.connectis.my.id/ws

  .env (Backend)
  ├─ DB_HOST=localhost
  ├─ DB_USER=tpms_user
  ├─ DB_PASSWORD=***
  ├─ DB_NAME=tpms_db
  └─ JWT_SECRET=***
```

---

## 📝 Summary

Diagram ini menunjukkan alur data lengkap dari:

1. **Hardware Layer** → IoT sensors mengirim data telemetri
2. **Backend Layer** → API menerima, validasi, simpan ke database
3. **Database Layer** → MySQL menyimpan relational data
4. **WebSocket Layer** → Real-time broadcasting ke clients
5. **Frontend Layer** → React components menampilkan UI
6. **User Layer** → End users berinteraksi dengan aplikasi

Semua komponen saling terhubung dengan pola RESTful API untuk CRUD dan WebSocket untuk real-time updates.
