// Dummy data for fleet_group table
// Simple UUID generator function
// eslint-disable-next-line no-unused-vars
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const fleetGroups = [
  {
    id: 'f1e8d400-e29b-41d4-a716-446655440001',
    name: 'Mining Fleet Alpha',
    site: 'Pit Area North',
    description: 'Primary mining trucks for coal extraction in northern pit area',
    created_at: '2023-01-10T08:00:00Z',
    created_by: null,
    updated_by: null,
  },
  {
    id: 'f1e8d400-e29b-41d4-a716-446655440002',
    name: 'Mining Fleet Beta',
    site: 'Pit Area South',
    description: 'Secondary mining fleet for overburden removal in southern area',
    created_at: '2023-01-15T09:30:00Z',
    created_by: null,
    updated_by: null,
  },
  {
    id: 'f1e8d400-e29b-41d4-a716-446655440003',
    name: 'Transport Fleet',
    site: 'Main Haul Road',
    description: 'Long-haul transport trucks for coal delivery to port',
    created_at: '2023-02-01T07:15:00Z',
    created_by: null,
    updated_by: null,
  },
  {
    id: 'f1e8d400-e29b-41d4-a716-446655440004',
    name: 'Support Fleet',
    site: 'Workshop Area',
    description: 'Support vehicles including fuel trucks, water trucks, and maintenance vehicles',
    created_at: '2023-02-10T10:00:00Z',
    created_by: null,
    updated_by: null,
  },
  {
    id: 'f1e8d400-e29b-41d4-a716-446655440005',
    name: 'Emergency Fleet',
    site: 'Safety Station',
    description: 'Emergency response vehicles and ambulances',
    created_at: '2023-03-01T06:45:00Z',
    created_by: null,
    updated_by: null,
  },
];

export default fleetGroups;
