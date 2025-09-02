// Dummy data for driver_shift table
// Simple UUID generator function
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const driverShifts = [
  // Day shifts for current week
  {
    id: "ds1e8400-e29b-41d4-a716-446655440001",
    driver_id: "660e8400-e29b-41d4-a716-446655440001", // Ahmad Suryanto
    truck_id: "550e8400-e29b-41d4-a716-446655440001", // Truck Alpha
    shift_date: "2024-09-02",
    shift_type: "day",
    shift_start: "2024-09-02T06:00:00Z",
    shift_end: "2024-09-02T18:00:00Z",
    notes: "Regular day shift",
    created_at: "2024-09-01T10:00:00Z",
    updated_at: "2024-09-01T10:00:00Z",
    created_by: null,
    updated_by: null
  },
  {
    id: "ds1e8400-e29b-41d4-a716-446655440002",
    driver_id: "660e8400-e29b-41d4-a716-446655440002", // Budi Santoso
    truck_id: "550e8400-e29b-41d4-a716-446655440002", // Truck Beta
    shift_date: "2024-09-02",
    shift_type: "day",
    shift_start: "2024-09-02T06:00:00Z",
    shift_end: "2024-09-02T18:00:00Z",
    notes: "Regular day shift",
    created_at: "2024-09-01T10:00:00Z",
    updated_at: "2024-09-01T10:00:00Z",
    created_by: null,
    updated_by: null
  },
  {
    id: "ds1e8400-e29b-41d4-a716-446655440003",
    driver_id: "660e8400-e29b-41d4-a716-446655440003", // Candra Wijaya
    truck_id: "550e8400-e29b-41d4-a716-446655440003", // Truck Gamma
    shift_date: "2024-09-02",
    shift_type: "day",
    shift_start: "2024-09-02T06:00:00Z",
    shift_end: "2024-09-02T18:00:00Z",
    notes: "Regular day shift",
    created_at: "2024-09-01T10:00:00Z",
    updated_at: "2024-09-01T10:00:00Z",
    created_by: null,
    updated_by: null
  },
  
  // Night shifts for current week
  {
    id: "ds1e8400-e29b-41d4-a716-446655440004",
    driver_id: "660e8400-e29b-41d4-a716-446655440004", // Dedi Kurniawan
    truck_id: "550e8400-e29b-41d4-a716-446655440001", // Truck Alpha (night shift)
    shift_date: "2024-09-02",
    shift_type: "night",
    shift_start: "2024-09-02T18:00:00Z",
    shift_end: "2024-09-03T06:00:00Z",
    notes: "Night shift operations",
    created_at: "2024-09-01T10:00:00Z",
    updated_at: "2024-09-01T10:00:00Z",
    created_by: null,
    updated_by: null
  },
  {
    id: "ds1e8400-e29b-41d4-a716-446655440005",
    driver_id: "660e8400-e29b-41d4-a716-446655440005", // Eko Prasetyo
    truck_id: "550e8400-e29b-41d4-a716-446655440005", // Truck Epsilon
    shift_date: "2024-09-02",
    shift_type: "night",
    shift_start: "2024-09-02T18:00:00Z",
    shift_end: "2024-09-03T06:00:00Z",
    notes: "Night shift operations",
    created_at: "2024-09-01T10:00:00Z",
    updated_at: "2024-09-01T10:00:00Z",
    created_by: null,
    updated_by: null
  },
  
  // Previous day shifts
  {
    id: "ds1e8400-e29b-41d4-a716-446655440006",
    driver_id: "d50e8400-e29b-41d4-a716-446655440001", // Ahmad Suryadi
    truck_id: "550e8400-e29b-41d4-a716-446655440001", // Truck Alpha
    shift_date: "2024-09-01",
    shift_code: "day",
    start_at: "2024-09-01T06:00:00Z",
    end_at: "2024-09-01T18:00:00Z",
    created_by: null,
    updated_by: null
  },
  {
    id: "ds1e8400-e29b-41d4-a716-446655440007",
    driver_id: "d50e8400-e29b-41d4-a716-446655440002", // Budi Santoso
    truck_id: "550e8400-e29b-41d4-a716-446655440002", // Truck Beta
    shift_date: "2024-09-01",
    shift_code: "day",
    start_at: "2024-09-01T06:00:00Z",
    end_at: "2024-09-01T18:00:00Z",
    created_by: null,
    updated_by: null
  },
  
  // Custom shifts (maintenance periods)
  {
    id: "ds1e8400-e29b-41d4-a716-446655440008",
    driver_id: "d50e8400-e29b-41d4-a716-446655440006", // Fajar Nugroho
    truck_id: "550e8400-e29b-41d4-a716-446655440008", // Truck Theta (maintenance)
    shift_date: "2024-09-02",
    shift_code: "custom",
    start_at: "2024-09-02T08:00:00Z",
    end_at: "2024-09-02T16:00:00Z",
    created_by: null,
    updated_by: null
  },
  
  // Weekend shifts
  {
    id: "ds1e8400-e29b-41d4-a716-446655440009",
    driver_id: "d50e8400-e29b-41d4-a716-446655440007", // Gunawan Saputra
    truck_id: "550e8400-e29b-41d4-a716-446655440004", // Truck Delta
    shift_date: "2024-08-31",
    shift_code: "day",
    start_at: "2024-08-31T06:00:00Z",
    end_at: "2024-08-31T18:00:00Z",
    created_by: null,
    updated_by: null
  },
  {
    id: "ds1e8400-e29b-41d4-a716-446655440010",
    driver_id: "d50e8400-e29b-41d4-a716-446655440008", // Hendra Wijaya
    truck_id: "550e8400-e29b-41d4-a716-446655440005", // Truck Epsilon
    shift_date: "2024-08-31",
    shift_code: "night",
    start_at: "2024-08-31T18:00:00Z",
    end_at: "2024-09-01T06:00:00Z",
    created_by: null,
    updated_by: null
  }
];

export default driverShifts;
