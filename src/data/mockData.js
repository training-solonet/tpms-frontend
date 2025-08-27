// src/data/mockData.js

// Mock data untuk testing
export const generateMockTrucks = (count = 20) => {
  const statuses = ['active', 'inactive', 'maintenance'];
  const models = ['Caterpillar 777D', 'Komatsu HD605', 'Liebherr T282C', 'Belaz 75710'];
  const drivers = ['Ahmad Subagio', 'Budi Santoso', 'Candra Wijaya', 'Dedi Kurniawan', 'Eko Prasetyo', 'Fajar Nugroho'];
  
  const trucks = [];
  
  for (let i = 1; i <= count; i++) {
    // Generate coordinates within Borneo Indobara area
    const lat = -3.6 + (Math.random() - 0.5) * 0.3; // Around -3.6
    const lng = 115.58 + (Math.random() - 0.5) * 0.3; // Around 115.58
    
    trucks.push({
      id: `truck-${i}`,
      truckNumber: `BIB-${String(i).padStart(3, '0')}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      model: models[Math.floor(Math.random() * models.length)],
      driver: Math.random() > 0.2 ? drivers[Math.floor(Math.random() * drivers.length)] : null,
      speed: Math.floor(Math.random() * 50),
      fuel: Math.floor(Math.random() * 100),
      payload: Math.floor(Math.random() * 200),
      engineHours: Math.floor(Math.random() * 10000),
      location: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      lastUpdate: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      tirePressures: Array.from({ length: 6 }, (_, idx) => ({
        position: `tire-${idx + 1}`,
        pressure: 30 + Math.random() * 20,
        status: Math.random() > 0.8 ? (Math.random() > 0.5 ? 'low' : 'high') : 'normal'
      }))
    });
  }
  
  return trucks;
};

export const generateMockDashboardStats = (trucks) => {
  const activeTrucks = trucks.filter(t => t.status === 'active').length;
  const inactiveTrucks = trucks.filter(t => t.status === 'inactive').length;
  const maintenanceTrucks = trucks.filter(t => t.status === 'maintenance').length;
  
  return {
    totalTrucks: trucks.length,
    activeTrucks,
    inactiveTrucks,
    maintenanceTrucks,
    alertsCount: Math.floor(Math.random() * 5),
    lastUpdate: new Date().toISOString()
  };
};