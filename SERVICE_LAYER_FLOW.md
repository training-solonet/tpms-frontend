# 🔄 Service Layer Flow - Detailed Architecture

## 📂 Service Folder Structure Overview

```
src/services/
├── index.js                      # 🎯 Main entry point - exports all services
├── management/                   # 📊 Backend 2 - Management & Master Data
│   ├── config.js                 # ⚙️ Axios instance with JWT interceptor
│   ├── index.js                  # 📦 Export all management modules
│   ├── websocket.js              # 🌐 WebSocket client for real-time
│   ├── base/
│   │   └── BaseApi.js            # 🏗️ Base API class (if needed)
│   └── modules/
│       ├── index.js              # 📦 Export all modules
│       ├── auth/
│       │   └── auth.api.js       # 🔐 Login, logout, profile
│       ├── fleet/
│       │   ├── trucks.api.js     # 🚛 Truck CRUD operations
│       │   ├── drivers.api.js    # 👤 Driver CRUD operations
│       │   ├── vendors.api.js    # 🏢 Vendor CRUD operations
│       │   └── fleet.api.js      # 📋 Fleet management
│       ├── iot/
│       │   ├── devices.api.js    # 📱 Device CRUD operations
│       │   ├── sensors.api.js    # 📡 Sensor CRUD operations
│       │   └── iot.api.js        # 📊 IoT data ingestion
│       ├── monitoring/
│       │   ├── dashboard.api.js  # 📈 Dashboard statistics
│       │   └── alerts.api.js     # 🚨 Alert management
│       └── operations/
│           └── miningArea.api.js # 🏔️ Mining area data
├── tracking/                     # 🗺️ Backend 1 - Tracking (if different)
│   ├── config.js
│   ├── index.js
│   └── tpms.api.js
├── utils/                        # 🛠️ Utility functions
└── websocket/                    # 🌐 WebSocket utilities
    └── FleetWebSocket.js
```

---

## 🔄 Complete Data Flow: From Service to UI

### **Phase 1: Service Layer Initialization**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 1: Application Boots Up (main.jsx)                                │
└─────────────────────────────────────────────────────────────────────────┘

main.jsx
  │
  ├─ Import React, ReactDOM
  ├─ Import App component
  └─ ReactDOM.createRoot(document.getElementById('root')).render(<App />)


┌─────────────────────────────────────────────────────────────────────────┐
│  Step 2: Service Initialization (Lazy - Only when imported)             │
└─────────────────────────────────────────────────────────────────────────┘

When component imports:
  import { devicesApi } from 'services/management';

Vite Alias Resolution:
  'services/management' ──▶ '@/services/management' ──▶ 'src/services/management'

Import Chain:
  1. src/services/management/index.js
  2. src/services/management/modules/index.js
  3. src/services/management/modules/iot/devices.api.js
  4. src/services/management/config.js (Axios instance created)
```

---

## 📦 Service Layer Architecture Deep Dive

### **File: `src/services/management/config.js`**

```javascript
/**
 * 🎯 Purpose: Create configured Axios instance for Backend 2
 * 🔧 Features:
 *    - Base URL from environment variables
 *    - Request interceptor (inject JWT token)
 *    - Response interceptor (handle errors globally)
 *    - 30 second timeout
 */

import axios from 'axios';

// Environment Variables
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
// Production: 'https://be-tpms.connectis.my.id/api'
// Development: 'http://localhost:3001/api'

// Create Axios Instance
const managementClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ⬆️ REQUEST INTERCEPTOR - Runs BEFORE every API call
managementClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`🚀 API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// ⬇️ RESPONSE INTERCEPTOR - Runs AFTER every API response
managementClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.url}`, response.data);
    // Return data directly for easier access
    if (response.data?.success !== false) {
      return response.data;
    }
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized - Auto logout
    if (error.response?.status === 401) {
      console.warn('🔒 Unauthorized! Redirecting to login...');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // Log error for debugging
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An error occurred';

    console.error('❌ Management API Error:', {
      status: error.response?.status,
      message: errorMessage,
      url: error.config?.url,
    });

    // Return structured error
    return Promise.reject({
      status: error.response?.status,
      message: errorMessage,
      data: error.response?.data,
    });
  }
);

