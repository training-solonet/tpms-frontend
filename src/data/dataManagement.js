// Data management utilities aligned with sidebar functions
import {
  trucks, fleetGroups, devices, sensors, gpsPositions, drivers,
  tirePressureEvents, hubTemperatureEvents, fuelLevelEvents,
  truckStatusEvents, deviceStatusEvents, alertEvents
} from './index.js';

// ==========================================
// DASHBOARD DATA MANAGEMENT
// ==========================================

export const getDashboardData = () => {
  const totalTrucks = trucks.length;
  const activeDevices = devices.filter(d => !d.removed_at).length;
  const totalAlerts = alertEvents.filter(a => !a.acknowledged).length;
  const criticalAlerts = alertEvents.filter(a => !a.acknowledged && a.severity === 'HIGH').length;
  
  // Fleet group statistics
  const fleetGroupStats = fleetGroups.map(group => {
    const groupTrucks = trucks.filter(t => t.fleet_group_id === group.id);
    const activeGroupTrucks = groupTrucks.filter(truck => {
      const latestPos = gpsPositions.find(pos => pos.truck_id === truck.id);
      return latestPos && latestPos.speed_kph > 0;
    });
    
    return {
      ...group,
      totalTrucks: groupTrucks.length,
      activeTrucks: activeGroupTrucks.length,
      idleTrucks: groupTrucks.length - activeGroupTrucks.length
    };
  });

  return {
    totalTrucks,
    activeDevices,
    totalAlerts,
    criticalAlerts,
    fleetGroupStats,
    lastUpdated: new Date().toISOString()
  };
};

// ==========================================
// LIVE TRACKING DATA MANAGEMENT
// ==========================================

export const getLiveTrackingData = () => {
  return trucks.map(truck => {
    const position = gpsPositions.find(pos => pos.truck_id === truck.id);
    const device = devices.find(d => d.truck_id === truck.id && !d.removed_at);
    const deviceStatus = device ? deviceStatusEvents
      .filter(e => e.device_id === device.id)
      .sort((a, b) => new Date(b.reported_at) - new Date(a.reported_at))[0] : null;
    
    const latestFuel = fuelLevelEvents
      .filter(f => f.truck_id === truck.id)
      .sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at))[0];
    
    const activeAlerts = alertEvents.filter(a => a.truck_id === truck.id && !a.acknowledged);
    const fleetGroup = fleetGroups.find(fg => fg.id === truck.fleet_group_id);

    return {
      id: truck.id,
      name: truck.name,
      plateNumber: truck.plate_number,
      model: truck.model,
      fleetGroup: fleetGroup?.name || 'Unknown',
      position: position ? {
        lat: position.latitude || position.lat,
        lng: position.longitude || position.lon,
        speed: position.speed_kph,
        heading: position.heading_deg,
        timestamp: position.ts
      } : null,
      fuel: latestFuel?.fuel_percent || 0,
      deviceStatus: deviceStatus?.status || 'UNKNOWN',
      batteryLevel: deviceStatus?.battery_level || 0,
      signalStrength: deviceStatus?.signal_strength || 0,
      alerts: activeAlerts.length,
      status: position?.speed_kph > 5 ? 'MOVING' : 'IDLE',
      lastUpdate: position?.ts || truck.updated_at
    };
  });
};

export const getTruckRouteHistory = (truckId, timeRange = '24h') => {
  const cutoffHours = timeRange === '1h' ? 1 : timeRange === '6h' ? 6 : 24;
  const cutoffTime = new Date(Date.now() - (cutoffHours * 60 * 60 * 1000));
  
  const routePoints = gpsPositions
    .filter(pos => pos.truck_id === truckId && new Date(pos.ts) >= cutoffTime)
    .sort((a, b) => new Date(a.ts) - new Date(b.ts))
    .map(pos => ({
      lat: pos.latitude || pos.lat,
      lng: pos.longitude || pos.lon,
      speed: pos.speed_kph,
      timestamp: pos.ts
    }));

  return routePoints;
};

