/**
 * Custom React Hooks for Backend 2 API (Management & Master Data)
 * Provides easy-to-use hooks for data fetching and state management
 */

import { useState, useEffect, useCallback } from 'react';
import {
  trucksApi,
  dashboardApi,
  driversApi,
  vendorsApi,
  devicesApi,
  sensorsApi,
  alertsApi,
  miningAreaApi,
  fleetApi,
} from 'services/management';

/**
 * Hook for fetching trucks with filters
 * @param {Object} filters - { page, limit, status, minFuel, search }
 * @returns {Object} - { trucks, loading, error, refetch, totalPages, stats }
 */
export const useTrucks = (filters = {}) => {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState(null);

  const fetchTrucks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await trucksApi.getAll(filters);
      setTrucks(response.data?.trucks || []);
      setTotalPages(response.data?.pagination?.totalPages || 1);
      setStats(response.data?.stats || null);
    } catch (err) {
      setError(err.message || 'Failed to fetch trucks');
      console.error('Error fetching trucks:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTrucks();
  }, [fetchTrucks]);

  return { trucks, loading, error, refetch: fetchTrucks, totalPages, stats };
};

/**
 * Hook for fetching single truck by ID
 * @param {string} truckId
 * @returns {Object} - { truck, loading, error, refetch }
 */
export const useTruck = (truckId) => {
  const [truck, setTruck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTruck = useCallback(async () => {
    if (!truckId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await trucksApi.getById(truckId);
      setTruck(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch truck');
      console.error('Error fetching truck:', err);
    } finally {
      setLoading(false);
    }
  }, [truckId]);

  useEffect(() => {
    fetchTruck();
  }, [fetchTruck]);

  return { truck, loading, error, refetch: fetchTruck };
};

/**
 * Hook for dashboard statistics
 * @returns {Object} - { stats, loading, error, refetch }
 */
export const useDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardApi.getStats();
      setStats(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard stats');
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
};

/**
 * Hook for fetching drivers
 * @param {Object} params - { page, limit }
 * @returns {Object} - { drivers, loading, error, refetch, totalPages }
 */
export const useDrivers = (params = {}) => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await driversApi.getAll(params);
      setDrivers(response.data?.drivers || []);
      setTotalPages(response.data?.pagination?.totalPages || 1);
    } catch (err) {
      setError(err.message || 'Failed to fetch drivers');
      console.error('Error fetching drivers:', err);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  return { drivers, loading, error, refetch: fetchDrivers, totalPages };
};

/**
 * Hook for fetching vendors
 * @param {Object} params - { page, limit }
 * @returns {Object} - { vendors, loading, error, refetch, totalPages }
 */
export const useVendors = (params = {}) => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await vendorsApi.getAll(params);
      setVendors(response.data?.vendors || []);
      setTotalPages(response.data?.pagination?.totalPages || 1);
    } catch (err) {
      setError(err.message || 'Failed to fetch vendors');
      console.error('Error fetching vendors:', err);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  return { vendors, loading, error, refetch: fetchVendors, totalPages };
};

/**
 * Hook for fetching devices
 * @param {Object} params - { page, limit, type }
 * @returns {Object} - { devices, loading, error, refetch, totalPages }
 */
export const useDevices = (params = {}) => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await devicesApi.getAll(params);
      setDevices(response.data?.devices || []);
      setTotalPages(response.data?.pagination?.totalPages || 1);
    } catch (err) {
      setError(err.message || 'Failed to fetch devices');
      console.error('Error fetching devices:', err);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  return { devices, loading, error, refetch: fetchDevices, totalPages };
};

/**
 * Hook for fetching alerts
 * @param {Object} params - { severity, resolved, limit, page }
 * @returns {Object} - { alerts, loading, error, refetch }
 */
export const useAlerts = (params = {}) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await alertsApi.getAll(params);
      setAlerts(response.data?.alerts || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch alerts');
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return { alerts, loading, error, refetch: fetchAlerts };
};

/**
 * Hook for fetching mining areas
 * @returns {Object} - { areas, loading, error, refetch }
 */
export const useMiningAreas = () => {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAreas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await miningAreaApi.getAll();
      setAreas(response.data?.areas || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch mining areas');
      console.error('Error fetching mining areas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

  return { areas, loading, error, refetch: fetchAreas };
};

/**
 * Hook for real-time truck locations
 * @returns {Object} - { locations, loading, error, refetch }
 */
export const useRealtimeLocations = () => {
  const [locations, setLocations] = useState({ type: 'FeatureCollection', features: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await trucksApi.getRealtimeLocations();
      setLocations(response.data || { type: 'FeatureCollection', features: [] });
    } catch (err) {
      setError(err.message || 'Failed to fetch locations');
      console.error('Error fetching locations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
    // Refresh every 30 seconds
    const interval = setInterval(fetchLocations, 30000);
    return () => clearInterval(interval);
  }, [fetchLocations]);

  return { locations, loading, error, refetch: fetchLocations };
};

/**
 * Hook for sensors with filters
 * @param {Object} params - { page, limit, device_id, status, tireNo, search }
 * @returns {Object} - { sensors, loading, error, refetch, totalPages }
 */
export const useSensors = (params = {}) => {
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSensors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await sensorsApi.getAll(params);
      setSensors(response.data?.sensors || []);
      setTotalPages(response.data?.pagination?.totalPages || 1);
    } catch (err) {
      setError(err.message || 'Failed to fetch sensors');
      console.error('Error fetching sensors:', err);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchSensors();
  }, [fetchSensors]);

  return { sensors, loading, error, refetch: fetchSensors, totalPages };
};

/**
 * Hook for fleet summary
 * @returns {Object} - { fleet, loading, error, refetch }
 */
export const useFleet = () => {
  const [fleet, setFleet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFleet = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fleetApi.getSummary();
      setFleet(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch fleet summary');
      console.error('Error fetching fleet summary:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFleet();
  }, [fetchFleet]);

  return { fleet, loading, error, refetch: fetchFleet };
};

/**
 * Generic CRUD hook for any entity
 * @param {Object} api - API service object with create, update, delete methods
 * @returns {Object} - CRUD operations
 */
export const useCRUD = (api) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const create = useCallback(
    async (data) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.create(data);
        return response;
      } catch (err) {
        setError(err.message || 'Failed to create');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const update = useCallback(
    async (id, data) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.update(id, data);
        return response;
      } catch (err) {
        setError(err.message || 'Failed to update');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const remove = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.delete(id);
        return response;
      } catch (err) {
        setError(err.message || 'Failed to delete');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  return { create, update, remove, loading, error };
};