export default managementClient;
```

**🔍 What Happens Here:**

1. ✅ Axios instance created with base URL
2. ✅ Request interceptor adds JWT token to every request
3. ✅ Response interceptor unwraps data and handles errors
4. ✅ 401 errors trigger automatic logout and redirect

---

### **File: `src/services/management/modules/iot/devices.api.js`**

```javascript
/**
 * 🎯 Purpose: Device API methods for CRUD operations
 * 🔧 Endpoints: All /api/iot/devices endpoints
 * 📊 Used by: Devices.jsx, DeviceForm.jsx, Dashboard.jsx
 */

import api2Instance from '../../config'; // Import configured Axios instance

export const devicesApi = {
  /**
   * 📋 GET ALL DEVICES
   * Endpoint: GET /api/iot/devices?page=1&limit=50&status=active
   */
  getAll: async (params = {}) => {
    try {
      // Build query string
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.truck_id) queryParams.append('truck_id', params.truck_id);
      if (params.status) queryParams.append('status', params.status);
      if (params.search) queryParams.append('search', params.search);

      const queryString = queryParams.toString();
      const url = queryString ? `/iot/devices?${queryString}` : '/iot/devices';

      console.log('📱 Fetching devices from:', url);

      // Make API call (Axios instance automatically adds token)
      const response = await api2Instance.get(url);

      console.log('✅ Devices data loaded:', response?.data?.devices?.length);
      return response; // Response interceptor already unwrapped data
    } catch (error) {
      console.error('❌ Failed to load devices:', error.message);
      throw error; // Re-throw for component to handle
    }
  },

  /**
   * 🔍 GET SINGLE DEVICE
   * Endpoint: GET /api/iot/devices/:id
   */
  getById: async (deviceId) => {
    const response = await api2Instance.get(`/iot/devices/${parseInt(deviceId)}`);
    return response;
  },

  /**
   * ➕ CREATE DEVICE
   * Endpoint: POST /api/iot/devices
   */
  create: async (deviceData) => {
    const payload = {
      sn: deviceData.sn,
      truck_id: deviceData.truck_id ? parseInt(deviceData.truck_id) : null,
      sim_number: deviceData.sim_number || null,
      status: deviceData.status || 'active',
    };
    const response = await api2Instance.post('/iot/devices', payload);
    return response;
  },

  /**
   * ✏️ UPDATE DEVICE
   * Endpoint: PUT /api/iot/devices/:id
   */
  update: async (deviceId, deviceData) => {
    const payload = {
      ...(deviceData.sn && { sn: deviceData.sn }),
      ...(deviceData.truck_id && { truck_id: parseInt(deviceData.truck_id) }),
      ...(deviceData.sim_number !== undefined && { sim_number: deviceData.sim_number }),
      ...(deviceData.status && { status: deviceData.status }),
      ...(deviceData.bat1 !== undefined && { bat1: deviceData.bat1 }),
      ...(deviceData.bat2 !== undefined && { bat2: deviceData.bat2 }),
      ...(deviceData.bat3 !== undefined && { bat3: deviceData.bat3 }),
    };
    const response = await api2Instance.put(`/iot/devices/${parseInt(deviceId)}`, payload);
    return response;
  },

  /**
   * 🗑️ DELETE DEVICE
   * Endpoint: DELETE /api/iot/devices/:id
   */
  delete: async (deviceId) => {
    const response = await api2Instance.delete(`/iot/devices/${parseInt(deviceId)}`);
    return response;
  },

  // ... Similar methods for sensors
};

export default devicesApi;
```

**🔍 What Happens Here:**

1. ✅ Import configured Axios instance from config.js
2. ✅ Define API methods as async functions
3. ✅ Build query strings for GET requests
4. ✅ Format payloads for POST/PUT requests
5. ✅ Add logging for debugging
6. ✅ Return unwrapped data (thanks to interceptor)

---

### **File: `src/services/management/modules/index.js`**

```javascript
/**
 * 🎯 Purpose: Centralized export for all API modules
 * 🔧 Pattern: Barrel export for cleaner imports
 */

