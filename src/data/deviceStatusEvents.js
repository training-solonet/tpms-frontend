// Dummy data for device_status_event table
// Simple UUID generator function
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Generate realistic device status events for the last 24 hours
const generateDeviceStatusEvents = () => {
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

  devices.forEach((deviceId, deviceIndex) => {
    const truckId = trucks[deviceIndex];

    // Generate events for last 24 hours (every 2 hours)
    for (let i = 0; i < 12; i++) {
      const timestamp = new Date(now.getTime() - i * 2 * 60 * 60 * 1000);

      // Simulate battery degradation over time
      const hostBattery = Math.max(20, 100 - i * 2 + Math.random() * 10);
      const repeater1Battery = Math.max(15, 95 - i * 3 + Math.random() * 15);
      const repeater2Battery = Math.max(10, 90 - i * 4 + Math.random() * 20);

      events.push({
        id: generateUUID(),
        device_id: deviceId,
        truck_id: truckId,
        host_bat: Math.floor(hostBattery),
        repeater1_bat: Math.floor(repeater1Battery),
        repeater2_bat: Math.floor(repeater2Battery),
        lock_state: Math.random() > 0.8 ? 1 : 0, // 20% chance of being locked
        reported_at: timestamp.toISOString(),
        created_by: null,
      });
    }
  });

  return events.sort((a, b) => new Date(b.reported_at) - new Date(a.reported_at));
};

export const deviceStatusEvents = generateDeviceStatusEvents();

export default deviceStatusEvents;
