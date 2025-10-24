/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState, useCallback } from 'react'; // Import React hooks untuk state management
import { TruckIcon, ClockIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline'; // Import ikon-ikon UI
import BaseTrackingMap from './BaseTrackingMap'; // Import komponen peta dasar
import TirePressureDisplay from './TirePressureDisplay'; // Import komponen display tekanan ban
import { tpmsAPI } from '../../services/api'; // BE1 TPMS data only

const LiveTrackingMapNew = () => {
  const [map, setMap] = useState(null); // State untuk menyimpan instance peta Leaflet
  const [mapUtils, setMapUtils] = useState(null); // State untuk utility functions peta
  const [vehicles, setVehicles] = useState([]); // State untuk daftar semua kendaraan
  const [selectedVehicle, setSelectedVehicle] = useState(null); // State untuk kendaraan yang sedang dipilih
  const [showVehicleCard, setShowVehicleCard] = useState(false); // Toggle visibility card info kendaraan
  const [showFilterDropdown, setShowFilterDropdown] = useState(false); // Toggle visibility dropdown filter
  const [loading, setLoading] = useState(true); // State loading saat fetch data
  const [setError] = useState(null); // State untuk menyimpan error (jika ada)
  const [clusterSelections, setClusterSelections] = useState(
    // State untuk filter cluster berdasarkan range nomor truk
    new Set(['1-199', '200-399', '400-599', '600-799', '800-999']) // Default: semua cluster aktif
  );
  const [vehicleRoutes, setVehicleRoutes] = useState({}); // State untuk menyimpan history rute tiap kendaraan
  const [isTrackingActive] = useState(true); // State tracking aktif/pause (default aktif)
  const [timeRange] = useState('24h'); // State range waktu untuk history (default 24 jam)
  const [, setSelectedDevice] = useState(null); // State untuk device IoT yang dipilih
  const [, setSelectedDeviceStatus] = useState(null); // State untuk status device IoT

  const markersRef = useRef({}); // Ref untuk menyimpan semua marker kendaraan di peta
  const markersLayerRef = useRef(null); // Ref untuk layer group yang berisi semua marker
  const liveRouteLineRef = useRef(null); // Ref untuk polyline rute yang sedang ditampilkan
  const liveRouteMarkersRef = useRef({ start: null, end: null }); // Ref untuk marker start & end point rute
  const wsRef = useRef(null); // Ref untuk koneksi WebSocket
  const wsSubscribedRef = useRef(false); // Flag apakah sudah subscribe ke WebSocket
  const lastHideStateRef = useRef(null); // Ref untuk menyimpan state visibility terakhir
  const rafRef = useRef(null); // Ref untuk requestAnimationFrame (animasi smooth)
  const focusHandledRef = useRef(false); // Flag untuk mencegah fokus berulang dari URL parameter
  const [backendOnline, setBackendOnline] = useState(false); // State status koneksi backend API
  const [wsStatus, setWsStatus] = useState('disconnected'); // State status koneksi WebSocket

  // Fungsi helper untuk normalisasi ID truk menjadi lowercase
  const normalizeTruckId = (id) => String(id || '').toLowerCase();

  // Resolve ID kendaraan menjadi UUID truck yang digunakan mapping device
  const resolveTruckUUID = (vehicleId) => {
    if (!vehicleId) return null; // Return null jika tidak ada vehicleId
    const idStr = String(vehicleId); // Konversi ke string
    if (idStr.length === 36 && idStr.includes('-')) return idStr; // Jika sudah format UUID, return langsung
    return idStr; // Return ID apa adanya jika bukan UUID
  };

  // Fungsi untuk ekstrak nomor truk dari ID atau nama
  const extractTruckNumber = (idOrName) => {
    if (!idOrName) return null; // Return null jika tidak ada input
    const str = String(idOrName); // Konversi ke string
    // Untuk serial number TPMS, ambil 3 digit terakhir
    if (str.length > 6) {
      return str.slice(-3); // Ambil 3 karakter terakhir
    }
    const m = str.match(/(\d{1,4})/); // Cari pattern angka 1-4 digit
    return m ? parseInt(m[1], 10) : null; // Parse ke integer atau return null
  };

  // Fungsi untuk cek apakah truk termasuk dalam cluster yang dipilih
  const inSelectedCluster = useCallback(
    (truckId) => {
      if (!clusterSelections || clusterSelections.size === 0) return true; // Jika tidak ada filter, tampilkan semua
      const n = extractTruckNumber(truckId); // Ekstrak nomor truk
      if (n == null) return false; // Jika tidak bisa ekstrak nomor, hide
      for (const key of clusterSelections) {
        // Loop setiap range yang dipilih
        const [lo, hi] = key.split('-').map(Number); // Parse range min-max
        if (n >= lo && n <= hi) return true; // Jika nomor dalam range, return true
      }
      return false; // Jika tidak ada range yang match, return false
    },
    [clusterSelections] // Re-run jika clusterSelections berubah
  );

  // Terapkan styling marker berdasarkan zoom dan viewport peta
  const applyMarkerZoomStyling = useCallback(() => {
    // Temporarily disabled to prevent glitches - markers will use default size
    if (!map) return; // Keluar jika map belum ready

    // Simple visibility check without scaling to prevent position glitches
    Object.values(markersRef.current).forEach((marker) => {
      // Loop semua marker
      try {
        const element = marker.getElement?.(); // Dapatkan DOM element marker
        if (element) {
          element.style.visibility = 'visible'; // Set visibility menjadi visible
        }
      } catch (err) {
        // Ignore errors for markers that might be removed
      }
    });
  }, [map]); // Re-run jika map berubah

  // Load data kendaraan live dari TPMS backend dengan fallback ke legacy backend
  const loadVehiclesFromBackend = async () => {
    try {
      setLoading(true); // Set loading state
      let items = []; // Array untuk menyimpan data kendaraan
      console.log('🔄 Loading live vehicles from TPMS...'); // Log proses loading
      const tpms = await tpmsAPI.getRealtimeSnapshot(); // Panggil API TPMS
      console.log('📡 TPMS response:', tpms); // Log response dari API
      if (tpms && tpms.success && Array.isArray(tpms.data)) {
        // Jika response sukses dan ada data
        items = tpms.data
          .map((d, index) => {
            // Map setiap item data
            const id = d?.sn ? String(d.sn) : null; // Ambil serial number sebagai ID

            // Get location from either location array or direct lat_lng field
            let lat = NaN; // Inisialisasi latitude sebagai NaN
            let lng = NaN; // Inisialisasi longitude sebagai NaN
            let lastUpdate = new Date(); // Inisialisasi waktu update

            if (d?.location && Array.isArray(d.location) && d.location.length > 0) {
              // Jika ada array location
              // Use the most recent location from the array
              const latestLocation = d.location[0]; // Ambil lokasi terbaru (index 0)
              const latlngStr = latestLocation?.lat_lng || ''; // Ambil string lat,lng
              const parts = String(latlngStr).split(','); // Split berdasarkan koma
              lat = parts[0] != null ? parseFloat(String(parts[0]).trim()) : NaN; // Parse latitude
              lng = parts[1] != null ? parseFloat(String(parts[1]).trim()) : NaN; // Parse longitude
              lastUpdate = latestLocation?.createdAt // Set waktu update
                ? new Date(latestLocation.createdAt)
                : new Date();
            } else if (d?.location?.lat_lng) {
              // Fallback ke field lat_lng langsung
              // Fallback to direct lat_lng field
              const latlngStr = d.location.lat_lng || ''; // Ambil string lat,lng
              const parts = String(latlngStr).split(','); // Split berdasarkan koma
              lat = parts[0] != null ? parseFloat(String(parts[0]).trim()) : NaN; // Parse latitude
              lng = parts[1] != null ? parseFloat(String(parts[1]).trim()) : NaN; // Parse longitude
              lastUpdate = d.location?.createdAt ? new Date(d.location.createdAt) : new Date(); // Set waktu update
            }

            // Validate coordinates are within reasonable bounds
            const isValidLat = isFinite(lat) && lat >= -90 && lat <= 90; // Validasi latitude (-90 sampai 90)
            const isValidLng = isFinite(lng) && lng >= -180 && lng <= 180; // Validasi longitude (-180 sampai 180)

            if (!id || !isValidLat || !isValidLng) {
              // Jika ID atau koordinat tidak valid
              console.warn(`⚠️ Invalid coordinates for vehicle ${id}: lat=${lat}, lng=${lng}`); // Log warning
              return null; // Return null untuk skip item ini
            }
            console.log(`📍 Vehicle ${id} position: [${lat}, ${lng}]`); // Log posisi kendaraan
            console.log(`🔧 Vehicle ${id} tire data:`, d?.tire); // Log data ban
            return {
              // Return object kendaraan
              id, // ID kendaraan (serial number)
              truckNumber: index + 1, // Nomor truk (index + 1)
              position: [lat, lng], // Posisi [latitude, longitude]
              status: 'active', // Status default: active
              speed: 0, // Kecepatan default: 0
              heading: 0, // Arah heading default: 0
              fuel: 0, // Bahan bakar default: 0
              battery: 0, // Battery default: 0
              signal: 'unknown', // Signal default: unknown
              lastUpdate: lastUpdate, // Waktu update terakhir
              tireData: d?.tire || [], // Data tekanan ban (dari TPMS)
            };
          })
          .filter(Boolean); // Filter out nilai null
        console.log(`✅ Loaded ${items.length} vehicles from TPMS`); // Log jumlah kendaraan yang berhasil di-load
        setBackendOnline(true); // Set status backend online
        setWsStatus('disconnected'); // Set WebSocket status disconnected
      } else {
        // Jika TPMS gagal, tidak ada fallback - tampilkan error
        console.error('❌ TPMS failed, no vehicles loaded');
        throw new Error(tpms.error || 'Failed to load vehicles from TPMS');
      }

      setVehicles(items || []); // Update state vehicles dengan data yang di-load
    } catch (error) {
      console.error('❌ Failed to load truck data from backend:', error); // Log error
      setVehicles([]); // Set vehicles menjadi array kosong
      setBackendOnline(false); // Set backend offline
    } finally {
      setLoading(false); // Set loading selesai
    }
  };

  // Handler saat peta siap digunakan
  const onMapReady = (mapInstance, utils) => {
    setMap(mapInstance); // Simpan instance map ke state
    setMapUtils(utils); // Simpan utility functions ke state
    try {
      const L = window.L || require('leaflet'); // eslint-disable-line no-undef
      // Ambil library Leaflet
      if (!markersLayerRef.current) {
        // Jika layer markers belum dibuat
        markersLayerRef.current = L.layerGroup([], { pane: 'markersPane' }).addTo(mapInstance); // Buat layer group untuk markers
      }
    } catch (err) {
      void err; // Abaikan error
    }

    // Apply marker styling on zoom/move
    mapInstance.on('zoom', () => applyMarkerZoomStyling()); // Event listener saat zoom
    mapInstance.on('zoomend', () => applyMarkerZoomStyling()); // Event listener saat zoom selesai
    mapInstance.on('move', () => applyMarkerZoomStyling()); // Event listener saat pan/move
    mapInstance.on('moveend', () => applyMarkerZoomStyling()); // Event listener saat pan/move selesai
  };

  // Load truck data from backend only
  useEffect(() => {
    loadVehiclesFromBackend(); // Panggil fungsi load data kendaraan
  }, [timeRange, mapUtils]); // Re-run saat timeRange atau mapUtils berubah

  // WebSocket setup (disabled until WS integration is configured)
  useEffect(() => {
    setWsStatus('disconnected'); // Set status WebSocket disconnected (fitur belum aktif)
  }, []); // Hanya run sekali saat mount

  // Backend connection monitor
  useEffect(() => {
    setBackendOnline(true); // Set backend online (monitoring connection)
  }, []); // Hanya run sekali saat mount

  // Geofence-aware smooth movement for live tracking
  useEffect(() => {
    if (!isTrackingActive || !mapUtils) return; // Keluar jika tracking tidak aktif atau mapUtils belum ready
    const centroid = mapUtils.polygonCentroid(mapUtils.polygonLatLng); // Hitung centroid/titik tengah polygon geofence
    const interval = setInterval(() => {
      // Set interval setiap 1 detik
      setVehicles(
        (
          prevVehicles // Update state vehicles
        ) =>
          prevVehicles.map((vehicle) => {
            // Map setiap kendaraan
            if (vehicle.status !== 'active') return vehicle; // Skip jika status bukan active
            const currentRoute = vehicleRoutes[vehicle.id] || []; // Ambil rute kendaraan ini
            const lastPos = currentRoute[currentRoute.length - 1] || vehicle.position; // Ambil posisi terakhir
            const baseBearing = vehicle.heading ?? 90; // Ambil heading/arah kendaraan (default 90)
            const rawDrift = (Math.random() - 0.5) * 2; // Random drift untuk gerakan natural
            const targetBearing = baseBearing + rawDrift; // Hitung target bearing dengan drift
            const nextBearing = baseBearing + (targetBearing - baseBearing) * 0.2; // Smooth transition bearing
            const stepM = 1; // Jarak perpindahan per step (1 meter)

            let nextPos = mapUtils.moveByMeters(lastPos, stepM, nextBearing); // Hitung posisi berikutnya
            if (!mapUtils.pointInPolygon(nextPos, mapUtils.polygonLatLng)) {
              // Jika posisi keluar dari geofence
              const dy = centroid[0] - lastPos[0]; // Hitung delta Y ke centroid
              const dx = centroid[1] - lastPos[1]; // Hitung delta X ke centroid
              const bearingToCentroid = (Math.atan2(dx, dy) * 180) / Math.PI; // Hitung bearing menuju centroid
              nextPos = mapUtils.moveByMeters(lastPos, stepM, bearingToCentroid); // Gerakkan ke arah centroid
              if (!mapUtils.pointInPolygon(nextPos, mapUtils.polygonLatLng)) {
                // Jika masih keluar
                nextPos = mapUtils.moveByMeters(lastPos, stepM, (baseBearing + 180) % 360); // Putar balik 180 derajat
              }
            }

            setVehicleRoutes((prev) => {
              // Update rute kendaraan
              const current = prev[vehicle.id] || []; // Ambil rute saat ini
              const last = current[current.length - 1] || lastPos; // Ambil posisi terakhir
              const moved = mapUtils.haversineMeters(last, nextPos); // Hitung jarak perpindahan (meter)
              if (moved >= 0.5) {
                // Jika bergerak minimal 0.5 meter
                const limited = [...current, nextPos].slice(-200); // Tambahkan posisi baru, batasi 200 point terakhir
                return { ...prev, [vehicle.id]: limited }; // Return rute yang diupdate
              }
              return prev; // Return rute lama jika tidak bergerak signifikan
            });

            return {
              // Return object kendaraan yang diupdate
              ...vehicle, // Copy semua properti lama
              position: nextPos, // Update posisi baru
              heading: (nextBearing + 360) % 360, // Update heading (normalize 0-360)
              speed: 3.6, // Update kecepatan (3.6 km/h)
              lastUpdate: new Date(), // Update timestamp
            };
          })
      );
    }, 1000); // Interval 1000ms (1 detik)

    return () => clearInterval(interval); // Cleanup interval saat unmount
  }, [isTrackingActive, vehicleRoutes, mapUtils]); // Re-run jika dependencies berubah

  // Helper functions
  const formatLastUpdate = (date) => {
    const now = new Date(); // Waktu sekarang
    const diff = Math.floor((now - date) / 1000); // Selisih dalam detik

    if (diff < 60) return `${diff}s ago`; // Jika < 60 detik, tampilkan dalam detik
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`; // Jika < 1 jam, tampilkan dalam menit
    return `${Math.floor(diff / 3600)}h ago`; // Tampilkan dalam jam
  };

  // Reconcile markers when data changes (reuse markers for performance)
  useEffect(() => {
    if (map && vehicles) {
      // Jika map dan vehicles sudah ready
      const L = window.L || require('leaflet'); // eslint-disable-line no-undef
      // Ambil library Leaflet
      if (!markersLayerRef.current) {
        // Jika layer markers belum dibuat
        try {
          markersLayerRef.current = L.layerGroup([], { pane: 'markersPane' }).addTo(map); // Buat layer group
        } catch (err) {
          void err; // Abaikan error
        }
      }

      const existing = markersRef.current; // Ambil markers yang sudah ada
      const seen = new Set(); // Set untuk tracking marker yang masih digunakan

      vehicles.forEach((vehicle) => {
        // Loop setiap kendaraan
        const colors = {
          // Palet warna berdasarkan status
          active: '#10b981', // Hijau untuk active
          idle: '#f59e0b', // Oranye untuk idle
          maintenance: '#ef4444', // Merah untuk maintenance
          offline: '#6b7280', // Abu-abu untuk offline
        };

        if (!inSelectedCluster(vehicle.id)) {
          // Jika kendaraan tidak dalam cluster yang dipilih
          return; // Skip kendaraan ini
        }

        const truckNum = vehicle.truckNumber || extractTruckNumber(vehicle.id) || ''; // Ekstrak nomor truk
        const buildIcon = (
          status // Fungsi untuk build custom icon
        ) =>
          L.divIcon({
            html: ` 
            <div style="position: relative;">
              <div style="background: ${colors[status] || colors.offline}; color: #ffffff; border: 2px solid #ffffff; border-radius: 6px; padding: 2px 6px; min-width: 26px; height: 20px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.25);">
                ${truckNum}
              </div>
              <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${colors[status] || colors.offline}; margin: 0 auto; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));"></div>
            </div>
          `, // HTML untuk icon dengan nomor truk dan pointer
            className: 'custom-truck-icon', // Class CSS
            iconSize: [28, 28], // Ukuran icon
            iconAnchor: [14, 28], // Anchor point (bottom center)
          });

        let marker = existing[vehicle.id]; // Cek apakah marker sudah ada
        if (!marker) {
          // Jika marker belum ada, buat baru
          console.log(`🆕 Creating new marker for ${vehicle.id} at position:`, vehicle.position); // Log pembuatan marker
          marker = L.marker(vehicle.position, {
            // Buat marker baru
            icon: buildIcon(vehicle.status), // Set icon custom
            zIndexOffset: 1000, // Set z-index tinggi
            pane: 'markersPane', // Tambahkan ke pane markers
            // Add options to prevent positioning issues
            keyboard: false, // Disable keyboard navigation
            riseOnHover: false, // Jangan naikkan z-index saat hover
          });
          marker.addTo(map); // Tambahkan marker ke peta
          existing[vehicle.id] = marker; // Simpan referensi marker
          marker._status = vehicle.status; // Simpan status untuk tracking perubahan

          // Add click handler only once when creating marker
          marker.on('click', async () => {
            // Event handler saat marker diklik
            setSelectedVehicle(vehicle); // Set kendaraan yang dipilih
            setShowVehicleCard(true); // Tampilkan card info kendaraan

            // Clear IoT device info (no dummy lookups)
            setSelectedDevice(null); // Clear device info
            setSelectedDeviceStatus(null); // Clear device status

            // Show live route for this vehicle
            try {
              if (liveRouteLineRef.current && map) {
                // Jika ada rute yang sedang ditampilkan
                try {
                  map.removeLayer(liveRouteLineRef.current); // Hapus rute lama
                } catch (err) {
                  void err; // Abaikan error
                }
                liveRouteLineRef.current = null; // Reset referensi
              }

              const L = window.L || require('leaflet'); // eslint-disable-line no-undef
              // Ambil library Leaflet

              let routeHistory = vehicleRoutes[vehicle.id] || []; // Ambil history rute dari state

              if (routeHistory.length <= 1) {
                // Jika rute belum ada/kurang, coba load dari backend
                // Try to load from backend
                try {
                  const histRes = await tpmsAPI.getLocationHistory(vehicle.id, {
                    // Request history dari API
                    range: timeRange, // Dengan range waktu yang dipilih
                  });
                  if (histRes.success && Array.isArray(histRes.data)) {
                    // Jika request sukses
                    const coords = histRes.data
                      .map((p) => {
                        // Map setiap point
                        const lat = p?.lat ?? p?.latitude; // Ambil latitude
                        const lng = p?.lng ?? p?.longitude; // Ambil longitude
                        return isFinite(lat) && isFinite(lng) ? [Number(lat), Number(lng)] : null; // Validasi koordinat
                      })
                      .filter(Boolean); // Filter out nilai null
                    if (coords.length > 1) {
                      // Jika ada minimal 2 point
                      routeHistory = coords; // Set sebagai route history
                    }
                  }
                } catch (e) {
                  console.warn('Failed to load route history from backend:', e); // Log error
                }
              }

              if (Array.isArray(routeHistory) && routeHistory.length > 1) {
                // Jika ada rute dengan minimal 2 point
                const routeColor = '#2563eb'; // Warna biru untuk rute
                liveRouteLineRef.current = L.polyline(routeHistory, {
                  // Buat polyline untuk rute
                  color: routeColor, // Warna garis
                  weight: 3, // Ketebalan garis
                  opacity: 0.9, // Transparansi
                  smoothFactor: 2, // Faktor smoothing
                  lineJoin: 'round', // Join style
                  lineCap: 'round', // Cap style
                  pane: 'routesPane', // Pane untuk rute
                }).addTo(map); // Tambahkan ke peta

                if (liveRouteMarkersRef.current.start)
                  // Jika ada marker start sebelumnya
                  try {
                    map.removeLayer(liveRouteMarkersRef.current.start); // Hapus marker start lama
                  } catch (err) {
                    void err; // Abaikan error
                  }
                if (liveRouteMarkersRef.current.end)
                  // Jika ada marker end sebelumnya
                  try {
                    map.removeLayer(liveRouteMarkersRef.current.end); // Hapus marker end lama
                  } catch (err) {
                    void err; // Abaikan error
                  }

                const startIcon = L.divIcon({
                  // Icon untuk start point
                  html: `<div style="background:white;border:2px solid ${routeColor};border-radius:50%;width:14px;height:14px;"></div>`,
                  className: 'live-route-start', // Class CSS
                  iconSize: [14, 14], // Ukuran icon
                  iconAnchor: [7, 7], // Anchor point (center)
                });
                const endIcon = L.divIcon({
                  // Icon untuk end point
                  html: `<div style="position:relative;"><div style="background:${routeColor};color:#fff;border:2px solid #fff;border-radius:6px;padding:2px 6px;min-width:20px;height:18px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:10px;box-shadow:0 2px 6px rgba(0,0,0,.25);">END</div><div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${routeColor};margin:0 auto;filter:drop-shadow(0 2px 2px rgba(0,0,0,.2));"></div></div>`,
                  className: 'live-route-end', // Class CSS
                  iconSize: [26, 26], // Ukuran icon
                  iconAnchor: [13, 26], // Anchor point (bottom center)
                });

                liveRouteMarkersRef.current.start = L.marker(routeHistory[0], {
                  // Marker untuk start point
                  icon: startIcon, // Set icon
                  pane: 'routesPane', // Pane untuk rute
                }).addTo(map); // Tambahkan ke peta
                liveRouteMarkersRef.current.end = L.marker(routeHistory[routeHistory.length - 1], {
                  // Marker untuk end point
                  icon: endIcon, // Set icon
                  pane: 'routesPane', // Pane untuk rute
                }).addTo(map); // Tambahkan ke peta

                try {
                  map.fitBounds(liveRouteLineRef.current.getBounds().pad(0.05)); // Zoom ke bounds rute dengan padding 5%
                } catch (err) {
                  void err; // Abaikan error
                }
              }
            } catch (e) {
              console.warn('Failed to show live route:', e); // Log error
            }
          });
        } else {
          // Jika marker sudah ada sebelumnya
          // Update existing marker position and icon
          console.log(`🔄 Updating marker ${vehicle.id} to position:`, vehicle.position); // Log update marker

          // Update position cleanly without timeout to prevent glitches
          try {
            marker.setLatLng(vehicle.position); // Update posisi marker
          } catch (err) {
            console.warn('Failed to update marker position:', err); // Log error
          }

          if (marker._status !== vehicle.status) {
            // Jika status berubah
            marker.setIcon(buildIcon(vehicle.status)); // Update icon dengan warna baru
            marker._status = vehicle.status; // Update status tracking
          }
        }

        // Ensure visible
        try {
          const el = marker.getElement?.(); // Ambil DOM element marker
          if (el) el.style.visibility = 'visible'; // Set visibility menjadi visible
        } catch (err) {
          void err; // Abaikan error
        }

        seen.add(vehicle.id); // Tandai marker ini sebagai sudah diproses
      });

      // Remove markers that are no longer present
      Object.keys(existing).forEach((id) => {
        // Loop semua marker yang ada
        if (!seen.has(id)) {
          // Jika marker tidak ada di data vehicles terbaru
          try {
            const m = existing[id]; // Ambil marker
            if (m && map.hasLayer(m)) {
              // Jika marker ada di peta
              map.removeLayer(m); // Hapus dari peta
            }
          } catch (err) {
            void err; // Abaikan error
          }
          delete existing[id]; // Hapus dari object existing
        }
      });
    }
  }, [map, vehicles, clusterSelections, inSelectedCluster, vehicleRoutes, timeRange]); // Re-run jika dependencies berubah

  // Re-apply marker zoom styling whenever map or selection changes
  useEffect(() => {
    applyMarkerZoomStyling(); // Terapkan styling marker
  }, [map, vehicles, clusterSelections, applyMarkerZoomStyling]); // Re-run jika dependencies berubah

  // Handle focus via URL param ?focus=<truck>
  useEffect(() => {
    if (!map || vehicles.length === 0 || focusHandledRef.current) return; // Keluar jika belum ready atau sudah dihandle
    try {
      const params = new URLSearchParams(window.location.search || ''); // Parse URL query params
      const focus = params.get('focus'); // Ambil parameter 'focus'
      if (!focus) return; // Keluar jika tidak ada parameter focus
      const target = // Cari kendaraan berdasarkan ID
        vehicles.find((v) => String(v.id) === focus) || // Cari exact match
        vehicles.find((v) => String(v.id).toLowerCase().includes(String(focus).toLowerCase())); // Cari partial match
      if (!target) return; // Keluar jika kendaraan tidak ditemukan
      const marker = markersRef.current[target.id]; // Ambil marker kendaraan
      if (marker) {
        // Jika marker sudah ada di peta
        try {
          marker.fire('click'); // Trigger click event marker
        } catch (err) {
          void err; // Abaikan error
        }
        try {
          map.setView(target.position, Math.max(map.getZoom(), 16), { animate: true }); // Zoom ke kendaraan (min zoom 16)
        } catch (err) {
          void err; // Abaikan error
        }
      } else {
        // Jika marker belum ada (fallback)
        // Fallback: set directly
        setSelectedVehicle(target); // Set kendaraan yang dipilih
        setShowVehicleCard(true); // Tampilkan card
        try {
          map.setView(target.position, Math.max(map.getZoom(), 16), { animate: true }); // Zoom ke kendaraan
        } catch (err) {
          void err; // Abaikan error
        }
      }
      focusHandledRef.current = true; // Tandai sudah dihandle (prevent duplicate)
    } catch (err) {
      void err; // Abaikan error
    }
  }, [map, vehicles]); // Re-run jika map atau vehicles berubah

  const additionalControls = // JSX untuk kontrol tambahan di header peta
    (
      <>
        {/* Status Indikator: LIVE/PAUSED */}
        <div className="border-l border-gray-300 pl-3 flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${isTrackingActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} // Dot hijau berkedip jika live, merah jika paused
          ></div>
          <span className="text-xs text-gray-700 font-medium">
            {isTrackingActive ? 'LIVE' : 'PAUSED'} {/* Label status */}
          </span>
        </div>
        {/* Status Indikator: API Online/Offline */}
        <div className="border-l border-gray-300 pl-3 flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-green-500' : 'bg-red-500'}`} // Dot hijau jika online, merah jika offline
          ></div>
          <span className="text-xs text-gray-700 font-medium">
            API {backendOnline ? 'Online' : 'Offline'} {/* Label status API */}
          </span>
        </div>
        {/* Status Indikator: WebSocket */}
        <div className="border-l border-gray-300 pl-3 flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${wsStatus === 'connected' ? 'bg-green-500' : wsStatus === 'connecting' || wsStatus === 'reconnecting' ? 'bg-yellow-500' : 'bg-red-500'}`} // Hijau=connected, kuning=connecting, merah=disconnected
          ></div>
          <span className="text-xs text-gray-700 font-medium">WS {wsStatus}</span>{' '}
          {/* Label status WebSocket */}
        </div>

        {/* Filter Dropdown */}
        <div className="relative border-l border-gray-300 pl-3">
          {' '}
          {/* Container dropdown filter */}
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)} // Toggle visibility dropdown
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
            aria-label="Open filter options"
          >
            <FunnelIcon className="w-3 h-3" /> {/* Icon filter */}
            Filter {/* Label button */}
          </button>
          {showFilterDropdown && ( // Tampilkan dropdown jika showFilterDropdown true
            <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-48 z-50">
              {' '}
              {/* Panel dropdown */}
              <div className="text-xs font-medium text-gray-700 mb-2">Cluster (Truck No)</div>{' '}
              {/* Header dropdown */}
              <div className="grid grid-cols-1 gap-2 text-xs">
                {' '}
                {/* Container checkbox list */}
                {['1-199', '200-399', '400-599', '600-799', '800-999'].map(
                  (
                    range // Loop setiap range cluster
                  ) => (
                    <label
                      key={range}
                      className="flex items-center gap-2 cursor-pointer select-none"
                    >
                      {' '}
                      {/* Label checkbox */}
                      <input
                        type="checkbox" // Checkbox input
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={clusterSelections.has(range)} // Checked jika range ada di Set
                        onChange={(e) => {
                          // Handler saat checkbox diubah
                          setClusterSelections((prev) => {
                            // Update state clusterSelections
                            const next = new Set(prev); // Copy Set lama
                            if (e.target.checked)
                              next.add(range); // Tambahkan range jika checked
                            else next.delete(range); // Hapus range jika unchecked
                            return next; // Return Set baru
                          });
                        }}
                        disabled={loading} // Disable saat loading
                      />
                      <span>{range}</span> {/* Label range */}
                    </label>
                  )
                )}
              </div>
              <div className="mt-2 text-[10px] text-gray-500">Unchecked ranges are hidden</div>{' '}
              {/* Info text */}
            </div>
          )}
        </div>
      </>
    );

  return (
    // Return JSX component
    <>
      <BaseTrackingMap // Komponen peta dasar
        onMapReady={onMapReady} // Callback saat peta ready
        additionalControls={additionalControls} // Kontrol tambahan (status indicators & filter)
        showCompass={true} // Tampilkan compass
        showMapStyleToggle={true} // Tampilkan toggle style peta
        showAutoCenter={true} // Tampilkan tombol auto center
        showFitRoutes={false} // Sembunyikan tombol fit routes
      >
        {/* Vehicle Info Card */}
        {showVehicleCard &&
          selectedVehicle && ( // Tampilkan card jika ada kendaraan yang dipilih
            <div
              className="absolute bg-white rounded-xl shadow-lg border border-gray-200 p-5 w-[380px] max-h-[calc(100vh-220px)] overflow-y-auto z-50" // Card container dengan scroll
              style={{ left: '24px', top: '80px' }} // Posisi card di kiri atas peta
            >
              {/* Vehicle banner image */}
              <div className="mb-4 overflow-hidden rounded-lg border border-gray-100">
                {' '}
                {/* Container gambar banner */}
                <img src="/icon2.png" alt="Truck" className="h-32 w-full object-cover" />{' '}
                {/* Gambar truk */}
              </div>
              {/* Header */}
              <div className="flex items-start justify-between">
                {' '}
                {/* Container header card */}
                <div>
                  {' '}
                  {/* Info kendaraan */}
                  <h4 className="text-lg font-semibold text-gray-900 leading-tight">
                    {selectedVehicle.id} {/* ID/nama kendaraan */}
                  </h4>
                  <p className="text-sm text-gray-500">
                    Driver: {selectedVehicle.driver || 'Unknown'} {/* Nama driver */}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {' '}
                  {/* Container status badge dan tombol close */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${
                      selectedVehicle.status === 'active' // Badge status dengan warna kondisional
                        ? 'bg-green-50 text-green-700 border-green-200' // Hijau untuk active
                        : selectedVehicle.status === 'idle'
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200' // Kuning untuk idle
                          : 'bg-gray-50 text-gray-700 border-gray-200' // Abu-abu untuk lainnya
                    }`}
                  >
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full ${
                        // Dot status indicator
                        selectedVehicle.status === 'active'
                          ? 'bg-green-500' // Hijau untuk active
                          : selectedVehicle.status === 'idle'
                            ? 'bg-yellow-500' // Kuning untuk idle
                            : 'bg-gray-400' // Abu-abu untuk lainnya
                      }`}
                    />
                    {selectedVehicle.status} {/* Label status */}
                  </span>
                  <button
                    onClick={() => {
                      // Handler saat tombol close diklik
                      setShowVehicleCard(false); // Sembunyikan card
                      setSelectedVehicle(null); // Clear kendaraan yang dipilih
                      if (liveRouteLineRef.current && map) {
                        // Jika ada rute yang ditampilkan
                        try {
                          map.removeLayer(liveRouteLineRef.current); // Hapus polyline rute
                        } catch {
                          /* empty */
                        }
                        liveRouteLineRef.current = null; // Reset referensi
                      }
                      if (liveRouteMarkersRef.current.start)
                        // Jika ada marker start
                        try {
                          map.removeLayer(liveRouteMarkersRef.current.start); // Hapus marker start
                        } catch {
                          /* empty */
                        }
                      if (liveRouteMarkersRef.current.end)
                        // Jika ada marker end
                        try {
                          map.removeLayer(liveRouteMarkersRef.current.end); // Hapus marker end
                        } catch {
                          /* empty */
                        }
                    }}
                    className="p-1.5 rounded-md hover:bg-gray-100" // Button styling
                    aria-label="Close vehicle card"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-500" /> {/* Icon close (X) */}
                  </button>
                </div>
              </div>

              {/* Key metrics - quick scan rows with icons */}
              <div className="mt-4 flex flex-col gap-2">
                {' '}
                {/* Container untuk metrik-metrik kendaraan */}
                {/* Speed */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/40 border border-blue-100">
                  {' '}
                  {/* Card metrik kecepatan */}
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-blue-100 border border-blue-200 text-blue-600">
                      {' '}
                      {/* Icon container */}
                      <span className="material-symbols-outlined text-[18px] leading-none">
                        speed {/* Material icon untuk kecepatan */}
                      </span>
                    </span>
                    <span className="text-sm text-gray-700">Speed</span> {/* Label metrik */}
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {selectedVehicle.speed} km/h {/* Nilai kecepatan dalam km/h */}
                  </div>
                </div>
                {/* Fuel */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50/40 border border-amber-100">
                  {' '}
                  {/* Card metrik bahan bakar */}
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-amber-100 border border-amber-200 text-amber-600">
                      {' '}
                      {/* Icon container */}
                      <span className="material-symbols-outlined text-[18px] leading-none">
                        local_gas_station {/* Material icon untuk bahan bakar */}
                      </span>
                    </span>
                    <span className="text-sm text-gray-700">Fuel</span> {/* Label metrik */}
                  </div>
                  <div className="text-sm font-semibold text-gray-900">{selectedVehicle.fuel}%</div>{' '}
                  {/* Nilai fuel dalam persen */}
                </div>
                {/* Signal */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-violet-50/40 border border-violet-100">
                  {' '}
                  {/* Card metrik signal */}
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-violet-100 border border-violet-200 text-violet-600">
                      {' '}
                      {/* Icon container */}
                      <span className="material-symbols-outlined text-[18px] leading-none">
                        signal_cellular_alt {/* Material icon untuk signal */}
                      </span>
                    </span>
                    <span className="text-sm text-gray-700">Signal</span> {/* Label metrik */}
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {selectedVehicle.signal}
                  </div>{' '}
                  {/* Nilai signal strength */}
                </div>
              </div>

              {/* Last update */}
              <div className="mt-4 flex items-center justify-between rounded-lg border border-gray-200 p-3">
                {' '}
                {/* Card waktu update terakhir */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <ClockIcon className="w-4 h-4 text-gray-500" /> {/* Icon clock */}
                  Last update {/* Label */}
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {formatLastUpdate(selectedVehicle.lastUpdate)}{' '}
                  {/* Waktu update dalam format relatif (e.g., "5m ago") */}
                </div>
              </div>

              {/* Tire Pressure Display */}
              <div className="mt-5">
                {' '}
                {/* Container display tekanan ban */}
                <div className="rounded-lg border border-gray-200 p-3">
                  {' '}
                  {/* Card border */}
                  <TirePressureDisplay // Komponen untuk menampilkan tekanan ban TPMS
                    selectedTruckId={selectedVehicle?.id} // Pass truck ID
                    tireData={selectedVehicle?.tireData} // Pass data tekanan ban
                    showHeader={true} // Tampilkan header komponen
                  />
                </div>
              </div>

              {/* CTA */}
              <div className="mt-5">
                {' '}
                {/* Container tombol CTA */}
                <a
                  href={`/history?focus=${encodeURIComponent(String(selectedVehicle?.id || ''))}`} // Link ke halaman history dengan parameter focus
                  className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-2.5 px-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span>View Route History</span> {/* Label tombol */}
                </a>
              </div>
            </div>
          )}
      </BaseTrackingMap>

      {/* Click outside to close filter dropdown */}
      {showFilterDropdown && ( // Overlay untuk close dropdown saat klik di luar
        <div className="fixed inset-0 z-40" onClick={() => setShowFilterDropdown(false)} /> // Full screen invisible overlay
      )}
    </>
  );
};

export default LiveTrackingMapNew; // Export komponen