// Fleet Management
export { trucksApi } from './fleet/trucks.api.js';
export { driversApi } from './fleet/drivers.api.js';
export { vendorsApi } from './fleet/vendors.api.js';
export { fleetApi } from './fleet/fleet.api.js';

// IoT Management
export { devicesApi } from './iot/devices.api.js';
export { sensorsApi } from './iot/sensors.api.js';
export { iotApi } from './iot/iot.api.js';

// Monitoring
export { dashboardApi } from './monitoring/dashboard.api.js';
export { alertsApi } from './monitoring/alerts.api.js';

// Authentication
export { authApi } from './auth/auth.api.js';

// Operations
export { miningAreaApi } from './operations/miningArea.api.js';
```

**🔍 What Happens Here:**

1. ✅ Re-exports all API modules in one place
2. ✅ Allows clean imports: `import { devicesApi, trucksApi } from 'services/management'`
3. ✅ Single source of truth for all APIs

---

### **File: `src/services/management/index.js`**

```javascript
/**
 * 🎯 Purpose: Main entry point for management services
 * 🔧 Exports: All API modules + config + WebSocket
 */

// Export all API modules
export * from './modules/index.js';

// Export config (for direct access to Axios instance if needed)
export { default as managementClient } from './config.js';
export { API_BASE_URL, WS_BASE_URL } from './config.js';

