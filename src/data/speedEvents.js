// Dummy data for speed_event table
// Simple UUID generator function
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Generate realistic speed events for the last 24 hours
const generateSpeedEvents = () => {
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

  trucks.forEach((truckId) => {
    // Generate events for last 24 hours (every 30 minutes)
    for (let i = 0; i < 48; i++) {
      const timestamp = new Date(now.getTime() - i * 30 * 60 * 1000);

      // Simulate realistic speed patterns for mining trucks
      let speed = 0;
      const hour = timestamp.getHours();

      // Working hours (6 AM - 6 PM) have higher activity
      if (hour >= 6 && hour <= 18) {
        // Vary speed based on operation type
        if (Math.random() > 0.3) {
          // 70% chance of movement during work hours
          speed = 15 + Math.random() * 35; // 15-50 km/h for loaded trucks
          if (Math.random() > 0.8) {
            // 20% chance of higher speed (empty return)
            speed = 40 + Math.random() * 20; // 40-60 km/h for empty trucks
          }
        }
      } else {
        // Night/early morning - mostly idle with occasional movement
        if (Math.random() > 0.8) {
          // 20% chance of movement
          speed = 5 + Math.random() * 25; // 5-30 km/h
        }
      }

      // Determine if this is a speed violation (>60 km/h for mining area)
      const speedLimit = 60;
      const isViolation = speed > speedLimit;

      events.push({
        id: generateUUID(),
        truck_id: truckId,
        speed_kph: Math.round(speed * 10) / 10,
        speed_limit_kph: speedLimit,
        is_violation: isViolation,
        location_lat: -2.5 + (Math.random() - 0.5) * 0.1, // Around Borneo area
        location_lng: 115.5 + (Math.random() - 0.5) * 0.1,
        recorded_at: timestamp.toISOString(),
        created_by: null,
      });
    }
  });

  return events.sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at));
};

export const speedEvents = generateSpeedEvents();

export default speedEvents;
