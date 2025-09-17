/* eslint-disable no-empty, no-unused-vars, no-undef */
import React, { useEffect, useRef, useState } from 'react';
import {
  TruckIcon,
  MapPinIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  SignalIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  MapIcon,
} from '@heroicons/react/24/outline';
import 'leaflet/dist/leaflet.css';
import BORNEO_INDOBARA_GEOJSON from '../../data/geofance.js';
import { trucksAPI, FleetWebSocket } from '../../services/api.js';
import {
  getLiveTrackingData,
  getTruckRoute,
  generateGpsPositions,
  getDummyRealRoutePoints,
  getDummyRealRouteLastPoint,
} from '../../data/index.js';
import tirePressureDummy from '../../data/tirePressureEvents.js';

const LiveTrackingMap = ({ forceViewMode = null }) => {
  // Toggle backend usage. Set to false to use dummy data only.
  const USE_BACKEND = true;
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [legendVisible, setLegendVisible] = useState(true);
  const [mapStyle, setMapStyle] = useState('satellite');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Cluster filters by truck number (multi-select)
  const [clusterSelections, setClusterSelections] = useState(
    new Set(['1-199', '200-399', '400-599', '600-799', '800-999'])
  );

  // Route tracking states
  const [vehicleRoutes, setVehicleRoutes] = useState({});
  const [routeVisible, setRouteVisible] = useState({});
  const [isTrackingActive, setIsTrackingActive] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [routeColors] = useState([
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7',
    '#DDA0DD',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E9',
  ]);
  // View mode: 'live' (no lines) or 'history' (show lines)
  const [viewMode, setViewMode] = useState(forceViewMode ?? 'live');
  // History playback
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaybackPlaying, setIsPlaybackPlaying] = useState(false);
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState(500);
  // History day selection (06:00–16:00 window)
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  // History shift selection (day/night/custom)
  const [shiftMode, setShiftMode] = useState('day'); // 'day' | 'night' | 'custom'
  const [customStart, setCustomStart] = useState('06:00');
  const [customEnd, setCustomEnd] = useState('16:00');

  const getDayWindow = (dateStr) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      if (shiftMode === 'night') {
        // 16:00 same day to 06:00 next day
        const start = new Date(y, m - 1, d, 16, 0, 0, 0);
        const end = new Date(y, m - 1, d + 1, 6, 0, 0, 0);
        return { start, end };
      }
      if (shiftMode === 'custom') {
        const [sh, sm] = (customStart || '06:00').split(':').map(Number);
        const [eh, em] = (customEnd || '16:00').split(':').map(Number);
        let start = new Date(y, m - 1, d, sh || 0, sm || 0, 0, 0);
        let end = new Date(y, m - 1, d, eh || 0, em || 0, 0, 0);
        // If end <= start, assume it crosses midnight -> add one day to end
        if (end <= start) end = new Date(y, m - 1, d + 1, eh || 0, em || 0, 0, 0);
        return { start, end };
      }
      // default day shift 06:00–16:00
      const start = new Date(y, m - 1, d, 6, 0, 0, 0);
      const end = new Date(y, m - 1, d, 16, 0, 0, 0);
      return { start, end };
    } catch {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 0, 0, 0);
      return { start, end };
    }
  };

  // Current shift window (for Live): if now 06–16 use day today; if 16–24 use night today->tomorrow; if 00–06 use night yesterday->today
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
    // h < 6 -> night previous day
    return { start: new Date(y, m, d - 1, 16, 0, 0, 0), end: new Date(y, m, d, 6, 0, 0, 0) };
  };

  // Sync viewMode with URL hash (#history -> history mode) unless forced
  useEffect(() => {
    if (forceViewMode) return;
    try {
      if (typeof window !== 'undefined') {
        if (window.location.hash === '#history') {
          setViewMode('history');
        }
        const onHash = () => {
          setViewMode(window.location.hash === '#history' ? 'history' : 'live');
        };

        // --- Tire data helpers (live mode popup) ---
        const normalizeTruckId = (id) => String(id || '').toLowerCase();
        const getLatestTireData = async (truckId) => {
          try {
            const apiRes = await trucksAPI.getTirePressures(truckId);
            if (apiRes?.success && Array.isArray(apiRes.data) && apiRes.data.length > 0) {
              // Expecting array of { tire_no, pressure_kpa, temp_celsius }
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
          // Fallback to dummy: pick latest per tire_no for this truck
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
          return `
      <div class="space-y-1">
        ${pairs.join('')}
      </div>
    `;
        };
        window.addEventListener('hashchange', onHash);
        return () => window.removeEventListener('hashchange', onHash);
      }
    } catch {}
  }, [forceViewMode]);

  useEffect(() => {
    if (forceViewMode) return; // do not alter URL when mode is forced
    try {
      if (typeof window !== 'undefined') {
        if (viewMode === 'history') {
          if (window.location.hash !== '#history') window.location.hash = 'history';
        } else {
          const url = window.location.pathname + window.location.search;
          window.history.replaceState(null, '', url);
        }
      }
    } catch {}
  }, [viewMode, forceViewMode]);

  // Enforce external forceViewMode prop (in case it changes)
  useEffect(() => {
    if (forceViewMode && viewMode !== forceViewMode) {
      setViewMode(forceViewMode);
    }
  }, [forceViewMode]);

  const markersRef = useRef({});
  const routeLinesRef = useRef({});
  const manualRouteRef = useRef(null);
  const playbackMarkerRef = useRef(null);
  const liveRouteLineRef = useRef(null);
  const liveRouteMarkersRef = useRef({ start: null, end: null });
  const wsRef = useRef(null);
  const miningBoundsRef = useRef(null);
  const lastHideStateRef = useRef(null);
  const rafRef = useRef(null);
  const playbackTimerRef = useRef(null);

  // --- Geofence helpers & movement utilities ---
  // Extract primary polygon (first ring) as [lat, lng]
  const polygonLatLng = (
    BORNEO_INDOBARA_GEOJSON?.features?.[0]?.geometry?.coordinates?.[0] || []
  ).map(([lng, lat]) => [lat, lng]);

  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  // Haversine distance in meters between [lat, lng]
  const haversineMeters = (a, b) => {
    const R = 6371000; // m
    const dLat = toRad(b[0] - a[0]);
    const dLng = toRad(b[1] - a[1]);
    const lat1 = toRad(a[0]);
    const lat2 = toRad(b[0]);
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  };

  // --- Truck number helpers & cluster filtering ---
  const extractTruckNumber = (idOrName) => {
    if (!idOrName) return null;
    const m = String(idOrName).match(/(\d{1,4})/);
    return m ? parseInt(m[1], 10) : null;
  };

  const inSelectedCluster = (truckId) => {
    // If nothing selected, treat as show all
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
      const bounds = map.getBounds();
      const miningBounds = miningBoundsRef.current;
      // Scale mapping by zoom (tweak as needed)
      let scale = 1;
      if (zoom >= 16) scale = 1;
      else if (zoom >= 14) scale = 0.85;
      else if (zoom >= 12) scale = 0.7;
      else if (zoom >= 10) scale = 0.55;
      else scale = 0.4;

      // Hysteresis to prevent flicker: hide <= 5, show >= 8, in-between keep last state
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
        const wrapper = el.firstElementChild; // our custom HTML root
        if (hideAll) {
          el.style.visibility = 'hidden';
        } else {
          el.style.visibility = 'visible';
          if (wrapper) {
            // Scale only the inner wrapper; do not touch Leaflet's translate3d on the container
            wrapper.style.transform = `scale(${scale})`;
            wrapper.style.transformOrigin = 'center bottom';
          }
        }
      });

      rafRef.current = null;
    });
  };

  // Convert a move of meters with bearing to new [lat, lng]
  const moveByMeters = (start, distanceM, bearingDeg) => {
    const R = 6371000; // Earth radius in meters
    const brng = toRad(bearingDeg);
    const lat1 = toRad(start[0]);
    const lng1 = toRad(start[1]);
    const lat2 = Math.asin(
      Math.sin(lat1) + (distanceM / R) * Math.cos(brng) * Math.cos(lat1) + 0 // keep formula simple for small distances; this is sufficient for 10m steps
    );
    // For small distances, use equirectangular approximation for longitude delta
    const dLng = (distanceM / (R * Math.cos(lat1))) * Math.sin(brng);
    const lng2 = lng1 + dLng;
    return [toDeg(lat2), toDeg(lng2)];
  };

  // Point in polygon (ray casting), polygon is array of [lat, lng]
  const pointInPolygon = (pt, poly) => {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0],
        yi = poly[i][1];
      const xj = poly[j][0],
        yj = poly[j][1];
      const intersect =
        yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi + 1e-12) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // Centroid of polygon (simple average; adequate for local movement guidance)
  const polygonCentroid = (poly) => {
    if (!poly || poly.length === 0) return [0, 0];
    let sumLat = 0,
      sumLng = 0;
    poly.forEach(([lat, lng]) => {
      sumLat += lat;
      sumLng += lng;
    });
    return [sumLat / poly.length, sumLng / poly.length];
  };

  // Generate and initialize sample data if backend not available
  const initializeSampleData = async () => {
    console.log('🔄 Backend not available - initializing comprehensive dummy data');
    try {
      let liveTrackingData = getLiveTrackingData();
      console.log(`📊 Loaded ${liveTrackingData.length} vehicles from dummy data`);

      // If no dummy data available, synthesize a small demo fleet inside the geofence
      if (!liveTrackingData || liveTrackingData.length === 0) {
        console.warn('⚠️ Dummy data empty, synthesizing demo vehicles');
        // Prefer positioning along the dummy real route if available
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
              : polygonCentroid(polygonLatLng),
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

      // Build simple initial routes from generated positions; also align positions to route last points when available
      const routes = {};
      liveTrackingData = liveTrackingData.map((vehicle, idx) => {
        const routeData = getTruckRoute(vehicle.id, timeRange);
        if (routeData && routeData.length > 0) {
          routes[vehicle.id] = routeData;
          saveOfflineRoute(vehicle.id, routes[vehicle.id]);
          // Use last point of the route for the icon position
          const last = routeData[routeData.length - 1];
          return { ...vehicle, position: last };
        }
        // If no routeData, try dummy route helpers
        const mdLast = getDummyRealRouteLastPoint?.();
        if (mdLast && typeof mdLast.lat === 'number' && typeof mdLast.lng === 'number') {
          return { ...vehicle, position: [mdLast.lat, mdLast.lng] };
        }
        return vehicle;
      });

      setVehicleRoutes(routes);

      const initialRouteVisibility = {};
      liveTrackingData.forEach((vehicle) => {
        initialRouteVisibility[vehicle.id] = true;
      });
      setRouteVisible(initialRouteVisibility);

      console.log(
        `✅ Initialized ${liveTrackingData.length} vehicles with comprehensive dummy data`
      );
      return liveTrackingData;
    } catch (error) {
      console.error('❌ Failed to initialize dummy data:', error);
      return [];
    }
  };

  // Advanced route simulation for active trucks
  const simulateRealisticMovement = (vehicle, currentRoute) => {
    const zones = {
      loadingPoint: [115.58, -3.52],
      dumpingPoint: [115.61, -3.59],
      workshop: [115.59, -3.58],
      fuelStation: [115.575, -3.535],
      weighbridge: [115.585, -3.545],
    };

    // Determine next waypoint based on current load and position
    let targetZone;
    if (vehicle.load.includes('Empty')) {
      targetZone = zones.loadingPoint; // Go to loading area
    } else if (vehicle.load.includes('Coal')) {
      targetZone = zones.dumpingPoint; // Go to dumping area
    } else {
      targetZone = zones.workshop; // Go to workshop
    }

    // Calculate direction towards target
    const currentPos = vehicle.position;
    const deltaLat = (targetZone[0] - currentPos[0]) * 0.1;
    const deltaLng = (targetZone[1] - currentPos[1]) * 0.1;

    // Add road following behavior with curves
    const roadNoise = {
      lat: Math.sin(Date.now() / 10000) * 0.0002,
      lng: Math.cos(Date.now() / 8000) * 0.0003,
    };

    const newPosition = [
      currentPos[0] + deltaLat + roadNoise.lat,
      currentPos[1] + deltaLng + roadNoise.lng,
    ];

    // Calculate realistic heading based on movement
    const bearing = (Math.atan2(deltaLng, deltaLat) * 180) / Math.PI;
    const newHeading = (bearing + 360) % 360;

    return {
      position: newPosition,
      heading: Math.round(newHeading),
      speed: Math.max(15, Math.min(65, vehicle.speed + (Math.random() - 0.5) * 8)),
    };
  };

  // Load route history from database with fallback
  const loadRouteHistory = async (truckId, timeRange = '24h', windowOverride = null) => {
    try {
      console.log(`📍 Loading route history for ${truckId} (${timeRange})`);

      const { start, end } = windowOverride || getDayWindow(selectedDate);
      const params = {
        timeRange: timeRange,
        limit: timeRange === 'shift' ? 1000 : 200,
        minSpeed: 0,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      };

      // Prefer numeric ID if present (some backends expect truck number only)
      const numericId = (String(truckId).match(/\d{1,4}/) || [])[0];
      const primaryId = numericId || truckId;
      // First attempt with primaryId
      let response = await trucksAPI.getLocationHistory(primaryId, params);

      const toPoints = (records) =>
        (records || [])
          .filter((record) => {
            try {
              const t = new Date(
                record.timestamp ||
                  record.recorded_at ||
                  record.created_at ||
                  record.time ||
                  record.gps_time ||
                  null
              );
              if (!isNaN(t)) {
                return t >= start && t <= end;
              }
            } catch {}
            return true;
          })
          .map((record) => [parseFloat(record.latitude), parseFloat(record.longitude)])
          .filter((pt) => !isNaN(pt[0]) && !isNaN(pt[1]) && pt[0] !== 0 && pt[1] !== 0);

      if (response.success && response.data) {
        // Convert database records to route points (filter by day window if timestamp present)
        let routePoints = toPoints(response.data);

        // If empty and we didn't already use truckId, try the original ID as fallback
        if ((!routePoints || routePoints.length === 0) && primaryId !== truckId) {
          console.log(`🔁 Retrying history with raw ID: ${truckId}`);
          response = await trucksAPI.getLocationHistory(truckId, params);
          if (response.success && response.data) {
            routePoints = toPoints(response.data);
          }
        }

        // If still empty, retry broader search without time window
        if (!routePoints || routePoints.length === 0) {
          console.log('🔁 Retrying history without time window constraints');
          const { startTime, endTime, ...noWindow } = params;
          response = await trucksAPI.getLocationHistory(truckId, noWindow);
          if (response.success && response.data) {
            routePoints = toPoints(response.data);
          }
        }

        // If backend returns empty for window, fallback to offline stored route
        if (!routePoints || routePoints.length === 0) {
          const offlineRoute = getOfflineRoute(truckId);
          if (offlineRoute.length > 0) {
            console.log(
              `📱 Backend empty, using offline route for ${truckId}: ${offlineRoute.length} points`
            );
            return offlineRoute;
          }
        }
        console.log(`✅ Loaded ${routePoints.length} route points for ${truckId}`);
        return routePoints;
      }

      return [];
    } catch (error) {
      console.error(`❌ Failed to load route history for ${truckId}:`, error);

      // Try to get from offline storage
      const offlineRoute = getOfflineRoute(truckId);
      if (offlineRoute.length > 0) {
        console.log(`📱 Using offline route for ${truckId}: ${offlineRoute.length} points`);
        return offlineRoute;
      }

      return [];
    }
  };

  // Load all vehicles route history from database with fallback
  const loadAllRoutesHistory = async (vehicleList) => {
    try {
      console.log('📍 Loading route history for all vehicles...');

      const routePromises = vehicleList.map(async (vehicle) => {
        const routeHistory = await loadRouteHistory(vehicle.id, timeRange);
        return {
          vehicleId: vehicle.id,
          routeHistory: routeHistory,
        };
      });

      const routeResults = await Promise.all(routePromises);
      const routesData = {};

      routeResults.forEach((result) => {
        routesData[result.vehicleId] = result.routeHistory;
      });

      console.log('✅ All route history loaded');
      return routesData;
    } catch (error) {
      console.error('❌ Failed to load routes history:', error);
      return {};
    }
  };

  // Offline route storage utilities
  const saveOfflineRoute = (vehicleId, routeData) => {
    try {
      const offlineRoutes = JSON.parse(localStorage.getItem('offlineRoutes') || '{}');
      offlineRoutes[vehicleId] = {
        route: routeData,
        timestamp: new Date().toISOString(),
        points: routeData.length,
      };
      localStorage.setItem('offlineRoutes', JSON.stringify(offlineRoutes));
    } catch (error) {
      console.error('Failed to save offline route:', error);
    }
  };

  const getOfflineRoute = (vehicleId) => {
    try {
      const offlineRoutes = JSON.parse(localStorage.getItem('offlineRoutes') || '{}');
      return offlineRoutes[vehicleId]?.route || [];
    } catch (error) {
      console.error('Failed to get offline route:', error);
      return [];
    }
  };
  const calculateRouteDistance = (routePoints) => {
    if (routePoints.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < routePoints.length; i++) {
      const lat1 = routePoints[i - 1][0];
      const lng1 = routePoints[i - 1][1];
      const lat2 = routePoints[i][0];
      const lng2 = routePoints[i][1];

      const R = 6371; // Earth's radius in kilometers
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLng = ((lng2 - lng1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      totalDistance += distance;
    }

    return totalDistance;
  };

  // Initialize map
  useEffect(() => {
    // Re-entrancy guard for StrictMode/hot-reload
    const initGuardRef = { current: false };
    const initializeMap = async () => {
      // Guard against double-invocation in React Strict Mode and hot reloads
      if (
        !mapRef.current ||
        map ||
        initGuardRef.current ||
        (mapRef.current && mapRef.current._leaflet_id) ||
        (mapRef.current &&
          mapRef.current.classList &&
          mapRef.current.classList.contains('leaflet-container')) ||
        (mapRef.current &&
          mapRef.current.querySelector &&
          mapRef.current.querySelector('.leaflet-pane'))
      ) {
        return;
      }
      if (mapRef.current && !map) {
        try {
          // mark initializing before awaiting
          initGuardRef.current = true;
          const L = await import('leaflet');

          // Initialize map centered on PT Borneo Indobara geofence area
          const mapInstance = L.default.map(mapRef.current, {
            center: [-3.58, 115.6],
            zoom: 13,
            zoomControl: true,
            scrollWheelZoom: true,
            doubleClickZoom: true,
            dragging: true,
            touchZoom: true,
            boxZoom: true,
            keyboard: true,
          });

          mapInstance.getContainer().style.outline = 'none';

          // Ensure proper layer ordering to prevent marker hover movement
          try {
            const routesPane = mapInstance.createPane('routesPane');
            routesPane.style.zIndex = 399;
            routesPane.style.pointerEvents = 'auto';
            const markersPane = mapInstance.createPane('markersPane');
            markersPane.style.zIndex = 400; // above routes
            markersPane.style.pointerEvents = 'auto';
          } catch (e) {
            console.warn('Unable to create custom panes:', e);
          }

          // Add tile layers
          const satelliteLayer = L.default.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            {
              attribution: 'Tiles &copy; Esri',
              keepBuffer: 3,
              updateWhenZooming: true,
              updateWhenIdle: true,
            }
          );

          const osmLayer = L.default.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
              attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              keepBuffer: 3,
              updateWhenZooming: true,
              updateWhenIdle: true,
            }
          );

          satelliteLayer.addTo(mapInstance);
          mapInstance.satelliteLayer = satelliteLayer;
          mapInstance.osmLayer = osmLayer;

          // Add geofence
          if (BORNEO_INDOBARA_GEOJSON && BORNEO_INDOBARA_GEOJSON.features) {
            L.default
              .geoJSON(BORNEO_INDOBARA_GEOJSON, {
                style: {
                  color: '#3b82f6',
                  weight: 3,
                  opacity: 0.8,
                  fillColor: '#3b82f6',
                  fillOpacity: 0.1,
                  dashArray: '10, 10',
                },
              })
              .addTo(mapInstance);
          }

          // Compute mining area bounds for zoom-based hiding
          try {
            const bounds = L.default.latLngBounds(polygonLatLng);
            miningBoundsRef.current = bounds;
          } catch (e) {
            console.warn('Unable to compute mining bounds:', e);
          }

          // Apply marker styling on zoom/move (continuous + end) and once after init
          mapInstance.on('zoom', () => applyMarkerZoomStyling());
          mapInstance.on('zoomend', () => applyMarkerZoomStyling());
          mapInstance.on('move', () => applyMarkerZoomStyling());
          mapInstance.on('moveend', () => applyMarkerZoomStyling());

          setMap(mapInstance);
        } catch (error) {
          console.error('Error initializing map:', error);
        } finally {
          // allow future inits only if map wasn't created for some reason
          // if map exists, effect won't run again due to dependency []
        }
      }
    };

    initializeMap();
  }, []);

  // Render manual route from make_dummy_real_route.md via helpers (History only)
  useEffect(() => {
    if (!map) return;
    if (viewMode !== 'history') {
      // remove if exists
      if (manualRouteRef.current) {
        try {
          map.removeLayer(manualRouteRef.current.line);
        } catch (e) {}
        try {
          map.removeLayer(manualRouteRef.current.start);
        } catch (e) {}
        try {
          map.removeLayer(manualRouteRef.current.end);
        } catch (e) {}
        manualRouteRef.current = null;
      }
      return;
    }
    try {
      const pts = getDummyRealRoutePoints();
      const coords = Array.isArray(pts) && pts.length > 1 ? pts.map((p) => [p.lat, p.lng]) : [];

      if (coords.length > 1) {
        const L = window.L || require('leaflet');

        // Remove previous manual route if exists
        if (manualRouteRef.current) {
          try {
            map.removeLayer(manualRouteRef.current.line);
          } catch (e) {}
          try {
            map.removeLayer(manualRouteRef.current.start);
          } catch (e) {}
          try {
            map.removeLayer(manualRouteRef.current.end);
          } catch (e) {}
          manualRouteRef.current = null;
        }

        const color = '#2563eb'; // indigo-600
        const line = L.polyline(coords, {
          color,
          weight: 4,
          opacity: 0.95,
          lineJoin: 'round',
          lineCap: 'round',
          pane: 'routesPane',
        }).addTo(map);

        const startIcon = L.divIcon({
          html: `<div style="background:white;border:2px solid ${color};border-radius:50%;width:14px;height:14px;"></div>`,
          className: 'manual-route-start',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        // Use truck-style icon shape for END marker (visual consistency)
        const endIcon = L.divIcon({
          html: `
            <div style="position: relative;">
              <div style="
                background: ${color};
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
                font-size: 11px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.25);
              ">
                END
              </div>
              <div style="
                width: 0; height: 0;
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-top: 8px solid ${color};
                margin: 0 auto;
                filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));
              "></div>
            </div>
          `,
          className: 'manual-route-end',
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        });

        const start = L.marker(coords[0], { icon: startIcon, pane: 'routesPane' })
          .addTo(map)
          .bindTooltip('Start', { direction: 'top' });
        const end = L.marker(coords[coords.length - 1], { icon: endIcon, pane: 'routesPane' })
          .addTo(map)
          .bindTooltip('End', { direction: 'top' });

        manualRouteRef.current = { line, start, end };

        try {
          map.fitBounds(line.getBounds(), { padding: [40, 40] });
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Failed to render manual route from markdown:', err);
    }
  }, [map, viewMode]);

  // Invalidate map size when sidebar visibility changes to avoid right-edge clipping
  useEffect(() => {
    if (!map) return;
    // Delay to allow CSS transition to complete before recalculating map size
    const t = setTimeout(() => {
      try {
        map.invalidateSize({ animate: false });
      } catch (e) {}
    }, 250);
    return () => clearTimeout(t);
  }, [map, sidebarVisible]);

  // Invalidate map size on window resize
  useEffect(() => {
    if (!map) return;
    const onResize = () => {
      try {
        map.invalidateSize({ animate: false });
      } catch (e) {}
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [map]);

  // Load truck data and route history
  useEffect(() => {
    const loadTruckData = async () => {
      try {
        setLoading(true);

        // In demo mode, skip backend entirely
        if (!USE_BACKEND) {
          const sampleData = await initializeSampleData();
          setVehicles(sampleData);
          setError(null);
          return;
        }

        // Load truck data from API
        const response = await trucksAPI.getRealTimeLocations();

        if (response.success && response.data) {
          // Convert GeoJSON to vehicle format
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

            // Load route history for each vehicle from database
            const routesData = await loadAllRoutesHistory(vehicleData);
            setVehicleRoutes(routesData);

            // Initialize route visibility
            const initialRouteVisibility = {};
            vehicleData.forEach((vehicle) => {
              initialRouteVisibility[vehicle.id] = true;
            });
            setRouteVisible(initialRouteVisibility);
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

    // Only setup WebSocket when using backend
    if (USE_BACKEND) {
      wsRef.current = new FleetWebSocket();
      try {
        wsRef.current.connect();

        // Common handler for truck updates
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

            // Update route tracking for moved vehicles (real-time from database)
            if (isTrackingActive) {
              vehicleData.forEach((vehicle) => {
                if (vehicle.status === 'active' && vehicle.speed > 0) {
                  setVehicleRoutes((prev) => {
                    const currentRoute = prev[vehicle.id] || [];
                    const newPosition = vehicle.position;
                    const lastPosition = currentRoute[currentRoute.length - 1];

                    const shouldAdd =
                      !lastPosition ||
                      Math.abs(lastPosition[0] - newPosition[0]) > 0.0001 ||
                      Math.abs(lastPosition[1] - newPosition[1]) > 0.0001;

                    if (shouldAdd) {
                      const newRoute = [...currentRoute, newPosition];
                      const limitedRoute = newRoute.slice(-200);
                      saveOfflineRoute(vehicle.id, limitedRoute);
                      return { ...prev, [vehicle.id]: limitedRoute };
                    }
                    return prev;
                  });
                }
              });
            }
          } else if (Array.isArray(data) && data.length === 0) {
            console.log('📡 WebSocket update empty - keeping current vehicles');
          }
        };

        // Subscribe to truck location updates on both possible channels
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
  }, [timeRange]);

  // Cleanup on unmount: remove map and disconnect WebSocket
  useEffect(() => {
    return () => {
      try {
        if (wsRef.current) wsRef.current.disconnect();
      } catch {}
      try {
        if (map) map.remove();
      } catch {}
    };
  }, []);

  // ... (rest of the code remains the same)
  // Safety: if after loading there are still no vehicles, synthesize demo data
  useEffect(() => {
    const backfillIfEmpty = async () => {
      if (!loading && vehicles.length === 0) {
        console.log('ℹ️ Vehicles still empty after load, synthesizing demo fleet');
        const sampleData = await initializeSampleData();
        setVehicles(sampleData);
      }
    };
    backfillIfEmpty();
  }, [loading]);

  // Update markers and routes when data changes
  useEffect(() => {
    if (map && vehicles.length > 0) {
      const L = window.L || require('leaflet');

      // Clear existing markers and routes
      Object.values(markersRef.current).forEach((marker) => {
        if (marker && map.hasLayer(marker)) {
          map.removeLayer(marker);
        }
      });

      Object.values(routeLinesRef.current).forEach((routeLine) => {
        if (routeLine && map.hasLayer(routeLine)) {
          map.removeLayer(routeLine);
        }
      });

      markersRef.current = {};
      routeLinesRef.current = {};

      // Add vehicle markers and routes
      vehicles.forEach((vehicle, index) => {
        const colors = {
          active: '#10b981',
          idle: '#f59e0b',
          maintenance: '#ef4444',
          offline: '#6b7280',
        };

        // Skip if not in selected numeric cluster
        if (!inSelectedCluster(vehicle.id)) {
          return;
        }

        // Create custom rectangular-with-pointer marker with truck number
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
          // Anchor at bottom-center so the pointer tip sits exactly on the coordinate
          iconAnchor: [14, 28],
        });

        const marker = L.marker(vehicle.position, {
          icon,
          zIndexOffset: 1000,
          pane: 'markersPane',
        }).addTo(map);
        markersRef.current[vehicle.id] = marker;
        // Ensure visibility in case zoom hysteresis previously hid markers
        try {
          const el = marker.getElement?.();
          if (el) el.style.visibility = 'visible';
        } catch {}

        // Enhanced popup (live: add tire info; history: keep concise)
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
          // In history mode, reset playback to start for this vehicle
          if (viewMode === 'history') {
            setIsPlaybackPlaying(false);
            setPlaybackIndex(0);
          }
          // On live mode, augment popup with tire info
          if (viewMode === 'live') {
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

            // Live mode: show this vehicle's recent route on demand
            try {
              // Clear previous live route if exists
              if (liveRouteLineRef.current && map) {
                try {
                  map.removeLayer(liveRouteLineRef.current);
                } catch {}
                liveRouteLineRef.current = null;
              }
              // Ensure Leaflet reference in this scope
              const L = window.L || require('leaflet');
              // Load route using current live shift window
              const liveWindow = getCurrentShiftWindow();
              console.log(
                '🔎 Live click load route for',
                vehicle.id,
                'window',
                liveWindow.start.toISOString(),
                '->',
                liveWindow.end.toISOString()
              );
              let routeHistory = await loadRouteHistory(vehicle.id, 'shift', liveWindow);
              // Fallback to in-memory tracked route if backend/offline empty
              if (!routeHistory || routeHistory.length <= 1) {
                const mem = vehicleRoutes[vehicle.id] || [];
                if (mem.length > 1) routeHistory = mem;
              }
              // Final fallback: use manual/dummy route path if available
              if (!routeHistory || routeHistory.length <= 1) {
                try {
                  const pts = getDummyRealRoutePoints?.() || [];
                  const coords =
                    Array.isArray(pts) && pts.length > 1 ? pts.map((p) => [p.lat, p.lng]) : [];
                  if (coords.length > 1) {
                    console.log('🧩 Using dummy/manual route fallback for live click');
                    routeHistory = coords;
                  }
                } catch {}
              }
              if (Array.isArray(routeHistory) && routeHistory.length > 1) {
                const routeColor = '#2563eb'; // blue-600
                liveRouteLineRef.current = L.polyline(routeHistory, {
                  color: routeColor,
                  weight: 3,
                  opacity: 0.9,
                  smoothFactor: 2,
                  lineJoin: 'round',
                  lineCap: 'round',
                  pane: 'routesPane',
                }).addTo(map);
                // Draw start/end markers for clarity
                try {
                  const startPt = routeHistory[0];
                  const endPt = routeHistory[routeHistory.length - 1];
                  // Clean previous markers
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
                    html: `<div style=\"position:relative;\"><div style=\"background:${routeColor};color:#fff;border:2px solid #fff;border-radius:6px;padding:2px 6px;min-width:20px;height:18px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:10px;box-shadow:0 2px 6px rgba(0,0,0,.25);\">END</div><div style=\"width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${routeColor};margin:0 auto;filter:drop-shadow(0 2px 2px rgba(0,0,0,.2));\"></div></div>`,
                    className: 'live-route-end',
                    iconSize: [26, 26],
                    iconAnchor: [13, 26],
                  });
                  liveRouteMarkersRef.current.start = L.marker(startPt, {
                    icon: startIcon,
                    pane: 'routesPane',
                  }).addTo(map);
                  liveRouteMarkersRef.current.end = L.marker(endPt, {
                    icon: endIcon,
                    pane: 'routesPane',
                  }).addTo(map);
                } catch {}
                try {
                  map.fitBounds(liveRouteLineRef.current.getBounds().pad(0.05));
                } catch {}
              } else {
                // No route available – show a tiny one-time notice near the marker
                try {
                  marker
                    .bindTooltip('No route data for current shift', {
                      direction: 'top',
                      opacity: 0.8,
                      offset: [0, -20],
                    })
                    .openTooltip();
                  setTimeout(() => {
                    try {
                      marker.closeTooltip();
                    } catch {}
                  }, 1800);
                } catch {}
              }
            } catch (e) {
              console.warn('Failed to show live on-demand route:', e);
            }
          }
        });

        // Add route line if exists and visible (only in history mode)
        const routeHistory = vehicleRoutes[vehicle.id] || [];
        if (
          viewMode === 'history' &&
          routeHistory.length > 1 &&
          routeVisible[vehicle.id] !== false
        ) {
          const routeColor = routeColors[index % routeColors.length];

          // Create route line
          const routeLine = L.polyline(routeHistory, {
            color: routeColor,
            weight: 3,
            opacity: 0.9,
            smoothFactor: 2,
            lineJoin: 'round',
            lineCap: 'round',
            dashArray: vehicle.status === 'active' ? undefined : '10, 10',
            pane: 'routesPane',
          }).addTo(map);

          routeLinesRef.current[vehicle.id] = routeLine;

          // Add route start marker
          if (routeHistory.length > 0) {
            const startIcon = L.divIcon({
              html: `
                <div style="
                  background: white;
                  border: 2px solid ${routeColor};
                  border-radius: 50%;
                  width: 16px;
                  height: 16px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                ">
                  <div style="
                    background: ${routeColor};
                    border-radius: 50%;
                    width: 8px;
                    height: 8px;
                  "></div>
                </div>
              `,
              className: 'route-start-marker',
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            });

            L.marker(routeHistory[0], { icon: startIcon })
              .addTo(map)
              .bindTooltip(`${vehicle.id} - Route Start (${routeHistory.length} points)`, {
                permanent: false,
                direction: 'top',
              });
          }

          // Add route info tooltip
          routeLine.bindTooltip(
            `
            <div class="text-sm">
              <strong>${vehicle.id} Route</strong><br/>
              Points: ${routeHistory.length}<br/>
              Distance: ~${calculateRouteDistance(routeHistory).toFixed(1)} km<br/>
              Status: ${vehicle.status.toUpperCase()}
            </div>
          `,
            {
              sticky: true,
            }
          );
        }
      });
    }
  }, [map, vehicles, routeVisible, routeColors, vehicleRoutes, clusterSelections, viewMode]);

  // Re-apply marker zoom styling whenever map or selection changes
  useEffect(() => {
    applyMarkerZoomStyling();
  }, [map, vehicles, clusterSelections]);

  // Geofence-aware smooth movement: ~1 meter every 1 second with gentle heading drift (≈3.6 km/h)
  useEffect(() => {
    if (!isTrackingActive) return;
    const centroid = polygonCentroid(polygonLatLng);
    const interval = setInterval(() => {
      setVehicles((prevVehicles) =>
        prevVehicles.map((vehicle) => {
          if (vehicle.status !== 'active') return vehicle;
          const currentRoute = vehicleRoutes[vehicle.id] || [];
          const lastPos = currentRoute[currentRoute.length - 1] || vehicle.position;
          const baseBearing = vehicle.heading ?? 90;
          // Apply very small random drift and heading inertia for smoother turns
          const rawDrift = (Math.random() - 0.5) * 2; // -1..+1 deg
          const targetBearing = baseBearing + rawDrift;
          const nextBearing = baseBearing + (targetBearing - baseBearing) * 0.2; // inertia
          const stepM = 1; // 1m per second

          let nextPos = moveByMeters(lastPos, stepM, nextBearing);
          if (!pointInPolygon(nextPos, polygonLatLng)) {
            const dy = centroid[0] - lastPos[0];
            const dx = centroid[1] - lastPos[1];
            const bearingToCentroid = (Math.atan2(dx, dy) * 180) / Math.PI;
            nextPos = moveByMeters(lastPos, stepM, bearingToCentroid);
            if (!pointInPolygon(nextPos, polygonLatLng)) {
              nextPos = moveByMeters(lastPos, stepM, (baseBearing + 180) % 360);
            }
          }

          setVehicleRoutes((prev) => {
            const current = prev[vehicle.id] || [];
            const last = current[current.length - 1] || lastPos;
            const moved = haversineMeters(last, nextPos);
            if (moved >= 0.5) {
              // add points more frequently for smoother polyline
              const limited = [...current, nextPos].slice(-200);
              saveOfflineRoute(vehicle.id, limited);
              return { ...prev, [vehicle.id]: limited };
            }
            return prev;
          });

          return {
            ...vehicle,
            position: nextPos,
            heading: (nextBearing + 360) % 360,
            speed: 3.6, // ≈ 1 m/s
            lastUpdate: new Date(),
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [isTrackingActive, vehicleRoutes, polygonLatLng]);

  // Refresh a single vehicle's route history from backend or offline storage
  const refreshVehicleRoute = async (vehicleId, range) => {
    try {
      const routeHistory = await loadRouteHistory(vehicleId, range);
      setVehicleRoutes((prev) => ({
        ...prev,
        [vehicleId]: routeHistory,
      }));
      if (routeHistory.length > 0) {
        saveOfflineRoute(vehicleId, routeHistory);
      }
      console.log(`✅ Route refreshed for ${vehicleId}: ${routeHistory.length} points`);
    } catch (error) {
      console.error(`❌ Failed to refresh route for ${vehicleId}:`, error);
      const offlineRoute = getOfflineRoute(vehicleId);
      if (offlineRoute.length > 0) {
        setVehicleRoutes((prev) => ({
          ...prev,
          [vehicleId]: offlineRoute,
        }));
        console.log(`📱 Loaded offline route for ${vehicleId}: ${offlineRoute.length} points`);
      }
    }
  };

  // Handle time range change
  const handleTimeRangeChange = async (newRange) => {
    setTimeRange(newRange);
    setLoading(true);

    try {
      const routesData = await loadAllRoutesHistory(vehicles);
      setVehicleRoutes(routesData);
    } catch (error) {
      console.error('Failed to change time range:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle selectedDate change (reload routes for the day window)
  useEffect(() => {
    if (viewMode !== 'history') return;
    const reload = async () => {
      setLoading(true);
      try {
        const routesData = await loadAllRoutesHistory(vehicles);
        setVehicleRoutes(routesData);
      } catch (e) {
        console.error('Failed to reload routes for date/shift:', e);
      } finally {
        setLoading(false);
      }
    };
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, shiftMode, customStart, customEnd]);

  // Toggle route visibility
  const toggleRouteVisibility = (vehicleId) => {
    setRouteVisible((prev) => ({
      ...prev,
      [vehicleId]: !prev[vehicleId],
    }));

    // Toggle route line visibility on map
    const routeLine = routeLinesRef.current[vehicleId];
    if (routeLine && map) {
      if (routeVisible[vehicleId]) {
        map.removeLayer(routeLine);
      } else {
        map.addLayer(routeLine);
      }
    }
  };

  // Clear all routes
  const clearAllRoutes = () => {
    setVehicleRoutes({});
    Object.values(routeLinesRef.current).forEach((routeLine) => {
      if (routeLine && map && map.hasLayer(routeLine)) {
        map.removeLayer(routeLine);
      }
    });
    routeLinesRef.current = {};
  };

  // Toggle tracking
  const toggleTracking = () => {
    setIsTrackingActive(!isTrackingActive);
  };

  // Helper functions
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'idle':
        return 'text-yellow-600 bg-yellow-100';
      case 'maintenance':
        return 'text-red-600 bg-red-100';
      case 'offline':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatLastUpdate = (date) => {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const focusOnVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    if (map) {
      map.setView(vehicle.position, 15);
    }
  };

  const resetMapView = () => {
    setSelectedVehicle(null);
    if (map) {
      map.setView([-3.58, 115.6], 13);
    }
  };

  // --- History playback helpers ---
  const hasHistory = (vehicleId) => {
    const pts = vehicleRoutes[vehicleId] || [];
    return Array.isArray(pts) && pts.length > 1;
  };

  const createOrUpdatePlaybackMarker = (latlng) => {
    if (!map || !latlng) return;
    const L = window.L || require('leaflet');
    if (!playbackMarkerRef.current) {
      const icon = L.divIcon({
        html: `<div style="background:#111827;color:#fff;border:2px solid #fff;border-radius:6px;padding:2px 6px;box-shadow:0 2px 6px rgba(0,0,0,.3);">▶</div><div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid #111827;margin:0 auto;"></div>`,
        className: 'playback-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });
      playbackMarkerRef.current = L.marker(latlng, {
        icon,
        zIndexOffset: 1200,
        pane: 'markersPane',
      }).addTo(map);
    } else {
      try {
        playbackMarkerRef.current.setLatLng(latlng);
      } catch {}
    }
  };

  const startPlayback = () => {
    if (!selectedVehicle || !hasHistory(selectedVehicle.id)) return;
    setIsPlaybackPlaying(true);
    if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    playbackTimerRef.current = setInterval(() => {
      setPlaybackIndex((i) => {
        const max = (vehicleRoutes[selectedVehicle.id] || []).length - 1;
        if (i >= max) return max; // stop at end; controlled below
        return i + 1;
      });
    }, playbackSpeedMs);
  };

  const pausePlayback = () => {
    setIsPlaybackPlaying(false);
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
  };

  const stopPlayback = () => {
    pausePlayback();
    setPlaybackIndex(0);
    // keep marker at start
    const pts = selectedVehicle ? vehicleRoutes[selectedVehicle.id] || [] : [];
    if (pts.length > 0) createOrUpdatePlaybackMarker(pts[0]);
  };

  // Update playback timer when speed changes
  useEffect(() => {
    if (!isPlaybackPlaying) return;
    // restart timer with new speed
    pausePlayback();
    startPlayback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbackSpeedMs]);

  // Drive playback marker on index change or vehicle change
  useEffect(() => {
    if (viewMode !== 'history') return;
    const v = selectedVehicle;
    if (!v) return;
    const pts = vehicleRoutes[v.id] || [];
    if (pts.length === 0) return;
    const idx = Math.min(playbackIndex, pts.length - 1);
    const latlng = pts[idx];
    createOrUpdatePlaybackMarker(latlng);
    // Stop at end
    if (isPlaybackPlaying && idx >= pts.length - 1) {
      pausePlayback();
    }
  }, [playbackIndex, selectedVehicle, vehicleRoutes, viewMode, isPlaybackPlaying]);

  // Cleanup playback marker/timer on unmount or when switching away from history
  useEffect(() => {
    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      if (playbackMarkerRef.current && map) {
        try {
          map.removeLayer(playbackMarkerRef.current);
        } catch {}
        playbackMarkerRef.current = null;
      }
    };
  }, [map]);

  return (
    <div className="h-full flex">
      {/* Toggle Button */}
      <button
        onClick={() => setSidebarVisible(!sidebarVisible)}
        className={`fixed top-1/2 -translate-y-1/2 z-40 bg-white hover:bg-gray-50 border border-gray-300 shadow-lg transition-all duration-300 flex items-center rounded-r-lg px-2 py-3 ${
          sidebarVisible ? 'left-80' : 'left-72'
        }`}
        style={{
          zIndex: 999,
          left: sidebarVisible ? '605px' : '288px', // Tested position - 605px when sidebar open
        }}
        title={sidebarVisible ? 'Hide Vehicle List' : 'Show Vehicle List'}
      >
        <svg
          className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${
            sidebarVisible ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      {/* Sidebar - Minimal with filters only (no list, no scroll) */}
      <div
        className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
          sidebarVisible ? 'w-80' : 'w-0 overflow-hidden'
        }`}
      >
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h4 className="text-lg font-semibold text-gray-900">Filters</h4>
          {/* Date filter (History only) */}
          {viewMode === 'history' && (
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Date (06:00 – 16:00)
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full mb-2 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={loading}
              />
              {/* Shift selector */}
              <label className="block text-xs font-medium text-gray-700 mb-1">Shift</label>
              <select
                value={shiftMode}
                onChange={(e) => setShiftMode(e.target.value)}
                className="w-full mb-2 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="day">Day (06:00–16:00)</option>
                <option value="night">Night (16:00–06:00)</option>
                <option value="custom">Custom</option>
              </select>
              {shiftMode === 'custom' && (
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="block text-[10px] text-gray-600 mb-0.5">Start</label>
                    <input
                      type="time"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-600 mb-0.5">End</label>
                    <input
                      type="time"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Cluster Filter */}
          <div className="mt-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Cluster (Truck No)
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
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
            <div className="mt-1 text-[10px] text-gray-500">
              Unchecked ranges are hidden. Leave all unchecked to show all.
            </div>
          </div>
          {/* Tracking status */}
          <div className="mt-3 flex items-center gap-1 text-xs text-gray-600">
            <div
              className={`w-2 h-2 rounded-full ${isTrackingActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}
            ></div>
            {isTrackingActive ? 'Live Tracking Active' : 'Tracking Paused'}
            {loading && <span className="text-blue-600 ml-2">Syncing...</span>}
          </div>
        </div>
        <div className="flex-1" />
      </div>

      {/* Map Area */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="absolute inset-0 w-full h-full" style={{ cursor: 'grab' }} />

        {/* Map Controls */}
        <div
          className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3"
          style={{ zIndex: 1000 }}
        >
          <div className="flex items-center gap-3">
            {/* Map Style Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setMapStyle('osm');
                  if (map) {
                    map.removeLayer(map.satelliteLayer);
                    map.addLayer(map.osmLayer);
                  }
                }}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  mapStyle === 'osm'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Map
              </button>
              <button
                onClick={() => {
                  setMapStyle('satellite');
                  if (map) {
                    map.removeLayer(map.osmLayer);
                    map.addLayer(map.satelliteLayer);
                  }
                }}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  mapStyle === 'satellite'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Satellite
              </button>
            </div>

            {/* Route Display Controls - only in history mode */}
            {viewMode === 'history' && (
              <div className="border-l border-gray-300 pl-3 flex items-center gap-2">
                <span className="text-xs text-gray-600">Routes:</span>
                <button
                  onClick={() => {
                    vehicles.forEach((vehicle) => {
                      if (!routeVisible[vehicle.id]) {
                        toggleRouteVisibility(vehicle.id);
                      }
                    });
                  }}
                  className="px-2 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded transition-colors"
                >
                  Show All
                </button>
                <button
                  onClick={() => {
                    vehicles.forEach((vehicle) => {
                      if (routeVisible[vehicle.id]) {
                        toggleRouteVisibility(vehicle.id);
                      }
                    });
                  }}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 rounded transition-colors"
                >
                  Hide All
                </button>
              </div>
            )}

            {/* Live Status */}
            <div className="border-l border-gray-300 pl-3 flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${isTrackingActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
              ></div>
              <span className="text-xs text-gray-700 font-medium">
                {isTrackingActive ? 'LIVE' : 'PAUSED'}
              </span>
            </div>
          </div>
        </div>

        {/* Top Right Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2" style={{ zIndex: 1000 }}>
          {/* Compass */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-2">
            <div className="flex flex-col items-center relative">
              <span className="text-xs font-bold text-gray-700 mb-1">N</span>
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8" stroke="#374151" strokeWidth="1" fill="white" />
                <polygon
                  points="12,6 13.5,11 12,10.5 10.5,11"
                  fill="#ef4444"
                  stroke="#dc2626"
                  strokeWidth="0.5"
                />
                <polygon
                  points="12,18 10.5,13 12,13.5 13.5,13"
                  fill="#6b7280"
                  stroke="#4b5563"
                  strokeWidth="0.5"
                />
                <circle cx="12" cy="12" r="1" fill="#374151" />
              </svg>
            </div>
          </div>

          {/* Fleet Status Legend hidden per advisor feedback */}
          {false && (
            <div
              className={`bg-white/90 backdrop-blur-sm rounded-lg shadow-lg transition-all duration-300 ${
                legendVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
              }`}
            >
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-900">Fleet Status</h4>
                  <button
                    onClick={() => setLegendVisible(!legendVisible)}
                    className="text-gray-400 hover:text-gray-600 ml-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 12h14"
                      />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-lg font-bold text-green-600">
                      {vehicles.filter((v) => v.status === 'active').length}
                    </div>
                    <div className="text-xs text-green-700 font-medium">Active</div>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-lg font-bold text-yellow-600">
                      {vehicles.filter((v) => v.status === 'idle').length}
                    </div>
                    <div className="text-xs text-yellow-700 font-medium">Idle</div>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-lg font-bold text-red-600">
                      {vehicles.filter((v) => v.status === 'maintenance').length}
                    </div>
                    <div className="text-xs text-red-700 font-medium">Maint.</div>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-lg font-bold text-blue-600">{vehicles.length}</div>
                    <div className="text-xs text-blue-700 font-medium">Total</div>
                  </div>
                </div>

                <div className="space-y-2 text-xs border-t border-gray-200 pt-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700">Active Vehicle</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-gray-700">Idle Vehicle</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-gray-700">Maintenance</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-1 bg-blue-500 rounded"></div>
                    <span className="text-gray-700">Vehicle Route</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-0.5 bg-blue-500 border-dashed border border-blue-500"></div>
                    <span className="text-gray-700">Mining Area</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-white border-2 border-orange-500 rounded-full"></div>
                    <span className="text-gray-700">Route Start</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Legend toggle button removed */}

        {/* Playback Controls (History mode) */}
        {viewMode === 'history' && selectedVehicle && hasHistory(selectedVehicle.id) && (
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg px-4 py-3 flex items-center gap-3"
            style={{ zIndex: 1000 }}
          >
            {/* Play/Pause */}
            <button
              onClick={() => (isPlaybackPlaying ? pausePlayback() : startPlayback())}
              className={`px-3 py-1 rounded text-white text-xs ${isPlaybackPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {isPlaybackPlaying ? 'Pause' : 'Play'}
            </button>
            {/* Step Back */}
            <button
              onClick={() => setPlaybackIndex((i) => Math.max(0, i - 1))}
              className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-xs"
            >
              -1
            </button>
            {/* Skip Back 10 */}
            <button
              onClick={() => setPlaybackIndex((i) => Math.max(0, i - 10))}
              className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-xs"
              title="Skip back 10 points"
            >
              -10
            </button>
            {/* Timeline */}
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={(vehicleRoutes[selectedVehicle.id] || []).length - 1}
                value={Math.min(
                  playbackIndex,
                  (vehicleRoutes[selectedVehicle.id] || []).length - 1
                )}
                onChange={(e) => setPlaybackIndex(Number(e.target.value))}
                className="w-64"
              />
              <span className="text-xs text-gray-700 min-w-[72px] text-right">
                {Math.min(playbackIndex, (vehicleRoutes[selectedVehicle.id] || []).length - 1)} /{' '}
                {(vehicleRoutes[selectedVehicle.id] || []).length - 1}
              </span>
            </div>
            {/* Step Forward */}
            <button
              onClick={() =>
                setPlaybackIndex((i) =>
                  Math.min((vehicleRoutes[selectedVehicle.id] || []).length - 1, i + 1)
                )
              }
              className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-xs"
            >
              +1
            </button>
            {/* Skip Forward 10 */}
            <button
              onClick={() =>
                setPlaybackIndex((i) =>
                  Math.min((vehicleRoutes[selectedVehicle.id] || []).length - 1, i + 10)
                )
              }
              className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-xs"
              title="Skip forward 10 points"
            >
              +10
            </button>
            {/* Speed */}
            <div className="flex items-center gap-1 text-xs text-gray-700">
              <span>Speed:</span>
              <select
                value={playbackSpeedMs}
                onChange={(e) => setPlaybackSpeedMs(Number(e.target.value))}
                className="border border-gray-300 rounded px-1 py-0.5 text-xs"
              >
                <option value={1000}>1x</option>
                <option value={500}>2x</option>
                <option value={200}>5x</option>
              </select>
            </div>
            {/* Stop */}
            <button
              onClick={stopPlayback}
              className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-xs"
            >
              Stop
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2" style={{ zIndex: 1000 }}>
          {/* Fit All Routes Button (history only) */}
          {viewMode === 'history' && (
            <button
              onClick={() => {
                if (map) {
                  const allRoutes = Object.values(vehicleRoutes).flat();
                  if (allRoutes.length > 0) {
                    const bounds = [];
                    allRoutes.forEach((point) => bounds.push(point));

                    if (bounds.length > 0) {
                      const group = new L.featureGroup();
                      bounds.forEach((point) => {
                        L.marker(point).addTo(group);
                      });
                      map.fitBounds(group.getBounds().pad(0.1));
                    }
                  } else {
                    resetMapView();
                  }
                }
              }}
              className="bg-purple-500 hover:bg-purple-600 text-white rounded-lg px-4 py-2 shadow-lg transition-colors duration-200 flex items-center gap-2"
            >
              <MapIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Fit Routes</span>
            </button>
          )}

          {/* Auto Center Button */}
          <button
            onClick={resetMapView}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 shadow-lg transition-colors duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="7" strokeWidth="2" />
              <line x1="12" y1="3" x2="12" y2="7" strokeWidth="2" strokeLinecap="round" />
              <line x1="12" y1="17" x2="12" y2="21" strokeWidth="2" strokeLinecap="round" />
              <line x1="3" y1="12" x2="7" y2="12" strokeWidth="2" strokeLinecap="round" />
              <line x1="17" y1="12" x2="21" y2="12" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-sm font-medium">Auto Center</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveTrackingMap;
