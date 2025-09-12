# Fleet Management Backend - Frontend Integration Guide

## 🚀 Quick Start

**Base URL**: `http://localhost:3001/api`  
**WebSocket URL**: `ws://localhost:3001/ws`  
**Authentication**: JWT Bearer Token  
**Database**: PostgreSQL + PostGIS  
**Real-time**: Native WebSocket  

---

## 🔐 Authentication

### Login & Get Token
```javascript
// Login request
const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123'
  })
});

const { data } = await loginResponse.json();
const token = data.token;

// Store token for subsequent requests
localStorage.setItem('authToken', token);
```

### Using Token in Requests
```javascript
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
  'Content-Type': 'application/json'
};
```

---

## 🚛 Truck Management

### Get All Trucks with Filters
```javascript
const getTrucks = async (filters = {}) => {
  const params = new URLSearchParams({
    page: filters.page || 1,
    limit: filters.limit || 50,
    status: filters.status || '',
    search: filters.search || '',
    vendor: filters.vendor || '',
    minFuel: filters.minFuel || ''
  });

  const response = await fetch(`http://localhost:3001/api/trucks?${params}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    }
  });

  return await response.json();
};

// Usage
const trucks = await getTrucks({ 
  status: 'active', 
  limit: 20, 
  vendor: 'Vendor-01' 
});
```

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "trucks": [
      {
        "id": "truck-uuid",
        "name": "Truck-001",
        "model": "Liebherr T282C",
        "status": "active",
        "vendor": { "id": 1, "nama_vendor": "PT Vendor Satu" },
        "sensors": {
          "fuelPercent": 75.5,
          "hubTemperature": 45.2,
          "tires": [
            { "pressure": 720, "temperature": 36, "battery": 90, "status": "normal" }
          ],
          "batteryAvg": 88.5
        }
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 50,
      "total": 1000,
      "total_pages": 20
    }
  }
}
```

### Get Real-time Truck Locations (GeoJSON)
```javascript
const getRealtimeLocations = async () => {
  const response = await fetch('http://localhost:3001/api/trucks/realtime/locations', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    }
  });

  const data = await response.json();
  return data.data; // GeoJSON FeatureCollection
};

// Usage with Leaflet/MapBox
const locations = await getRealtimeLocations();
map.addSource('trucks', {
  type: 'geojson',
  data: locations
});
```

### Get Truck Location History
```javascript
const getTruckHistory = async (truckName, options = {}) => {
  const params = new URLSearchParams({
    timeRange: options.timeRange || '24h',
    limit: options.limit || 200,
    minSpeed: options.minSpeed || 0
  });

  const response = await fetch(
    `http://localhost:3001/api/trucks/${encodeURIComponent(truckName)}/locations?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    }
  );

  return await response.json();
};

// Usage
const history = await getTruckHistory('Truck-001', { 
  timeRange: '6h', 
  minSpeed: 5 
});
```

---

## 📊 Dashboard Statistics

### Get Dashboard Data
```javascript
const getDashboardStats = async () => {
  const response = await fetch('http://localhost:3001/api/dashboard/stats', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    }
  });

  return await response.json();
};