// Export WebSocket client
export { default as managementWebSocket } from './websocket.js';
```

**🔍 What Happens Here:**

1. ✅ Re-exports everything from modules/index.js
2. ✅ Exports Axios instance for advanced use cases
3. ✅ Exports WebSocket client for real-time features

---

## 🎬 Real Example: Devices List Page Flow

### **Complete Flow from Component Mount to UI Render**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP-BY-STEP: Loading Devices in Devices.jsx                           │
└─────────────────────────────────────────────────────────────────────────┘

🎬 Scene 1: User Navigates to /devices
──────────────────────────────────────────────────────────────────────────

1. React Router matches route: /devices ──▶ <Devices /> component

2. Devices.jsx imports service:
   import { devicesApi } from 'services/management';

   Vite resolves alias:
   'services/management' ──▶ 'src/services/management/index.js'

3. Service files loaded (if not already cached):
   ├─ src/services/management/index.js
   ├─ src/services/management/modules/index.js
   ├─ src/services/management/modules/iot/devices.api.js
   └─ src/services/management/config.js (Axios instance created)


🎬 Scene 2: Component Mounts
──────────────────────────────────────────────────────────────────────────

4. Devices.jsx renders with initial state:
   const [devices, setDevices] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);

5. useEffect hook triggers on mount:
   useEffect(() => {
     fetchDevices();
   }, []);


🎬 Scene 3: Fetching Data
──────────────────────────────────────────────────────────────────────────

6. fetchDevices() function executes:

   const fetchDevices = async () => {
     try {
       setLoading(true); // Show loading spinner

       // Call service method
       console.log('📡 Calling devicesApi.getAll()...');
       const response = await devicesApi.getAll({
         page: 1,
         limit: 50,
         status: statusFilter, // e.g., 'active'
       });

       // Service method flow starts here ⬇️
     }
   };


🎬 Scene 4: Service Layer Processing
──────────────────────────────────────────────────────────────────────────

7. devicesApi.getAll() method in devices.api.js:

   getAll: async (params = {}) => {
     // Build query string
     const queryParams = new URLSearchParams();
     queryParams.append('page', 1);
     queryParams.append('limit', 50);
     queryParams.append('status', 'active');

     const url = '/iot/devices?page=1&limit=50&status=active';

     console.log('📱 Fetching devices from:', url);

     // Call Axios instance ⬇️
     const response = await api2Instance.get(url);

     return response;
   }


🎬 Scene 5: Axios Request Interceptor
──────────────────────────────────────────────────────────────────────────

8. REQUEST INTERCEPTOR in config.js runs:

   managementClient.interceptors.request.use((config) => {
     // Get JWT token from localStorage
     const token = localStorage.getItem('authToken');
     // e.g., "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

     if (token) {
       // Add Authorization header
       config.headers.Authorization = `Bearer ${token}`;
     }

     console.log('🚀 API Request:', config.method, config.url);
     // Output: "🚀 API Request: get /iot/devices?page=1&limit=50&status=active"

     return config; // Modified config sent to backend
   });

9. Actual HTTP Request sent:
   ┌─────────────────────────────────────────────────────────────────┐
   │ GET https://be-tpms.connectis.my.id/api/iot/devices?page=1&... │
   │ Headers:                                                        │
   │   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...│
   │   Content-Type: application/json                                │
   └─────────────────────────────────────────────────────────────────┘


🎬 Scene 6: Backend Processing
──────────────────────────────────────────────────────────────────────────

10. Backend receives request:
    ├─ Validates JWT token
    ├─ Checks user permissions
    ├─ Queries database: SELECT * FROM devices WHERE status='active' LIMIT 50
    ├─ Joins related tables (trucks, sensors)
    └─ Returns JSON response


🎬 Scene 7: Backend Response
──────────────────────────────────────────────────────────────────────────

11. Backend sends HTTP Response:
    ┌─────────────────────────────────────────────────────────────────┐
    │ Status: 200 OK                                                  │
    │ Content-Type: application/json                                  │
    │                                                                 │
    │ Body:                                                           │
    │ {                                                               │
    │   "success": true,                                              │
    │   "data": {                                                     │
    │     "devices": [                                                │
    │       {                                                         │
    │         "id": 1,                                                │
    │         "truck_id": 5,                                          │
    │         "sn": "DEV-SN-0001",                                    │
    │         "sim_number": "628123456789",                           │
    │         "status": "active",                                     │
    │         "bat1": 85,                                             │
    │         "bat2": 82,                                             │
    │         "bat3": 88,                                             │
    │         "lock": 1,                                              │
    │         "truck": {                                              │
    │           "id": 5,                                              │
    │           "truck_number": "DT-001",                             │
    │           "plate": "B 1234 ABC"                                 │
    │         },                                                      │
    │         "sensor": [                                             │
    │           { "id": 1, "tireNo": 1, "sn": "SN-0001" },          │
    │           { "id": 2, "tireNo": 2, "sn": "SN-0002" }           │
    │         ]                                                       │
    │       },                                                        │
    │       { ... more devices ... }                                  │
    │     ],                                                          │
    │     "pagination": {                                             │
    │       "page": 1,                                                │
    │       "limit": 50,                                              │
    │       "total": 15,                                              │
    │       "totalPages": 1                                           │
    │     }                                                           │
    │   },                                                            │
    │   "message": "Devices retrieved successfully"                   │
    │ }                                                               │
    └─────────────────────────────────────────────────────────────────┘


🎬 Scene 8: Axios Response Interceptor
──────────────────────────────────────────────────────────────────────────

12. RESPONSE INTERCEPTOR in config.js runs:

    managementClient.interceptors.response.use((response) => {
      console.log('✅ API Response:', response.config.url, response.data);

      // Unwrap data for easier access
      if (response.data?.success !== false) {
        return response.data; // Return only data, not full Axios response
      }

      return response;
    });

13. Interceptor returns:
    {
      success: true,
      data: {
        devices: [ ... ],
        pagination: { ... }
      },
      message: "Devices retrieved successfully"
    }


🎬 Scene 9: Service Method Returns
──────────────────────────────────────────────────────────────────────────

14. devicesApi.getAll() method continues:

    getAll: async (params = {}) => {
      // ... (previous code)

      const response = await api2Instance.get(url);
      // response now contains unwrapped data from interceptor

      console.log('✅ Devices data loaded:', response?.data?.devices?.length);
      // Output: "✅ Devices data loaded: 15"

      return response; // Return to component
    }


🎬 Scene 10: Component Receives Data
──────────────────────────────────────────────────────────────────────────

15. Back in Devices.jsx fetchDevices():

    const fetchDevices = async () => {
      try {
        setLoading(true);

        const response = await devicesApi.getAll({ ... });
        // response = { success: true, data: { devices: [...], pagination: {...} }, message: "..." }

        console.log('📥 Response received:', response);

        // Extract devices array
        const devicesArray = response?.data?.devices || response?.devices || [];

        console.log('📊 Devices count:', devicesArray.length);
        // Output: "📊 Devices count: 15"

        // Update state
        setDevices(devicesArray);
        setError(null);

      } catch (error) {
        console.error('❌ Error fetching devices:', error);

        const errorStatus = error.status || error.response?.status;

        if (errorStatus === 404) {
          showAlert.error('Devices API endpoint not found...', 'API Error');
        } else if (errorStatus === 500) {
          showAlert.error('Server error occurred...', 'Server Error');
        } else {
          showAlert.error(error.message, 'Error');
        }

        setError(error.message);
        setDevices([]); // Clear devices on error

      } finally {
        setLoading(false); // Hide loading spinner
      }
    };


🎬 Scene 11: React Re-renders Component
──────────────────────────────────────────────────────────────────────────

16. State updated → React triggers re-render:

    Previous state:
      devices: []
      loading: true
      error: null

    New state:
      devices: [{ id: 1, sn: "DEV-SN-0001", ... }, ...]
      loading: false
      error: null


🎬 Scene 12: UI Renders with Data
──────────────────────────────────────────────────────────────────────────

17. Devices.jsx JSX renders:

    return (
      <TailwindLayout>
        {loading ? (
          <div>Loading...</div> // ❌ Not shown (loading = false)
        ) : error ? (
          <div>Error: {error}</div> // ❌ Not shown (error = null)
        ) : (
          <table>
            <thead>...</thead>
            <tbody>
              {devices.map((device) => ( // ✅ Loops through 15 devices
                <tr key={device.id}>
                  <td>{device.sn}</td>           {/* DEV-SN-0001 */}
                  <td>{device.sim_number}</td>   {/* 628123456789 */}
                  <td>{device.truck?.plate}</td> {/* B 1234 ABC */}
                  <td>
                    <Badge status={device.status}> {/* Active badge */}
                      {device.status}
                    </Badge>
                  </td>
                  <td>
                    <DropdownMenu> {/* Edit/Delete buttons */}
                      <button onClick={() => handleEdit(device.id)}>Edit</button>
                      <button onClick={() => handleDelete(device)}>Delete</button>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TailwindLayout>
    );

18. User sees fully rendered device list in browser! 🎉
```

