// src/data/dummyTrucks.js
// Shared dummy data for 1000 trucks, each with multiple tires and sensors and one driver

export function generateDummyTrucks(count = 1000) {
  const clusters = ['Pit A', 'Pit B', 'Pit C', 'Hauling North', 'Hauling South'];
  const trucks = Array.from({ length: count }, (_, i) => {
    const id = `TRK-${(i + 1).toString().padStart(4, '0')}`;
    const cluster = clusters[i % clusters.length];
    const driver = {
      id: `DRV-${(i + 1).toString().padStart(4, '0')}`,
      name: `Driver ${(i + 1).toString().padStart(4, '0')}`,
      phone: `0812${(1000000 + i).toString().slice(0,7)}`,
    };

    const tiresCount = 10; // default 10 tires per truck for dummy
    const tires = Array.from({ length: tiresCount }, (_, ti) => {
      const tireNo = ti + 1;
      const sn = `${i + 1}${tireNo}`.padEnd(10, '0');
      const simNumber = `8986081426238${(100000 + i).toString().padStart(6,'0')}`;
      return {
        tireNo,
        sensor: {
          sn,
          cmd: 'tpdata',
          data: {
            dataType: 0,
            tireNo,
            exType: '',
            tiprValue: 200 + Math.round(Math.random() * 80),
            tempValue: 25 + Math.round(Math.random() * 30),
            bat: Math.floor(Math.random() * 4),
            simNumber,
          },
        },
        hub: {
          sn,
          cmd: 'hubdata',
          data: {
            dataType: 1,
            tireNo,
            exType: '',
            tempValue: 30 + Math.round(Math.random() * 40),
            bat: Math.floor(Math.random() * 4),
            simNumber,
          },
        },
      };
    });

    return {
      id,
      plate: `DA ${1000 + i} BI`,
      name: `Truck ${id}`,
      cluster,
      driver,
      device: {
        sn: `${(3462680000 + i)}`,
        cmd: 'device',
        data: {
          lng: 113.86 + Math.random() * 0.1,
          lat: 22.59 + Math.random() * 0.1,
          bat1: Math.floor(Math.random() * 5),
          bat2: Math.floor(Math.random() * 5),
          bat3: Math.floor(Math.random() * 5),
          lock: Math.random() > 0.8 ? 1 : 0,
        },
      },
      tires,
    };
  });
  return trucks;
}

export const allDummyTrucks = generateDummyTrucks();
