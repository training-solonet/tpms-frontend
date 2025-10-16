/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from 'react';
import { TruckIcon, ClockIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import BaseTrackingMap from './BaseTrackingMap';
import TirePressureDisplay from './TirePressureDisplay';
import { getLiveTrackingData } from '../../data/dataManagement.js';
import { getDummyRealRoutePoints, getDummyRealRouteLastPoint } from '../../data/index.js';
import { devices } from '../../data/devices.js';
import { deviceStatusEvents } from '../../data/deviceStatusEvents.js';
import { trucks as trucksList } from '../../data/trucks.js';

const LiveTrackingMapNew = () => {
  const USE_BACKEND = false; // Force use dummy data
  const [map, setMap] = useState(null);
  const [mapUtils, setMapUtils] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showVehicleCard, setShowVehicleCard] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setError] = useState(null);
  const [clusterSelections, setClusterSelections] = useState(
    new Set(['1-199', '200-399', '400-599', '600-799', '800-999'])
  );
  const [vehicleRoutes, setVehicleRoutes] = useState({});
  const [isTrackingActive] = useState(true);
  const [timeRange] = useState('24h');
  const [, setSelectedDevice] = useState(null);
  const [, setSelectedDeviceStatus] = useState(null);

  const markersRef = useRef({});
  const markersLayerRef = useRef(null);
  const liveRouteLineRef = useRef(null);
  const liveRouteMarkersRef = useRef({ start: null, end: null });
  const wsRef = useRef(null);
  const wsSubscribedRef = useRef(false);
  const lastHideStateRef = useRef(null);
  const rafRef = useRef(null);
  const focusHandledRef = useRef(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [wsStatus, setWsStatus] = useState('disconnected'); // connecting | connected | reconnecting | disconnected

  // Tire data helpers
  const normalizeTruckId = (id) => String(id || '').toLowerCase();

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

  // Truck number helpers & cluster filtering
  const extractTruckNumber = (idOrName) => {
    if (!idOrName) return null;
    const m = String(idOrName).match(/(\d{1,4})/);
    return m ? parseInt(m[1], 10) : null;
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // Use dummy data directly
      const liveTrackingData = getLiveTrackingData();
      console.log(`📊 Loaded ${liveTrackingData.length} vehicles from dummy data`);

      let finalTrackingData = liveTrackingData;
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
        finalTrackingData = synth;
      }

      const routes = {};
      // Use dummy route data for all vehicles
      for (const vehicle of finalTrackingData) {
        const mdLast = getDummyRealRouteLastPoint?.();
        if (mdLast && typeof mdLast.lat === 'number' && typeof mdLast.lng === 'number') {
          vehicle.position = [mdLast.lat, mdLast.lng];
        }
        // Generate dummy route points for each vehicle
        const routePoints = getDummyRealRoutePoints();
        if (routePoints && routePoints.length > 0) {
          routes[vehicle.id] = routePoints.map((p) => [p.lat, p.lng]);
        }
      }

      setVehicleRoutes(routes);
      console.log(
        `✅ Initialized ${finalTrackingData.length} vehicles with comprehensive dummy data`
      );
      return finalTrackingData;
    } catch (error) {
      console.error('❌ Failed to initialize dummy data:', error);
      return [];
    }
  };

  const onMapReady = (mapInstance, utils) => {
    setMap(mapInstance);
    setMapUtils(utils);
    try {
      const L = window.L || require('leaflet'); // eslint-disable-line no-undef
      if (!markersLayerRef.current) {
        markersLayerRef.current = L.layerGroup([], { pane: 'markersPane' }).addTo(mapInstance);
      }
    } catch (err) {
      void err;
    }

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

        const vehicleData = getLiveTrackingData();

        if (vehicleData && vehicleData.length > 0) {
          setVehicles(vehicleData);
        } else {
          console.log('ℹ️ API returned no vehicles, switching to sample data');
          const sampleData = await initializeSampleData();
          setVehicles(sampleData);
          setError('No vehicles from backend - using demo data');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, mapUtils]);

  // WebSocket setup disabled for dummy data mode
  useEffect(() => {
    if (!USE_BACKEND) {
      setWsStatus('disconnected');
      return;
    }
    // WebSocket logic removed since we're using dummy data only
  }, [USE_BACKEND]);

  // Backend connection monitor disabled for dummy data mode
  useEffect(() => {
    setBackendOnline(false);
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

  // Reconcile markers when data changes (reuse markers for performance)
  useEffect(() => {
    if (map && vehicles) {
      const L = window.L || require('leaflet'); // eslint-disable-line no-undef
      if (!markersLayerRef.current) {
        try {
          markersLayerRef.current = L.layerGroup([], { pane: 'markersPane' }).addTo(map);
        } catch (err) {
          void err;
        }
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
                } catch (err) {
                  void err;
                }
                liveRouteLineRef.current = null;
              }

              const L = window.L || require('leaflet'); // eslint-disable-line no-undef

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
                  } catch (err) {
                    void err;
                  }
                if (liveRouteMarkersRef.current.end)
                  try {
                    map.removeLayer(liveRouteMarkersRef.current.end);
                  } catch (err) {
                    void err;
                  }

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
                } catch (err) {
                  void err;
                }
              }
            } catch (e) {
              console.warn('Failed to show live route:', e);
            }
          });
        } else {
          // Update position
          try {
            marker.setLatLng(vehicle.position);
          } catch (err) {
            void err;
          }
          // Update icon only if status changed (cheaper)
          if (marker._status !== vehicle.status) {
            try {
              marker.setIcon(buildIcon(vehicle.status));
              marker._status = vehicle.status;
            } catch (err) {
              void err;
            }
          }
        }

        // Ensure visible
        try {
          const el = marker.getElement?.();
          if (el) el.style.visibility = 'visible';
        } catch (err) {
          void err;
        }

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
          } catch (err) {
            void err;
          }
          delete existing[id];
        }
      });
    }
  }, [map, vehicles, clusterSelections, inSelectedCluster, vehicleRoutes]);

  // Re-apply marker zoom styling whenever map or selection changes
  useEffect(() => {
    applyMarkerZoomStyling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        } catch (err) {
          void err;
        }
        try {
          map.setView(target.position, Math.max(map.getZoom(), 16), { animate: true });
        } catch (err) {
          void err;
        }
      } else {
        // Fallback: set directly
        setSelectedVehicle(target);
        setShowVehicleCard(true);
        try {
          map.setView(target.position, Math.max(map.getZoom(), 16), { animate: true });
        } catch (err) {
          void err;
        }
      }
      focusHandledRef.current = true;
    } catch (err) {
      void err;
    }
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
            className="absolute bg-white rounded-xl shadow-lg border border-gray-200 p-5 w-[380px] max-h-[calc(100vh-220px)] overflow-y-auto z-50"
            style={{ left: '24px', top: '80px' }}
          >
            {/* Vehicle banner image */}
            <div className="mb-4 overflow-hidden rounded-lg border border-gray-100">
              <img src="/icon2.png" alt="Truck" className="h-32 w-full object-cover" />
            </div>
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 leading-tight">
                  {selectedVehicle.id}
                </h4>
                <p className="text-sm text-gray-500">
                  Driver: {selectedVehicle.driver || 'Unknown'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${
                    selectedVehicle.status === 'active'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : selectedVehicle.status === 'idle'
                        ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                      selectedVehicle.status === 'active'
                        ? 'bg-green-500'
                        : selectedVehicle.status === 'idle'
                          ? 'bg-yellow-500'
                          : 'bg-gray-400'
                    }`}
                  />
                  {selectedVehicle.status}
                </span>
                <button
                  onClick={() => {
                    setShowVehicleCard(false);
                    setSelectedVehicle(null);
                    if (liveRouteLineRef.current && map) {
                      try {
                        map.removeLayer(liveRouteLineRef.current);
                      } catch {
                        /* empty */
                      }
                      liveRouteLineRef.current = null;
                    }
                    if (liveRouteMarkersRef.current.start)
                      try {
                        map.removeLayer(liveRouteMarkersRef.current.start);
                      } catch {
                        /* empty */
                      }
                    if (liveRouteMarkersRef.current.end)
                      try {
                        map.removeLayer(liveRouteMarkersRef.current.end);
                      } catch {
                        /* empty */
                      }
                  }}
                  className="p-1.5 rounded-md hover:bg-gray-100"
                  aria-label="Close vehicle card"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Key metrics - quick scan rows with icons */}
            <div className="mt-4 flex flex-col gap-2">
              {/* Speed */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/40 border border-blue-100">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-blue-100 border border-blue-200 text-blue-600">
                    <span className="material-symbols-outlined text-[18px] leading-none">
                      speed
                    </span>
                  </span>
                  <span className="text-sm text-gray-700">Speed</span>
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {selectedVehicle.speed} km/h
                </div>
              </div>

              {/* Fuel */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50/40 border border-amber-100">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-amber-100 border border-amber-200 text-amber-600">
                    <span className="material-symbols-outlined text-[18px] leading-none">
                      local_gas_station
                    </span>
                  </span>
                  <span className="text-sm text-gray-700">Fuel</span>
                </div>
                <div className="text-sm font-semibold text-gray-900">{selectedVehicle.fuel}%</div>
              </div>

              {/* Signal */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-violet-50/40 border border-violet-100">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-violet-100 border border-violet-200 text-violet-600">
                    <span className="material-symbols-outlined text-[18px] leading-none">
                      signal_cellular_alt
                    </span>
                  </span>
                  <span className="text-sm text-gray-700">Signal</span>
                </div>
                <div className="text-sm font-semibold text-gray-900">{selectedVehicle.signal}</div>
              </div>
            </div>

            {/* Last update */}
            <div className="mt-4 flex items-center justify-between rounded-lg border border-gray-200 p-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ClockIcon className="w-4 h-4 text-gray-500" />
                Last update
              </div>
              <div className="text-sm font-medium text-gray-900">
                {formatLastUpdate(selectedVehicle.lastUpdate)}
              </div>
            </div>

            {/* Tire Pressure Display */}
            <div className="mt-5">
              <div className="rounded-lg border border-gray-200 p-3">
                <TirePressureDisplay selectedTruckId={selectedVehicle?.id} showHeader={true} />
              </div>
            </div>

            {/* CTA */}
            <div className="mt-5">
              <a
                href={`/history?focus=${encodeURIComponent(String(selectedVehicle?.id || ''))}`}
                className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-2.5 px-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>View Route History</span>
              </a>
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
