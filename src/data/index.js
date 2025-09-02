// Main data export - aggregates all dummy data modules
import { trucks } from './trucks.js';
import { gpsPositions, generateGpsPositions } from './gpsPositions.js';
import { fuelLevelEvents, speedEvents, alertEvents } from './telemetryEvents.js';
import { trips } from './trips.js';
import { dailyRoutes } from './dailyRoutes.js';

// New data structures from updated schema
import { fleetGroups } from './fleetGroups.js';
import { devices } from './devices.js';
import { sensors } from './sensors.js';
import { truckStatusEvents } from './truckStatusEvents.js';
import { tirePressureEvents } from './tirePressureEvents.js';
import { hubTemperatureEvents } from './hubTemperatureEvents.js';
import { deviceStatusEvents } from './deviceStatusEvents.js';
import { lockEvents } from './lockEvents.js';
import { tireErrorCodes } from './tireErrorCodes.js';
import BORNEO_INDOBARA_GEOJSON from './geofance.js';

// Fleet data aggregation with relationships
export const getFleetData = () => {
  const trucksWithDrivers = trucks.map(truck => {
    // Get latest GPS position
    const latestPosition = gpsPositions.find(pos => pos.truck_id === truck.id);
    
    // Get latest fuel level
    const latestFuel = fuelLevelEvents.find(fuel => fuel.truck_id === truck.id);
    
    // Get tire pressures
    const tireData = tirePressureEvents.filter(tire => tire.truck_id === truck.id);
    
    // Get active alerts
    const activeAlerts = alertEvents.filter(
      alert => alert.truck_id === truck.id && !alert.acknowledged
    );

    // Get current trip
    const currentTrip = trips.find(trip => trip.truck_id === truck.id && trip.end_ts === null);

    return {
      ...truck,
      position: latestPosition,
      fuel: latestFuel,
      tires: tireData,
      alerts: activeAlerts,
      currentTrip: currentTrip,
      status: latestPosition?.speed_kph > 5 ? 'moving' : 'idle'
    };
  });

  return trucksWithDrivers;
};

// Live tracking data for map
export const getLiveTrackingData = () => {
  return gpsPositions.map(position => {
    const truck = trucks.find(t => t.id === position.truck_id);
    const fuel = fuelLevelEvents.find(f => f.truck_id === position.truck_id);
    const alerts = alertEvents.filter(
      a => a.truck_id === position.truck_id && !a.acknowledged
    );

    return {
      id: position.truck_id,
      name: truck?.name || 'Unknown Truck',
      plateNumber: truck?.plate_number || 'N/A',
      driver: 'N/A',
      position: [position.latitude, position.longitude],
      speed: position.speed_kph,
      heading: position.heading_deg,
      fuel: fuel?.fuel_percent || 0,
      alerts: alerts.length,
      status: position.speed_kph > 5 ? 'active' : 'idle',
      lastUpdate: position.ts
    };
  });
};

// Get truck route history
export const getTruckRoute = (truckId, timeRange = '24h') => {
  // Generate route from GPS positions for the specified time range
  const now = new Date();
  let cutoffTime;
  
  switch (timeRange) {
    case '1h':
      cutoffTime = new Date(now.getTime() - (1 * 60 * 60 * 1000));
      break;
    case '6h':
      cutoffTime = new Date(now.getTime() - (6 * 60 * 60 * 1000));
      break;
    case '24h':
    default:
      cutoffTime = new Date(now.getTime() - (24 * 60 * 60 * 1000));
      break;
  }
  
  // Get GPS positions for the truck within the time range
  const allPositions = generateGpsPositions();
  const positions = allPositions.filter(pos => {
    if (pos.truck_id !== truckId) return false;
    const posTime = new Date(pos.ts);
    return posTime >= cutoffTime && posTime <= now;
  });
  
  if (positions.length > 0) {
    // Sort by timestamp and return as coordinate array for Leaflet
    const sortedPositions = positions.sort((a, b) => new Date(a.ts) - new Date(b.ts));
    return sortedPositions.map(pos => [pos.lat, pos.lon]); // [lat, lng] format for Leaflet
  }
  
  // Fallback: return current position if no route data
  const currentPos = gpsPositions.find(pos => pos.truck_id === truckId);
  if (currentPos) {
    return [[currentPos.latitude || currentPos.lat, currentPos.longitude || currentPos.lon]];
  }
  
  return [];
};

