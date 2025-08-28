// src/services/websocket.js
class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.listeners = new Map();
    this.isConnected = false;
    this.url = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected');
      };

      this.ws.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            // API documentation: message has { type, data, requestId, timestamp }
            this.emit(message.type, message);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnected = false;
        this.emit('disconnected');
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };

    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.handleReconnect();
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    } else {
      console.log('Max reconnection attempts reached. Switching to demo mode.');
      this.startDemoMode();
    }
  }

  startDemoMode() {
    console.log('Starting demo mode with simulated data');
    this.emit('demo_mode_started');
    
    // Simulate vehicle updates every 5 seconds
    setInterval(() => {
      const demoVehicles = this.generateDemoVehicleData();
      this.emit('vehicle_update', demoVehicles);
    }, 5000);

    // Simulate alerts occasionally
    setInterval(() => {
      const demoAlert = this.generateDemoAlert();
      this.emit('alert', demoAlert);
    }, 15000);
  }

  generateDemoVehicleData() {
    const vehicles = [
      {
        id: 'BRN-001',
        lat: -3.580000 + (Math.random() - 0.5) * 0.01,
        lng: 115.600000 + (Math.random() - 0.5) * 0.01,
        speed: Math.floor(Math.random() * 60) + 20,
        fuel: Math.floor(Math.random() * 100),
        status: Math.random() > 0.8 ? 'warning' : 'active',
        driver: 'Driver ' + Math.floor(Math.random() * 10 + 1),
        lastUpdate: new Date().toISOString()
      },
      {
        id: 'BRN-002',
        lat: -3.585000 + (Math.random() - 0.5) * 0.01,
        lng: 115.605000 + (Math.random() - 0.5) * 0.01,
        speed: Math.floor(Math.random() * 60) + 15,
        fuel: Math.floor(Math.random() * 100),
        status: Math.random() > 0.9 ? 'maintenance' : 'active',
        driver: 'Driver ' + Math.floor(Math.random() * 10 + 1),
        lastUpdate: new Date().toISOString()
      },
      {
        id: 'BRN-003',
        lat: -3.575000 + (Math.random() - 0.5) * 0.01,
        lng: 115.595000 + (Math.random() - 0.5) * 0.01,
        speed: Math.floor(Math.random() * 60) + 10,
        fuel: Math.floor(Math.random() * 100),
        status: 'active',
        driver: 'Driver ' + Math.floor(Math.random() * 10 + 1),
        lastUpdate: new Date().toISOString()
      }
    ];

    return vehicles;
  }

  generateDemoAlert() {
    const alerts = [
      { type: 'speed', message: 'Vehicle BRN-001 exceeding speed limit', severity: 'warning' },
      { type: 'fuel', message: 'Vehicle BRN-002 low fuel level', severity: 'error' },
      { type: 'route', message: 'Vehicle BRN-003 deviation from planned route', severity: 'warning' },
      { type: 'maintenance', message: 'Vehicle BRN-001 maintenance due', severity: 'info' }
    ];

    return {
      ...alerts[Math.floor(Math.random() * alerts.length)],
      timestamp: new Date().toISOString(),
      id: Date.now()
    };
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected, cannot send data');
    }
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  unsubscribe(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${event}:`, error);
        }
      });
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.listeners.clear();
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts
    };
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;
