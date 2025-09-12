import React, { useEffect, useRef, useState } from 'react';
import {
  TruckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  SignalIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import BaseTrackingMap from './BaseTrackingMap';
import TirePressureDisplay from './TirePressureDisplay';
import { trucksAPI, FleetWebSocket, connectionUtils } from '../../services/api.js';
import {
  getLiveTrackingData,
  getTruckRoute,
  getDummyRealRoutePoints,
  getDummyRealRouteLastPoint,
} from '../../data/index.js';
import tirePressureDummy from '../../data/tirePressureEvents.js';
import { devices } from '../../data/devices.js';
import { deviceStatusEvents } from '../../data/deviceStatusEvents.js';
import { trucks as trucksList } from '../../data/trucks.js';

const LiveTrackingMapNew = () => {
  const USE_BACKEND =
    ((typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_USE_BACKEND) ??
      'true') === 'true';
  const [map, setMap] = useState(null);
  const [mapUtils, setMapUtils] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showVehicleCard, setShowVehicleCard] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clusterSelections, setClusterSelections] = useState(
    new Set(['1-199', '200-399', '400-599', '600-799', '800-999'])
  );
  const [vehicleRoutes, setVehicleRoutes] = useState({});
  const [isTrackingActive, setIsTrackingActive] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [selectedDeviceStatus, setSelectedDeviceStatus] = useState(null);

  const markersRef = useRef({});
  const markersLayerRef = useRef(null);
  const liveRouteLineRef = useRef(null);
  const liveRouteMarkersRef = useRef({ start: null, end: null });
  const wsRef = useRef(null);
  const wsSubscribedRef = useRef(false);
  const lastHideStateRef = useRef(null);
  const rafRef = useRef(null);
  const focusHandledRef = useRef(false);
  const [backendOnline, setBackendOnline] = useState(connectionUtils?.isOnline?.() ?? false);
  const [wsStatus, setWsStatus] = useState('disconnected'); // connecting | connected | reconnecting | disconnected

  // Tire data helpers
  const normalizeTruckId = (id) => String(id || '').toLowerCase();

  const getLatestTireData = async (truckId) => {
    try {
      const apiRes = await trucksAPI.getTirePressures(truckId);
      if (apiRes?.success && Array.isArray(apiRes.data) && apiRes.data.length > 0) {
        const latestByTire = {};
        apiRes.data.forEach((item) => {
          const no = Number(item.tire_no);
          if (!latestByTire[no]) latestByTire[no] = item;
        });
        return latestByTire;
      }
    } catch (e) {
      console.warn('Tire API failed, using dummy:', e?.message || e);
    }

    try {
      const all = Array.isArray(tirePressureDummy)
        ? tirePressureDummy
        : tirePressureDummy?.tirePressureEvents || [];
      const filtered = all.filter((ev) =>
        normalizeTruckId(ev.truck_id).includes(normalizeTruckId(truckId))
      );
      const latestByTire = {};
      filtered.forEach((ev) => {
        const no = Number(ev.tire_no);
        if (!latestByTire[no]) latestByTire[no] = ev;
        else if (new Date(ev.changed_at) > new Date(latestByTire[no].changed_at))
          latestByTire[no] = ev;
      });
      return latestByTire;
    } catch {
      return {};
    }
  };

  // Resolve a given vehicle identifier to the truck UUID used by device mappings
  const resolveTruckUUID = (vehicleId) => {
    if (!vehicleId) return null;
    const idStr = String(vehicleId);
    // if it's already UUID-like
    if (idStr.length === 36 && idStr.includes('-')) return idStr;
    // try by exact match in trucks list by name or plate contains number
    const numMatch = idStr.match(/(\d{1,4})/);
    const num = numMatch ? numMatch[1] : null;
    if (num) {
      const t = trucksList.find(
        (tk) => String(tk.name).includes(num) || String(tk.plate_number).includes(num)
      );
      if (t) return t.id;
    }
    // fallback: cannot resolve
    return null;
  };

  const buildTirePopupHTML = (tireMap) => {
    const tires = Object.keys(tireMap)
      .map((n) => Number(n))
      .sort((a, b) => a - b);
    const pairs = [];
    for (let i = 0; i < tires.length; i += 2) {
      const a = tireMap[tires[i]];
      const b = tireMap[tires[i + 1]];
      const left = a
        ? `<div class="flex items-center gap-2"><span class="text-[10px] px-1 rounded bg-gray-200">#${a.tire_no}</span><span class="text-xs">${a.pressure_kpa ?? a.pressureKpa ?? '-'} kPa</span><span class="text-xs text-gray-500">/ ${a.temp_celsius ?? a.tempCelsius ?? '-'}°C</span></div>`
        : '';
      const right = b
        ? `<div class="flex items-center gap-2"><span class="text-[10px] px-1 rounded bg-gray-200">#${b.tire_no}</span><span class="text-xs">${b.pressure_kpa ?? b.pressureKpa ?? '-'} kPa</span><span class="text-xs text-gray-500">/ ${b.temp_celsius ?? b.tempCelsius ?? '-'}°C</span></div>`
        : '';
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

      Object.values(markersRef.current).forEach((marker) => {
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
        const mdCoords =
          Array.isArray(mdPts) && mdPts.length > 0 ? mdPts.map((p) => [p.lat, p.lng]) : [];
        const total = 5;
        const synth = Array.from({ length: total }).map((_, i) => ({
          id: `TRUCK-${String(i + 1).padStart(3, '0')}`,
          driver: `Demo Driver ${i + 1}`,
          position:
            mdCoords.length > 0
              ? mdCoords[Math.floor((i / Math.max(total - 1, 1)) * (mdCoords.length - 1))]
              : mapUtils?.polygonCentroid(mapUtils.polygonLatLng) || [-3.58, 115.6],
          status: 'active',
          speed: 0,
          heading: 90,
          fuel: 80,
          battery: 90,
          signal: 'good',
          lastUpdate: new Date(),
          route: 'Mining Area',
          load: 'Empty',
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
      console.log(
        `✅ Initialized ${liveTrackingData.length} vehicles with comprehensive dummy data`
      );
      return liveTrackingData;
    } catch (error) {
      console.error('❌ Failed to initialize dummy data:', error);
      return [];
    }
  };

  const onMapReady = (mapInstance, utils) => {
    setMap(mapInstance);
    setMapUtils(utils);
    try {
      const L = window.L || require('leaflet');
      if (!markersLayerRef.current) {
        markersLayerRef.current = L.layerGroup([], { pane: 'markersPane' }).addTo(mapInstance);
      }
    } catch {}

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
          const vehicleData =
            response.data.features?.map((feature) => ({
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
              load: feature.properties.payloadTons
                ? `Coal - ${feature.properties.payloadTons} tons`
                : 'Unknown',
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
  }, [timeRange, mapUtils]);

  // Setup WebSocket once (guarded) to avoid double-subscribe in StrictMode
  useEffect(() => {
    if (!USE_BACKEND) return;
    if (wsSubscribedRef.current) return;

    wsRef.current = new FleetWebSocket();
    try {
      setWsStatus('connecting');
      wsRef.current.connect();

      const handleTruckUpdates = async (data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          console.log('📡 Received WebSocket truck updates:', data.length, 'vehicles');

          const vehicleData = data.map((truck) => ({
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
            load: truck.payloadTons ? `Coal - ${truck.payloadTons} tons` : 'Unknown',
          }));

          setVehicles(vehicleData);
          setError(null);
        }
      };

      wsRef.current.subscribe('truck_locations_update', handleTruckUpdates);
      wsRef.current.subscribe('truck_updates', handleTruckUpdates);
      // Wrap internal WS events to also update local status without breaking existing handlers
      try {
        const ws = wsRef.current.ws;
        if (ws) {
          const prevOpen = ws.onopen;
          const prevClose = ws.onclose;
          const prevError = ws.onerror;
          ws.onopen = (ev) => {
            setWsStatus('connected');
            prevOpen && prevOpen(ev);
          };
          ws.onclose = (ev) => {
            setWsStatus('disconnected');
            prevClose && prevClose(ev);
          };
          ws.onerror = (ev) => {
            setWsStatus('reconnecting');
            prevError && prevError(ev);
          };
        }
      } catch {}
      wsSubscribedRef.current = true;
    } catch (wsError) {
      console.warn('⚠️ WebSocket connection failed, using polling fallback');
    }

    return () => {
      try {
        if (wsRef.current) wsRef.current.disconnect();
      } finally {
        wsSubscribedRef.current = false;
        setWsStatus('disconnected');
      }
    };
  }, [USE_BACKEND]);

  // Backend connection monitor
  useEffect(() => {
    let timerId;
    const sync = async () => {
      try {
        const ok = await connectionUtils.checkConnection();
        setBackendOnline(ok);
      } catch {
        setBackendOnline(false);
      }
    };
    // initial
    sync();
    // periodic
    try {
      timerId = connectionUtils.startConnectionMonitor?.(30000);
    } catch {}
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, []);

  // Geofence-aware smooth movement for live tracking
  useEffect(() => {
    if (!isTrackingActive || !mapUtils) return;
    const centroid = mapUtils.polygonCentroid(mapUtils.polygonLatLng);
    const interval = setInterval(() => {
      setVehicles((prevVehicles) =>
        prevVehicles.map((vehicle) => {
          if (vehicle.status !== 'active') return vehicle;
          const currentRoute = vehicleRoutes[vehicle.id] || [];
          const lastPos = currentRoute[currentRoute.length - 1] || vehicle.position;
          const baseBearing = vehicle.heading ?? 90;
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

          setVehicleRoutes((prev) => {
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
            heading: (nextBearing + 360) % 360,
            speed: 3.6,
            lastUpdate: new Date(),
          };
        })
      );
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

  // Reconcile markers when data changes (reuse markers for performance)
  useEffect(() => {
    if (map && vehicles) {
      const L = window.L || require('leaflet');
      if (!markersLayerRef.current) {
        try {
          markersLayerRef.current = L.layerGroup([], { pane: 'markersPane' }).addTo(map);
        } catch {}
      }

      const existing = markersRef.current;
      const seen = new Set();

      vehicles.forEach((vehicle) => {
        const colors = {
          active: '#10b981',
          idle: '#f59e0b',
          maintenance: '#ef4444',
          offline: '#6b7280',
        };

        if (!inSelectedCluster(vehicle.id)) {
          return;
        }

        const truckNum = extractTruckNumber(vehicle.id) ?? '';
        const buildIcon = (status) =>
          L.divIcon({
            html: `
            <div style="position: relative;">
              <div style="background: ${colors[status] || colors.offline}; color: #ffffff; border: 2px solid #ffffff; border-radius: 6px; padding: 2px 6px; min-width: 26px; height: 20px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.25);">
                ${truckNum}
              </div>
              <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${colors[status] || colors.offline}; margin: 0 auto; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));"></div>
            </div>
          `,
            className: 'custom-truck-icon',
            iconSize: [28, 28],
            iconAnchor: [14, 28],
          });

        let marker = existing[vehicle.id];
        if (!marker) {
          marker = L.marker(vehicle.position, {
            icon: buildIcon(vehicle.status),
            zIndexOffset: 1000,
            pane: 'markersPane',
          });
          marker.addTo(markersLayerRef.current || map);
          existing[vehicle.id] = marker;
          marker._status = vehicle.status;
          marker.on('click', async () => {
            setSelectedVehicle(vehicle);
            setShowVehicleCard(true);

            // Resolve and load IoT device info aligned with this vehicle
            try {
              const truckUUID = resolveTruckUUID(vehicle.id);
              const dev = devices.find((d) => d.truck_id === (truckUUID || vehicle.id));
              setSelectedDevice(dev || null);
              if (dev) {
                const statuses = deviceStatusEvents.filter((e) => e.device_id === dev.id);
                const latest =
                  statuses.sort((a, b) => new Date(b.reported_at) - new Date(a.reported_at))[0] ||
                  null;
                setSelectedDeviceStatus(latest);
              } else {
                setSelectedDeviceStatus(null);
              }
            } catch (e) {
              console.warn('Failed to resolve IoT device for vehicle:', vehicle?.id, e);
              setSelectedDevice(null);
              setSelectedDeviceStatus(null);
            }

            // Show live route for this vehicle
            try {
              if (liveRouteLineRef.current && map) {
                try {
                  map.removeLayer(liveRouteLineRef.current);
                } catch {}
                liveRouteLineRef.current = null;
              }

              const L = window.L || require('leaflet');
              const liveWindow = getCurrentShiftWindow();
              let routeHistory = vehicleRoutes[vehicle.id] || [];

              if (routeHistory.length <= 1) {
                const pts = getDummyRealRoutePoints?.() || [];
                const coords =
                  Array.isArray(pts) && pts.length > 1 ? pts.map((p) => [p.lat, p.lng]) : [];
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
                  pane: 'routesPane',
                }).addTo(map);

                if (liveRouteMarkersRef.current.start)
                  try {
                    map.removeLayer(liveRouteMarkersRef.current.start);
                  } catch {}
                if (liveRouteMarkersRef.current.end)
                  try {
                    map.removeLayer(liveRouteMarkersRef.current.end);
                  } catch {}

                const startIcon = L.divIcon({
                  html: `<div style="background:white;border:2px solid ${routeColor};border-radius:50%;width:14px;height:14px;"></div>`,
                  className: 'live-route-start',
                  iconSize: [14, 14],
                  iconAnchor: [7, 7],
                });
                const endIcon = L.divIcon({
                  html: `<div style="position:relative;"><div style="background:${routeColor};color:#fff;border:2px solid #fff;border-radius:6px;padding:2px 6px;min-width:20px;height:18px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:10px;box-shadow:0 2px 6px rgba(0,0,0,.25);">END</div><div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${routeColor};margin:0 auto;filter:drop-shadow(0 2px 2px rgba(0,0,0,.2));"></div></div>`,
                  className: 'live-route-end',
                  iconSize: [26, 26],
                  iconAnchor: [13, 26],
                });

                liveRouteMarkersRef.current.start = L.marker(routeHistory[0], {
                  icon: startIcon,
                  pane: 'routesPane',
                }).addTo(map);
                liveRouteMarkersRef.current.end = L.marker(routeHistory[routeHistory.length - 1], {
                  icon: endIcon,
                  pane: 'routesPane',
                }).addTo(map);

                try {
                  map.fitBounds(liveRouteLineRef.current.getBounds().pad(0.05));
                } catch {}
              }
            } catch (e) {
              console.warn('Failed to show live route:', e);
            }
          });
        } else {
          // Update position
          try {
            marker.setLatLng(vehicle.position);
          } catch {}
          // Update icon only if status changed (cheaper)
          if (marker._status !== vehicle.status) {
            try {
              marker.setIcon(buildIcon(vehicle.status));
              marker._status = vehicle.status;
            } catch {}
          }
        }

        // Ensure visible
        try {
          const el = marker.getElement?.();
          if (el) el.style.visibility = 'visible';
        } catch {}

        seen.add(vehicle.id);
      });

      // Remove markers that are no longer present
      Object.keys(existing).forEach((id) => {
        if (!seen.has(id)) {
          try {
            const m = existing[id];
            if (m && (map.hasLayer(m) || markersLayerRef.current?.hasLayer(m))) {
              (markersLayerRef.current || map).removeLayer(m);
            }
          } catch {}
          delete existing[id];
        }
      });
    }
  }, [map, vehicles, clusterSelections]);

  // Re-apply marker zoom styling whenever map or selection changes
  useEffect(() => {
    applyMarkerZoomStyling();
  }, [map, vehicles, clusterSelections]);

  // Handle focus via URL param ?focus=<truck>
  useEffect(() => {
    if (!map || vehicles.length === 0 || focusHandledRef.current) return;
    try {
      const params = new URLSearchParams(window.location.search || '');
      const focus = params.get('focus');
      if (!focus) return;
      const target =
        vehicles.find((v) => String(v.id) === focus) ||
        vehicles.find((v) => String(v.id).toLowerCase().includes(String(focus).toLowerCase()));
      if (!target) return;
      const marker = markersRef.current[target.id];
      if (marker) {
        try {
          marker.fire('click');
        } catch {}
        try {
          map.setView(target.position, Math.max(map.getZoom(), 16), { animate: true });
        } catch {}
      } else {
        // Fallback: set directly
        setSelectedVehicle(target);
        setShowVehicleCard(true);
        try {
          map.setView(target.position, Math.max(map.getZoom(), 16), { animate: true });
        } catch {}
      }
      focusHandledRef.current = true;
    } catch {}
  }, [map, vehicles]);

  const additionalControls = (
    <>
      <div className="border-l border-gray-300 pl-3 flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${isTrackingActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
        ></div>
        <span className="text-xs text-gray-700 font-medium">
          {isTrackingActive ? 'LIVE' : 'PAUSED'}
        </span>
      </div>
      <div className="border-l border-gray-300 pl-3 flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-green-500' : 'bg-red-500'}`}
        ></div>
        <span className="text-xs text-gray-700 font-medium">
          API {backendOnline ? 'Online' : 'Offline'}
        </span>
      </div>
      <div className="border-l border-gray-300 pl-3 flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${wsStatus === 'connected' ? 'bg-green-500' : wsStatus === 'connecting' || wsStatus === 'reconnecting' ? 'bg-yellow-500' : 'bg-red-500'}`}
        ></div>
        <span className="text-xs text-gray-700 font-medium">WS {wsStatus}</span>
      </div>

      {/* Filter Dropdown */}
      <div className="relative border-l border-gray-300 pl-3">
        <button
          onClick={() => setShowFilterDropdown(!showFilterDropdown)}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
          aria-label="Open filter options"
        >
          <FunnelIcon className="w-3 h-3" />
          Filter
        </button>

        {showFilterDropdown && (
          <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-48 z-50">
            <div className="text-xs font-medium text-gray-700 mb-2">Cluster (Truck No)</div>
            <div className="grid grid-cols-1 gap-2 text-xs">
              {['1-199', '200-399', '400-599', '600-799', '800-999'].map((range) => (
                <label key={range} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={clusterSelections.has(range)}
                    onChange={(e) => {
                      setClusterSelections((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(range);
                        else next.delete(range);
                        return next;
                      });
                    }}
                    disabled={loading}
                  />
                  <span>{range}</span>
                </label>
              ))}
            </div>
            <div className="mt-2 text-[10px] text-gray-500">Unchecked ranges are hidden</div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      <BaseTrackingMap
        onMapReady={onMapReady}
        additionalControls={additionalControls}
        showCompass={true}
        showMapStyleToggle={true}
        showAutoCenter={true}
        showFitRoutes={false}
      >
        {/* Vehicle Info Card */}
        {showVehicleCard && selectedVehicle && (
          <div
            className="absolute bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/50 p-6 w-96 max-h-[calc(100vh-200px)] overflow-y-auto z-50 transition-all duration-300 ease-out"
            style={{
              left: '24px', // More space from left edge
              top: '80px', // Below map controls
              maxHeight: 'calc(100vh - 240px)', // More space for controls
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%)',
              backdropFilter: 'blur(20px)',
              boxShadow:
                '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
            }}
          >
            {/* Card Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <TruckIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-xl">{selectedVehicle.id}</h4>
                  <p className="text-sm text-gray-500">Fleet Vehicle</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-4 py-2 rounded-xl text-sm font-semibold shadow-sm ${
                    selectedVehicle.status === 'active'
                      ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200'
                      : selectedVehicle.status === 'idle'
                        ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border border-yellow-200'
                        : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200'
                  }`}
                >
                  {selectedVehicle.status.toUpperCase()}
                </span>
                <button
                  onClick={() => {
                    setShowVehicleCard(false);
                    setSelectedVehicle(null);
                    // Clear route display
                    if (liveRouteLineRef.current && map) {
                      try {
                        map.removeLayer(liveRouteLineRef.current);
                      } catch {}
                      liveRouteLineRef.current = null;
                    }
                    if (liveRouteMarkersRef.current.start)
                      try {
                        map.removeLayer(liveRouteMarkersRef.current.start);
                      } catch {}
                    if (liveRouteMarkersRef.current.end)
                      try {
                        map.removeLayer(liveRouteMarkersRef.current.end);
                      } catch {}
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:shadow-md"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="text-blue-600 text-xs font-semibold uppercase tracking-wide">
                    Driver
                  </div>
                </div>
                <div className="font-semibold text-gray-900">{selectedVehicle.driver}</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="text-green-600 text-xs font-semibold uppercase tracking-wide">
                    Speed
                  </div>
                </div>
                <div className="font-semibold text-gray-900">{selectedVehicle.speed} km/h</div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="text-orange-600 text-xs font-semibold uppercase tracking-wide">
                    Fuel
                  </div>
                </div>
                <div className="font-semibold text-gray-900">{selectedVehicle.fuel}%</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-xl border border-purple-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="text-purple-600 text-xs font-semibold uppercase tracking-wide">
                    Signal
                  </div>
                </div>
                <div className="font-semibold text-gray-900">{selectedVehicle.signal}</div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="border-t border-gray-200/50 pt-6 space-y-4">
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <ClockIcon className="w-4 h-4 text-gray-500" />
                  <div className="text-gray-600 text-xs font-semibold uppercase tracking-wide">
                    Last Update
                  </div>
                </div>
                <div className="font-semibold text-gray-900">
                  {formatLastUpdate(selectedVehicle.lastUpdate)}
                </div>
              </div>
            </div>

            {/* Tire Pressure Display */}
            <div className="mt-6 pt-6 border-t border-gray-200/50">
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-slate-500 to-gray-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5zM8 15a1 1 0 01-2 0v-3a1 1 0 012 0v3zm4 0a1 1 0 01-2 0v-3a1 1 0 012 0v3z" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-900">Tire Monitoring</h5>
                    <p className="text-xs text-gray-500">Real-time pressure & temperature</p>
                  </div>
                </div>
                <TirePressureDisplay selectedTruckId={selectedVehicle?.id} />
              </div>
            </div>
          </div>
        )}
      </BaseTrackingMap>

      {/* Click outside to close filter dropdown */}
      {showFilterDropdown && (
        <div className="fixed inset-0 z-40" onClick={() => setShowFilterDropdown(false)} />
      )}
    </>
  );
};

export default LiveTrackingMapNew;
