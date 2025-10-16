// Dummy data for trucks table
// Simple UUID generator function
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const baseTrucks = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    plate_number: 'BN 1234 AB',
    vin: '1HGBH41JXMN109186',
    name: 'Truck Alpha',
    model: 'Hino 500 Series',
    year: 2020,
    tire_config: "6x4",
    tire_count: 6,
    driver_id: "dr001-e29b-41d4-a716-446655440001",
    fleet_group_id: "f1e8d400-e29b-41d4-a716-446655440001", // Mining Fleet Alpha
    created_at: "2023-01-15T08:00:00Z",
    created_by: null,
    updated_by: null,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    plate_number: 'BN 5678 CD',
    vin: '1HGBH41JXMN109187',
    name: 'Truck Beta',
    model: 'Mitsubishi Fuso',
    year: 2019,
    tire_config: "6x4",
    tire_count: 6,
    driver_id: "dr002-e29b-41d4-a716-446655440002",
    fleet_group_id: "f1e8d400-e29b-41d4-a716-446655440001", // Mining Fleet Alpha
    created_at: "2023-01-20T09:15:00Z",
    created_by: null,
    updated_by: null,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    plate_number: 'BN 9012 EF',
    vin: '1HGBH41JXMN109188',
    name: 'Truck Gamma',
    model: 'Volvo FMX',
    year: 2021,
    tire_config: "8x4",
    tire_count: 8,
    driver_id: "dr003-e29b-41d4-a716-446655440003",
    fleet_group_id: "f1e8d400-e29b-41d4-a716-446655440002", // Mining Fleet Beta
    created_at: "2023-02-01T07:30:00Z",
    created_by: null,
    updated_by: null,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    plate_number: 'BN 3456 GH',
    vin: '1HGBH41JXMN109189',
    name: 'Truck Delta',
    model: 'Scania R-Series',
    year: 2020,
    tire_config: "6x4",
    tire_count: 6,
    driver_id: "dr004-e29b-41d4-a716-446655440004",
    fleet_group_id: "f1e8d400-e29b-41d4-a716-446655440002", // Mining Fleet Beta
    created_at: "2023-02-10T10:45:00Z",
    created_by: null,
    updated_by: null,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    plate_number: 'BN 7890 IJ',
    vin: '1HGBH41JXMN109190',
    name: 'Truck Epsilon',
    model: 'Mercedes-Benz Actros',
    year: 2022,
    tire_config: "8x4",
    tire_count: 8,
    driver_id: "dr005-e29b-41d4-a716-446655440005",
    fleet_group_id: "f1e8d400-e29b-41d4-a716-446655440003", // Transport Fleet
    created_at: "2023-02-15T11:20:00Z",
    created_by: null,
    updated_by: null,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    plate_number: 'BN 2468 KL',
    vin: '1HGBH41JXMN109191',
    name: 'Truck Zeta',
    model: 'Caterpillar 797F',
    year: 2021,
    tire_config: "4x2",
    tire_count: 4,
    driver_id: "dr006-e29b-41d4-a716-446655440006",
    fleet_group_id: "f1e8d400-e29b-41d4-a716-446655440001", // Mining Fleet Alpha
    created_at: "2023-03-01T06:00:00Z",
    created_by: null,
    updated_by: null,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440007',
    plate_number: 'BN 1357 MN',
    vin: '1HGBH41JXMN109192',
    name: 'Truck Eta',
    model: 'Komatsu 930E',
    year: 2020,
    tire_config: "4x2",
    tire_count: 4,
    driver_id: "dr007-e29b-41d4-a716-446655440007",
    fleet_group_id: "f1e8d400-e29b-41d4-a716-446655440002", // Mining Fleet Beta
    created_at: "2023-03-05T08:15:00Z",
    created_by: null,
    updated_by: null,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440008',
    plate_number: 'BN 9753 OP',
    vin: '1HGBH41JXMN109193',
    name: 'Truck Theta',
    model: 'Liebherr T 284',
    year: 2019,
    tire_config: "4x2",
    tire_count: 4,
    driver_id: "dr008-e29b-41d4-a716-446655440008",
    fleet_group_id: "f1e8d400-e29b-41d4-a716-446655440004", // Support Fleet
    created_at: "2023-03-10T09:45:00Z",
    created_by: null,
    updated_by: null,
  },
];

// Generate additional trucks to extend the dataset
const models = [
  'Hino 500 Series',
  'Mitsubishi Fuso',
  'Volvo FMX',
  'Scania R-Series',
  'Mercedes-Benz Actros',
  'Caterpillar 797F',
  'Komatsu 930E',
  'Liebherr T 284'
];

const tireConfigs = [
  { cfg: '4x2', count: 4 },
  { cfg: '6x4', count: 6 },
  { cfg: '8x4', count: 8 }
];

const fleetGroups = [
  'f1e8d400-e29b-41d4-a716-446655440001',
  'f1e8d400-e29b-41d4-a716-446655440002',
  'f1e8d400-e29b-41d4-a716-446655440003',
  'f1e8d400-e29b-41d4-a716-446655440004'
];

// Generate additional 992 trucks to reach exactly 1000 total (8 base + 992 generated)
const generatedTrucks = Array.from({ length: 992 }).map((_, idx) => {
  const n = idx + 9; // start after 8 base trucks
  const model = models[idx % models.length];
  const cfg = tireConfigs[idx % tireConfigs.length];
  const group = fleetGroups[idx % fleetGroups.length];
  const year = 2018 + (idx % 6);

  return {
    id: generateUUID(),
    plate_number: `BN ${1000 + n}${(n % 26).toString(36).toUpperCase()}${((n + 3) % 26).toString(36).toUpperCase()}`,
    vin: `1HGBH41JXMN${(109193 + n).toString()}`,
    name: `Truck ${n.toString().padStart(3, '0')}`,
    model,
    year,
    tire_config: cfg.cfg,
    tire_count: cfg.count,
    driver_id: null,
    fleet_group_id: group,
    created_at: new Date(2023, (idx % 12), 10 + (idx % 15)).toISOString(),
    created_by: null,
    updated_by: null,
  };
});

export const trucks = [...baseTrucks, ...generatedTrucks];

export default trucks;