---

## 📊 Visual Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Component to Backend Flow                            │
└─────────────────────────────────────────────────────────────────────────┘

User Browser
    │
    ├─ URL: /devices
    │
    ▼
React Router
    │
    ├─ <Route path="/devices" element={<Devices />} />
    │
    ▼
Devices.jsx Component
    │
    ├─ import { devicesApi } from 'services/management';
    │
    ├─ useEffect(() => { fetchDevices(); }, []);
    │
    ├─ const response = await devicesApi.getAll(params);
    │
    ▼
src/services/management/index.js
    │
    ├─ export * from './modules/index.js';
    │
    ▼
src/services/management/modules/index.js
    │
    ├─ export { devicesApi } from './iot/devices.api.js';
    │
    ▼
src/services/management/modules/iot/devices.api.js
    │
    ├─ import api2Instance from '../../config';
    │
    ├─ getAll: async (params) => {
    │     const response = await api2Instance.get(url);
    │     return response;
    │   }
    │
    ▼
src/services/management/config.js
    │
    ├─ const managementClient = axios.create({ ... });
    │
    ├─ REQUEST INTERCEPTOR (add JWT token)
    │
    ├─ axios.get('https://be-tpms.connectis.my.id/api/iot/devices')
    │
    ▼
Backend API Server (be-tpms.connectis.my.id)
    │
    ├─ Verify JWT token
    ├─ Validate permissions
    ├─ Query database: SELECT * FROM devices ...
    ├─ Format response JSON
    │
    ▼