// ==========================================
// FLEET MANAGEMENT DATA
// ==========================================

export const getFleetManagementData = () => {
  return {
    fleetGroups: fleetGroups.map(group => ({
      ...group,
      trucks: trucks.filter(t => t.fleet_group_id === group.id),
      totalTrucks: trucks.filter(t => t.fleet_group_id === group.id).length
    })),
    
    allVehicles: trucks.map(truck => {
      const device = devices.find(d => d.truck_id === truck.id && !d.removed_at);
      const fleetGroup = fleetGroups.find(fg => fg.id === truck.fleet_group_id);
      const latestStatus = truckStatusEvents
        .filter(e => e.truck_id === truck.id)
        .sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at))[0];
      
      return {
        ...truck,
        fleetGroup: fleetGroup?.name || 'Unassigned',
        deviceSN: device?.sn || 'No Device',
        status: latestStatus?.status || 'UNKNOWN',
        lastStatusChange: latestStatus?.changed_at || truck.created_at
      };
    }),
    
    vehicleIoTStatus: trucks.map(truck => {
      const device = devices.find(d => d.truck_id === truck.id && !d.removed_at);
      const deviceStatus = device ? deviceStatusEvents
        .filter(e => e.device_id === device.id)
        .sort((a, b) => new Date(b.reported_at) - new Date(a.reported_at))[0] : null;
      
      return {
        truckId: truck.id,
        truckName: truck.name,
        plateNumber: truck.plate_number,
        deviceId: device?.id || null,
        deviceSN: device?.sn || 'No Device',
        deviceStatus: deviceStatus?.status || 'OFFLINE',
        batteryLevel: deviceStatus?.battery_level || 0,
        signalStrength: deviceStatus?.signal_strength || 0,
        lastReport: deviceStatus?.reported_at || null
      };
    })
  };
};

// ==========================================
// IOT DEVICES DATA MANAGEMENT
// ==========================================

export const getIoTDevicesData = () => {
  return devices.map(device => {
    const truck = trucks.find(t => t.id === device.truck_id);
    const deviceSensors = sensors.filter(s => s.device_id === device.id && !s.removed_at);
    const latestStatus = deviceStatusEvents
      .filter(e => e.device_id === device.id)
      .sort((a, b) => new Date(b.reported_at) - new Date(a.reported_at))[0];
    
    return {
      ...device,
      truckName: truck?.name || 'Unassigned',
      plateNumber: truck?.plate_number || 'N/A',
      sensorsCount: deviceSensors.length,
      sensors: deviceSensors,
      status: latestStatus?.status || 'UNKNOWN',
      batteryLevel: latestStatus?.battery_level || 0,
      signalStrength: latestStatus?.signal_strength || 0,
      lastReport: latestStatus?.reported_at || null,
      isActive: !device.removed_at
    };
  });
};

export const getDeviceSensorsData = (deviceId) => {
  const device = devices.find(d => d.id === deviceId);
  const deviceSensors = sensors.filter(s => s.device_id === deviceId && !s.removed_at);
  
  return {
    device,
    sensors: deviceSensors.map(sensor => {
      const latestTireData = tirePressureEvents
        .filter(e => e.sensor_id === sensor.id)
        .sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at))[0];
      
      const latestHubData = hubTemperatureEvents
        .filter(e => e.device_id === deviceId && e.sensor_id === sensor.id)
        .sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at))[0];
      
      return {
        ...sensor,
        latestReading: sensor.sensor_type === 'TIRE_PRESSURE' ? latestTireData : latestHubData,
        batteryLevel: sensor.battery_level,
        batteryVoltage: sensor.battery_voltage,
        lastBatteryCheck: sensor.last_battery_check
      };
    })
  };
};

// ==========================================
// TELEMETRY DATA MANAGEMENT
// ==========================================