// Dashboard statistics
export const getDashboardStats = () => {
  const totalTrucks = trucks.length;
  const activeTrucks = gpsPositions.filter(pos => pos.speed_kph > 0).length;
  const totalAlerts = alertEvents.filter(alert => !alert.acknowledged).length;
  
  return {
    totalTrucks,
    activeTrucks,
    idleTrucks: totalTrucks - activeTrucks,
    totalAlerts,
    fuelAverage: Math.round(
      fuelLevelEvents.reduce((sum, fuel) => sum + fuel.fuel_percent, 0) / 
      fuelLevelEvents.length
    )
  };
};

// Export all data structures
export {
  // Original data
  trucks,
  generateGpsPositions,
  gpsPositions,
  fuelLevelEvents,
  speedEvents,
  alertEvents,
  trips,
  dailyRoutes,
  
  // New data structures from updated schema
  fleetGroups,
  devices,
  sensors,
  truckStatusEvents,
  tirePressureEvents,
  hubTemperatureEvents,
  deviceStatusEvents,
  lockEvents,
  tireErrorCodes,
  
  // Geofence data
  BORNEO_INDOBARA_GEOJSON
};

// Utility functions for accessing new data
export const getDeviceByTruck = (truckId) => {
  return devices.find(device => device.truck_id === truckId && !device.removed_at);
};

export const getSensorsByDevice = (deviceId) => {
  return sensors.filter(sensor => sensor.device_id === deviceId && !sensor.removed_at);
};

export const getLatestTruckStatus = (truckId) => {
  return truckStatusEvents
    .filter(event => event.truck_id === truckId)
    .sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at))[0];
};

export const getLatestTirePressure = (truckId) => {
  return tirePressureEvents
    .filter(event => event.truck_id === truckId)
    .sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at))
    .slice(0, 6); // Get latest readings for all tires
};

export const getLatestHubTemperature = (truckId) => {
  return hubTemperatureEvents
    .filter(event => event.truck_id === truckId)
    .sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at))
    .slice(0, 3); // Get latest readings for all hubs
};

export const getDeviceStatus = (deviceId) => {
  return deviceStatusEvents
    .filter(event => event.device_id === deviceId)
    .sort((a, b) => new Date(b.reported_at) - new Date(a.reported_at))[0];
};

export const getDevicesByTruck = (truckId) => {
  return devices.filter(device => device.truck_id === truckId && !device.removed_at);
};

export const getTirePressureData = (truckId, timeRange = '24h') => {
  return tirePressureEvents.filter(event => event.truck_id === truckId);
};

export const getHubTemperatureData = (deviceId, timeRange = '24h') => {
  return hubTemperatureEvents.filter(event => event.device_id === deviceId);
};


export default {
  // Utility functions
  getFleetData,
  getLiveTrackingData,
  getTruckRoute,
  getDashboardStats,
  getDeviceByTruck,
  getSensorsByDevice,
  getLatestTruckStatus,
  getLatestTirePressure,
  getLatestHubTemperature,
  getDeviceStatus,
  
  // All data structures
  trucks,
  gpsPositions,
  fleetGroups,
  devices,
  sensors,
  truckStatusEvents,
  tirePressureEvents,
  hubTemperatureEvents,
  deviceStatusEvents,
  lockEvents,
  tireErrorCodes,
  fuelLevelEvents,
  speedEvents,
  alertEvents,
  trips,
  dailyRoutes,
  BORNEO_INDOBARA_GEOJSON
};
