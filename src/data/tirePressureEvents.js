// Dummy data for tire_pressure_event table (updated schema)
// Simple UUID generator function
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Generate realistic tire pressure events for the last 24 hours
const generateTirePressureEvents = () => {
  const events = [];
  const now = new Date();
  const devices = [
    "d1e8d400-e29b-41d4-a716-446655440001", // Truck Alpha
    "d1e8d400-e29b-41d4-a716-446655440002", // Truck Beta
    "d1e8d400-e29b-41d4-a716-446655440003", // Truck Gamma
    "d1e8d400-e29b-41d4-a716-446655440004", // Truck Delta
    "d1e8d400-e29b-41d4-a716-446655440005", // Truck Epsilon
    "d1e8d400-e29b-41d4-a716-446655440006", // Truck Zeta
    "d1e8d400-e29b-41d4-a716-446655440007", // Truck Eta
    "d1e8d400-e29b-41d4-a716-446655440008"  // Truck Theta
  ];
  
  const trucks = [
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002",
    "550e8400-e29b-41d4-a716-446655440003",
    "550e8400-e29b-41d4-a716-446655440004",
    "550e8400-e29b-41d4-a716-446655440005",
    "550e8400-e29b-41d4-a716-446655440006",
    "550e8400-e29b-41d4-a716-446655440007",
    "550e8400-e29b-41d4-a716-446655440008"
  ];

  const tireConfigs = [4, 4, 6, 4, 6, 4, 4, 4]; // Number of tires per truck

  devices.forEach((deviceId, deviceIndex) => {
    const truckId = trucks[deviceIndex];
    const numTires = tireConfigs[deviceIndex];
    
    // Generate events for last 24 hours (every hour)
    for (let i = 0; i < 24; i++) {
      const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
      
      // Generate pressure events for each tire
      for (let tireNo = 1; tireNo <= numTires; tireNo++) {
        // Normal pressure range: 800-900 kPa for mining trucks
        const basePressure = 850;
        const pressureVariation = Math.sin(i * 0.3) * 30 + Math.random() * 20;
        const pressure = basePressure + pressureVariation;
        
        // Temperature varies with operation and ambient conditions
        const baseTemp = 35;
        const tempVariation = Math.sin(i * 0.2) * 15 + Math.random() * 10;
        const temperature = baseTemp + tempVariation;
        
        // Determine if there's an exception
        let exType = null;
        if (pressure < 750) exType = "LOW_PRESSURE";
        else if (pressure > 950) exType = "HIGH_PRESSURE";
        else if (temperature > 65) exType = "HIGH_TEMP";
        
        events.push({
          id: generateUUID(),
          device_id: deviceId,
          truck_id: truckId,
          tire_no: tireNo,
          pressure_kpa: Math.round(pressure * 10) / 10,
          temp_celsius: Math.round(temperature * 10) / 10,
          ex_type: exType,
          battery_level: Math.floor(75 + Math.random() * 25),
          changed_at: timestamp.toISOString(),
          created_by: null
        });
      }
    }
  });
  
  return events.sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at));
};

export const tirePressureEvents = generateTirePressureEvents();

export default tirePressureEvents;