export const getTelemetryData = () => {
  return {
    tirePressure: getTirePressureData(),
    hubTemperature: getHubTemperatureData(),
    fuelLevels: getFuelLevelsData()
  };
};

export const getTirePressureData = (truckId = null, timeRange = '24h') => {
  const cutoffHours = timeRange === '1h' ? 1 : timeRange === '6h' ? 6 : 24;
  const cutoffTime = new Date(Date.now() - (cutoffHours * 60 * 60 * 1000));
  
  let events = tirePressureEvents.filter(e => new Date(e.changed_at) >= cutoffTime);
  if (truckId) {
    events = events.filter(e => e.truck_id === truckId);
  }
  
  return events.map(event => {
    const truck = trucks.find(t => t.id === event.truck_id);
    const device = devices.find(d => d.id === event.device_id);
    const sensor = sensors.find(s => s.id === event.sensor_id);
    
    return {
      ...event,
      truckName: truck?.name || 'Unknown',
      plateNumber: truck?.plate_number || 'N/A',
      deviceSN: device?.sn || 'Unknown',
      sensorSN: sensor?.sn || 'Unknown',
      tirePosition: sensor?.position || 'Unknown',
      hasException: event.ex_type !== null
    };
  }).sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at));
};

export const getHubTemperatureData = (deviceId = null, timeRange = '24h') => {
  const cutoffHours = timeRange === '1h' ? 1 : timeRange === '6h' ? 6 : 24;
  const cutoffTime = new Date(Date.now() - (cutoffHours * 60 * 60 * 1000));
  
  let events = hubTemperatureEvents.filter(e => new Date(e.changed_at) >= cutoffTime);
  if (deviceId) {
    events = events.filter(e => e.device_id === deviceId);
  }
  
  return events.map(event => {
    const device = devices.find(d => d.id === event.device_id);
    const truck = trucks.find(t => t.id === device?.truck_id);
    
    return {
      ...event,
      truckName: truck?.name || 'Unknown',
      plateNumber: truck?.plate_number || 'N/A',
      deviceSN: device?.sn || 'Unknown'
    };
  }).sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at));
};

export const getFuelLevelsData = (truckId = null, timeRange = '24h') => {
  const cutoffHours = timeRange === '1h' ? 1 : timeRange === '6h' ? 6 : 24;
  const cutoffTime = new Date(Date.now() - (cutoffHours * 60 * 60 * 1000));
  
  let events = fuelLevelEvents.filter(e => new Date(e.changed_at) >= cutoffTime);
  if (truckId) {
    events = events.filter(e => e.truck_id === truckId);
  }
  
  return events.map(event => {
    const truck = trucks.find(t => t.id === event.truck_id);
    
    return {
      ...event,
      truckName: truck?.name || 'Unknown',
      plateNumber: truck?.plate_number || 'N/A',
      isLowFuel: event.fuel_percent < 25
    };
  }).sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at));
};

// ==========================================
// ALERTS DATA MANAGEMENT
// ==========================================

