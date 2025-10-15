// Dummy data for fuel_level_event table
// Simple UUID generator function
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Generate realistic fuel level events for the last 24 hours
const generateFuelLevelEvents = () => {
  const events = [];
  const now = new Date();
  const trucks = [
    "550e8400-e29b-41d4-a716-446655440001", // Truck Alpha
    "550e8400-e29b-41d4-a716-446655440002", // Truck Beta
    "550e8400-e29b-41d4-a716-446655440003", // Truck Gamma
    "550e8400-e29b-41d4-a716-446655440004", // Truck Delta
    "550e8400-e29b-41d4-a716-446655440005", // Truck Epsilon
    "550e8400-e29b-41d4-a716-446655440006", // Truck Zeta
    "550e8400-e29b-41d4-a716-446655440007", // Truck Eta
    "550e8400-e29b-41d4-a716-446655440008"  // Truck Theta
  ];

  trucks.forEach((truckId) => {
    let currentFuel = 85 + Math.random() * 15; // Start with 85-100% fuel
    
    // Generate events for last 24 hours (every 2 hours)
    for (let i = 0; i < 12; i++) {
      const timestamp = new Date(now.getTime() - (i * 2 * 60 * 60 * 1000));
      
      // Simulate fuel consumption (2-8% per 2 hours depending on activity)
      const consumption = 2 + Math.random() * 6;
      currentFuel = Math.max(10, currentFuel - consumption);
      
      // Add some refueling events randomly
      if (currentFuel < 25 && Math.random() > 0.7) {
        currentFuel = 90 + Math.random() * 10; // Refuel to 90-100%
      }
      
      events.push({
        id: generateUUID(),
        truck_id: truckId,
        fuel_percent: Math.round(currentFuel * 10) / 10,
        fuel_liters: Math.round((currentFuel / 100) * 500), // Assuming 500L tank capacity
        changed_at: timestamp.toISOString(),
        created_by: null
      });
    }
  });
  
  return events.sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at));
};

export const fuelLevelEvents = generateFuelLevelEvents();

export default fuelLevelEvents;