HTTP Response (200 OK)
    │
    ├─ { success: true, data: { devices: [...] }, message: "..." }
    │
    ▼
src/services/management/config.js
    │
    ├─ RESPONSE INTERCEPTOR (unwrap data, handle errors)
    │
    ├─ Return: response.data
    │
    ▼
src/services/management/modules/iot/devices.api.js
    │
    ├─ Log: "✅ Devices data loaded: 15"
    │
    ├─ return response;
    │
    ▼
Devices.jsx Component
    │
    ├─ const response = await devicesApi.getAll(params);
    │
    ├─ const devicesArray = response.data.devices;
    │
    ├─ setDevices(devicesArray); ──▶ State updated
    │
    ▼
React Re-render
    │
    ├─ devices.map((device) => <tr>...</tr>)
    │
    ▼
Browser DOM Updated
    │
    ├─ User sees device list table
    │
    └─ 🎉 Complete!
```

---

## 🔄 Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Error Handling at Each Layer                         │
└─────────────────────────────────────────────────────────────────────────┘

Layer 1: Network Level (Axios)
──────────────────────────────────────────────────────────────────────────
❌ Error: No internet connection

Axios throws: AxiosError: Network Error

Response Interceptor catches:
  if (error.message === 'Network Error') {
    console.error('❌ Network Error: Check internet connection');
    return Promise.reject({
      status: null,
      message: 'No internet connection',
      data: null
    });
  }

Component receives:
  catch (error) {
    showAlert.error('No internet connection. Please check your network.', 'Connection Error');
  }


Layer 2: HTTP Status Errors
──────────────────────────────────────────────────────────────────────────
❌ Error: 401 Unauthorized (Invalid/Expired token)

Response Interceptor catches:
  if (error.response?.status === 401) {
    console.warn('🔒 Unauthorized! Redirecting to login...');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login'; // Auto redirect

    // No need to reject, user redirected
    return Promise.reject({
      status: 401,
      message: 'Session expired. Please login again.',
      data: null
    });
  }

Component won't receive this error (user already redirected to login)


❌ Error: 404 Not Found (Endpoint doesn't exist)

Response Interceptor logs error:
  console.error('❌ Management API Error:', {
    status: 404,
    message: 'Endpoint not found',
    url: '/iot/devices'
  });

Component receives:
  catch (error) {
    if (error.status === 404) {
      showAlert.error(
        'Devices API endpoint not found. Please check backend server.',
        'API Error'
      );
    }
  }


❌ Error: 500 Internal Server Error (Backend crash)

Response Interceptor logs error:
  console.error('❌ Management API Error:', {
    status: 500,
    message: 'Internal server error',
    url: '/iot/devices'
  });

Component receives:
  catch (error) {
    if (error.status === 500) {
      showAlert.error(
        'Server error occurred. Please try again later.',
        'Server Error'
      );
    }
  }


Layer 3: Business Logic Errors (Backend validation)
──────────────────────────────────────────────────────────────────────────
❌ Error: Validation failed (e.g., device SN already exists)

Backend returns: 400 Bad Request
{
  "success": false,
  "message": "Device with SN 'DEV-001' already exists",
  "error": "DUPLICATE_SN"
}

Response Interceptor passes through:
  return Promise.reject({
    status: 400,
    message: 'Device with SN 'DEV-001' already exists',
    data: { error: 'DUPLICATE_SN' }
  });

Component receives:
  catch (error) {
    showAlert.error(error.message, 'Validation Error');
    // Shows: "Device with SN 'DEV-001' already exists"
  }


Layer 4: Frontend Validation (Before API call)
──────────────────────────────────────────────────────────────────────────
✋ Validation: Required field missing

DeviceForm.jsx onSave():
  if (!form.sn?.trim()) {
    showAlert.warning('Please enter Device SN', 'Validation Error');
    return; // Stop execution, no API call made
  }

No backend call, instant user feedback
```

---

## 🎯 Service Method Patterns

### **Pattern 1: Simple GET Request**

