// Dummy data for trucks table
// Simple UUID generator function
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const trucks = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    plate_number: "BN 1234 AB",
    vin: "1HGBH41JXMN109186",
    name: "Truck Alpha",
    model: "Hino 500 Series",
    year: 2020,
    tire_config: "6x4",
    fleet_group_id: "f1e8d400-e29b-41d4-a716-446655440001", // Mining Fleet Alpha
    created_at: "2023-01-15T08:00:00Z",
    created_by: null,
    updated_by: null
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    plate_number: "BN 5678 CD",
    vin: "1HGBH41JXMN109187",
    name: "Truck Beta",
    model: "Mitsubishi Fuso",
    year: 2019,
    tire_config: "6x4",
    fleet_group_id: "f1e8d400-e29b-41d4-a716-446655440001", // Mining Fleet Alpha
    created_at: "2023-01-20T09:15:00Z",
    created_by: null,
    updated_by: null
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440003",
    plate_number: "BN 9012 EF",
    vin: "1HGBH41JXMN109188",
    name: "Truck Gamma",
    model: "Volvo FMX",
    year: 2021,
    tire_config: "8x4",
    fleet_group_id: "f1e8d400-e29b-41d4-a716-446655440002", // Mining Fleet Beta
    created_at: "2023-02-01T07:30:00Z",
    created_by: null,
    updated_by: null
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440004",
    plate_number: "BN 3456 GH",
    vin: "1HGBH41JXMN109189",
    name: "Truck Delta",
    model: "Scania R-Series",
    year: 2020,
    tire_config: "6x4",
    fleet_group_id: "f1e8d400-e29b-41d4-a716-446655440002", // Mining Fleet Beta
    created_at: "2023-02-10T10:45:00Z",
    created_by: null,
    updated_by: null
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440005",
    plate_number: "BN 7890 IJ",
    vin: "1HGBH41JXMN109190",
    name: "Truck Epsilon",
    model: "Mercedes-Benz Actros",
    year: 2022,
    tire_config: "8x4",
    fleet_group_id: "f1e8d400-e29b-41d4-a716-446655440003", // Transport Fleet
    created_at: "2023-02-15T11:20:00Z",
    created_by: null,
    updated_by: null
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440006",
    plate_number: "BN 2468 KL",
    vin: "1HGBH41JXMN109191",
    name: "Truck Zeta",
    model: "Caterpillar 797F",
    year: 2021,
    tire_config: "4x2",
    fleet_group_id: "f1e8d400-e29b-41d4-a716-446655440001", // Mining Fleet Alpha
    created_at: "2023-03-01T06:00:00Z",
    created_by: null,
    updated_by: null
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440007",
    plate_number: "BN 1357 MN",
    vin: "1HGBH41JXMN109192",
    name: "Truck Eta",
    model: "Komatsu 930E",
    year: 2020,
    tire_config: "4x2",
    fleet_group_id: "f1e8d400-e29b-41d4-a716-446655440002", // Mining Fleet Beta
    created_at: "2023-03-05T08:15:00Z",
    created_by: null,
    updated_by: null
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440008",
    plate_number: "BN 9753 OP",
    vin: "1HGBH41JXMN109193",
    name: "Truck Theta",
    model: "Liebherr T 284",
    year: 2019,
    tire_config: "4x2",
    fleet_group_id: "f1e8d400-e29b-41d4-a716-446655440004", // Support Fleet
    created_at: "2023-03-10T09:45:00Z",
    created_by: null,
    updated_by: null
  }
];

export default trucks;
