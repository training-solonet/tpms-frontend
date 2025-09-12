// Dummy data for lock_event table
// Simple UUID generator function
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Generate realistic lock events for the last week
const generateLockEvents = () => {
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

    // Generate lock/unlock events for last 7 days
    for (let day = 0; day < 7; day++) {
      // Morning unlock (start of shift)
      const morningUnlock = new Date(now.getTime() - day * 24 * 60 * 60 * 1000);
      morningUnlock.setHours(6, Math.floor(Math.random() * 30), 0, 0);

      events.push({
        id: generateUUID(),
        device_id: deviceId,
        truck_id: truckId,
        is_lock: 0, // Unlock
        reported_at: morningUnlock.toISOString(),
        created_by: null,
      });

      // Evening lock (end of shift)
      const eveningLock = new Date(now.getTime() - day * 24 * 60 * 60 * 1000);
      eveningLock.setHours(18, Math.floor(Math.random() * 60), 0, 0);

      events.push({
        id: generateUUID(),
        device_id: deviceId,
        truck_id: truckId,
        is_lock: 1, // Lock
        reported_at: eveningLock.toISOString(),
        created_by: null,
      });

      // Random security lock events (10% chance per day)
      if (Math.random() < 0.1) {
        const securityLock = new Date(now.getTime() - day * 24 * 60 * 60 * 1000);
        securityLock.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);

        events.push({
          id: generateUUID(),
          device_id: deviceId,
          truck_id: truckId,
          is_lock: 1, // Security lock
          reported_at: securityLock.toISOString(),
          created_by: null,
        });
      }
    }
  });

  return events.sort((a, b) => new Date(b.reported_at) - new Date(a.reported_at));
};

export const lockEvents = generateLockEvents();

export default lockEvents;