// Response structure
{
  "success": true,
  "data": {
    "totalTrucks": 1000,
    "activeTrucks": 850,
    "inactiveTrucks": 150,
    "averageFuel": 65.2,
    "alertsCount": 45,
    "lowTirePressureCount": 12
  }
}
```

---

## 🏢 Vendor & Driver Management

### Get All Vendors
```javascript
const getVendors = async () => {
  const response = await fetch('http://localhost:3001/api/vendors', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    }
  });

  return await response.json();
};
```

### Get All Drivers with Filters
```javascript
const getDrivers = async (filters = {}) => {
  const params = new URLSearchParams({
    page: filters.page || 1,
    limit: filters.limit || 50,
    status: filters.status || '',
    vendor_id: filters.vendorId || ''
  });

  const response = await fetch(`http://localhost:3001/api/drivers?${params}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    }
  });

  return await response.json();
};
```

### Create New Driver
```javascript
const createDriver = async (driverData) => {
  const response = await fetch('http://localhost:3001/api/drivers', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: driverData.name,
      phone: driverData.phone,
      email: driverData.email,
      address: driverData.address,
      license_number: driverData.licenseNumber,
      license_type: driverData.licenseType,
      license_expiry: driverData.licenseExpiry,
      id_card_number: driverData.idCardNumber,
      vendor_id: driverData.vendorId,
      status: 'aktif'
    })
  });

  return await response.json();
};
```

---

## 📡 Real-time WebSocket Integration

### WebSocket Connection Setup
```javascript
class FleetWebSocket {
  constructor(token) {
    this.ws = null;
    this.token = token;
    this.subscriptions = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    this.ws = new WebSocket('ws://localhost:3001/ws');
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.reconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  subscribe(channel) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        data: { channel }
      }));
      this.subscriptions.add(channel);
    }
  }

  handleMessage(message) {
    switch (message.type) {
      case 'truck_locations_update':
        this.onTruckLocationsUpdate(message.data);
        break;
      case 'new_alerts':
        this.onNewAlerts(message.data);
        break;
      case 'dashboard_update':
        this.onDashboardUpdate(message.data);
        break;
    }
  }

  reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, 5000);
    }
  }
}
```

### Using WebSocket in Your App
```javascript
// Initialize WebSocket
const fleetWS = new FleetWebSocket(localStorage.getItem('authToken'));
fleetWS.connect();

// Subscribe to channels
fleetWS.subscribe('truck_updates');
fleetWS.subscribe('alerts');
fleetWS.subscribe('dashboard');

// Handle real-time updates
fleetWS.onTruckLocationsUpdate = (geoJsonData) => {
  // Update map with new truck positions
  if (map.getSource('trucks')) {
    map.getSource('trucks').setData(geoJsonData);
  }
};

fleetWS.onNewAlerts = (alerts) => {
  // Show notifications for new alerts
  alerts.forEach(alert => {
    showNotification({
      title: `${alert.type} Alert`,
      message: `Truck ${alert.truckName}: Severity ${alert.severity}`,
      type: alert.severity >= 4 ? 'error' : 'warning'
    });
  });
};

fleetWS.onDashboardUpdate = (stats) => {
  // Update dashboard statistics
  updateDashboardCards(stats);
};
```

---

## 🗺️ Mining Area Integration

### Get Mining Areas (GeoJSON)
```javascript
const getMiningAreas = async () => {
  const response = await fetch('http://localhost:3001/api/mining-area', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    }
  });

  const data = await response.json();
  return data.data; // GeoJSON FeatureCollection
};

// Add to map
const miningAreas = await getMiningAreas();
map.addSource('mining-areas', {
  type: 'geojson',
  data: miningAreas
});

map.addLayer({
  id: 'mining-areas-fill',
  type: 'fill',
  source: 'mining-areas',
  paint: {
    'fill-color': '#088',
    'fill-opacity': 0.3
  }
});
```

---

## 🔧 Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information (development only)"
}
```

### Error Handling Utility
```javascript
const apiCall = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, redirect to login
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        return;
      }
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
```

---

## ⚛️ React Integration Examples

### Custom Hook for Trucks
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
        const response = await apiCall('/api/trucks', {
          method: 'GET'
        });
        setTrucks(response.data.trucks);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTrucks();
  }, [JSON.stringify(filters)]);

  return { trucks, loading, error };
};
```

### Dashboard Component
```javascript
import React from 'react';
import { useDashboard } from './hooks/useDashboard';

const Dashboard = () => {
  const { stats, loading, error } = useDashboard();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <StatCard 
          title="Total Trucks" 
          value={stats.totalTrucks} 
          icon="🚛" 
        />
        <StatCard 
          title="Active Trucks" 
          value={stats.activeTrucks} 
          icon="✅" 
        />
        <StatCard 
          title="Alerts" 
          value={stats.alertsCount} 
          icon="🚨" 
        />
      </div>
    </div>
  );
};
```

---

## 🎯 Vue.js Integration Examples

### Composition API Hook
```javascript
import { ref, onMounted } from 'vue';

export function useFleetData() {
  const trucks = ref([]);
  const loading = ref(true);
  const error = ref(null);

  const fetchTrucks = async () => {
    try {
      loading.value = true;
      const response = await apiCall('/api/trucks');
      trucks.value = response.data.trucks;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  onMounted(fetchTrucks);

  return { trucks, loading, error, fetchTrucks };
}
```

---

## 📋 Best Practices

### 1. Authentication
- Store JWT token securely (consider httpOnly cookies for production)
- Implement automatic token refresh
- Handle 401 responses by redirecting to login

### 2. Performance
- Use pagination for large datasets (limit: 50-100)
- Implement client-side caching for static data (mining areas)
- Debounce search inputs

### 3. Real-time Updates
- Subscribe only to needed WebSocket channels
- Implement connection retry logic
- Handle connection state in UI

### 4. Error Handling
- Show user-friendly error messages
- Implement retry mechanisms for failed requests
- Log errors for debugging

### 5. Data Management
- Use state management (Redux/Vuex) for complex apps
- Normalize data structures
- Implement optimistic updates where appropriate

---

## 🚀 Quick Integration Checklist

- [ ] Set up authentication with JWT token storage
- [ ] Implement API utility functions with error handling
- [ ] Create WebSocket connection for real-time updates
- [ ] Add truck listing with pagination and filters
- [ ] Integrate map with GeoJSON data (trucks + mining areas)
- [ ] Implement dashboard with statistics
- [ ] Add driver and vendor management forms
- [ ] Set up real-time notifications for alerts
- [ ] Test all endpoints with proper error scenarios

---

## 📞 Support & Testing

**Test Credentials:**
- Username: `admin`
- Password: `admin123`

**Sample Data:**
- 1000 trucks: `Truck-001` to `Truck-1000`
- 5 vendors with drivers
- Real-time GPS simulation running

**WebSocket Channels:**
- `truck_updates` - Location updates every 30s
- `alerts` - New alerts every 15s  
- `dashboard` - Statistics every 60s

For issues or questions, check the server logs or API responses for detailed error information.
