// Mining data untuk visualisasi pada peta
export const miningData = {
  // Data pit/lokasi penambangan
  pits: [
    {
      id: 'PIT-A',
      name: 'Pit Alpha',
      location: [115.575000, -3.515000],
      status: 'active',
      depth: 120, // meters
      area: 450000, // square meters
    },
    {
      id: 'PIT-B',
      name: 'Pit Beta',
      location: [115.585000, -3.525000],
      status: 'active',
      depth: 85,
      area: 320000,
    },
    {
      id: 'PIT-C',
      name: 'Pit Charlie',
      location: [115.570000, -3.530000],
      status: 'maintenance',
      depth: 95,
      area: 280000,
    }
  ],
  
  // Data dump/lokasi pembuangan
  dumps: [
    {
      id: 'DUMP-1',
      name: 'Disposal Area 1',
      location: [115.590000, -3.510000],
      capacity: 1000000, // cubic meters
      currentFill: 650000,
      status: 'active'
    },
    {
      id: 'DUMP-2',
      name: 'Disposal Area 2',
      location: [115.565000, -3.535000],
      capacity: 800000,
      currentFill: 720000,
      status: 'near-full'
    }
  ],
  
  // Data jalan tambang
  haulRoads: [
    {
      id: 'ROAD-1',
      name: 'Main Haul Road',
      startPoint: [115.575000, -3.515000],
      endPoint: [115.590000, -3.510000],
      width: 30, // meters
      grade: 8, // percent
      status: 'good'
    },
    {
      id: 'ROAD-2',
      name: 'Secondary Haul Road',
      startPoint: [115.585000, -3.525000],
      endPoint: [115.565000, -3.535000],
      width: 25,
      grade: 10,
      status: 'maintenance'
    }
  ],
  
  // Data stockpile
  stockpiles: [
    {
      id: 'SP-1',
      name: 'ROM Stockpile',
      location: [115.580000, -3.505000],
      capacity: 50000, // tonnes
      currentStock: 35000,
      coalType: 'ROM'
    },
    {
      id: 'SP-2',
      name: 'Product Stockpile',
      location: [115.595000, -3.515000],
      capacity: 100000,
      currentStock: 65000,
      coalType: 'Product'
    }
  ],
  
  // Data fasilitas pendukung
  facilities: [
    {
      id: 'FAC-1',
      name: 'Workshop Area',
      location: [115.578000, -3.508000],
      type: 'maintenance',
      status: 'operational'
    },
    {
      id: 'FAC-2',
      name: 'Fuel Station',
      location: [115.582000, -3.512000],
      type: 'fueling',
      status: 'operational'
    },
    {
      id: 'FAC-3',
      name: 'Office Complex',
      location: [115.577000, -3.507000],
      type: 'office',
      status: 'operational'
    }
  ]
};
