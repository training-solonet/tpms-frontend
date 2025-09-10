import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  PlayIcon,
  PauseIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import BaseTrackingMap from './BaseTrackingMap';
import { trucksAPI } from '../../services/api.js';
import { getDummyRealRoutePoints, getDummyRealRoutePoints2 } from '../../data/index.js';

const HistoryTrackingMap = () => {
  // Test mode for manual single route playback
  const USE_TEST_ROUTE = true;
  const TEST_ROUTE = [
    [-3.506761, 115.624602],
    [-3.506831, 115.624709],
    [-3.506925, 115.624882],
    [-3.507028, 115.625017],
    [-3.507139, 115.625174],
    [-3.507221, 115.625322],
    [-3.507603, 115.625873],
    [-3.507746, 115.626132],
    [-3.507841, 115.626260],
    [-3.507927, 115.626371],
    [-3.508066, 115.626490],
    [-3.508177, 115.626646],
    [-3.508313, 115.626803],
    [-3.508420, 115.626930],
    [-3.508403, 115.626905],
    [-3.508502, 115.627021],
    [-3.508645, 115.627177],
    [-3.508828, 115.627354],
    [-3.508963, 115.627512],
    [-3.509174, 115.627706],
    [-3.509418, 115.627918],
    [-3.509634, 115.628112],
    [-3.509931, 115.628342],
    [-3.510025, 115.628491],
    [-3.510138, 115.628622],
    [-3.510260, 115.628766],
    [-3.510399, 115.628956],
    [-3.510597, 115.629145],
    [-3.511003, 115.629446],
    [-3.511238, 115.629505],
    [-3.511399, 115.629564],
    [-3.511613, 115.629623],
    [-3.511843, 115.629639],
    [-3.512015, 115.629666],
    [-3.512154, 115.629715],
    [-3.512475, 115.629677],
    [-3.512764, 115.629602],
    [-3.512903, 115.629564],
    [-3.513150, 115.629511],
    [-3.513284, 115.629462],
    [-3.513235, 115.629296],
    [-3.513193, 115.629087],
    [-3.513134, 115.628867],
    [-3.513128, 115.628685],
    [-3.513235, 115.628593],
    [-3.513401, 115.628534],
    [-3.513562, 115.628470],
    [-3.513749, 115.628459],
    [-3.513926, 115.628406],
    [-3.514135, 115.628384]
  ];
  const [map, setMap] = useState(null);
  const [mapUtils, setMapUtils] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clusterSelections, setClusterSelections] = useState(new Set(['1-199','200-399','400-599','600-799','800-999']));
  const [vehicleRoutes, setVehicleRoutes] = useState({});
  const [routeVisible, setRouteVisible] = useState({});
  const [routeColors] = useState([
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
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
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaybackPlaying, setIsPlaybackPlaying] = useState(false);
  const [isAutoCenterEnabled, setIsAutoCenterEnabled] = useState(false);
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState(500);

  const markersRef = useRef({});
  const routeLinesRef = useRef({});
  const manualRouteRef = useRef(null);
  const playbackMarkerRef = useRef(null);
  const playbackTimerRef = useRef(null);

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

  const loadRouteHistory = async (truckId, timeRange = '24h', windowOverride = null) => {
    try {
      console.log(`📍 Loading route history for ${truckId} (${timeRange})`);
      
      const { start, end } = windowOverride || getDayWindow(selectedDate);
      const params = {
        timeRange: timeRange,
        limit: timeRange === 'shift' ? 1000 : 200,
        minSpeed: 0,
        startTime: start.toISOString(),
        endTime: end.toISOString()
      };
      
      const numericId = (String(truckId).match(/\d{1,4}/) || [])[0];
      const primaryId = numericId || truckId;
      let response = await trucksAPI.getLocationHistory(primaryId, params);
      
      const toPoints = (records) => (records || [])
        .filter(record => {
          try {
            const t = new Date(
              record.timestamp || record.recorded_at || record.created_at || record.time || record.gps_time || null
            );
            if (!isNaN(t)) {
              return t >= start && t <= end;
            }
          } catch {}
          return true;
        })
        .map(record => [parseFloat(record.latitude), parseFloat(record.longitude)])
        .filter(pt => !isNaN(pt[0]) && !isNaN(pt[1]) && pt[0] !== 0 && pt[1] !== 0);

      if (response.success && response.data) {
        let routePoints = toPoints(response.data);
        
        if ((!routePoints || routePoints.length === 0) && primaryId !== truckId) {
          console.log(`🔁 Retrying history with raw ID: ${truckId}`);
          response = await trucksAPI.getLocationHistory(truckId, params);
          if (response.success && response.data) {
            routePoints = toPoints(response.data);
          }
        }
        
        console.log(`✅ Loaded ${routePoints.length} route points for ${truckId}`);
        return routePoints;
      }
      
      return [];
    } catch (error) {
      console.error(`❌ Failed to load route history for ${truckId}:`, error);
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
      
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      totalDistance += distance;
    }
    
    return totalDistance;
  };

  const onMapReady = (mapInstance, utils) => {
    setMap(mapInstance);
    setMapUtils(utils);
  };

  // Load vehicles and route history
  useEffect(() => {
    const loadHistoryData = async () => {
      try {
        setLoading(true);
        
        if (USE_TEST_ROUTE) {
          const testVehicle = {
            id: 'TRUCK-001',
            driver: 'Demo Driver',
            position: TEST_ROUTE[0],
            status: 'active',
            speed: 20,
            heading: 0,
            fuel: 50,
            battery: 90,
            signal: 'good',
            lastUpdate: new Date(),
            route: 'Test Route',
            load: 'Empty'
          };
          // Load route2.md if available
          const r2pts = getDummyRealRoutePoints2();
          const ROUTE2 = Array.isArray(r2pts) && r2pts.length > 1 ? r2pts.map(p => [p.lat, p.lng]) : [];
          const vehiclesArr = [testVehicle];
          const routesData = { [testVehicle.id]: TEST_ROUTE };
          const routeVisibilityData = { [testVehicle.id]: true };

          if (ROUTE2.length > 1) {
            const testVehicle2 = {
              id: 'TRUCK-002',
              driver: 'Demo Driver 2',
              position: ROUTE2[0],
              status: 'active',
              speed: 18,
              heading: 0,
              fuel: 55,
              battery: 90,
              signal: 'good',
              lastUpdate: new Date(),
              route: 'Test Route 2',
              load: 'Empty'
            };
            vehiclesArr.push(testVehicle2);
            routesData[testVehicle2.id] = ROUTE2;
            routeVisibilityData[testVehicle2.id] = true;
          }

          setVehicles(vehiclesArr);
          setVehicleRoutes(routesData);
          setRouteVisible(routeVisibilityData);
          setSelectedVehicle(testVehicle);
          try {
            const allLatLngs = [];
            TEST_ROUTE.forEach(p => allLatLngs.push(L.latLng(p[0], p[1])));
            if (routesData['TRUCK-002']) {
              routesData['TRUCK-002'].forEach(p => allLatLngs.push(L.latLng(p[0], p[1])));
            }
            if (allLatLngs.length > 1) {
              const bounds = L.latLngBounds(allLatLngs);
              map.fitBounds(bounds, { padding: [40, 40] });
            }
          } catch {}
          return;
        }

        // Load basic vehicle data (can be from API or dummy)
        const response = await trucksAPI.getRealTimeLocations();
        let vehicleData = [];
        
        if (response.success && response.data) {
          vehicleData = response.data.features?.map(feature => ({
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
        }

        // If no API data, create dummy vehicles
        if (vehicleData.length === 0) {
          vehicleData = Array.from({ length: 5 }).map((_, i) => ({
            id: `TRUCK-${String(i + 1).padStart(3, '0')}`,
            driver: `Demo Driver ${i + 1}`,
            position: [-3.580000 + (Math.random() - 0.5) * 0.01, 115.600000 + (Math.random() - 0.5) * 0.01],
            status: ['active', 'idle', 'maintenance'][Math.floor(Math.random() * 3)],
            speed: Math.floor(Math.random() * 60),
            heading: Math.floor(Math.random() * 360),
            fuel: Math.floor(Math.random() * 100),
            battery: 90,
            signal: 'good',
            lastUpdate: new Date(),
            route: 'Mining Area',
            load: 'Empty'
          }));
        }

        setVehicles(vehicleData);

        // Load route history for each vehicle
        const routesData = {};
        const routeVisibilityData = {};
        
        for (const vehicle of vehicleData) {
          const routeHistory = await loadRouteHistory(vehicle.id, '24h');
          if (routeHistory.length > 0) {
            routesData[vehicle.id] = routeHistory;
            routeVisibilityData[vehicle.id] = true;
          }
        }
        
        setVehicleRoutes(routesData);
        setRouteVisible(routeVisibilityData);
        
      } catch (error) {
        console.error('Failed to load history data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (map) {
      loadHistoryData();
    }
  }, [map, selectedDate, shiftMode, customStart, customEnd]);

  // Update markers and routes when data changes
  useEffect(() => {
    if (map && vehicles.length > 0) {
      
      // Clear existing markers and routes
      Object.values(markersRef.current).forEach(marker => {
        if (marker && map.hasLayer(marker)) {
          map.removeLayer(marker);
        }
      });
      
      Object.values(routeLinesRef.current).forEach(routeLine => {
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

        const marker = L.marker(vehicle.position, { icon, zIndexOffset: 2000, pane: 'markersPane' }).addTo(map);
        markersRef.current[vehicle.id] = marker;

        marker.on('click', () => {
          try { marker.bringToFront(); } catch {}
          console.log('[History] Marker clicked:', vehicle.id);
          setSelectedVehicle(vehicle);
          setPlaybackIndex(0);
          setIsPlaybackPlaying(false);
        });

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
            pane: 'routesPane'
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
            
            L.marker(routeHistory[0], { icon: startIcon }).addTo(map)
              .bindTooltip(`${vehicle.id} - Route Start (${routeHistory.length} points)`, { 
                permanent: false, 
                direction: 'top' 
              });
          }
          
          // Add route info tooltip
          routeLine.bindTooltip(`
            <div class="text-sm">
              <strong>${vehicle.id} Route</strong><br/>
              Points: ${routeHistory.length}<br/>
              Distance: ~${calculateRouteDistance(routeHistory).toFixed(1)} km<br/>
              Status: ${vehicle.status.toUpperCase()}
            </div>
          `, { 
            sticky: true 
          });
        }
      });
    }
  }, [map, vehicles, routeVisible, routeColors, vehicleRoutes, clusterSelections]);

  // Update playback marker position
  useEffect(() => {
    if (!map || !selectedVehicle) return;

    const routeHistory = vehicleRoutes[selectedVehicle.id] || [];
    if (routeHistory.length === 0 || playbackIndex >= routeHistory.length) return;

    const currentPosition = routeHistory[playbackIndex];
    
    // Create or update playback marker
    if (!playbackMarkerRef.current) {
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
        pane: 'markersPane'
      }).addTo(map);
    } else {
      playbackMarkerRef.current.setLatLng(currentPosition);
    }

    // Update tooltip
    if (playbackMarkerRef.current) {
      playbackMarkerRef.current.bindTooltip(`
        <div class="text-sm">
          <strong>${selectedVehicle.id} Playback</strong><br/>
          Point: ${playbackIndex + 1} / ${routeHistory.length}<br/>
          Progress: ${Math.round((playbackIndex / Math.max(1, routeHistory.length - 1)) * 100)}%
        </div>
      `, { 
        permanent: false,
        direction: 'top'
      });
    }

    // Auto-center map on playback marker if enabled
    if (isAutoCenterEnabled) {
      map.setView(currentPosition, map.getZoom());
    }
  }, [map, selectedVehicle, playbackIndex, vehicleRoutes, isAutoCenterEnabled]);

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
            offline: '#6b7280'
          };
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
          const marker = L.marker(vehicle.position, { icon, zIndexOffset: 2000, pane: 'markersPane' }).addTo(map);
          markersRef.current[vehicle.id] = marker;
          marker.on('click', () => {
            try { marker.bringToFront(); } catch {}
            setSelectedVehicle(vehicle);
            setPlaybackIndex(0);
            setIsPlaybackPlaying(false);
          });
        }
      });
    } catch {}

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
        try { createOrUpdatePlaybackMarker(routeHistory[0]); } catch {}
      }
    }

    return () => {
      if (playbackMarkerRef.current && map.hasLayer(playbackMarkerRef.current)) {
        map.removeLayer(playbackMarkerRef.current);
        playbackMarkerRef.current = null;
      }
    };
  }, [map, selectedVehicle, vehicleRoutes]);

  // Render manual route from make_dummy_real_route.md (disabled in test mode)
  useEffect(() => {
    if (!map) return;
    if (USE_TEST_ROUTE) return;
    
    try {
      const pts = getDummyRealRoutePoints();
      const coords = Array.isArray(pts) && pts.length > 1
        ? pts.map(p => [p.lat, p.lng])
        : [];

      if (coords.length > 1) {
        const L = window.L || require('leaflet');

        if (manualRouteRef.current) {
          try { map.removeLayer(manualRouteRef.current.line); } catch (e) {}
          try { map.removeLayer(manualRouteRef.current.start); } catch (e) {}
          try { map.removeLayer(manualRouteRef.current.end); } catch (e) {}
          manualRouteRef.current = null;
        }

        const color = '#2563eb';
        const line = L.polyline(coords, {
          color,
          weight: 4,
          opacity: 0.95,
          lineJoin: 'round',
          lineCap: 'round',
          pane: 'routesPane'
        }).addTo(map);

        const startIcon = L.divIcon({
          html: `<div style="background:white;border:2px solid ${color};border-radius:50%;width:14px;height:14px;"></div>`,
          className: 'manual-route-start',
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });
        
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
          iconAnchor: [14, 28]
        });

        const start = L.marker(coords[0], { icon: startIcon, pane: 'routesPane' }).addTo(map).bindTooltip('Start', {direction:'top'});
        const end = L.marker(coords[coords.length - 1], { icon: endIcon, pane: 'routesPane' }).addTo(map).bindTooltip('End', {direction:'top'});

        manualRouteRef.current = { line, start, end };

        try {
          map.fitBounds(line.getBounds(), { padding: [40, 40] });
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Failed to render manual route from markdown:', err);
    }
  }, [map]);

  const sidebarContent = (
    <>
      <h4 className="text-lg font-semibold text-gray-900">History Tracking</h4>
      
      {/* Date filter */}
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
      </div>
    </>
  );

  const additionalControls = (
    <div className="border-l border-gray-300 pl-3 flex items-center gap-2">
      <span className="text-xs text-gray-600">Routes:</span>
      <button
        onClick={() => {
          vehicles.forEach(vehicle => {
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
          vehicles.forEach(vehicle => {
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
    const L = window.L || require('leaflet');
    
    if (!playbackMarkerRef.current) {
      const truckNum = extractTruckNumber(selectedVehicle?.id) ?? '';
      const colors = {
        active: '#10b981',
        idle: '#f59e0b',
        maintenance: '#ef4444',
        offline: '#6b7280'
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
        iconAnchor: [14, 28]
      });
      
      playbackMarkerRef.current = L.marker(latlng, { 
        icon, 
        zIndexOffset: 3000, 
        pane: 'markersPane' 
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
    } catch {}

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
    const pts = selectedVehicle ? (vehicleRoutes[selectedVehicle.id] || []) : [];
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
        try { map.removeLayer(playbackMarkerRef.current); } catch {}
        playbackMarkerRef.current = null;
      }
    };
  }, [map]);

  const onFitRoutes = () => {
    if (map) {
      const allRoutes = Object.values(vehicleRoutes).flat();
      if (allRoutes.length > 0) {
        const bounds = [];
        allRoutes.forEach(point => bounds.push(point));
        
        if (bounds.length > 0) {
          const L = window.L || require('leaflet');
          const group = new L.featureGroup();
          bounds.forEach(point => {
            L.marker(point).addTo(group);
          });
          map.fitBounds(group.getBounds().pad(0.1));
        }
      }
    }
  };

  const bottomControls = (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg px-4 py-3 flex items-center gap-3" style={{ zIndex: 1000 }}>
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
            onClick={() => setPlaybackIndex(i => Math.max(0, i - 1))}
            className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-xs"
          >
            -1
          </button>
          {/* Skip Back 10 */}
          <button
            onClick={() => setPlaybackIndex(i => Math.max(0, i - 10))}
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
              {Math.min(playbackIndex, (vehicleRoutes[selectedVehicle.id] || []).length - 1)} / {(vehicleRoutes[selectedVehicle.id] || []).length - 1}
            </span>
          </div>
          {/* Step Forward */}
          <button
            onClick={() => setPlaybackIndex(i => Math.min((vehicleRoutes[selectedVehicle.id] || []).length - 1, i + 1))}
            className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-xs"
          >
            +1
          </button>
          {/* Skip Forward 10 */}
          <button
            onClick={() => setPlaybackIndex(i => Math.min((vehicleRoutes[selectedVehicle.id] || []).length - 1, i + 10))}
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
          <button className="px-3 py-1 rounded bg-gray-200 text-gray-500 text-xs cursor-not-allowed" disabled>Play</button>
          <button className="px-2 py-1 rounded bg-gray-200 text-gray-500 text-xs cursor-not-allowed" disabled>-1</button>
          <button className="px-2 py-1 rounded bg-gray-200 text-gray-500 text-xs cursor-not-allowed" disabled>-10</button>
          <input type="range" className="w-64 opacity-50" disabled />
          <button className="px-2 py-1 rounded bg-gray-200 text-gray-500 text-xs cursor-not-allowed" disabled>+1</button>
          <button className="px-2 py-1 rounded bg-gray-200 text-gray-500 text-xs cursor-not-allowed" disabled>+10</button>
          <div className="flex items-center gap-1 text-xs text-gray-700">
            <span>Speed:</span>
            <select className="border border-gray-300 rounded px-1 py-0.5 text-xs" disabled>
              <option>1x</option>
            </select>
          </div>
          <button className="px-2 py-1 rounded bg-gray-200 text-gray-500 text-xs cursor-not-allowed" disabled>Stop</button>
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