```javascript
// Service: src/services/management/modules/fleet/trucks.api.js
export const trucksApi = {
  getAll: async (params = {}) => {
    const response = await api2Instance.get('/trucks', { params });
    return response;
  },
};

// Component Usage: src/pages/listdata/TrucksList.jsx
const fetchTrucks = async () => {
  const response = await trucksApi.getAll({ page: 1, limit: 50 });
  setTrucks(response.data.trucks);
};
```

### **Pattern 2: GET with Complex Query Params**

```javascript
// Service
export const devicesApi = {
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);

    const url = `/iot/devices?${queryParams.toString()}`;
    return await api2Instance.get(url);
  },
};

// Component Usage
const response = await devicesApi.getAll({
  page: 1,
  limit: 50,
  status: 'active',
  truck_id: 5,
});
```

### **Pattern 3: POST with Payload Transformation**

```javascript
// Service
export const devicesApi = {
  create: async (deviceData) => {
    // Transform frontend data to backend format
    const payload = {
      sn: deviceData.sn,
      truck_id: parseInt(deviceData.truck_id), // String → Integer
      sim_number: deviceData.sim_number || null, // Optional field
      status: deviceData.status || 'active', // Default value
    };

    return await api2Instance.post('/iot/devices', payload);
  },
};

// Component Usage
const formData = {
  sn: 'DEV-001',
  truck_id: '5', // String from select dropdown
  sim_number: '628123456789',
  status: 'active',
};

const response = await devicesApi.create(formData);
```

### **Pattern 4: PUT with Partial Update**

```javascript
// Service
export const devicesApi = {
  update: async (deviceId, deviceData) => {
    // Only include changed fields in payload
    const payload = {};

    if (deviceData.sim_number !== undefined) {
      payload.sim_number = deviceData.sim_number;
    }
    if (deviceData.status) {
      payload.status = deviceData.status;
    }
    // Note: sn and truck_id cannot be updated (backend restriction)

    return await api2Instance.put(`/iot/devices/${parseInt(deviceId)}`, payload);
  },
};

// Component Usage
const response = await devicesApi.update(deviceId, {
  sim_number: '628999999999', // Changed
  status: 'maintenance', // Changed
  // sn: '...' // Won't be sent to backend
});
```

### **Pattern 5: DELETE with Confirmation**

```javascript
// Service
export const devicesApi = {
  delete: async (deviceId) => {
    return await api2Instance.delete(`/iot/devices/${parseInt(deviceId)}`);
  },
};

// Component Usage
const handleDelete = async (device) => {
  // Show confirmation modal first
  showAlert.confirm(
    `Are you sure you want to delete device ${device.sn}?`,
    'Confirm Delete',
    async () => {
      // User confirmed
      try {
        await devicesApi.delete(device.id);
        showAlert.success('Device deleted successfully!', 'Success');
        fetchDevices(); // Refresh list
      } catch (error) {
        showAlert.error(error.message, 'Delete Failed');
      }
    }
  );
};
```

---

## 🌐 WebSocket Real-time Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     WebSocket Connection Flow                            │
└─────────────────────────────────────────────────────────────────────────┘

Component Mount
    │
    ├─ import { managementWebSocket } from 'services/management';
    │
    ▼
src/services/management/websocket.js
    │
    ├─ const ws = new WebSocket('wss://be-tpms.connectis.my.id/ws');
    │
    ├─ ws.onopen = () => {
    │     console.log('🌐 WebSocket connected');
    │   };
    │
    ├─ ws.onmessage = (event) => {
    │     const data = JSON.parse(event.data);
    │
    │     // Broadcast to all listeners
    │     eventBus.emit(data.type, data);
    │   };
    │
    ▼
Component Listens for Events
    │
    ├─ useEffect(() => {
    │     managementWebSocket.on('tire_pressure_update', (data) => {
    │       console.log('📊 New tire pressure:', data);
    │
    │       // Update state
    │       setTirePressure(prevState => ({
    │         ...prevState,
    │         [data.tireNo]: data.pressure
    │       }));
    │     });
    │
    │     return () => {
    │       managementWebSocket.off('tire_pressure_update');
    │     };
    │   }, []);
    │
    ▼
