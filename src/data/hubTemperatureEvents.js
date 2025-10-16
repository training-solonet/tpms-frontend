// Dummy data for hub_temperature_event table
// Simple UUID generator function
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Generate realistic hub temperature events for the last 24 hours
const generateHubTemperatureEvents = () => {
  const events = [];
  const now = new Date();
  const devices = [
    'd1e8d400-e29b-41d4-a716-446655440001', // Truck Alpha
    'd1e8d400-e29b-41d4-a716-446655440002', // Truck Beta
    'd1e8d400-e29b-41d4-a716-446655440003', // Truck Gamma
    'd1e8d400-e29b-41d4-a716-446655440004', // Truck Delta
    'd1e8d400-e29b-41d4-a716-446655440005', // Truck Epsilon
    'd1e8d400-e29b-41d4-a716-446655440006', // Truck Zeta
    'd1e8d400-e29b-41d4-a716-446655440007', // Truck Eta
    'd1e8d400-e29b-41d4-a716-446655440008', // Truck Theta
  ];

  const trucks = [
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440006',
    '550e8400-e29b-41d4-a716-446655440007',
    '550e8400-e29b-41d4-a716-446655440008',
  ];

  // eslint-disable-next-line no-unused-vars
  let eventId = 1;

  devices.forEach((deviceId, deviceIndex) => {
    const truckId = trucks[deviceIndex];

    // Generate events for last 24 hours (every 30 minutes)
    for (let i = 0; i < 48; i++) {
      const timestamp = new Date(now.getTime() - i * 30 * 60 * 1000);

      // Front hub temperature
      const frontHubTemp = 45 + Math.sin(i * 0.2) * 15 + Math.random() * 10;
      events.push({
        id: generateUUID(),
        device_id: deviceId,
        truck_id: truckId,
        hub_no: 1,
        temp_celsius: Math.round(frontHubTemp * 10) / 10,
        ex_type: frontHubTemp > 70 ? 'HIGH_TEMP' : null,
        battery_level: Math.floor(85 + Math.random() * 15),
        changed_at: timestamp.toISOString(),
        created_by: null,
      });

      // Rear hub temperature
      const rearHubTemp = 50 + Math.sin(i * 0.15) * 20 + Math.random() * 8;
      events.push({
        id: generateUUID(),
        device_id: deviceId,
        truck_id: truckId,
        hub_no: 2,
        temp_celsius: Math.round(rearHubTemp * 10) / 10,
        ex_type: rearHubTemp > 75 ? 'HIGH_TEMP' : null,
        battery_level: Math.floor(80 + Math.random() * 20),
        changed_at: timestamp.toISOString(),
        created_by: null,
      });

      eventId += 2;
    }
  });

  return events.sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at));
};

export const hubTemperatureEvents = generateHubTemperatureEvents();

export default hubTemperatureEvents;
