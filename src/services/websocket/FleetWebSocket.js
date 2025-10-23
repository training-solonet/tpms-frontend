// src/services/websocket/FleetWebSocket.js

import { TRACKING_CONFIG } from '../api/config.js'; // BE1 untuk WebSocket tracking

/**
 * WebSocket connection for real-time fleet tracking updates
 * Handles real-time truck location, TPMS data, and telemetry
 */

export class FleetWebSocket {
  constructor() {
    this.ws = null;
    this.subscriptions = new Set();
    this.messageHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  /**
   * Connect to WebSocket server
   */
  connect() {
    try {
      this.ws = new WebSocket(TRACKING_CONFIG.WS_URL); // Pakai WS_URL dari TRACKING_CONFIG

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected to backend');
        this.reconnectAttempts = 0;
        // Auto-subscribe to backend channels as per documentation
        this.send({ type: 'subscribe', channel: 'truck_updates' });
        this.send({ type: 'subscribe', channel: 'alerts' });
        this.send({ type: 'subscribe', channel: 'dashboard' });
        // Also subscribe to any channels registered before connection was open
        if (this.subscriptions && this.subscriptions.size > 0) {
          for (const ch of this.subscriptions) {
            this.send({ type: 'subscribe', channel: ch });
          }
        }
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
        console.log('❌ WebSocket disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }

  /**
   * Attempt to reconnect to WebSocket
   */
  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );

      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  /**
   * Subscribe to a channel
   * @param {string} channel - Channel name
   * @param {Function} handler - Message handler function
   */
  subscribe(channel, handler) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({
        type: 'subscribe',
        channel: channel,
      });

      this.messageHandlers.set(channel, handler);
      this.subscriptions.add(channel);
    } else {
      // If not yet open, store handler; on open we auto-subscribe to standard channels
      this.messageHandlers.set(channel, handler);
      this.subscriptions.add(channel);
    }
  }

  /**
   * Send message to WebSocket
   * @param {object} message - Message to send
   */
  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Handle incoming WebSocket message
   * @param {object} message - Received message
   */
  handleMessage(message) {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message.data);
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export default FleetWebSocket;
