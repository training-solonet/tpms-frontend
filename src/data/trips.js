// Dummy data for trips table

export const trips = [
  {
    id: 'trip_001',
    truck_id: '550e8400-e29b-41d4-a716-446655440001',
    start_ts: '2024-08-31T06:00:00Z',
    end_ts: '2024-08-31T14:30:00Z',
    start_pos: { lat: -3.52, lon: 115.58 },
    end_pos: { lat: -3.525, lon: 115.585 },
  },
  {
    id: 'trip_002',
    truck_id: '550e8400-e29b-41d4-a716-446655440002',
    start_ts: '2024-08-31T07:15:00Z',
    end_ts: '2024-08-31T15:45:00Z',
    start_pos: { lat: -3.53, lon: 115.59 },
    end_pos: { lat: -3.535, lon: 115.595 },
  },
  {
    id: 'trip_003',
    truck_id: '550e8400-e29b-41d4-a716-446655440003',
    start_ts: '2024-08-31T06:30:00Z',
    end_ts: null, // Currently active trip
    start_pos: { lat: -3.54, lon: 115.6 },
    end_pos: null,
  },
  {
    id: 'trip_004',
    truck_id: '550e8400-e29b-41d4-a716-446655440004',
    start_ts: '2024-08-31T08:00:00Z',
    end_ts: null, // Currently parked/idle
    start_pos: { lat: -3.55, lon: 115.61 },
    end_pos: null,
  },
  {
    id: 'trip_005',
    truck_id: '550e8400-e29b-41d4-a716-446655440005',
    start_ts: '2024-08-31T05:45:00Z',
    end_ts: '2024-08-31T16:20:00Z',
    start_pos: { lat: -3.56, lon: 115.62 },
    end_pos: { lat: -3.565, lon: 115.625 },
  },
];

export default trips;
