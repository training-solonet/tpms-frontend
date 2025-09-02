// Dummy data for trips table

export const trips = [
  {
    id: "trip_001",
    truck_id: "550e8400-e29b-41d4-a716-446655440001",
    start_ts: "2024-08-31T06:00:00Z",
    end_ts: "2024-08-31T14:30:00Z",
    start_pos: { lat: -3.520000, lon: 115.580000 },
    end_pos: { lat: -3.525000, lon: 115.585000 }
  },
  {
    id: "trip_002",
    truck_id: "550e8400-e29b-41d4-a716-446655440002", 
    start_ts: "2024-08-31T07:15:00Z",
    end_ts: "2024-08-31T15:45:00Z",
    start_pos: { lat: -3.530000, lon: 115.590000 },
    end_pos: { lat: -3.535000, lon: 115.595000 }
  },
  {
    id: "trip_003",
    truck_id: "550e8400-e29b-41d4-a716-446655440003",
    start_ts: "2024-08-31T06:30:00Z",
    end_ts: null, // Currently active trip
    start_pos: { lat: -3.540000, lon: 115.600000 },
    end_pos: null
  },
  {
    id: "trip_004",
    truck_id: "550e8400-e29b-41d4-a716-446655440004",
    start_ts: "2024-08-31T08:00:00Z",
    end_ts: null, // Currently parked/idle
    start_pos: { lat: -3.550000, lon: 115.610000 },
    end_pos: null
  },
  {
    id: "trip_005",
    truck_id: "550e8400-e29b-41d4-a716-446655440005",
    start_ts: "2024-08-31T05:45:00Z",
    end_ts: "2024-08-31T16:20:00Z",
    start_pos: { lat: -3.560000, lon: 115.620000 },
    end_pos: { lat: -3.565000, lon: 115.625000 }
  }
];

export default trips;
