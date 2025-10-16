// Dummy data for sensor table - Updated structure
// Each truck has multiple tires, each tire has 1 sensor, each sensor has battery

// Generate sensors for each truck based on tire count
const generateSensorsForAllTrucks = () => {
  const sensors = [];

  // Truck configurations: [truckId, deviceId, tireCount]
  const truckConfigs = [
    ['550e8400-e29b-41d4-a716-446655440001', 'd1e8d400-e29b-41d4-a716-446655440001', 6], // Truck Alpha
    ['550e8400-e29b-41d4-a716-446655440002', 'd1e8d400-e29b-41d4-a716-446655440002', 6], // Truck Beta
    ['550e8400-e29b-41d4-a716-446655440003', 'd1e8d400-e29b-41d4-a716-446655440003', 8], // Truck Gamma
    ['550e8400-e29b-41d4-a716-446655440004', 'd1e8d400-e29b-41d4-a716-446655440004', 6], // Truck Delta
    ['550e8400-e29b-41d4-a716-446655440005', 'd1e8d400-e29b-41d4-a716-446655440005', 8], // Truck Epsilon
    ['550e8400-e29b-41d4-a716-446655440006', 'd1e8d400-e29b-41d4-a716-446655440006', 4], // Truck Zeta
    ['550e8400-e29b-41d4-a716-446655440007', 'd1e8d400-e29b-41d4-a716-446655440007', 4], // Truck Eta
    ['550e8400-e29b-41d4-a716-446655440008', 'd1e8d400-e29b-41d4-a716-446655440008', 4], // Truck Theta
  ];

  const tirePositions = {
    4: ['FRONT_LEFT', 'FRONT_RIGHT', 'REAR_LEFT', 'REAR_RIGHT'],
    6: ['FRONT_LEFT', 'FRONT_RIGHT', 'REAR_LEFT_1', 'REAR_RIGHT_1', 'REAR_LEFT_2', 'REAR_RIGHT_2'],
    8: [
      'FRONT_LEFT',
      'FRONT_RIGHT',
      'REAR_LEFT_1',
      'REAR_RIGHT_1',
      'REAR_LEFT_2',
      'REAR_RIGHT_2',
      'REAR_LEFT_3',
      'REAR_RIGHT_3',
    ],
  };

  truckConfigs.forEach(([truckId, deviceId, tireCount], truckIndex) => {
    const positions = tirePositions[tireCount];

    for (let tireNo = 1; tireNo <= tireCount; tireNo++) {
      const position = positions[tireNo - 1];
      const sensorId = `s${(truckIndex + 1).toString().padStart(3, '0')}-tire-${tireNo.toString().padStart(2, '0')}-sensor`;

      sensors.push({
        id: sensorId,
        truck_id: truckId,
        device_id: deviceId,
        tire_number: tireNo,
        sensor_type: 'TIRE_PRESSURE',
        position: position,
        sn: `TP-${(truckIndex + 1).toString().padStart(3, '0')}-${tireNo.toString().padStart(2, '0')}`,
        battery_level: 75 + Math.floor(Math.random() * 25), // 75-100%
        battery_voltage: (3.0 + Math.random() * 0.7).toFixed(2), // 3.0-3.7V
        last_battery_check: new Date(
          Date.now() - Math.random() * 24 * 60 * 60 * 1000
        ).toISOString(),
        installed_at: `2023-0${Math.floor(Math.random() * 3) + 1}-${Math.floor(Math.random() * 28) + 1}T${Math.floor(Math.random() * 12) + 8}:${Math.floor(Math.random() * 60)}:00Z`,
        removed_at: null,
        created_by: null,
        updated_by: null,
      });
    }
  });

  return sensors;
};

export const sensors = generateSensorsForAllTrucks();
