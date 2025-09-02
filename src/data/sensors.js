// Dummy data for sensor table
// Simple UUID generator function
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const sensors = [
  // Tire sensors for Truck Alpha (Device BRN-DEV-001)
  {
    id: "s1e8d400-e29b-41d4-a716-446655440001",
    device_id: "d1e8d400-e29b-41d4-a716-446655440001",
    type: "tire",
    position_no: 1,
    sn: "TIRE-001-FL",
    installed_at: "2023-01-15T10:30:00Z",
    removed_at: null,
    created_by: null,
    updated_by: null
  },
  {
    id: "s1e8d400-e29b-41d4-a716-446655440002",
    device_id: "d1e8d400-e29b-41d4-a716-446655440001",
    type: "tire",
    position_no: 2,
    sn: "TIRE-001-FR",
    installed_at: "2023-01-15T10:30:00Z",
    removed_at: null,
    created_by: null,
    updated_by: null
  },
  {
    id: "s1e8d400-e29b-41d4-a716-446655440003",
    device_id: "d1e8d400-e29b-41d4-a716-446655440001",
    type: "tire",
    position_no: 3,
    sn: "TIRE-001-RL",
    installed_at: "2023-01-15T10:30:00Z",
    removed_at: null,
    created_by: null,
    updated_by: null
  },
  {
    id: "s1e8d400-e29b-41d4-a716-446655440004",
    device_id: "d1e8d400-e29b-41d4-a716-446655440001",
    type: "tire",
    position_no: 4,
    sn: "TIRE-001-RR",
    installed_at: "2023-01-15T10:30:00Z",
    removed_at: null,
    created_by: null,
    updated_by: null
  },
  // Hub sensors for Truck Alpha
  {
    id: "s1e8d400-e29b-41d4-a716-446655440005",
    device_id: "d1e8d400-e29b-41d4-a716-446655440001",
    type: "hub",
    position_no: 1,
    sn: "HUB-001-F",
    installed_at: "2023-01-15T10:30:00Z",
    removed_at: null,
    created_by: null,
    updated_by: null
  },
  {
    id: "s1e8d400-e29b-41d4-a716-446655440006",
    device_id: "d1e8d400-e29b-41d4-a716-446655440001",
    type: "hub",
    position_no: 2,
    sn: "HUB-001-R",
    installed_at: "2023-01-15T10:30:00Z",
    removed_at: null,
    created_by: null,
    updated_by: null
  },

  // Tire sensors for Truck Beta (Device BRN-DEV-002)
  {
    id: "s1e8d400-e29b-41d4-a716-446655440007",
    device_id: "d1e8d400-e29b-41d4-a716-446655440002",
    type: "tire",
    position_no: 1,
    sn: "TIRE-002-FL",
    installed_at: "2023-01-20T12:00:00Z",
    removed_at: null,
    created_by: null,
    updated_by: null
  },
  {
    id: "s1e8d400-e29b-41d4-a716-446655440008",
    device_id: "d1e8d400-e29b-41d4-a716-446655440002",
    type: "tire",
    position_no: 2,
    sn: "TIRE-002-FR",
    installed_at: "2023-01-20T12:00:00Z",
    removed_at: null,
    created_by: null,
    updated_by: null
  },
  {
    id: "s1e8d400-e29b-41d4-a716-446655440009",
    device_id: "d1e8d400-e29b-41d4-a716-446655440002",
    type: "tire",
    position_no: 3,
    sn: "TIRE-002-RL",
    installed_at: "2023-01-20T12:00:00Z",
    removed_at: null,
    created_by: null,
    updated_by: null
  },
  {
    id: "s1e8d400-e29b-41d4-a716-446655440010",
    device_id: "d1e8d400-e29b-41d4-a716-446655440002",
    type: "tire",
    position_no: 4,
    sn: "TIRE-002-RR",
    installed_at: "2023-01-20T12:00:00Z",
    removed_at: null,
    created_by: null,
    updated_by: null
  },
  // Hub sensors for Truck Beta
  {
    id: "s1e8d400-e29b-41d4-a716-446655440011",
    device_id: "d1e8d400-e29b-41d4-a716-446655440002",
    type: "hub",
    position_no: 1,
    sn: "HUB-002-F",
    installed_at: "2023-01-20T12:00:00Z",
    removed_at: null,
    created_by: null,
    updated_by: null
  },
  {
    id: "s1e8d400-e29b-41d4-a716-446655440012",
    device_id: "d1e8d400-e29b-41d4-a716-446655440002",
    type: "hub",
    position_no: 2,
    sn: "HUB-002-R",
    installed_at: "2023-01-20T12:00:00Z",
    removed_at: null,
    created_by: null,
    updated_by: null
  },

  // Tire sensors for Truck Gamma (Device BRN-DEV-003) - 8x4 config has more tires
  {
    id: "s1e8d400-e29b-41d4-a716-446655440013",
    device_id: "d1e8d400-e29b-41d4-a716-446655440003",
    type: "tire",
    position_no: 1,
    sn: "TIRE-003-FL",
    installed_at: "2023-02-01T09:30:00Z",
    removed_at: null,
    created_by: null,
    updated_by: null
  },
  {
    id: "s1e8d400-e29b-41d4-a716-446655440014",
    device_id: "d1e8d400-e29b-41d4-a716-446655440003",
    type: "tire",
    position_no: 2,
    sn: "TIRE-003-FR",
    installed_at: "2023-02-01T09:30:00Z",
    removed_at: null,
    created_by: null,
    updated_by: null
  },
  {
    id: "s1e8d400-e29b-41d4-a716-446655440015",
    device_id: "d1e8d400-e29b-41d4-a716-446655440003",
    type: "tire",
    position_no: 3,
    sn: "TIRE-003-RL1",
    installed_at: "2023-02-01T09:30:00Z",
    removed_at: null,
    created_by: null,
    updated_by: null
  },
  {
    id: "s1e8d400-e29b-41d4-a716-446655440016",
    device_id: "d1e8d400-e29b-41d4-a716-446655440003",
    type: "tire",
    position_no: 4,
    sn: "TIRE-003-RR1",
    installed_at: "2023-02-01T09:30:00Z",
    removed_at: null,
    created_by: null,
    updated_by: null
  },
  {
    id: "s1e8d400-e29b-41d4-a716-446655440017",
    device_id: "d1e8d400-e29b-41d4-a716-446655440003",
    type: "tire",
    position_no: 5,
    sn: "TIRE-003-RL2",
    installed_at: "2023-02-01T09:30:00Z",
    removed_at: null,
    created_by: null,
    updated_by: null
  },
  {
    id: "s1e8d400-e29b-41d4-a716-446655440018",
    device_id: "d1e8d400-e29b-41d4-a716-446655440003",
    type: "tire",
    position_no: 6,
    sn: "TIRE-003-RR2",
    installed_at: "2023-02-01T09:30:00Z",
    removed_at: null,
    created_by: null,
    updated_by: null
  },
  // Hub sensors for Truck Gamma
  {
    id: "s1e8d400-e29b-41d4-a716-446655440019",
    device_id: "d1e8d400-e29b-41d4-a716-446655440003",
    type: "hub",
    position_no: 1,
    sn: "HUB-003-F",
    installed_at: "2023-02-01T09:30:00Z",
    removed_at: null,
    created_by: null,
    updated_by: null
  },
  {
    id: "s1e8d400-e29b-41d4-a716-446655440020",
    device_id: "d1e8d400-e29b-41d4-a716-446655440003",
    type: "hub",
    position_no: 2,
    sn: "HUB-003-R1",
    installed_at: "2023-02-01T09:30:00Z",
    removed_at: null,
    created_by: null,
    updated_by: null
  },
  {
    id: "s1e8d400-e29b-41d4-a716-446655440021",
    device_id: "d1e8d400-e29b-41d4-a716-446655440003",
    type: "hub",
    position_no: 3,
    sn: "HUB-003-R2",
    installed_at: "2023-02-01T09:30:00Z",
    removed_at: null,
    created_by: null,
    updated_by: null
  }
];

export default sensors;
