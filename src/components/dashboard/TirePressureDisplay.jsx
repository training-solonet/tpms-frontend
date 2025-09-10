import React, { useState, useEffect } from 'react';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { tirePressureEvents } from '../../data/tirePressureEvents.js';
import { trucks } from '../../data/trucks.js';

const TirePressureDisplay = ({ selectedTruckId, className = "" }) => {
  const [tireData, setTireData] = useState([]);
  const [truckInfo, setTruckInfo] = useState(null);

  // Get tire configuration mapping
  const getTireCount = (tireConfig) => {
    const configMap = {
      '4x2': 4,  // 2 front + 2 rear
      '6x4': 6,  // 2 front + 4 rear
      '8x4': 8   // 2 front + 6 rear
    };
    return configMap[tireConfig] || 4;
  };

  // Get tire layout based on configuration
  const getTireLayout = (tireConfig) => {
    switch (tireConfig) {
      case '4x2':
        return [
          { row: 0, positions: [1, 2] }, // Front axle
          { row: 1, positions: [3, 4] }  // Rear axle
        ];
      case '6x4':
        return [
          { row: 0, positions: [1, 2] },     // Front axle
          { row: 1, positions: [3, 4] },     // Rear axle 1
          { row: 2, positions: [5, 6] }      // Rear axle 2
        ];
      case '8x4':
        return [
          { row: 0, positions: [1, 2] },     // Front axle
          { row: 1, positions: [3, 4] },     // Rear axle 1
          { row: 2, positions: [5, 6] },     // Rear axle 2
          { row: 3, positions: [7, 8] }      // Rear axle 3
        ];
      default:
        return [
          { row: 0, positions: [1, 2] },
          { row: 1, positions: [3, 4] }
        ];
    }
  };

  useEffect(() => {
    if (!selectedTruckId) {
      setTireData([]);
      setTruckInfo(null);
      return;
    }

    // Find truck info
    const truck = trucks.find(t => t.id === selectedTruckId);
    setTruckInfo(truck);

    if (!truck) return;

    // Get latest tire pressure data for this truck
    const truckTireEvents = tirePressureEvents.filter(event => event.truck_id === selectedTruckId);
    
    // Group by tire number and get latest reading for each tire
    const latestByTire = {};
    truckTireEvents.forEach(event => {
      const tireNo = event.tire_no;
      if (!latestByTire[tireNo] || new Date(event.changed_at) > new Date(latestByTire[tireNo].changed_at)) {
        latestByTire[tireNo] = event;
      }
    });

    // Convert to array and sort by tire number
    const tireArray = Object.values(latestByTire).sort((a, b) => a.tire_no - b.tire_no);
    setTireData(tireArray);
  }, [selectedTruckId]);

  const getTireStatus = (pressure, temperature, exType) => {
    if (exType) {
      return {
        status: 'warning',
        color: 'bg-red-500',
        textColor: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    }
    
    if (pressure < 800 || pressure > 900 || temperature > 60) {
      return {
        status: 'caution',
        color: 'bg-yellow-500',
        textColor: 'text-yellow-700',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      };
    }
    
    return {
      status: 'normal',
      color: 'bg-green-500',
      textColor: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    };
  };

  if (!selectedTruckId || !truckInfo) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="mb-2">
            <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-sm">Pilih kendaraan untuk melihat tekanan ban</p>
        </div>
      </div>
    );
  }

  const tireLayout = getTireLayout(truckInfo.tire_config);
  const tireCount = getTireCount(truckInfo.tire_config);

  return (
    <div className={`p-4 ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">Tekanan Ban</h3>
        <p className="text-sm text-gray-600">{truckInfo.name} ({truckInfo.tire_config})</p>
        <p className="text-xs text-gray-500">{tireCount} ban total</p>
      </div>

      {/* Tire Layout Visualization */}
      <div className="space-y-3">
        {tireLayout.map((axle, axleIndex) => (
          <div key={axleIndex} className="flex justify-center">
            <div className="flex items-center gap-4">
              {axle.positions.map((tireNo, posIndex) => {
                const tireInfo = tireData.find(t => t.tire_no === tireNo);
                const status = tireInfo ? getTireStatus(tireInfo.pressure_kpa, tireInfo.temp_celsius, tireInfo.ex_type) : null;
                
                return (
                  <div key={tireNo} className="flex flex-col items-center">
                    {/* Pressure Value */}
                    <div className="text-xs font-medium text-gray-600 mb-1">
                      {tireInfo ? `${tireInfo.pressure_kpa} kPa` : '--'}
                    </div>
                    
                    {/* Temperature Value */}
                    <div className="text-xs text-gray-500 mb-2">
                      {tireInfo ? `${tireInfo.temp_celsius}°C` : '--'}
                    </div>
                    
                    {/* Tire Visual */}
                    <div className={`relative w-12 h-16 rounded-lg border-2 flex items-center justify-center ${
                      status ? status.borderColor : 'border-gray-300'
                    } ${status ? status.bgColor : 'bg-gray-50'}`}>
                      {/* Tire Number */}
                      <span className={`text-xs font-bold ${status ? status.textColor : 'text-gray-500'}`}>
                        {tireNo}
                      </span>
                      
                      {/* Status Indicator */}
                      {status && (
                        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${status.color}`}>
                          {status.status === 'warning' && (
                            <ExclamationTriangleIcon className="w-2 h-2 text-white m-0.5" />
                          )}
                          {status.status === 'normal' && (
                            <CheckCircleIcon className="w-2 h-2 text-white m-0.5" />
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Pressure Value (Bottom) */}
                    <div className="text-xs font-medium text-gray-600 mt-2">
                      {tireInfo ? `${tireInfo.pressure_kpa} kPa` : '--'}
                    </div>
                    
                    {/* Temperature Value (Bottom) */}
                    <div className="text-xs text-gray-500 mt-1">
                      {tireInfo ? `${tireInfo.temp_celsius}°C` : '--'}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Axle Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-20 h-0.5 bg-gray-400 mt-8" 
                 style={{ zIndex: -1 }} />
          </div>
        ))}
      </div>

      {/* Status Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Status:</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Normal (800-900 kPa, &lt;60°C)</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-600">Perhatian</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-600">Peringatan</span>
          </div>
        </div>
      </div>

      {/* Last Update */}
      {tireData.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Update terakhir: {new Date(tireData[0].changed_at).toLocaleString('id-ID')}
          </p>
        </div>
      )}
    </div>
  );
};

export default TirePressureDisplay;
