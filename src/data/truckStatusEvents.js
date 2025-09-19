// Dummy data for truck_status_event table
// Simple UUID generator function
// eslint-disable-next-line no-unused-vars
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const truckStatusEvents = [
  // Recent status changes
  {
    id: "tse1e400-e29b-41d4-a716-446655440001",
    truck_id: "550e8400-e29b-41d4-a716-446655440001", // Truck Alpha
    status: "active",
    note: "Truck returned to service after routine maintenance",
    changed_at: "2024-09-02T06:00:00Z",
    created_by: null
  },
  {
    id: "tse1e400-e29b-41d4-a716-446655440002",
    truck_id: "550e8400-e29b-41d4-a716-446655440002", // Truck Beta
    status: "active",
    note: "Daily pre-operation check completed",
    changed_at: "2024-09-02T06:15:00Z",
    created_by: null
  },
  {
    id: "tse1e400-e29b-41d4-a716-446655440003",
    truck_id: "550e8400-e29b-41d4-a716-446655440003", // Truck Gamma
    status: "active",
    note: "Fuel tank refilled, ready for operation",
    changed_at: "2024-09-02T05:45:00Z",
    created_by: null
  },
  {
    id: "tse1e400-e29b-41d4-a716-446655440004",
    truck_id: "550e8400-e29b-41d4-a716-446655440004", // Truck Delta
    status: "inactive",
    note: "End of shift, parked at depot",
    changed_at: "2024-09-01T18:30:00Z",
    created_by: null
  },
  {
    id: "tse1e400-e29b-41d4-a716-446655440005",
    truck_id: "550e8400-e29b-41d4-a716-446655440005", // Truck Epsilon
    status: "active",
    note: "Long haul transport mission started",
    changed_at: "2024-09-02T07:00:00Z",
    created_by: null
  },
  {
    id: "tse1e400-e29b-41d4-a716-446655440006",
    truck_id: "550e8400-e29b-41d4-a716-446655440006", // Truck Zeta
    status: "active",
    note: "Heavy mining operation in pit area",
    changed_at: "2024-09-02T06:30:00Z",
    created_by: null
  },
  {
    id: "tse1e400-e29b-41d4-a716-446655440007",
    truck_id: "550e8400-e29b-41d4-a716-446655440007", // Truck Eta
    status: "active",
    note: "Coal hauling operation resumed",
    changed_at: "2024-09-02T06:45:00Z",
    created_by: null
  },
  {
    id: "tse1e400-e29b-41d4-a716-446655440008",
    truck_id: "550e8400-e29b-41d4-a716-446655440008", // Truck Theta
    status: "maintenance",
    note: "Scheduled maintenance - hydraulic system inspection",
    changed_at: "2024-09-01T16:00:00Z",
    created_by: null
  },

  // Historical status changes
  {
    id: "tse1e400-e29b-41d4-a716-446655440009",
    truck_id: "550e8400-e29b-41d4-a716-446655440001", // Truck Alpha
    status: "maintenance",
    note: "Tire replacement and brake inspection",
    changed_at: "2024-08-30T14:00:00Z",
    created_by: null
  },
  {
    id: "tse1e400-e29b-41d4-a716-446655440010",
    truck_id: "550e8400-e29b-41d4-a716-446655440002", // Truck Beta
    status: "inactive",
    note: "Driver shift ended, truck parked",
    changed_at: "2024-09-01T18:00:00Z",
    created_by: null
  },
  {
    id: "tse1e400-e29b-41d4-a716-446655440011",
    truck_id: "550e8400-e29b-41d4-a716-446655440003", // Truck Gamma
    status: "inactive",
    note: "Fuel shortage, waiting for refuel",
    changed_at: "2024-09-01T15:30:00Z",
    created_by: null
  },
  {
    id: "tse1e400-e29b-41d4-a716-446655440012",
    truck_id: "550e8400-e29b-41d4-a716-446655440004", // Truck Delta
    status: "active",
    note: "Morning shift started",
    changed_at: "2024-09-01T06:00:00Z",
    created_by: null
  },
  {
    id: "tse1e400-e29b-41d4-a716-446655440013",
    truck_id: "550e8400-e29b-41d4-a716-446655440005", // Truck Epsilon
    status: "maintenance",
    note: "Engine oil change and filter replacement",
    changed_at: "2024-08-28T10:00:00Z",
    created_by: null
  },
  {
    id: "tse1e400-e29b-41d4-a716-446655440014",
    truck_id: "550e8400-e29b-41d4-a716-446655440006", // Truck Zeta
    status: "inactive",
    note: "Weather delay - heavy rain",
    changed_at: "2024-08-29T12:00:00Z",
    created_by: null
  },
  {
    id: "tse1e400-e29b-41d4-a716-446655440015",
    truck_id: "550e8400-e29b-41d4-a716-446655440007", // Truck Eta
    status: "maintenance",
    note: "Transmission service and inspection",
    changed_at: "2024-08-25T09:00:00Z",
    created_by: null
  }
];

export default truckStatusEvents;
