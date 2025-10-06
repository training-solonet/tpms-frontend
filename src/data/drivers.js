// Dummy data for drivers table
// Simple UUID generator function
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const drivers = [
  {
    id: "dr001-e29b-41d4-a716-446655440001",
    name: "Ahmad Supriadi",
    license_number: "B1234567890",
    phone: "+62812345678901",
    experience_years: 8,
    status: "ACTIVE",
    created_at: "2023-01-10T08:00:00Z",
    updated_at: "2023-01-10T08:00:00Z"
  },
  {
    id: "dr002-e29b-41d4-a716-446655440002",
    name: "Budi Santoso",
    license_number: "B2345678901",
    phone: "+62812345678902",
    experience_years: 12,
    status: "ACTIVE",
    created_at: "2023-01-15T09:00:00Z",
    updated_at: "2023-01-15T09:00:00Z"
  },
  {
    id: "dr003-e29b-41d4-a716-446655440003",
    name: "Candra Wijaya",
    license_number: "B3456789012",
    phone: "+62812345678903",
    experience_years: 6,
    status: "ACTIVE",
    created_at: "2023-02-01T07:30:00Z",
    updated_at: "2023-02-01T07:30:00Z"
  },
  {
    id: "dr004-e29b-41d4-a716-446655440004",
    name: "Dedi Kurniawan",
    license_number: "B4567890123",
    phone: "+62812345678904",
    experience_years: 15,
    status: "ACTIVE",
    created_at: "2023-02-10T10:45:00Z",
    updated_at: "2023-02-10T10:45:00Z"
  },
  {
    id: "dr005-e29b-41d4-a716-446655440005",
    name: "Eko Prasetyo",
    license_number: "B5678901234",
    phone: "+62812345678905",
    experience_years: 10,
    status: "ACTIVE",
    created_at: "2023-02-15T11:20:00Z",
    updated_at: "2023-02-15T11:20:00Z"
  },
  {
    id: "dr006-e29b-41d4-a716-446655440006",
    name: "Fajar Nugroho",
    license_number: "B6789012345",
    phone: "+62812345678906",
    experience_years: 7,
    status: "ACTIVE",
    created_at: "2023-03-01T06:00:00Z",
    updated_at: "2023-03-01T06:00:00Z"
  },
  {
    id: "dr007-e29b-41d4-a716-446655440007",
    name: "Gunawan Setiawan",
    license_number: "B7890123456",
    phone: "+62812345678907",
    experience_years: 9,
    status: "ACTIVE",
    created_at: "2023-03-05T08:15:00Z",
    updated_at: "2023-03-05T08:15:00Z"
  },
  {
    id: "dr008-e29b-41d4-a716-446655440008",
    name: "Hendra Pratama",
    license_number: "B8901234567",
    phone: "+62812345678908",
    experience_years: 11,
    status: "ACTIVE",
    created_at: "2023-03-10T09:45:00Z",
    updated_at: "2023-03-10T09:45:00Z"
  }
];

export default drivers;