export const getAlertsData = (includeAcknowledged = false) => {
  let alerts = includeAcknowledged ? alertEvents : alertEvents.filter(a => !a.acknowledged);
  
  return alerts.map(alert => {
    const truck = trucks.find(t => t.id === alert.truck_id);
    const fleetGroup = fleetGroups.find(fg => fg.id === truck?.fleet_group_id);
    
    return {
      ...alert,
      truckName: truck?.name || 'Unknown',
      plateNumber: truck?.plate_number || 'N/A',
      fleetGroup: fleetGroup?.name || 'Unknown',
      age: Math.floor((Date.now() - new Date(alert.created_at).getTime()) / (1000 * 60 * 60)) // hours
    };
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

export const getAlertsByTruck = (truckId, includeAcknowledged = false) => {
  return getAlertsData(includeAcknowledged).filter(a => a.truck_id === truckId);
};

export const getAlertsBySeverity = (severity, includeAcknowledged = false) => {
  return getAlertsData(includeAcknowledged).filter(a => a.severity === severity);
};

// ==========================================
// SETTINGS DATA MANAGEMENT
// ==========================================

export const getSystemSettings = () => {
  return {
    fleetConfiguration: {
      totalFleetGroups: fleetGroups.length,
      totalTrucks: trucks.length,
      totalDevices: devices.filter(d => !d.removed_at).length,
      totalSensors: sensors.filter(s => !s.removed_at).length
    },
    alertConfiguration: {
      totalAlertTypes: [...new Set(alertEvents.map(a => a.alert_type))].length,
      unacknowledgedAlerts: alertEvents.filter(a => !a.acknowledged).length,
      criticalAlerts: alertEvents.filter(a => !a.acknowledged && a.severity === 'HIGH').length
    },
    telemetryConfiguration: {
      tirePressureThresholds: {
        low: 750, // kPa
        high: 950 // kPa
      },
      temperatureThresholds: {
        high: 65 // Celsius
      },
      fuelThresholds: {
        low: 25, // percent
        critical: 10 // percent
      }
    },
    systemStatus: {
      lastDataUpdate: new Date().toISOString(),
      activeConnections: devices.filter(d => !d.removed_at).length,
      dataIntegrity: 'OK'
    }
  };
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

export const searchTrucks = (query) => {
  const searchTerm = query.toLowerCase();
  return trucks.filter(truck => 
    truck.name.toLowerCase().includes(searchTerm) ||
    truck.plate_number.toLowerCase().includes(searchTerm) ||
    truck.model.toLowerCase().includes(searchTerm)
  );
};

export const getTrucksByFleetGroup = (fleetGroupId) => {
  return trucks.filter(truck => truck.fleet_group_id === fleetGroupId);
};

export const getActiveAlertsByType = (alertType) => {
  return alertEvents.filter(alert => 
    alert.alert_type === alertType && !alert.acknowledged
  );
};

export const getTruckCurrentStatus = (truckId) => {
  const truck = trucks.find(t => t.id === truckId);
  const driver = drivers.find(d => d.id === truck?.driver_id);
  const position = gpsPositions.find(pos => pos.truck_id === truckId);
  const device = devices.find(d => d.truck_id === truckId && !d.removed_at);
  const alerts = alertEvents.filter(a => a.truck_id === truckId && !a.acknowledged);
  const fuel = fuelLevelEvents
    .filter(f => f.truck_id === truckId)
    .sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at))[0];
  
  return {
    truck,
    driver,
    position,
    device,
    alerts,
    fuel,
    status: position?.speed_kph > 5 ? 'MOVING' : 'IDLE'
  };
};

// ==========================================
// DRIVERS DATA MANAGEMENT
// ==========================================

export const getDriversData = () => {
  return drivers.map(driver => {
    const assignedTruck = trucks.find(t => t.driver_id === driver.id);
    const fleetGroup = assignedTruck ? fleetGroups.find(fg => fg.id === assignedTruck.fleet_group_id) : null;
    
    return {
      ...driver,
      assignedTruck: assignedTruck ? {
        id: assignedTruck.id,
        name: assignedTruck.name,
        plateNumber: assignedTruck.plate_number,
        model: assignedTruck.model
      } : null,
      fleetGroup: fleetGroup?.name || 'Unassigned',
      isActive: driver.status === 'ACTIVE'
    };
  });
};

export const getDriverById = (driverId) => {
  const driver = drivers.find(d => d.id === driverId);
  if (!driver) return null;
  
  const assignedTruck = trucks.find(t => t.driver_id === driverId);
  const fleetGroup = assignedTruck ? fleetGroups.find(fg => fg.id === assignedTruck.fleet_group_id) : null;
  
  return {
    ...driver,
    assignedTruck,
    fleetGroup: fleetGroup?.name || 'Unassigned'
  };
};
