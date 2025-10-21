/**
 * WebSocket Client for Backend 2
 * Handles real-time updates for trucks, alerts, and dashboard
 */

import { WS_BASE_URL } from './config';

class FleetWebSocket {
  constructor() {
    this.ws = null;
    this.subscriptions = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000;
    this.isConnecting = false;
    this.listeners = {};
  }

  /**
   * Connect to WebSocket server
   */
  connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;

    try {
      this.ws = new WebSocket(WS_BASE_URL);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected to Backend 2');
        this.isConnecting = false;
        this.reconnectAttempts = 0;

        // Resubscribe to previous channels
        this.subscriptions.forEach((channel) => {
          this.subscribe(channel);
        });

        // Notify listeners
        this.emit('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('❌ WebSocket disconnected from Backend 2');
        this.isConnecting = false;
        this.emit('disconnected');

        // Attempt reconnection
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
          setTimeout(() => this.connect(), this.reconnectDelay);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
  }

  /**
   * Send message to server
   * @param {Object} message
   */
  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  }

  /**
   * Subscribe to a channel
   * @param {string} channel - 'truck_updates', 'alerts', 'dashboard', etc.
   */
  subscribe(channel) {
    this.subscriptions.add(channel);
    this.send({
      type: 'subscribe',
      data: { channel },
    });
  }

  /**
   * Unsubscribe from a channel
   * @param {string} channel
   */
  unsubscribe(channel) {
    this.subscriptions.delete(channel);
    this.send({
      type: 'unsubscribe',
      data: { channel },
    });
  }

  /**
   * Handle incoming WebSocket messages
   * @param {Object} message
   */
  handleMessage(message) {
    const { type, data } = message;

    switch (type) {
      case 'truck_locations_update':
      case 'truck_updates':
        this.emit('truckUpdate', data);
        break;

      case 'new_alerts':
        this.emit('newAlerts', data);
        break;

      case 'alert_resolved':
        this.emit('alertResolved', data);
        break;

      case 'dashboard_update':
        this.emit('dashboardUpdate', data);
        break;

      case 'subscription_confirmed':
        console.log(`✅ Subscribed to ${data.channel}`);
        this.emit('subscribed', data);
        break;

      case 'pong':
        // Heartbeat response
        break;

      default:
        console.log('Unknown message type:', type, data);
        this.emit('message', message);
    }
  }

  /**
   * Register event listener
   * @param {string} event
   * @param {Function} callback
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event
   * @param {Function} callback
   */
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    }
  }

  /**
   * Emit event to listeners
   * @param {string} event
   * @param {*} data
   */
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  /**
   * Send heartbeat ping
   */
  ping() {
    this.send({ type: 'ping' });
  }

  /**
   * Get connection status
   * @returns {boolean}
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Create singleton instance
const fleetWebSocket = new FleetWebSocket();

export default fleetWebSocket;
