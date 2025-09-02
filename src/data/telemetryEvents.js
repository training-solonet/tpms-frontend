// Dummy data for telemetry events (fuel, tire pressure, speed, alerts)

export const fuelLevelEvents = [
  {
    id: "fuel_001",
    truck_id: "550e8400-e29b-41d4-a716-446655440001",
    fuel_percent: 85.5,
    changed_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
    source: "fuel_sensor"
  },
  {
    id: "fuel_002", 
    truck_id: "550e8400-e29b-41d4-a716-446655440002",
    fuel_percent: 72.3,
    changed_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 min ago
    source: "fuel_sensor"
  },
  {
    id: "fuel_003",
    truck_id: "550e8400-e29b-41d4-a716-446655440003", 
    fuel_percent: 91.2,
    changed_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 min ago
    source: "fuel_sensor"
  },
  {
    id: "fuel_004",
    truck_id: "550e8400-e29b-41d4-a716-446655440004",
    fuel_percent: 45.8,
    changed_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
    source: "fuel_sensor"
  },
  {
    id: "fuel_005",
    truck_id: "550e8400-e29b-41d4-a716-446655440005",
    fuel_percent: 68.7,
    changed_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 min ago
    source: "fuel_sensor"
  },
  {
    id: "fuel_006",
    truck_id: "550e8400-e29b-41d4-a716-446655440006",
    fuel_percent: 33.4,
    changed_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(), // 1.5 hours ago
    source: "fuel_sensor"
  },
  {
    id: "fuel_007",
    truck_id: "550e8400-e29b-41d4-a716-446655440007",
    fuel_percent: 79.1,
    changed_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 min ago
    source: "fuel_sensor"
  },
  {
    id: "fuel_008",
    truck_id: "550e8400-e29b-41d4-a716-446655440008",
    fuel_percent: 56.9,
    changed_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 min ago
    source: "fuel_sensor"
  }
];

export const tirePressureEvents = [
  // Truck Alpha - All tires
  {
    id: "tire_001",
    truck_id: "550e8400-e29b-41d4-a716-446655440001",
    position: "FL",
    pressure_kpa: 850,
    changed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    source: "tire_sensor"
  },
  {
    id: "tire_002",
    truck_id: "550e8400-e29b-41d4-a716-446655440001",
    position: "FR", 
    pressure_kpa: 845,
    changed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    source: "tire_sensor"
  },
  {
    id: "tire_003",
    truck_id: "550e8400-e29b-41d4-a716-446655440001",
    position: "RL",
    pressure_kpa: 840,
    changed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    source: "tire_sensor"
  },
  {
    id: "tire_004",
    truck_id: "550e8400-e29b-41d4-a716-446655440001",
    position: "RR",
    pressure_kpa: 835,
    changed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    source: "tire_sensor"
  },
  // Truck Beta - Sample tires
  {
    id: "tire_005",
    truck_id: "550e8400-e29b-41d4-a716-446655440002",
    position: "FL",
    pressure_kpa: 820, // Low pressure
    changed_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    source: "tire_sensor"
  },
  {
    id: "tire_006",
    truck_id: "550e8400-e29b-41d4-a716-446655440002",
    position: "FR",
    pressure_kpa: 855,
    changed_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    source: "tire_sensor"
  }
];

export const speedEvents = [
  {
    id: "speed_001",
    truck_id: "550e8400-e29b-41d4-a716-446655440001",
    speed_kph: 45.2,
    changed_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
    source: "gps_device"
  },
  {
    id: "speed_002",
    truck_id: "550e8400-e29b-41d4-a716-446655440002", 
    speed_kph: 38.7,
    changed_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(), // 3 min ago
    source: "gps_device"
  },
  {
    id: "speed_003",
    truck_id: "550e8400-e29b-41d4-a716-446655440003",
    speed_kph: 75.8, // Speeding
    changed_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 min ago
    source: "gps_device"
  }
];

export const alertEvents = [
  {
    id: "alert_001",
    truck_id: "550e8400-e29b-41d4-a716-446655440002",
    type: "LOW_TIRE",
    severity: 3,
    detail: {
      tire_position: "FL",
      current_pressure: 820,
      threshold_pressure: 830,
      message: "Front left tire pressure below threshold"
    },
    occurred_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    acknowledged: false,
    acknowledged_at: null
  },
  {
    id: "alert_002",
    truck_id: "550e8400-e29b-41d4-a716-446655440003",
    type: "SPEEDING",
    severity: 4,
    detail: {
      current_speed: 75.8,
      speed_limit: 60,
      location: "Mining Road Section A",
      message: "Vehicle exceeding speed limit"
    },
    occurred_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    acknowledged: false,
    acknowledged_at: null
  },
  {
    id: "alert_003",
    truck_id: "550e8400-e29b-41d4-a716-446655440006",
    type: "FUEL_DROP",
    severity: 2,
    detail: {
      previous_level: 45.2,
      current_level: 33.4,
      drop_rate: "11.8% in 30 minutes",
      message: "Rapid fuel consumption detected"
    },
    occurred_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    acknowledged: true,
    acknowledged_at: new Date(Date.now() - 60 * 60 * 1000).toISOString()
  },
  {
    id: "alert_004",
    truck_id: "550e8400-e29b-41d4-a716-446655440004",
    type: "IDLE",
    severity: 1,
    detail: {
      idle_duration: "45 minutes",
      location: "Loading Zone B",
      fuel_consumed: "2.3 liters",
      message: "Extended idle time detected"
    },
    occurred_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    acknowledged: false,
    acknowledged_at: null
  }
];

export default {
  fuelLevelEvents,
  tirePressureEvents, 
  speedEvents,
  alertEvents
};
