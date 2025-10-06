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
  
  // Truck configurations: [truckId, deviceId, tireCount]
  const truckConfigs = [
    ["550e8400-e29b-41d4-a716-446655440001", "d1e8d400-e29b-41d4-a716-446655440001", 6], // Truck Alpha
    ["550e8400-e29b-41d4-a716-446655440002", "d1e8d400-e29b-41d4-a716-446655440002", 6], // Truck Beta
    ["550e8400-e29b-41d4-a716-446655440003", "d1e8d400-e29b-41d4-a716-446655440003", 8], // Truck Gamma
    ["550e8400-e29b-41d4-a716-446655440004", "d1e8d400-e29b-41d4-a716-446655440004", 6], // Truck Delta
    ["550e8400-e29b-41d4-a716-446655440005", "d1e8d400-e29b-41d4-a716-446655440005", 8], // Truck Epsilon
    ["550e8400-e29b-41d4-a716-446655440006", "d1e8d400-e29b-41d4-a716-446655440006", 4], // Truck Zeta
    ["550e8400-e29b-41d4-a716-446655440007", "d1e8d400-e29b-41d4-a716-446655440007", 4], // Truck Eta
    ["550e8400-e29b-41d4-a716-446655440008", "d1e8d400-e29b-41d4-a716-446655440008", 4]  // Truck Theta
  ];

  truckConfigs.forEach(([truckId, deviceId, tireCount], truckIndex) => {
    // Generate events for last 24 hours (every hour)
    for (let i = 0; i < 24; i++) {
      const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
      
      // Generate pressure events for each tire
      for (let tireNo = 1; tireNo <= tireCount; tireNo++) {
        // Generate sensor ID matching the pattern from sensors.js
        const sensorId = `s${(truckIndex + 1).toString().padStart(3, '0')}-tire-${tireNo.toString().padStart(2, '0')}-sensor`;
        
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
          sensor_id: sensorId,
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
