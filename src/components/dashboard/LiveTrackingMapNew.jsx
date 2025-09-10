import React, { useEffect, useRef, useState } from 'react';
import {
  TruckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  SignalIcon
} from '@heroicons/react/24/outline';
import BaseTrackingMap from './BaseTrackingMap';
import TirePressureDisplay from './TirePressureDisplay';
import { trucksAPI, FleetWebSocket } from '../../services/api.js';
import { getLiveTrackingData, getTruckRoute, getDummyRealRoutePoints, getDummyRealRouteLastPoint } from '../../data/index.js';
import tirePressureDummy from '../../data/tirePressureEvents.js';

const LiveTrackingMapNew = () => {
  const USE_BACKEND = true;
  const [map, setMap] = useState(null);
  const [mapUtils, setMapUtils] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clusterSelections, setClusterSelections] = useState(new Set(['1-199','200-399','400-599','600-799','800-999']));
  const [vehicleRoutes, setVehicleRoutes] = useState({});
  const [isTrackingActive, setIsTrackingActive] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');

  const markersRef = useRef({});
  const liveRouteLineRef = useRef(null);
  const liveRouteMarkersRef = useRef({ start: null, end: null });
  const wsRef = useRef(null);
  const lastHideStateRef = useRef(null);
  const rafRef = useRef(null);

  // Tire data helpers
  const normalizeTruckId = (id) => String(id || '').toLowerCase();
  
  const getLatestTireData = async (truckId) => {
    try {
      const apiRes = await trucksAPI.getTirePressures(truckId);
      if (apiRes?.success && Array.isArray(apiRes.data) && apiRes.data.length > 0) {
        const latestByTire = {};
        apiRes.data.forEach(item => {
          const no = Number(item.tire_no);
          if (!latestByTire[no]) latestByTire[no] = item;
        });
        return latestByTire;
      }
    } catch (e) {
      console.warn('Tire API failed, using dummy:', e?.message || e);
    }
    
    try {
      const all = Array.isArray(tirePressureDummy) ? tirePressureDummy : (tirePressureDummy?.tirePressureEvents || []);
      const filtered = all.filter(ev => normalizeTruckId(ev.truck_id).includes(normalizeTruckId(truckId)));
      const latestByTire = {};
      filtered.forEach(ev => {
        const no = Number(ev.tire_no);
        if (!latestByTire[no]) latestByTire[no] = ev;
        else if (new Date(ev.changed_at) > new Date(latestByTire[no].changed_at)) latestByTire[no] = ev;
      });
      return latestByTire;
    } catch {
      return {};
    }
  };

  const buildTirePopupHTML = (tireMap) => {
    const tires = Object.keys(tireMap).map(n => Number(n)).sort((a,b)=>a-b);
    const pairs = [];
    for (let i=0;i<tires.length;i+=2){
      const a = tireMap[tires[i]]; const b = tireMap[tires[i+1]];
      const left = a ? `<div class="flex items-center gap-2"><span class="text-[10px] px-1 rounded bg-gray-200">#${a.tire_no}</span><span class="text-xs">${a.pressure_kpa ?? a.pressureKpa ?? '-'} kPa</span><span class="text-xs text-gray-500">/ ${a.temp_celsius ?? a.tempCelsius ?? '-'}°C</span></div>` : '';
      const right = b ? `<div class="flex items-center gap-2"><span class="text-[10px] px-1 rounded bg-gray-200">#${b.tire_no}</span><span class="text-xs">${b.pressure_kpa ?? b.pressureKpa ?? '-'} kPa</span><span class="text-xs text-gray-500">/ ${b.temp_celsius ?? b.tempCelsius ?? '-'}°C</span></div>` : '';
      pairs.push(`
        <div class="flex items-center justify-between gap-2">
          <div class="flex-1 flex items-center justify-between">
            <span class="text-[11px]">Tekanan Suhu</span>
            ${left}
          </div>
          <div class="w-10 h-4 bg-gray-300 rounded-sm mx-2"></div>
          <div class="flex-1 flex items-center justify-between">
            ${right}
            <span class="text-[11px]">Suhu Tekanan</span>
          </div>
        </div>
      `);
    }
    return `<div class="space-y-1">${pairs.join('')}</div>`;
  };

  // Truck number helpers & cluster filtering
  const extractTruckNumber = (idOrName) => {
    if (!idOrName) return null;
    const m = String(idOrName).match(/(\d{1,4})/);
    return m ? parseInt(m[1], 10) : null;
  };

  const inSelectedCluster = (truckId) => {
    if (!clusterSelections || clusterSelections.size === 0) return true;
    const n = extractTruckNumber(truckId);
    if (n == null) return false;
    for (const key of clusterSelections) {
      const [lo, hi] = key.split('-').map(Number);
      if (n >= lo && n <= hi) return true;
    }
    return false;
  };

  // Apply marker scale/visibility based on zoom and viewport
  const applyMarkerZoomStyling = () => {
    if (!map) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const zoom = map.getZoom();
      let scale = 1;
      if (zoom >= 16) scale = 1;
      else if (zoom >= 14) scale = 0.85;
      else if (zoom >= 12) scale = 0.7;
      else if (zoom >= 10) scale = 0.55;
      else scale = 0.4;

      const HIDE_ZOOM_MAX = 5;
      const SHOW_ZOOM_MIN = 8;
      let hideAll;
      if (zoom <= HIDE_ZOOM_MAX) hideAll = true;
      else if (zoom >= SHOW_ZOOM_MIN) hideAll = false;
      else hideAll = lastHideStateRef.current ?? false;
      lastHideStateRef.current = hideAll;

      Object.values(markersRef.current).forEach(marker => {
        const el = marker.getElement?.();
        if (!el) return;
        const wrapper = el.firstElementChild;
        if (hideAll) {
          el.style.visibility = 'hidden';
        } else {
          el.style.visibility = 'visible';
          if (wrapper) {
            wrapper.style.transform = `scale(${scale})`;
            wrapper.style.transformOrigin = 'center bottom';
          }
        }
      });

      rafRef.current = null;
    });
  };

  // Initialize sample data if backend not available
  const initializeSampleData = async () => {
    console.log('🔄 Backend not available - initializing comprehensive dummy data');
    try {
      let liveTrackingData = getLiveTrackingData();
      console.log(`📊 Loaded ${liveTrackingData.length} vehicles from dummy data`);

      if (!liveTrackingData || liveTrackingData.length === 0) {
        console.warn('⚠️ Dummy data empty, synthesizing demo vehicles');
        const mdPts = getDummyRealRoutePoints();
        const mdCoords = Array.isArray(mdPts) && mdPts.length > 0 ? mdPts.map(p => [p.lat, p.lng]) : [];
        const total = 5;
        const synth = Array.from({ length: total }).map((_, i) => ({
          id: `TRUCK-${String(i + 1).padStart(3, '0')}`,
          driver: `Demo Driver ${i + 1}`,
          position: mdCoords.length > 0
            ? mdCoords[Math.floor((i / Math.max(total - 1, 1)) * (mdCoords.length - 1))]
            : mapUtils?.polygonCentroid(mapUtils.polygonLatLng) || [-3.580000, 115.600000],
          status: 'active',
          speed: 0,
          heading: 90,
          fuel: 80,
          battery: 90,
          signal: 'good',
          lastUpdate: new Date(),
          route: 'Mining Area',
          load: 'Empty'
        }));
        liveTrackingData = synth;
      }

      const routes = {};
      liveTrackingData = liveTrackingData.map((vehicle, idx) => {
        const routeData = getTruckRoute(vehicle.id, timeRange);
        if (routeData && routeData.length > 0) {
          routes[vehicle.id] = routeData;
          const last = routeData[routeData.length - 1];
          return { ...vehicle, position: last };
        }
        const mdLast = getDummyRealRouteLastPoint?.();
        if (mdLast && typeof mdLast.lat === 'number' && typeof mdLast.lng === 'number') {
          return { ...vehicle, position: [mdLast.lat, mdLast.lng] };
        }
        return vehicle;
      });

      setVehicleRoutes(routes);
      console.log(`✅ Initialized ${liveTrackingData.length} vehicles with comprehensive dummy data`);
      return liveTrackingData;
    } catch (error) {
      console.error('❌ Failed to initialize dummy data:', error);
      return [];
    }
  };

  const onMapReady = (mapInstance, utils) => {
    setMap(mapInstance);
    setMapUtils(utils);
    
    // Apply marker styling on zoom/move
    mapInstance.on('zoom', () => applyMarkerZoomStyling());
    mapInstance.on('zoomend', () => applyMarkerZoomStyling());
    mapInstance.on('move', () => applyMarkerZoomStyling());
    mapInstance.on('moveend', () => applyMarkerZoomStyling());
  };

  // Load truck data
  useEffect(() => {
    const loadTruckData = async () => {
      try {
        setLoading(true);
        
        if (!USE_BACKEND) {
          const sampleData = await initializeSampleData();
          setVehicles(sampleData);
          setError(null);
          return;
        }

        const response = await trucksAPI.getRealTimeLocations();
        
        if (response.success && response.data) {
          const vehicleData = response.data.features?.map(feature => ({
            id: feature.properties.truckNumber,
            driver: feature.properties.driverName || 'Unknown Driver',
            position: [feature.geometry.coordinates[1], feature.geometry.coordinates[0]],
            status: feature.properties.status?.toLowerCase() || 'offline',
            speed: feature.properties.speed || 0,
            heading: feature.properties.heading || 0,
            fuel: feature.properties.fuelPercentage || 0,
            battery: 90,
            signal: 'good',
            lastUpdate: new Date(),
            route: 'Mining Area',
            load: feature.properties.payloadTons ? `Coal - ${feature.properties.payloadTons} tons` : 'Unknown'
          })) || [];

          if (vehicleData.length > 0) {
            setVehicles(vehicleData);
          } else {
            console.log('ℹ️ API returned no vehicles, switching to sample data');
            const sampleData = await initializeSampleData();
            setVehicles(sampleData);
            setError('No vehicles from backend - using demo data');
          }

        } else {
          console.log('🔌 Backend not available - using sample data for demo');
          const sampleData = await initializeSampleData();
          setVehicles(sampleData);
          setError('Backend not available - using demo data');
        }
      } catch (error) {
        console.error('❌ Failed to load truck data:', error);
        console.log('🔄 Using sample data as fallback');
        
        const sampleData = await initializeSampleData();
        setVehicles(sampleData);
        setError('Connection failed - using demo data');
      } finally {
        setLoading(false);
      }
    };

    loadTruckData();

    // Setup WebSocket
    if (USE_BACKEND) {
      wsRef.current = new FleetWebSocket();
      try {
        wsRef.current.connect();
        
        const handleTruckUpdates = async (data) => {
          if (data && Array.isArray(data) && data.length > 0) {
            console.log('📡 Received WebSocket truck updates:', data.length, 'vehicles');
            
            const vehicleData = data.map(truck => ({
              id: truck.truckNumber,
              driver: truck.driverName || 'Unknown Driver',
              position: [truck.latitude, truck.longitude],
              status: truck.status?.toLowerCase() || 'offline',
              speed: truck.speed || 0,
              heading: truck.heading || 0,
              fuel: truck.fuelPercentage || 0,
              battery: 90,
              signal: 'good',
              lastUpdate: new Date(),
              route: 'Mining Area',
              load: truck.payloadTons ? `Coal - ${truck.payloadTons} tons` : 'Unknown'
            }));
            
            setVehicles(vehicleData);
            setError(null);
          }
        };

        wsRef.current.subscribe('truck_locations_update', handleTruckUpdates);
        wsRef.current.subscribe('truck_updates', handleTruckUpdates);
      } catch (wsError) {
        console.warn('⚠️ WebSocket connection failed, using polling fallback');
      }
    }
    
    return () => {
      if (USE_BACKEND && wsRef.current) {
        wsRef.current.disconnect();
      }
    };
  }, [timeRange, mapUtils]);

  // Geofence-aware smooth movement for live tracking
  useEffect(() => {
    if (!isTrackingActive || !mapUtils) return;
    const centroid = mapUtils.polygonCentroid(mapUtils.polygonLatLng);
    const interval = setInterval(() => {
      setVehicles(prevVehicles => prevVehicles.map(vehicle => {
        if (vehicle.status !== 'active') return vehicle;
        const currentRoute = (vehicleRoutes[vehicle.id] || []);
        const lastPos = currentRoute[currentRoute.length - 1] || vehicle.position;
        const baseBearing = (vehicle.heading ?? 90);
        const rawDrift = (Math.random() - 0.5) * 2;
        const targetBearing = baseBearing + rawDrift;
        const nextBearing = baseBearing + (targetBearing - baseBearing) * 0.2;
        const stepM = 1;

        let nextPos = mapUtils.moveByMeters(lastPos, stepM, nextBearing);
        if (!mapUtils.pointInPolygon(nextPos, mapUtils.polygonLatLng)) {
          const dy = centroid[0] - lastPos[0];
          const dx = centroid[1] - lastPos[1];
          const bearingToCentroid = (Math.atan2(dx, dy) * 180) / Math.PI;
          nextPos = mapUtils.moveByMeters(lastPos, stepM, bearingToCentroid);
          if (!mapUtils.pointInPolygon(nextPos, mapUtils.polygonLatLng)) {
            nextPos = mapUtils.moveByMeters(lastPos, stepM, (baseBearing + 180) % 360);
          }
        }

        setVehicleRoutes(prev => {
          const current = prev[vehicle.id] || [];
          const last = current[current.length - 1] || lastPos;
          const moved = mapUtils.haversineMeters(last, nextPos);
          if (moved >= 0.5) {
            const limited = [...current, nextPos].slice(-200);
            return { ...prev, [vehicle.id]: limited };
          }
          return prev;
        });

        return {
          ...vehicle,
          position: nextPos,
          heading: ((nextBearing) + 360) % 360,
          speed: 3.6,
          lastUpdate: new Date()
        };
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [isTrackingActive, vehicleRoutes, mapUtils]);

  // Helper functions
  const formatLastUpdate = (date) => {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const getCurrentShiftWindow = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();
    const h = now.getHours();
    if (h >= 6 && h < 16) {
      return { start: new Date(y, m, d, 6, 0, 0, 0), end: new Date(y, m, d, 16, 0, 0, 0) };
    }
    if (h >= 16) {
      return { start: new Date(y, m, d, 16, 0, 0, 0), end: new Date(y, m, d + 1, 6, 0, 0, 0) };
    }
    return { start: new Date(y, m, d - 1, 16, 0, 0, 0), end: new Date(y, m, d, 6, 0, 0, 0) };
  };

  // Update markers when data changes
  useEffect(() => {
    if (map && vehicles.length > 0) {
      const L = window.L || require('leaflet');
      
      // Clear existing markers
      Object.values(markersRef.current).forEach(marker => {
        if (marker && map.hasLayer(marker)) {
          map.removeLayer(marker);
        }
      });
      
      markersRef.current = {};

      // Add vehicle markers
      vehicles.forEach((vehicle) => {
        const colors = {
          active: '#10b981',
          idle: '#f59e0b',
          maintenance: '#ef4444',
          offline: '#6b7280'
        };

        if (!inSelectedCluster(vehicle.id)) {
          return;
        }

        const truckNum = extractTruckNumber(vehicle.id) ?? '';
        const icon = L.divIcon({
          html: `
            <div style="position: relative;">
              <div style="
                background: ${colors[vehicle.status] || colors.offline};
                color: #ffffff;
                border: 2px solid #ffffff;
                border-radius: 6px;
                padding: 2px 6px;
                min-width: 26px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 12px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.25);
              ">
                ${truckNum}
              </div>
              <div style="
                width: 0; height: 0;
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-top: 8px solid ${colors[vehicle.status] || colors.offline};
                margin: 0 auto;
                filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));
              "></div>
            </div>
          `,
          className: 'custom-truck-icon',
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        });

        const marker = L.marker(vehicle.position, { icon, zIndexOffset: 1000, pane: 'markersPane' }).addTo(map);
        markersRef.current[vehicle.id] = marker;
        
        try {
          const el = marker.getElement?.();
          if (el) el.style.visibility = 'visible';
        } catch {}
        
        const basePopup = `
          <div class="p-4 min-w-72 max-w-80">
            <div class="flex items-center justify-between mb-3">
              <h4 class="font-bold text-gray-900 text-lg">${vehicle.id}</h4>
              <span class="px-3 py-1 rounded-full text-xs font-medium bg-${vehicle.status === 'active' ? 'green' : vehicle.status === 'idle' ? 'yellow' : 'red'}-100 text-${vehicle.status === 'active' ? 'green' : vehicle.status === 'idle' ? 'yellow' : 'red'}-600">
                ${vehicle.status.toUpperCase()}
              </span>
            </div>
            
            <div class="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div class="bg-gray-50 p-2 rounded">
                <div class="text-gray-500 text-xs">Driver</div>
                <div class="font-medium">${vehicle.driver}</div>
              </div>
              <div class="bg-gray-50 p-2 rounded">
                <div class="text-gray-500 text-xs">Speed</div>
                <div class="font-medium">${vehicle.speed} km/h</div>
              </div>
              <div class="bg-gray-50 p-2 rounded">
                <div class="text-gray-500 text-xs">Fuel</div>
                <div class="font-medium">${vehicle.fuel}%</div>
              </div>
              <div class="bg-gray-50 p-2 rounded">
                <div class="text-gray-500 text-xs">Signal</div>
                <div class="font-medium">${vehicle.signal}</div>
              </div>
            </div>
            
            <div class="border-t pt-3 space-y-2" id="extra-section">
              <div class="text-sm">
                <div class="text-gray-500">Last Update:</div>
                <div class="font-medium">${formatLastUpdate(vehicle.lastUpdate)}</div>
              </div>
            </div>
          </div>
        `;

        marker.bindPopup(basePopup);

        marker.on('click', async () => {
          setSelectedVehicle(vehicle);
          
          try {
            const tireMap = await getLatestTireData(vehicle.id);
            const html = buildTirePopupHTML(tireMap);
            const popup = marker.getPopup();
            if (popup) {
              const content = document.createElement('div');
              content.innerHTML = popup.getContent();
              const extra = content.querySelector('#extra-section');
              if (extra) {
                const header = document.createElement('div');
                header.className = 'text-xs text-gray-600 font-medium';
                header.textContent = 'Tire Pressure & Temperature';
                extra.prepend(header);
                const tireDiv = document.createElement('div');
                tireDiv.className = 'space-y-1 mt-1';
                tireDiv.innerHTML = html;
                extra.appendChild(tireDiv);
                popup.setContent(content.innerHTML);
                marker.openPopup();
              }
            }
          } catch {}

          // Show live route for this vehicle
          try {
            if (liveRouteLineRef.current && map) {
              try { map.removeLayer(liveRouteLineRef.current); } catch {}
              liveRouteLineRef.current = null;
            }
            
            const L = window.L || require('leaflet');
            const liveWindow = getCurrentShiftWindow();
            let routeHistory = vehicleRoutes[vehicle.id] || [];
            
            if (routeHistory.length <= 1) {
              const pts = getDummyRealRoutePoints?.() || [];
              const coords = Array.isArray(pts) && pts.length > 1 ? pts.map(p => [p.lat, p.lng]) : [];
              if (coords.length > 1) {
                routeHistory = coords;
              }
            }
            
            if (Array.isArray(routeHistory) && routeHistory.length > 1) {
              const routeColor = '#2563eb';
              liveRouteLineRef.current = L.polyline(routeHistory, {
                color: routeColor,
                weight: 3,
                opacity: 0.9,
                smoothFactor: 2,
                lineJoin: 'round',
                lineCap: 'round',
                pane: 'routesPane'
              }).addTo(map);
              
              if (liveRouteMarkersRef.current.start) try { map.removeLayer(liveRouteMarkersRef.current.start); } catch {}
              if (liveRouteMarkersRef.current.end) try { map.removeLayer(liveRouteMarkersRef.current.end); } catch {}
              
              const startIcon = L.divIcon({
                html: `<div style="background:white;border:2px solid ${routeColor};border-radius:50%;width:14px;height:14px;"></div>`,
                className: 'live-route-start', iconSize: [14,14], iconAnchor: [7,7]
              });
              const endIcon = L.divIcon({
                html: `<div style="position:relative;"><div style="background:${routeColor};color:#fff;border:2px solid #fff;border-radius:6px;padding:2px 6px;min-width:20px;height:18px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:10px;box-shadow:0 2px 6px rgba(0,0,0,.25);">END</div><div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${routeColor};margin:0 auto;filter:drop-shadow(0 2px 2px rgba(0,0,0,.2));"></div></div>`,
                className: 'live-route-end', iconSize: [26,26], iconAnchor: [13,26]
              });
              
              liveRouteMarkersRef.current.start = L.marker(routeHistory[0], { icon: startIcon, pane: 'routesPane' }).addTo(map);
              liveRouteMarkersRef.current.end = L.marker(routeHistory[routeHistory.length - 1], { icon: endIcon, pane: 'routesPane' }).addTo(map);
              
              try {
                map.fitBounds(liveRouteLineRef.current.getBounds().pad(0.05));
              } catch {}
            }
          } catch (e) {
            console.warn('Failed to show live route:', e);
          }
        });
      });
    }
  }, [map, vehicles, clusterSelections]);

  // Re-apply marker zoom styling whenever map or selection changes
  useEffect(() => {
    applyMarkerZoomStyling();
  }, [map, vehicles, clusterSelections]);

  const sidebarContent = (
    <>
      <h4 className="text-lg font-semibold text-gray-900">Live Tracking</h4>
      
      {/* Cluster Filter */}
      <div className="mt-3">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Cluster (Truck No)
        </label>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {['1-199','200-399','400-599','600-799','800-999'].map(range => (
            <label key={range} className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={clusterSelections.has(range)}
                onChange={(e) => {
                  setClusterSelections(prev => {
                    const next = new Set(prev);
                    if (e.target.checked) next.add(range); else next.delete(range);
                    return next;
                  });
                }}
                disabled={loading}
              />
              <span>{range}</span>
            </label>
          ))}
        </div>
        <div className="mt-1 text-[10px] text-gray-500">Unchecked ranges are hidden. Leave all unchecked to show all.</div>
      </div>
      
      {/* Tracking status */}
      <div className="mt-3 flex items-center gap-1 text-xs text-gray-600">
        <div className={`w-2 h-2 rounded-full ${isTrackingActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
        {isTrackingActive ? 'Live Tracking Active' : 'Tracking Paused'}
        {loading && (
          <span className="text-blue-600 ml-2">Syncing...</span>
        )}
      </div>

      {/* Tire Pressure Display */}
      <div className="mt-4 border-t border-gray-200 pt-4">
        <TirePressureDisplay 
          selectedTruckId={selectedVehicle?.id} 
        />
      </div>
    </>
  );

  const additionalControls = (
    <div className="border-l border-gray-300 pl-3 flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${isTrackingActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
      <span className="text-xs text-gray-700 font-medium">
        {isTrackingActive ? 'LIVE' : 'PAUSED'}
      </span>
    </div>
  );

  return (
    <BaseTrackingMap
      onMapReady={onMapReady}
      sidebarContent={sidebarContent}
      additionalControls={additionalControls}
      showCompass={true}
      showMapStyleToggle={true}
      showAutoCenter={true}
      showFitRoutes={false}
    />
  );
};

export default LiveTrackingMapNew;