Backend Broadcasts Event
    │
    ├─ IoT device sends data: POST /api/iot/data?cmd=tpdata
    │
    ├─ Backend saves to database
    │
    ├─ Backend broadcasts via WebSocket:
    │     ws.send(JSON.stringify({
    │       type: 'tire_pressure_update',
    │       deviceSn: 'DEV-001',
    │       tireNo: 5,
    │       pressure: 850.5,
    │       temp: 65.2
    │     }));
    │
    ▼
Frontend Receives Event
    │
    ├─ ws.onmessage triggers
    │
    ├─ eventBus.emit('tire_pressure_update', data)
    │
    ├─ Component listener callback executes
    │
    ├─ State updated: setTirePressure(...)
    │
    ├─ React re-renders component
    │
    ▼
UI Updates in Real-time
    │
    └─ User sees updated pressure: 850.5 kPa (without refresh!)
```

---

## 🧩 Service Layer Benefits

### **1. Separation of Concerns**

```
❌ Bad: API logic mixed in component
──────────────────────────────────────────────────────────────────────────
const Devices = () => {
  const fetchDevices = async () => {
    const token = localStorage.getItem('authToken');
    const response = await axios.get('https://be-tpms.connectis.my.id/api/iot/devices', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setDevices(response.data.data.devices);
  };
};

✅ Good: API logic in service layer
──────────────────────────────────────────────────────────────────────────
// Service layer handles all API logic
const Devices = () => {
  const fetchDevices = async () => {
    const response = await devicesApi.getAll();
    setDevices(response.data.devices);
  };
};
```

### **2. Reusability**

```
Multiple components can use same service:
  ├─ Devices.jsx → devicesApi.getAll()
  ├─ DeviceForm.jsx → devicesApi.create(), devicesApi.update()
  ├─ Dashboard.jsx → devicesApi.getAll({ status: 'active' })
  └─ LiveTracking.jsx → devicesApi.getAll({ truck_id: selectedTruck })
```

### **3. Centralized Error Handling**

```
Response interceptor handles errors once for all components:
  ├─ 401 Unauthorized → Auto logout + redirect
  ├─ 500 Server Error → Logged to console
  └─ Network Error → Structured error object
```

### **4. Easy Testing**

```javascript
// Mock service in tests
jest.mock('services/management', () => ({
  devicesApi: {
    getAll: jest.fn().mockResolvedValue({
      data: { devices: [{ id: 1, sn: 'TEST-001' }] },
    }),
  },
}));

// Test component without hitting real API
test('renders device list', async () => {
  render(<Devices />);
  expect(await screen.findByText('TEST-001')).toBeInTheDocument();
});
```

### **5. Environment Flexibility**

```
Easily switch between environments:
  .env.development:  VITE_API_BASE_URL=http://localhost:3001/api
  .env.production:   VITE_API_BASE_URL=https://be-tpms.connectis.my.id/api

No code changes needed in components or services!
```

---

## 📚 Summary

### **Service Layer Responsibilities:**

1. ✅ Configure HTTP client (Axios with interceptors)
2. ✅ Define API endpoints and methods
3. ✅ Handle request/response transformations
4. ✅ Manage authentication tokens
5. ✅ Provide centralized error handling
6. ✅ Support real-time via WebSocket
7. ✅ Export clean API for components

### **Component Responsibilities:**

1. ✅ Import and call service methods
2. ✅ Manage UI state (loading, error, data)
3. ✅ Handle user interactions
4. ✅ Display data and error messages
5. ✅ Navigate between routes

### **Clear Separation:**

```
Components (UI Logic)  ←→  Services (Data Logic)  ←→  Backend (Business Logic)
```

This architecture makes the codebase:

- 📖 **Easy to understand**: Each layer has clear responsibility
- 🔧 **Easy to maintain**: Changes isolated to specific files
- 🧪 **Easy to test**: Mock services without touching components
- 🚀 **Easy to scale**: Add new services without affecting existing code
