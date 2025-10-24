/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { PlayIcon, PauseIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import BaseTrackingMap from './BaseTrackingMap';
import { tpmsAPI } from '../../services/api'; // BE1 untuk tracking & TPMS only
import TirePressureDisplay from './TirePressureDisplay';

const HistoryTrackingMap = () => {
  // Test mode disabled; use only backend data
  const USE_TEST_ROUTE = false;
  const [map, setMap] = useState(null);
  const [, setMapUtils] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clusterSelections, setClusterSelections] = useState(
    new Set(['1-199', '200-399', '400-599', '600-799', '800-999'])
  );
  const [vehicleRoutes, setVehicleRoutes] = useState({});
  const [routeMetaByVehicle, setRouteMetaByVehicle] = useState({});
  const [routeVisible, setRouteVisible] = useState({});
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

  // History-specific states
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [shiftMode, setShiftMode] = useState('day');
  const [customStart, setCustomStart] = useState('06:00');
  const [customEnd, setCustomEnd] = useState('16:00');
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaybackPlaying, setIsPlaybackPlaying] = useState(false);
  const [isAutoCenterEnabled, setIsAutoCenterEnabled] = useState(false);
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState(500);

  const markersRef = useRef({});
  const routeLinesRef = useRef({});
  const manualRouteRef = useRef(null);
  const playbackMarkerRef = useRef(null);
  const playbackTimerRef = useRef(null);

  // Resolve vehicle identifier (keep as-is; backend should accept it)
  const resolveTruckUUID = (vehicleId) => {
    if (!vehicleId) return null;
    const idStr = String(vehicleId);
    if (idStr.length === 36 && idStr.includes('-')) return idStr;
    return idStr;
  };

  const getDayWindow = (dateStr) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      if (shiftMode === 'night') {
        const start = new Date(y, m - 1, d, 16, 0, 0, 0);
        const end = new Date(y, m - 1, d + 1, 6, 0, 0, 0);
        return { start, end };
      }
      if (shiftMode === 'custom') {
        const [sh, sm] = (customStart || '06:00').split(':').map(Number);
        const [eh, em] = (customEnd || '16:00').split(':').map(Number);
        let start = new Date(y, m - 1, d, sh || 0, sm || 0, 0, 0);
        let end = new Date(y, m - 1, d, eh || 0, em || 0, 0, 0);
        if (end <= start) end = new Date(y, m - 1, d + 1, eh || 0, em || 0, 0, 0);
        return { start, end };
      }
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

  const extractTruckNumber = (idOrName) => {
    if (!idOrName) return null;
    const str = String(idOrName);
    // For TPMS serial numbers, use last 3 digits or show as "T1", "T2", etc.
    if (str.length > 6) {
      return str.slice(-3); // Last 3 digits for serial numbers
    }
    const m = str.match(/(\d{1,4})/);
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

      const numericId = (String(truckId).match(/\d{1,4}/) || [])[0];
      const primaryId = numericId || truckId;
      // Try TPMS new backend first using SN as identifier
      let response = await tpmsAPI.getLocationHistory({
        sn: String(truckId),
        startTime: params.startTime,
        endTime: params.endTime,
      });

      const toRecords = (records) =>
        (records || [])
          .map((record) => {
            const tStr =
              record.timestamp ||
              record.recorded_at ||
              record.created_at ||
              record.time ||
              record.gps_time ||
              null;
            const t = tStr ? new Date(tStr) : null;
            const lat = parseFloat(record.latitude ?? record.lat);
            const lng = parseFloat(record.longitude ?? record.lng ?? record.lon);
            const speed = parseFloat(record.speed ?? record.speed_kmh ?? record.v) || null;
            return { lat, lng, t, raw: record, speed };
          })
          .filter((r) => !isNaN(r.lat) && !isNaN(r.lng) && r.lat !== 0 && r.lng !== 0)
          .filter((r) => {
            if (!r.t || isNaN(r.t)) return true;
            return r.t >= start && r.t <= end;
          });

      const toPoints = (recs) => (recs || []).map((r) => [r.lat, r.lng]);

      if (response.success && response.data) {
        // TPMS format: [{ sn, location: [{ createdAt, lat_lng }] }]
        let enriched;
        if (Array.isArray(response.data) && response.data[0]?.location) {
          const locs = response.data[0].location || [];
          enriched = (locs || [])
            .map((loc) => {
              const parts = String(loc?.lat_lng || '').split(',');
              const lat = parts[0] != null ? parseFloat(String(parts[0]).trim()) : NaN;
              const lng = parts[1] != null ? parseFloat(String(parts[1]).trim()) : NaN;
              const t = loc?.createdAt ? new Date(loc.createdAt) : null;
              return { lat, lng, t, raw: loc, speed: null };
            })
            .filter((r) => !isNaN(r.lat) && !isNaN(r.lng));
        } else {
          enriched = toRecords(response.data);
        }
        let routePoints = toPoints(enriched);

        if ((!routePoints || routePoints.length === 0) && primaryId !== truckId) {
          console.log(`🔁 Retrying history with legacy backend using: ${truckId}`);
          const legacy = await tpmsAPI.getLocationHistory(truckId, params);
          if (legacy.success && legacy.data) {
            enriched = toRecords(legacy.data);
            routePoints = toPoints(enriched);
          }
        }

        console.log(`✅ Loaded ${routePoints.length} route points for ${truckId}`);
        return { points: routePoints, records: enriched };
      }

      return { points: [], records: [] };
    } catch (error) {
      console.error(`❌ Failed to load route history for ${truckId}:`, error);
      return { points: [], records: [] };
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

      const R = 6371;
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

  const onMapReady = (mapInstance, utils) => {
    setMap(mapInstance);
  };

  // Load vehicles and route history
  useEffect(() => {
    const loadHistoryData = async () => {
      try {
        setLoading(true);

        // Test route disabled: use only backend data

        // Load basic vehicle data from TPMS (fallback to legacy if needed)
        const tpms = await tpmsAPI.getRealtimeSnapshot();
        let vehicleData = [];
        if (tpms && tpms.success && Array.isArray(tpms.data)) {
          vehicleData = tpms.data
            .map((d, index) => {
              const id = d?.sn ? String(d.sn) : null;

              // Get location from either location array or direct lat_lng field
              let lat = NaN;
              let lng = NaN;
              let lastUpdate = new Date();

              if (d?.location && Array.isArray(d.location) && d.location.length > 0) {
                // Use the most recent location from the array
                const latestLocation = d.location[0];
                const latlngStr = latestLocation?.lat_lng || '';
                const parts = String(latlngStr).split(',');
                lat = parts[0] != null ? parseFloat(String(parts[0]).trim()) : NaN;
                lng = parts[1] != null ? parseFloat(String(parts[1]).trim()) : NaN;
                lastUpdate = latestLocation?.createdAt
                  ? new Date(latestLocation.createdAt)
                  : new Date();
              } else if (d?.location?.lat_lng) {
                const latlngStr = d.location.lat_lng || '';
                const parts = String(latlngStr).split(',');
                lat = parts[0] != null ? parseFloat(String(parts[0]).trim()) : NaN;
                lng = parts[1] != null ? parseFloat(String(parts[1]).trim()) : NaN;
                lastUpdate = d.location?.createdAt ? new Date(d.location.createdAt) : new Date();
              }

              if (!id || !isFinite(lat) || !isFinite(lng)) return null;
              return {
                id,
                truckNumber: index + 1, // Use array index + 1 as truck number
                driver: 'Unknown Driver',
                position: [lat, lng],
                status: 'active',
                speed: 0,
                heading: 0,
                fuel: 0,
                battery: 0,
                signal: 'unknown',
                lastUpdate: lastUpdate,
                route: 'Mining Area',
                load: 'Unknown',
                tireData: d?.tire || [], // Include tire pressure data
              };
            })
            .filter(Boolean);
        } else {
          // Jika TPMS gagal, tidak ada fallback
          console.error('❌ TPMS failed, no vehicles loaded');
        }

        setVehicles(vehicleData);

        // Load route history for each vehicle
        const routesData = {};
        const routeVisibilityData = {};

        for (const vehicle of vehicleData) {
          console.log(`🔄 Loading route history for vehicle: ${vehicle.id}`);
          const history = await loadRouteHistory(vehicle.id, '24h');
          console.log(`📍 Route points loaded for ${vehicle.id}:`, history.points.length);
          if (history.points.length > 0) {
            routesData[vehicle.id] = history.points;
            routeVisibilityData[vehicle.id] = true;
            // store meta records for stats
            routeMetaByVehicleRef.current[vehicle.id] = history.records;
          } else {
            console.warn(`⚠️ No route points found for vehicle ${vehicle.id}`);
          }
        }

        setVehicleRoutes(routesData);
        setRouteVisible(routeVisibilityData);
        // commit meta records from ref to state to avoid stale closure
        setRouteMetaByVehicle((prev) => ({ ...prev, ...routeMetaByVehicleRef.current }));
      } catch (error) {
        console.error('Failed to load history data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (map) {
      loadHistoryData();
      const interval = setInterval(loadHistoryData, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [map, selectedDate, shiftMode, customStart, customEnd]);

  // Update markers and routes when data changes
  useEffect(() => {
    if (map && vehicles.length > 0) {
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

        if (!inSelectedCluster(vehicle.id)) {
          return;
        }

        const truckNum = vehicle.truckNumber || extractTruckNumber(vehicle.id) || '';
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

        // Check if marker already exists to prevent duplicates
        let marker = markersRef.current[vehicle.id];
        if (!marker) {
          marker = L.marker(vehicle.position, {
            icon,
            zIndexOffset: 2000,
            pane: 'markersPane',
          }).addTo(map);
          markersRef.current[vehicle.id] = marker;

          marker.on('click', () => {
            try {
              marker.bringToFront();
            } catch {
              /* empty */
            }
            console.log('[History] Marker clicked:', vehicle.id);

            // Hide the static marker immediately when selected to prevent duplication
            try {
              marker.setOpacity(0);
            } catch {
              /* empty */
            }

            setSelectedVehicle(vehicle);
            setPlaybackIndex(0);
            setIsPlaybackPlaying(false);
          });
        } else {
          // Update existing marker position and icon
          marker.setLatLng(vehicle.position);
          marker.setIcon(icon);
        }

        // Add route line if exists and visible
        const routeHistory = vehicleRoutes[vehicle.id] || [];
        if (routeHistory.length > 1 && routeVisible[vehicle.id] !== false) {
          const routeColor = routeColors[index % routeColors.length];

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

      // Remove markers that are no longer in vehicles data
      const currentVehicleIds = new Set(vehicles.map((v) => v.id));
      Object.keys(markersRef.current).forEach((id) => {
        if (!currentVehicleIds.has(id)) {
          const marker = markersRef.current[id];
          if (marker && map.hasLayer(marker)) {
            map.removeLayer(marker);
          }
          delete markersRef.current[id];
        }
      });

      // Update marker visibility based on selection
      Object.keys(markersRef.current).forEach((id) => {
        const marker = markersRef.current[id];
        if (marker) {
          try {
            if (selectedVehicle && selectedVehicle.id === id) {
              // Hide static marker when selected (playback marker will be shown)
              marker.setOpacity(0);
            } else {
              // Show static marker when not selected
              marker.setOpacity(1);
            }
          } catch {
            /* empty */
          }
        }
      });
    }
  }, [map, vehicles, routeVisible, routeColors, vehicleRoutes, clusterSelections, selectedVehicle]);

  // Update playback marker position
  useEffect(() => {
    if (!map || !selectedVehicle) return;

    const routeHistory = vehicleRoutes[selectedVehicle.id] || [];
    if (routeHistory.length === 0 || playbackIndex >= routeHistory.length) return;

    const currentPosition = routeHistory[playbackIndex];

    // Create or update playback marker
    if (!playbackMarkerRef.current) {
      // eslint-disable-next-line no-undef
      const L = window.L || require('leaflet');
      const playbackIcon = L.divIcon({
        html: `
          <div style="
            background: #3b82f6;
            border: 3px solid #ffffff;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3), 0 4px 8px rgba(0,0,0,0.3);
            animation: pulse 2s infinite;
          "></div>
          <style>
            @keyframes pulse {
              0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7), 0 4px 8px rgba(0,0,0,0.3); }
              70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0), 0 4px 8px rgba(0,0,0,0.3); }
              100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0), 0 4px 8px rgba(0,0,0,0.3); }
            }
          </style>
        `,
        className: 'playback-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      playbackMarkerRef.current = L.marker(currentPosition, {
        icon: playbackIcon,
        zIndexOffset: 3000,
        pane: 'markersPane',
      }).addTo(map);
    } else {
      playbackMarkerRef.current.setLatLng(currentPosition);
    }

    // Update tooltip
    if (playbackMarkerRef.current) {
      playbackMarkerRef.current.bindTooltip(
        `
        <div class="text-sm">
          <strong>${selectedVehicle.id} Playback</strong><br/>
          Point: ${playbackIndex + 1} / ${routeHistory.length}<br/>
          Progress: ${Math.round((playbackIndex / Math.max(1, routeHistory.length - 1)) * 100)}%
        </div>
      `,
        {
          permanent: false,
          direction: 'top',
        }
      );
    }

    // Auto-center map on playback marker if enabled
    if (isAutoCenterEnabled) {
      map.setView(currentPosition, map.getZoom());
    }
  }, [map, selectedVehicle, playbackIndex, vehicleRoutes, isAutoCenterEnabled]);

  // Keep a ref for meta updates inside async loops
  const routeMetaByVehicleRef = useRef({});
  useEffect(() => {
    routeMetaByVehicleRef.current = routeMetaByVehicle;
  }, [routeMetaByVehicle]);

  // Compute journey stats for selected vehicle
  const [journeyStats, setJourneyStats] = useState(null);
  useEffect(() => {
    if (!selectedVehicle) {
      setJourneyStats(null);
      return;
    }
    const recs = routeMetaByVehicle[selectedVehicle.id] || [];
    const pts = vehicleRoutes[selectedVehicle.id] || [];
    if (!recs.length && pts.length < 2) {
      setJourneyStats(null);
      return;
    }

    let distanceKm = calculateRouteDistance(pts);
    let startT = null,
      endT = null;
    let durationHrs = null,
      avgSpeed = null;
    if (recs.length > 0) {
      const sorted = recs.filter((r) => r.t && !isNaN(r.t)).sort((a, b) => a.t - b.t);
      if (sorted.length > 1) {
        startT = sorted[0].t;
        endT = sorted[sorted.length - 1].t;
        const ms = endT - startT;
        durationHrs = ms > 0 ? ms / 3600000 : null;
        if (durationHrs && durationHrs > 0) avgSpeed = distanceKm / durationHrs;
      }
    }
    setJourneyStats({ distanceKm, startT, endT, durationHrs, avgSpeed, points: pts.length });
  }, [selectedVehicle, routeMetaByVehicle, vehicleRoutes]);

  // Optionally load alerts count for selected vehicle within window
  const [alertCount, setAlertCount] = useState(null);
  const [alertsLoading, setAlertsLoading] = useState(false);
  useEffect(() => {
    const loadAlerts = async () => {
      if (!selectedVehicle) {
        setAlertCount(null);
        return;
      }
      const { start, end } = getDayWindow(selectedDate);
      try {
        setAlertsLoading(true);
        const params = {
          truckId: selectedVehicle.id,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          limit: 500,
        };
        // Alerts tidak tersedia dari TPMS, set count ke 0
        setAlertCount(0);
      } catch (e) {
        setAlertCount(null);
      } finally {
        setAlertsLoading(false);
      }
    };
    loadAlerts();
  }, [selectedVehicle, selectedDate, shiftMode, customStart, customEnd]);

  // Create/remove playback marker when vehicle is selected
  useEffect(() => {
    if (!map) return;

    // Remove existing playback marker
    if (playbackMarkerRef.current && map.hasLayer(playbackMarkerRef.current)) {
      map.removeLayer(playbackMarkerRef.current);
      playbackMarkerRef.current = null;
    }

    // Recreate any missing static markers so all trucks remain selectable
    try {
      vehicles.forEach((vehicle) => {
        const existing = markersRef.current[vehicle.id];
        const hasLayer = existing && map.hasLayer(existing);
        if (!hasLayer) {
          const colors = {
            active: '#10b981',
            idle: '#f59e0b',
            maintenance: '#ef4444',
            offline: '#6b7280',
          };
          const truckNum = vehicle.truckNumber || extractTruckNumber(vehicle.id) || '';
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
          const marker = L.marker(vehicle.position, {
            icon,
            zIndexOffset: 2000,
            pane: 'markersPane',
          }).addTo(map);
          markersRef.current[vehicle.id] = marker;
          marker.on('click', () => {
            try {
              marker.bringToFront();
            } catch {
              /* empty */
            }
            setSelectedVehicle(vehicle);
            setPlaybackIndex(0);
            setIsPlaybackPlaying(false);
          });
        }
      });
    } catch {
      /* empty */
    }

    // Reset playback when vehicle changes
    if (selectedVehicle) {
      const routeHistory = vehicleRoutes[selectedVehicle.id] || [];
      if (routeHistory.length > 0) {
        setPlaybackIndex(0);
        setIsPlaybackPlaying(false);
        if (playbackTimerRef.current) {
          clearInterval(playbackTimerRef.current);
          playbackTimerRef.current = null;
        }
        // Place the playback truck icon at the starting point
        try {
          createOrUpdatePlaybackMarker(routeHistory[0]);
        } catch {
          /* empty */
        }
      }
    }

    return () => {
      if (playbackMarkerRef.current && map.hasLayer(playbackMarkerRef.current)) {
        map.removeLayer(playbackMarkerRef.current);
        playbackMarkerRef.current = null;
      }
    };
  }, [map, selectedVehicle, vehicleRoutes]);

  // Manual dummy route rendering removed (backend-only)
  useEffect(() => {
    if (!map) return;
    // no-op
  }, [map]);

  const sidebarContent = (
    <>
      <h4 className="text-lg font-semibold text-gray-900">History Tracking</h4>

      {/* Date filter */}
      <div className="mt-3">
        <label className="block text-xs font-medium text-gray-700 mb-1">Date (06:00 – 16:00)</label>
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

      {/* Cluster Filter */}
      <div className="mt-3">
        <label className="block text-xs font-medium text-gray-700 mb-1">Cluster (Truck No)</label>
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
      </div>

      {/* Journey Summary for selected vehicle */}
      <div className="mt-4 p-3 bg-white/70 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-700">Ringkasan Perjalanan</span>
          {selectedVehicle && (
            <span className="text-[10px] text-gray-500">
              Truck{' '}
              {selectedVehicle.truckNumber ||
                extractTruckNumber(selectedVehicle.id) ||
                selectedVehicle.id}
            </span>
          )}
        </div>
        {selectedVehicle && journeyStats ? (
          <div className="text-xs text-gray-800 space-y-1">
            <div className="flex justify-between">
              <span>Poin</span>
              <span>{journeyStats.points}</span>
            </div>
            <div className="flex justify-between">
              <span>Jarak</span>
              <span>{journeyStats.distanceKm.toFixed(2)} km</span>
            </div>
            <div className="flex justify-between">
              <span>Durasi</span>
              <span>
                {journeyStats.durationHrs ? journeyStats.durationHrs.toFixed(2) + ' jam' : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Kecepatan Rata2</span>
              <span>
                {journeyStats.avgSpeed ? journeyStats.avgSpeed.toFixed(1) + ' km/j' : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Waktu</span>
              <span>
                {journeyStats.startT ? new Date(journeyStats.startT).toLocaleTimeString() : '-'} —{' '}
                {journeyStats.endT ? new Date(journeyStats.endT).toLocaleTimeString() : '-'}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-gray-500">
            Pilih kendaraan untuk melihat ringkasan perjalanan.
          </div>
        )}
      </div>

      {/* Alerts summary */}
      <div className="mt-2 p-3 bg-white/70 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-700">Alerts (Periode)</span>
        </div>
        <div className="text-xs text-gray-800">
          {alertsLoading ? 'Memuat…' : alertCount == null ? '—' : `${alertCount} kejadian`}
        </div>
      </div>

      {/* Tire Pressure (same as live) */}
      <div className="mt-3">
        <TirePressureDisplay
          selectedTruckId={resolveTruckUUID(selectedVehicle?.id) || selectedVehicle?.id}
          tireData={selectedVehicle?.tireData}
        />
      </div>
    </>
  );

  const additionalControls = (
    <div className="border-l border-gray-300 pl-3 flex items-center gap-2">
      <span className="text-xs text-gray-600">Routes:</span>
      <button
        onClick={() => {
          vehicles.forEach((vehicle) => {
            if (!routeVisible[vehicle.id]) {
              // toggleRouteVisibility(vehicle.id);
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
              // toggleRouteVisibility(vehicle.id);
            }
          });
        }}
        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 rounded transition-colors"
      >
        Hide All
      </button>
    </div>
  );

  // Playback functions
  const hasHistory = (vehicleId) => {
    const pts = vehicleRoutes[vehicleId] || [];
    return Array.isArray(pts) && pts.length > 1;
  };

  const createOrUpdatePlaybackMarker = (latlng) => {
    if (!map || !latlng) return;
    // eslint-disable-next-line no-undef
    const L = window.L || require('leaflet');

    if (!playbackMarkerRef.current) {
      const truckNum =
        selectedVehicle?.truckNumber || extractTruckNumber(selectedVehicle?.id) || '';
      const colors = {
        active: '#10b981',
        idle: '#f59e0b',
        maintenance: '#ef4444',
        offline: '#6b7280',
      };
      const badgeColor = colors[selectedVehicle?.status] || colors.offline;
      const icon = L.divIcon({
        html: `
          <div style="position: relative;">
            <div style="
              background: ${badgeColor};
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
              border-top: 8px solid ${badgeColor};
              margin: 0 auto;
              filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));
            "></div>
          </div>
        `,
        className: 'playback-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });

      playbackMarkerRef.current = L.marker(latlng, {
        icon,
        zIndexOffset: 3000,
        pane: 'markersPane',
      }).addTo(map);
    } else {
      try {
        playbackMarkerRef.current.setLatLng(latlng);
      } catch (e) {
        console.warn('Failed to update playback marker position:', e);
      }
    }
  };

  const startPlayback = () => {
    if (!selectedVehicle || !hasHistory(selectedVehicle.id)) return;

    const routeHistory = vehicleRoutes[selectedVehicle.id] || [];
    if (playbackIndex >= routeHistory.length - 1) {
      setPlaybackIndex(0); // Reset to start if at end
    }

    // Remove the static truck marker at the start so only the start dot remains
    try {
      const staticMarker = markersRef.current[selectedVehicle.id];
      if (staticMarker && map && map.hasLayer(staticMarker)) {
        map.removeLayer(staticMarker);
      }
      delete markersRef.current[selectedVehicle.id];
    } catch {
      /* empty */
    }

    setIsPlaybackPlaying(true);
    if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);

    playbackTimerRef.current = setInterval(() => {
      setPlaybackIndex((currentIndex) => {
        const maxIndex = routeHistory.length - 1;
        if (currentIndex >= maxIndex) {
          // Auto-stop at end
          setIsPlaybackPlaying(false);
          if (playbackTimerRef.current) {
            clearInterval(playbackTimerRef.current);
            playbackTimerRef.current = null;
          }
          return maxIndex;
        }
        return currentIndex + 1;
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
    const pts = selectedVehicle ? vehicleRoutes[selectedVehicle.id] || [] : [];
    if (pts.length > 0) createOrUpdatePlaybackMarker(pts[0]);
  };

  // Update playback timer when speed changes
  useEffect(() => {
    if (!isPlaybackPlaying || !selectedVehicle) return;
    pausePlayback();
    setTimeout(() => startPlayback(), 50); // Small delay to ensure clean restart
  }, [playbackSpeedMs]);

  // Auto-stop playback when reaching the end
  useEffect(() => {
    if (!selectedVehicle || !isPlaybackPlaying) return;

    const routeHistory = vehicleRoutes[selectedVehicle.id] || [];
    if (playbackIndex >= routeHistory.length - 1) {
      setIsPlaybackPlaying(false);
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
    }
  }, [playbackIndex, selectedVehicle, vehicleRoutes, isPlaybackPlaying]);

  // Cleanup playback marker/timer on unmount
  useEffect(() => {
    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      if (playbackMarkerRef.current && map) {
        try {
          map.removeLayer(playbackMarkerRef.current);
        } catch {
          /* empty */
        }
        playbackMarkerRef.current = null;
      }
    };
  }, [map]);

  const onFitRoutes = () => {
    if (map) {
      const allRoutes = Object.values(vehicleRoutes).flat();
      if (allRoutes.length > 0) {
        const bounds = [];
        allRoutes.forEach((point) => bounds.push(point));

        if (bounds.length > 0) {
          // eslint-disable-next-line no-undef
          const L = window.L || require('leaflet');
          const group = new L.featureGroup();
          bounds.forEach((point) => {
            L.marker(point).addTo(group);
          });
          map.fitBounds(group.getBounds().pad(0.1));
        }
      }
    }
  };

  const bottomControls = (
    <div
      className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg px-4 py-3 flex items-center gap-3"
      style={{ zIndex: 1000 }}
    >
      {selectedVehicle && hasHistory(selectedVehicle.id) ? (
        <>
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
              value={Math.min(playbackIndex, (vehicleRoutes[selectedVehicle.id] || []).length - 1)}
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
        </>
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-600">Pilih kendaraan untuk playback.</span>
          <button
            className="px-3 py-1 rounded bg-gray-200 text-gray-500 text-xs cursor-not-allowed"
            disabled
          >
            Play
          </button>
          <button
            className="px-2 py-1 rounded bg-gray-200 text-gray-500 text-xs cursor-not-allowed"
            disabled
          >
            -1
          </button>
          <button
            className="px-2 py-1 rounded bg-gray-200 text-gray-500 text-xs cursor-not-allowed"
            disabled
          >
            -10
          </button>
          <input type="range" className="w-64 opacity-50" disabled />
          <button
            className="px-2 py-1 rounded bg-gray-200 text-gray-500 text-xs cursor-not-allowed"
            disabled
          >
            +1
          </button>
          <button
            className="px-2 py-1 rounded bg-gray-200 text-gray-500 text-xs cursor-not-allowed"
            disabled
          >
            +10
          </button>
          <div className="flex items-center gap-1 text-xs text-gray-700">
            <span>Speed:</span>
            <select className="border border-gray-300 rounded px-1 py-0.5 text-xs" disabled>
              <option>1x</option>
            </select>
          </div>
          <button
            className="px-2 py-1 rounded bg-gray-200 text-gray-500 text-xs cursor-not-allowed"
            disabled
          >
            Stop
          </button>
        </div>
      )}
    </div>
  );

  return (
    <BaseTrackingMap
      onMapReady={onMapReady}
      sidebarContent={sidebarContent}
      additionalControls={additionalControls}
      bottomControls={bottomControls}
      showCompass={true}
      showMapStyleToggle={true}
      showAutoCenter={true}
      showFitRoutes={true}
      onFitRoutes={onFitRoutes}
    />
  );
};

export default HistoryTrackingMap;
