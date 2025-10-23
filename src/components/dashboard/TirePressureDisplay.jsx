import React, { useEffect, useState } from 'react';
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { trucksAPI } from '../../services/api'; // BE1 untuk tracking data
import WheelFrontIcon from '../icons/WheelFrontIcon.jsx';

const TirePressureDisplay = ({
  selectedTruckId,
  tireData: propTireData,
  className = '',
  showHeader = true,
}) => {
  const [tireData, setTireData] = useState([]);
  const [truckInfo, setTruckInfo] = useState(null);
  const [
    viewMode,
    // setViewMode
  ] = useState('icons'); // 'visual' | 'list' | 'icons'

  // Build a per-axle layout that supports dual tires (2 left, 2 right) for rear axles
  // and single tires for the front axle. Also returns the computed total tire count.
  const buildAxleLayout = (tireConfig) => {
    // Define axle specifications: each axle has leftCount and rightCount
    // - Front axle: single-left and single-right (motor vehicle front)
    // - Rear axles: depending on config, single or dual per side
    let axles = [];
    switch (tireConfig) {
      case '6x4':
        // 3 axles: 1 front (single), 2 rear (dual each side)
        axles = [
          { name: 'Front', leftCount: 1, rightCount: 1 },
          { name: 'Rear 1', leftCount: 2, rightCount: 2 },
          { name: 'Rear 2', leftCount: 2, rightCount: 2 },
        ];
        break;
      case '8x4':
        // 4 axles: 1 front (single), 3 rear (dual each side)
        axles = [
          { name: 'Front', leftCount: 1, rightCount: 1 },
          { name: 'Rear 1', leftCount: 2, rightCount: 2 },
          { name: 'Rear 2', leftCount: 2, rightCount: 2 },
          { name: 'Rear 3', leftCount: 2, rightCount: 2 },
        ];
        break;
      case '4x2':
      default:
        // 2 axles: front (single), rear (single)
        axles = [
          { name: 'Front', leftCount: 1, rightCount: 1 },
          { name: 'Rear', leftCount: 1, rightCount: 1 },
        ];
        break;
    }

    // Assign sequential tire numbers across axles and sides
    let tireNo = 1;
    const layout = axles.map((axle) => {
      const left = Array.from({ length: axle.leftCount }).map(() => ({ tireNo: tireNo++ }));
      const right = Array.from({ length: axle.rightCount }).map(() => ({ tireNo: tireNo++ }));
      return { ...axle, left, right };
    });

    return { layout, tireCount: tireNo - 1 };
  };

  const IconsLayout = () => {
    const kpaToPsi = (kpa) => Math.round((kpa || 0) * 0.1450377);
    const colorHex = (reading) => {
      const st = reading
        ? getTireStatus(reading.pressure_kpa, reading.temp_celsius, reading.ex_type)
        : null;
      if (!st) return '#9ca3af';
      return st.status === 'warning' ? '#ef4444' : st.status === 'caution' ? '#f59e0b' : '#10b981';
    };
    const labelPsi = (reading) => (reading ? `${kpaToPsi(reading.pressure_kpa)} PSI` : '-- PSI');
    const labelTemp = (reading) =>
      reading ? `${Math.round(reading.temp_celsius ?? 0)}°C` : '--°C';

    // Helper to render a pair of icons (for dual or single)
    const Pair = ({ leftTireNo, rightTireNo, gapClass = 'gap-20' }) => {
      const left = tireData.find((t) => t.tire_no === leftTireNo);
      const right = tireData.find((t) => t.tire_no === rightTireNo);
      return (
        <div className={`flex justify-center ${gapClass}`}>
          <div className="flex flex-col items-center space-y-1 w-16">
            <WheelFrontIcon size={28} color={colorHex(left)} />
            <span className="text-xs font-semibold leading-tight">{labelPsi(left)}</span>
            <span className="text-[11px] text-gray-500 leading-tight">{labelTemp(left)}</span>
          </div>
          <div className="flex flex-col items-center space-y-1 w-16">
            <WheelFrontIcon size={28} color={colorHex(right)} />
            <span className="text-xs font-semibold leading-tight">{labelPsi(right)}</span>
            <span className="text-[11px] text-gray-500 leading-tight">{labelTemp(right)}</span>
          </div>
        </div>
      );
    };

    return (
      <div className="flex flex-col items-center space-y-4">
        {axleLayout.map((axle, idx) => {
          // Single tires per side (front or simple rear)
          if (axle.left.length === 1 && axle.right.length === 1) {
            return (
              <Pair
                key={`icons-${idx}`}
                leftTireNo={axle.left[0].tireNo}
                rightTireNo={axle.right[0].tireNo}
              />
            );
          }
          // Dual tires per side
          return (
            <div key={`icons-${idx}`} className="flex justify-center gap-10">
              <div className="flex gap-3">
                <div className="flex flex-col items-center space-y-1 w-16">
                  <WheelFrontIcon
                    size={28}
                    color={colorHex(tireData.find((t) => t.tire_no === axle.left[0]?.tireNo))}
                  />
                  <span className="text-xs font-semibold leading-tight">
                    {labelPsi(tireData.find((t) => t.tire_no === axle.left[0]?.tireNo))}
                  </span>
                  <span className="text-[11px] text-gray-500 leading-tight">
                    {labelTemp(tireData.find((t) => t.tire_no === axle.left[0]?.tireNo))}
                  </span>
                </div>
                <div className="flex flex-col items-center space-y-1 w-16">
                  <WheelFrontIcon
                    size={28}
                    color={colorHex(tireData.find((t) => t.tire_no === axle.left[1]?.tireNo))}
                  />
                  <span className="text-xs font-semibold leading-tight">
                    {labelPsi(tireData.find((t) => t.tire_no === axle.left[1]?.tireNo))}
                  </span>
                  <span className="text-[11px] text-gray-500 leading-tight">
                    {labelTemp(tireData.find((t) => t.tire_no === axle.left[1]?.tireNo))}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex flex-col items-center space-y-1 w-16">
                  <WheelFrontIcon
                    size={28}
                    color={colorHex(tireData.find((t) => t.tire_no === axle.right[0]?.tireNo))}
                  />
                  <span className="text-xs font-semibold leading-tight">
                    {labelPsi(tireData.find((t) => t.tire_no === axle.right[0]?.tireNo))}
                  </span>
                  <span className="text-[11px] text-gray-500 leading-tight">
                    {labelTemp(tireData.find((t) => t.tire_no === axle.right[0]?.tireNo))}
                  </span>
                </div>
                <div className="flex flex-col items-center space-y-1 w-16">
                  <WheelFrontIcon
                    size={28}
                    color={colorHex(tireData.find((t) => t.tire_no === axle.right[1]?.tireNo))}
                  />
                  <span className="text-xs font-semibold leading-tight">
                    {labelPsi(tireData.find((t) => t.tire_no === axle.right[1]?.tireNo))}
                  </span>
                  <span className="text-[11px] text-gray-500 leading-tight">
                    {labelTemp(tireData.find((t) => t.tire_no === axle.right[1]?.tireNo))}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {/* Legend */}
        <div className="flex justify-start w-full mt-2 text-xs text-gray-500 gap-4">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span>Optimal</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span>Low</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span>High/Critical</span>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const loadTireData = async () => {
      if (!selectedTruckId) {
        setTireData([]);
        setTruckInfo(null);
        return;
      }

      console.log('🔧 TirePressureDisplay - selectedTruckId:', selectedTruckId);
      console.log('🔧 TirePressureDisplay - propTireData:', propTireData);

      // Default minimal truck info; backend-specific enrichment can be added if available
      setTruckInfo(
        (prev) => prev || { id: selectedTruckId, name: String(selectedTruckId), tire_config: '6x4' }
      );

      // Use propTireData if available (from TPMS), otherwise fetch from API
      if (propTireData && Array.isArray(propTireData) && propTireData.length > 0) {
        // Convert TPMS format to expected format
        const convertedData = propTireData.map((tire) => ({
          tire_no: tire.tireNo,
          tireNo: tire.tireNo,
          pressure_kpa: tire.tiprValue,
          temp_celsius: tire.tempValue,
          changed_at: tire.createdAt,
        }));
        console.log('🔧 TirePressureDisplay - convertedData:', convertedData);
        setTireData(convertedData);
        return;
      }

      try {
        const res = await trucksAPI.getTirePressures(selectedTruckId);
        if (res.success && Array.isArray(res.data)) {
          // Expecting array with fields: tire_no, pressure_kpa, temp_celsius, changed_at (optional)
          const latestByTire = {};
          res.data.forEach((item) => {
            const tireNo = Number(item.tire_no ?? item.tireNo);
            if (!tireNo) return;
            const ts = item.changed_at || item.timestamp || item.reported_at || null;
            if (!latestByTire[tireNo]) latestByTire[tireNo] = { ...item, changed_at: ts };
            else if (ts && new Date(ts) > new Date(latestByTire[tireNo].changed_at || 0)) {
              latestByTire[tireNo] = { ...item, changed_at: ts };
            }
          });
          const tireArray = Object.values(latestByTire).sort(
            (a, b) => (a.tire_no ?? a.tireNo) - (b.tire_no ?? b.tireNo)
          );
          setTireData(tireArray);
        } else {
          setTireData([]);
        }
      } catch {
        setTireData([]);
      }
    };

    loadTireData();
  }, [selectedTruckId, propTireData]);

  const getTireStatus = (pressure, temperature, exType) => {
    if (exType) {
      return {
        status: 'warning',
        color: 'bg-red-500',
        textColor: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
      };
    }

    if (pressure < 800 || pressure > 900 || temperature > 60) {
      return {
        status: 'caution',
        color: 'bg-yellow-500',
        textColor: 'text-yellow-700',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
      };
    }

    return {
      status: 'normal',
      color: 'bg-green-500',
      textColor: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    };
  };

  // SVG Tire icon with status coloring
  const TireIcon = ({ tireNo, reading }) => {
    const status = reading
      ? getTireStatus(reading.pressure_kpa, reading.temp_celsius, reading.ex_type)
      : null;
    const ring = status
      ? status.status === 'warning'
        ? '#ef4444'
        : status.status === 'caution'
          ? '#f59e0b'
          : '#10b981'
      : '#9ca3af';
    return (
      <div className="flex flex-col items-center">
        <div className="text-[10px] text-gray-500 mb-0.5">
          {reading ? `${reading.pressure_kpa} kPa` : '--'}
        </div>
        <div className="relative">
          <svg width="36" height="36" viewBox="0 0 36 36" className="drop-shadow-sm">
            <circle cx="18" cy="18" r="16" fill="#f8fafc" stroke={ring} strokeWidth="3" />
            <circle cx="18" cy="18" r="10" fill="#e5e7eb" stroke="#cbd5e1" strokeWidth="1.5" />
            <circle cx="18" cy="18" r="4.5" fill="#94a3b8" />
            {/* tread marks */}
            <g stroke="#cbd5e1" strokeWidth="1">
              <line x1="6" y1="18" x2="12" y2="18" />
              <line x1="24" y1="18" x2="30" y2="18" />
              <line x1="18" y1="6" x2="18" y2="12" />
              <line x1="18" y1="24" x2="18" y2="30" />
            </g>
          </svg>
          {/* status dot */}
          {status && (
            <span
              className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${status.color}`}
            ></span>
          )}
          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-slate-700">
            {tireNo}
          </span>
        </div>
        <div className="text-[10px] text-gray-500 mt-0.5">
          {reading ? `${reading.temp_celsius}°C` : '--'}
        </div>
      </div>
    );
  };

  if (!selectedTruckId || !truckInfo) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="mb-2">
            <svg
              className="w-12 h-12 mx-auto text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <p className="text-sm">Pilih kendaraan untuk melihat tekanan ban</p>
        </div>
      </div>
    );
  }

  const { layout: axleLayout, tireCount } = buildAxleLayout(truckInfo.tire_config || '6x4');

  const Header = () => (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-1">Tire Pressure</h3>
        <p className="text-sm text-gray-600">
          {truckInfo.name} ({truckInfo.tire_config})
        </p>
        <p className="text-xs text-gray-500">{tireCount} tires</p>
      </div>
      <div className="inline-flex rounded-md border border-gray-200 bg-white overflow-hidden">
        {/* <button
          className={`px-2.5 py-1.5 text-xs font-medium ${viewMode === 'visual' ? 'bg-gray-100 text-gray-900' : 'text-gray-600'}`}
          onClick={() => setViewMode('visual')}
        >
          Visual
        </button>
        <button
          className={`px-2.5 py-1.5 text-xs font-medium border-l border-gray-200 ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-600'}`}
          onClick={() => setViewMode('list')}
        >
          Detail
        </button>
        <button
          className={`px-2.5 py-1.5 text-xs font-medium border-l border-gray-200 ${viewMode === 'icons' ? 'bg-gray-100 text-gray-900' : 'text-gray-600'}`}
          onClick={() => setViewMode('icons')}
        >
          Icons
        </button> */}
      </div>
    </div>
  );

  const ListLayout = () => {
    const kpaToPsi = (kpa) => Math.round((kpa || 0) * 0.1450377);
    const statusBar = (reading) => {
      const st = reading
        ? getTireStatus(reading.pressure_kpa, reading.temp_celsius, reading.ex_type)
        : null;
      return st?.status === 'warning'
        ? 'bg-red-500'
        : st?.status === 'caution'
          ? 'bg-yellow-500'
          : 'bg-green-500';
    };
    const readingText = (reading) => {
      if (!reading) return '--';
      const psi = kpaToPsi(reading.pressure_kpa);
      const temp = Math.round(reading.temp_celsius ?? 0);
      return `${psi} PSI · ${temp}°C`;
    };
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        {axleLayout.map((axle, idx) => {
          const axleTitle =
            axle.name === 'Front' ? 'Front Axle' : `Rear Axle ${axle.name.replace('Rear ', '')}`;
          return (
            <div key={`ax-${idx}`} className={idx > 0 ? 'mt-4' : ''}>
              <p className="text-sm font-medium text-gray-700 mb-2">{axleTitle}</p>
              {/* Front or single tires */}
              {axle.left.length === 1 && axle.right.length === 1 ? (
                <div className="space-y-2">
                  {/* Left */}
                  <div className="flex items-center justify-between p-2 rounded-md bg-white border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-1 h-6 rounded-full ${statusBar(tireData.find((t) => t.tire_no === axle.left[0].tireNo))}`}
                      ></div>
                      <p className="text-sm text-gray-800">
                        {axle.name === 'Front' ? 'Front Left' : 'Left'}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {readingText(tireData.find((t) => t.tire_no === axle.left[0].tireNo))}
                    </p>
                  </div>
                  {/* Right */}
                  <div className="flex items-center justify-between p-2 rounded-md bg-white border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-1 h-6 rounded-full ${statusBar(tireData.find((t) => t.tire_no === axle.right[0].tireNo))}`}
                      ></div>
                      <p className="text-sm text-gray-800">
                        {axle.name === 'Front' ? 'Front Right' : 'Right'}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {readingText(tireData.find((t) => t.tire_no === axle.right[0].tireNo))}
                    </p>
                  </div>
                </div>
              ) : (
                // Dual tires per side
                <div className="space-y-3">
                  {/* Left side (Dual) */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Left Side (Dual)</p>
                    <div className="pl-3 border-l-2 border-gray-200 space-y-2">
                      {['Inner', 'Outer'].map((label, i) => (
                        <div
                          key={label}
                          className="flex items-center justify-between p-2 rounded-md bg-white border border-gray-200"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-1 h-6 rounded-full ${statusBar(tireData.find((t) => t.tire_no === axle.left[i]?.tireNo))}`}
                            ></div>
                            <p className="text-sm text-gray-800">{label}</p>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">
                            {readingText(tireData.find((t) => t.tire_no === axle.left[i]?.tireNo))}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Right side (Dual) */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Right Side (Dual)</p>
                    <div className="pl-3 border-l-2 border-gray-200 space-y-2">
                      {['Inner', 'Outer'].map((label, i) => (
                        <div
                          key={label}
                          className="flex items-center justify-between p-2 rounded-md bg-white border border-gray-200"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-1 h-6 rounded-full ${statusBar(tireData.find((t) => t.tire_no === axle.right[i]?.tireNo))}`}
                            ></div>
                            <p className="text-sm text-gray-800">{label}</p>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">
                            {readingText(tireData.find((t) => t.tire_no === axle.right[i]?.tireNo))}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
            <span>Optimal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
            <span>Warning</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span>Critical</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`p-4 ${className}`}>
      {showHeader && <Header />}

      {viewMode === 'visual' ? (
        <div className="space-y-5">
          {axleLayout.map((axle, idx) => (
            <div key={idx} className="relative flex items-center justify-center">
              <div className="flex flex-col gap-2 items-center mr-8">
                {axle.left.map((pos, i) => {
                  const reading = tireData.find((t) => t.tire_no === pos.tireNo);
                  return <TireIcon key={`L-${idx}-${i}`} tireNo={pos.tireNo} reading={reading} />;
                })}
              </div>
              <div className="w-28 h-1 bg-gray-400/70 rounded" />
              <div className="flex flex-col gap-2 items-center ml-8">
                {axle.right.map((pos, i) => {
                  const reading = tireData.find((t) => t.tire_no === pos.tireNo);
                  return <TireIcon key={`R-${idx}-${i}`} tireNo={pos.tireNo} reading={reading} />;
                })}
              </div>
            </div>
          ))}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
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
        </div>
      ) : viewMode === 'list' ? (
        <ListLayout />
      ) : (
        <IconsLayout />
      )}

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
