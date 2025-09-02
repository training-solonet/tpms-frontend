// Dummy data for GPS positions - simulating real-time tracking within PT Borneo Indobara area
// Coordinates are within the geofence area defined in geofance.js

export const generateGpsPositions = () => {
  const now = new Date();
  const positions = [];
  
  // Base coordinates within PT Borneo Indobara area
  const baseCoordinates = [
    { lat: -3.520000, lon: 115.580000 }, // Truck Alpha
    { lat: -3.530000, lon: 115.590000 }, // Truck Beta  
    { lat: -3.540000, lon: 115.600000 }, // Truck Gamma
    { lat: -3.550000, lon: 115.610000 }, // Truck Delta
    { lat: -3.560000, lon: 115.620000 }, // Truck Epsilon
    { lat: -3.570000, lon: 115.630000 }, // Truck Zeta
    { lat: -3.580000, lon: 115.640000 }, // Truck Eta
    { lat: -3.590000, lon: 115.650000 }, // Truck Theta
  ];

  const truckIds = [
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002", 
    "550e8400-e29b-41d4-a716-446655440003",
    "550e8400-e29b-41d4-a716-446655440004",
    "550e8400-e29b-41d4-a716-446655440005",
    "550e8400-e29b-41d4-a716-446655440006",
    "550e8400-e29b-41d4-a716-446655440007",
    "550e8400-e29b-41d4-a716-446655440008"
  ];

  // Generate positions for each truck
  truckIds.forEach((truckId, index) => {
    const baseCoord = baseCoordinates[index];
    
    // Generate positions for the last 24 hours (every 10 minutes)
    for (let i = 0; i < 144; i++) {
      const timestamp = new Date(now.getTime() - (i * 10 * 60 * 1000));
      
      // Add some random movement within a small area
      const latOffset = (Math.random() - 0.5) * 0.01; // ±0.005 degrees
      const lonOffset = (Math.random() - 0.5) * 0.01; // ±0.005 degrees
      
      positions.push({
        id: `gps_${truckId}_${i}`,
        truck_id: truckId,
        ts: timestamp.toISOString(),
        lat: baseCoord.lat + latOffset,
        lon: baseCoord.lon + lonOffset,
        speed_kph: Math.random() * 60 + 10, // 10-70 km/h
        heading_deg: Math.random() * 360,
        hdop: Math.random() * 2 + 1, // 1-3 HDOP
        source: "gps_device"
      });
    }
  });

  return positions.sort((a, b) => new Date(b.ts) - new Date(a.ts));
};

// Static current positions for immediate use
export const currentGpsPositions = [
  {
    id: "gps_current_001",
    truck_id: "550e8400-e29b-41d4-a716-446655440001",
    ts: new Date().toISOString(),
    lat: -3.520000,
    lon: 115.580000,
    speed_kph: 45.2,
    heading_deg: 135,
    hdop: 1.2,
    source: "gps_device"
  },
  {
    id: "gps_current_002", 
    truck_id: "550e8400-e29b-41d4-a716-446655440002",
    ts: new Date().toISOString(),
    lat: -3.530000,
    lon: 115.590000,
    speed_kph: 38.7,
    heading_deg: 90,
    hdop: 1.5,
    source: "gps_device"
  },
  {
    id: "gps_current_003",
    truck_id: "550e8400-e29b-41d4-a716-446655440003", 
    ts: new Date().toISOString(),
    lat: -3.540000,
    lon: 115.600000,
    speed_kph: 52.1,
    heading_deg: 270,
    hdop: 1.1,
    source: "gps_device"
  },
  {
    id: "gps_current_004",
    truck_id: "550e8400-e29b-41d4-a716-446655440004",
    ts: new Date().toISOString(), 
    lat: -3.550000,
    lon: 115.610000,
    speed_kph: 0, // Parked
    heading_deg: 180,
    hdop: 2.1,
    source: "gps_device"
  },
  {
    id: "gps_current_005",
    truck_id: "550e8400-e29b-41d4-a716-446655440005",
    ts: new Date().toISOString(),
    lat: -3.560000,
    lon: 115.620000,
    speed_kph: 41.8,
    heading_deg: 45,
    hdop: 1.3,
    source: "gps_device"
  },
  {
    id: "gps_current_006",
    truck_id: "550e8400-e29b-41d4-a716-446655440006",
    ts: new Date().toISOString(),
    lat: -3.570000,
    lon: 115.630000,
    speed_kph: 35.4,
    heading_deg: 315,
    hdop: 1.7,
    source: "gps_device"
  },
  {
    id: "gps_current_007",
    truck_id: "550e8400-e29b-41d4-a716-446655440007",
    ts: new Date().toISOString(),
    lat: -3.580000,
    lon: 115.640000,
    speed_kph: 28.9,
    heading_deg: 225,
    hdop: 1.4,
    source: "gps_device"
  },
  {
    id: "gps_current_008",
    truck_id: "550e8400-e29b-41d4-a716-446655440008",
    ts: new Date().toISOString(),
    lat: -3.590000,
    lon: 115.650000,
    speed_kph: 47.3,
    heading_deg: 60,
    hdop: 1.6,
    source: "gps_device"
  }
];

// Export gpsPositions as an alias for currentGpsPositions for backward compatibility
export const gpsPositions = currentGpsPositions;

export default { generateGpsPositions, currentGpsPositions, gpsPositions };
