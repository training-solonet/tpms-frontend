// Dummy data for device table
// Simple UUID generator function
// eslint-disable-next-line no-unused-vars
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const devices = [
  {
    id: 'd1e8d400-e29b-41d4-a716-446655440001',
    truck_id: '550e8400-e29b-41d4-a716-446655440001', // Truck Alpha
    sn: 'BRN-DEV-001',
    sim_number: '62812345678901',
    installed_at: '2023-01-15T10:00:00Z',
    removed_at: null,
    created_by: null,
    updated_by: null,
  },
  {
    id: 'd1e8d400-e29b-41d4-a716-446655440002',
    truck_id: '550e8400-e29b-41d4-a716-446655440002', // Truck Beta
    sn: 'BRN-DEV-002',
    sim_number: '62812345678902',
    installed_at: '2023-01-20T11:30:00Z',
    removed_at: null,
    created_by: null,
    updated_by: null,
  },
  {
    id: 'd1e8d400-e29b-41d4-a716-446655440003',
    truck_id: '550e8400-e29b-41d4-a716-446655440003', // Truck Gamma
    sn: 'BRN-DEV-003',
    sim_number: '62812345678903',
    installed_at: '2023-02-01T09:00:00Z',
    removed_at: null,
    created_by: null,
    updated_by: null,
  },
  {
    id: 'd1e8d400-e29b-41d4-a716-446655440004',
    truck_id: '550e8400-e29b-41d4-a716-446655440004', // Truck Delta
    sn: 'BRN-DEV-004',
    sim_number: '62812345678904',
    installed_at: '2023-02-10T12:15:00Z',
    removed_at: null,
    created_by: null,
    updated_by: null,
  },
  {
    id: 'd1e8d400-e29b-41d4-a716-446655440005',
    truck_id: '550e8400-e29b-41d4-a716-446655440005', // Truck Epsilon
    sn: 'BRN-DEV-005',
    sim_number: '62812345678905',
    installed_at: '2023-02-15T13:45:00Z',
    removed_at: null,
    created_by: null,
    updated_by: null,
  },
  {
    id: 'd1e8d400-e29b-41d4-a716-446655440006',
    truck_id: '550e8400-e29b-41d4-a716-446655440006', // Truck Zeta
    sn: 'BRN-DEV-006',
    sim_number: '62812345678906',
    installed_at: '2023-03-01T08:30:00Z',
    removed_at: null,
    created_by: null,
    updated_by: null,
  },
  {
    id: 'd1e8d400-e29b-41d4-a716-446655440007',
    truck_id: '550e8400-e29b-41d4-a716-446655440007', // Truck Eta
    sn: 'BRN-DEV-007',
    sim_number: '62812345678907',
    installed_at: '2023-03-05T10:00:00Z',
    removed_at: null,
    created_by: null,
    updated_by: null,
  },
  {
    id: 'd1e8d400-e29b-41d4-a716-446655440008',
    truck_id: '550e8400-e29b-41d4-a716-446655440008', // Truck Theta
    sn: 'BRN-DEV-008',
    sim_number: '62812345678908',
    installed_at: '2023-03-10T11:30:00Z',
    removed_at: null,
    created_by: null,
    updated_by: null,
  },
  // Some historical devices that were removed
  {
    id: 'd1e8d400-e29b-41d4-a716-446655440009',
    truck_id: '550e8400-e29b-41d4-a716-446655440001', // Truck Alpha (old device)
    sn: 'BRN-DEV-001-OLD',
    sim_number: '62812345678900',
    installed_at: '2022-12-01T08:00:00Z',
    removed_at: '2023-01-15T09:45:00Z',
    created_by: null,
    updated_by: null,
  },
  {
    id: 'd1e8d400-e29b-41d4-a716-446655440010',
    truck_id: '550e8400-e29b-41d4-a716-446655440003', // Truck Gamma (old device)
    sn: 'BRN-DEV-003-OLD',
    sim_number: '62812345678910',
    installed_at: '2022-11-15T10:00:00Z',
    removed_at: '2023-02-01T08:30:00Z',
    created_by: null,
    updated_by: null,
  },
];

export default devices;
