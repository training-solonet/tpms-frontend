// Dummy data for alert_event table
// Simple UUID generator function
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Generate realistic alert events
const generateAlertEvents = () => {
  const events = [];
  const now = new Date();
  const trucks = [
    '550e8400-e29b-41d4-a716-446655440001', // Truck Alpha
    '550e8400-e29b-41d4-a716-446655440002', // Truck Beta
    '550e8400-e29b-41d4-a716-446655440003', // Truck Gamma
    '550e8400-e29b-41d4-a716-446655440004', // Truck Delta
    '550e8400-e29b-41d4-a716-446655440005', // Truck Epsilon
    '550e8400-e29b-41d4-a716-446655440006', // Truck Zeta
    '550e8400-e29b-41d4-a716-446655440007', // Truck Eta
    '550e8400-e29b-41d4-a716-446655440008', // Truck Theta
  ];

  const alertTypes = [
    { type: 'LOW_TIRE_PRESSURE', severity: 'HIGH', message: 'Tire pressure below safe threshold' },
    {
      type: 'HIGH_TEMPERATURE',
      severity: 'MEDIUM',
      message: 'Hub temperature exceeding normal range',
    },
    { type: 'LOW_FUEL', severity: 'HIGH', message: 'Fuel level critically low' },
    { type: 'SPEED_VIOLATION', severity: 'MEDIUM', message: 'Vehicle exceeding speed limit' },
    { type: 'GEOFENCE_EXIT', severity: 'HIGH', message: 'Vehicle left authorized area' },
    { type: 'DEVICE_OFFLINE', severity: 'HIGH', message: 'IoT device connection lost' },
    { type: 'MAINTENANCE_DUE', severity: 'LOW', message: 'Scheduled maintenance approaching' },
    { type: 'BATTERY_LOW', severity: 'MEDIUM', message: 'Device battery level low' },
  ];

  trucks.forEach((truckId) => {
    // Generate 2-5 alerts per truck over the last week
    const numAlerts = 2 + Math.floor(Math.random() * 4);

    for (let i = 0; i < numAlerts; i++) {
      const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      const hoursAgo = Math.floor(Math.random() * 168); // Random time in last week
      const timestamp = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

      // Some alerts are acknowledged, some are not
      const acknowledged = Math.random() > 0.4;
      const acknowledgedAt = acknowledged
        ? new Date(timestamp.getTime() + Math.random() * 2 * 60 * 60 * 1000)
        : null;

      events.push({
        id: generateUUID(),
        truck_id: truckId,
        alert_type: alertType.type,
        severity: alertType.severity,
        message: alertType.message,
        acknowledged: acknowledged,
        acknowledged_at: acknowledgedAt?.toISOString() || null,
        acknowledged_by: acknowledged ? 'system_admin' : null,
        created_at: timestamp.toISOString(),
        created_by: null,
      });
    }
  });

  return events.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

export const alertEvents = generateAlertEvents();

export default alertEvents;
