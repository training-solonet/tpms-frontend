/* eslint-disable no-unused-vars */
import React from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import TailwindLayout from '../components/layout/TailwindLayout.jsx';
import { trucksApi, vendorsApi } from '../services/api2/index.js';

function Input({ label, ...props }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700">{label}</span>
      <input
        {...props}
        className={`mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${props.className || ''}`}
      />
    </label>
  );
}

function Select({ label, children, ...props }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700">{label}</span>
      <select
        {...props}
        className={`mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${props.className || ''}`}
      >
        {children}
      </select>
    </label>
  );
}

export default function TruckForm() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [vendors, setVendors] = React.useState([]);
  const [trucks, setTrucks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        console.log('📡 Loading truck form data from Backend 2...');
        const [vendorsRes, trucksRes] = await Promise.all([
          vendorsApi.getAll().catch(() => ({ data: [] })),
          trucksApi.getAll(),
        ]);
        console.log('✅ Vendors response:', vendorsRes);
        console.log('✅ Trucks response:', trucksRes);
        
        setVendors(Array.isArray(vendorsRes?.data?.vendors || vendorsRes?.data) ? (vendorsRes.data.vendors || vendorsRes.data) : []);
        setTrucks(Array.isArray(trucksRes?.data?.trucks || trucksRes?.data) ? (trucksRes.data.trucks || trucksRes.data) : []);
      } catch (error) {
        console.error('Failed to load data:', error);
        setVendors([]);
        setTrucks([]);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const initialTruck = React.useMemo(() => {
    if (location.state?.truck) return { ...location.state.truck, tires: location.state.truck.tires || [] };
    const foundTruck = trucks.find((t) => t.id === id) || trucks[0] || {};
    return { ...foundTruck, tires: foundTruck.tires || [] };
  }, [id, location.state, trucks]);

  const clusters = React.useMemo(
    () => Array.from(new Set(trucks.map((t) => t.cluster || 'Default'))),
    [trucks]
  );

  const [truck, setTruck] = React.useState(initialTruck);
  const [selectedVendorId, setSelectedVendorId] = React.useState('');

  const updateTruck = (path, value) => {
    setTruck((prev) => {
      const clone = structuredClone(prev);
      let obj = clone;
      for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]];
      obj[path[path.length - 1]] = value;
      return clone;
    });
  };

  React.useEffect(() => {
    // initialize from existing truck vendor if present
    if (truck && truck.vendor_id) {
      setSelectedVendorId(truck.vendor_id);
    }
  }, [truck]);

  const handleSave = async () => {
    try {
      console.log('💾 Saving truck data to Backend 2...', truck);
      
      const truckData = {
        truckNumber: truck.truckNumber || truck.id,
        plateNumber: truck.plateNumber || truck.plate_number,
        model: truck.model || '',
        year: truck.year || new Date().getFullYear(),
        capacity: truck.capacity || 0,
        vendor: selectedVendorId || truck.vendor_id || '',
        driver: truck.driver || '',
        status: truck.status || 'active',
        cluster: truck.cluster || 'Default',
      };

      let response;
      if (id && id !== 'new') {
        // UPDATE existing truck
        console.log('🔄 Updating truck:', id);
        response = await trucksApi.update(id, truckData);
        console.log('✅ Truck updated successfully:', response);
      } else {
        // CREATE new truck
        console.log('➕ Creating new truck');
        response = await trucksApi.create(truckData);
        console.log('✅ Truck created successfully:', response);
      }

      alert('Truck saved successfully!');
      navigate('/trucks');
    } catch (error) {
      console.error('❌ Failed to save truck:', error);
      alert(`Failed to save truck: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <TailwindLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Edit Truck {truck.id}</h1>
              <p className="text-sm text-gray-500">Manage truck info, driver, and tire sensors</p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/trucks" className="px-3 py-2 rounded-md border text-sm">
                Back
              </Link>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700"
              >
                Save
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <section className="bg-white rounded-xl shadow p-4">
                <h2 className="font-semibold text-gray-900 mb-4">Truck Info</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Truck ID" value={truck.id} readOnly />
                  <Input
                    label="Plate"
                    value={truck.plate}
                    onChange={(e) => updateTruck(['plate'], e.target.value)}
                  />
                  <Input
                    label="Name"
                    value={truck.name}
                    onChange={(e) => updateTruck(['name'], e.target.value)}
                  />
                  <Select
                    label="Cluster"
                    value={truck.cluster}
                    onChange={(e) => updateTruck(['cluster'], e.target.value)}
                  >
                    {clusters.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                  <label className="block">
                    <span className="block text-sm font-medium text-gray-700">Vendor</span>
                    <select
                      className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={selectedVendorId}
                      onChange={(e) => setSelectedVendorId(e.target.value)}
                    >
                      <option value="">-</option>
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} {v.code ? `(${v.code})` : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>

              <section className="bg-white rounded-xl shadow p-4">
                <h2 className="font-semibold text-gray-900 mb-4">Driver</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Driver ID" value={truck.driver.id} readOnly />
                  <Input
                    label="Driver Name"
                    value={truck.driver.name}
                    onChange={(e) => updateTruck(['driver', 'name'], e.target.value)}
                  />
                  <Input
                    label="Phone"
                    value={truck.driver.phone}
                    onChange={(e) => updateTruck(['driver', 'phone'], e.target.value)}
                  />
                </div>
              </section>

              <section className="bg-white rounded-xl shadow p-4">
                <h2 className="font-semibold text-gray-900 mb-2">Tires and Sensors</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Read-only telemetry (live data from sensors). Editing is disabled.
                </p>
                <div className="space-y-4">
                  {truck.tires && truck.tires.length > 0 ? truck.tires.map((tire, idx) => {
                    const sensor = tire.sensor || {};
                    const sensorData = sensor.data || {};
                    return (
                    <details key={tire.tireNo || idx} className="group border rounded-lg">
                      <summary className="cursor-pointer select-none px-4 py-2 flex items-center justify-between">
                        <span className="font-medium">Tire #{tire.tireNo || idx + 1}</span>
                        <span className="text-xs text-gray-500">SN {sensor.sn || 'N/A'}</span>
                      </summary>
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-1 md:col-span-2">
                          <h3 className="text-sm font-semibold text-gray-800">TPMS (tpdata)</h3>
                        </div>
                        <Input label="SN" value={sensor.sn || ''} readOnly />
                        <Input label="SIM Number" value={sensorData.simNumber || ''} readOnly />
                        <Select
                          label="Exception Types (exType)"
                          value={sensorData.exType || ''}
                          disabled
                        >
                          <option value="">None</option>
                          <option value="1">1 High Pressure</option>
                          <option value="2">2 Low Pressure</option>
                          <option value="3">3 High Temperature</option>
                          <option value="4">4 Sensor Lost</option>
                          <option value="5">5 Sensor Battery Low</option>
                        </Select>
                        <Input
                          type="number"
                          step="0.1"
                          label="Pressure (kPa) tiprValue"
                          value={sensorData.tiprValue || ''}
                          readOnly
                        />
                        <Input
                          type="number"
                          step="0.1"
                          label="Temperature (°C) tempValue"
                          value={sensorData.tempValue || ''}
                          readOnly
                        />
                        <Select
                          label="Battery Level (bat) 0-4"
                          value={sensorData.bat || '0'}
                          disabled
                        >
                          {[0, 1, 2, 3, 4].map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </Select>

                        <div className="col-span-1 md:col-span-2 mt-2">
                          <h3 className="text-sm font-semibold text-gray-800">
                            Hub Temperature (hubdata)
                          </h3>
                        </div>
                        <Input label="SN" value={tire.hub?.sn || ''} readOnly />
                        <Input label="SIM Number" value={tire.hub?.data?.simNumber || ''} readOnly />
                        <Select
                          label="Exception Types (exType)"
                          value={tire.hub?.data?.exType || ''}
                          disabled
                        >
                          <option value="">None</option>
                          <option value="1">1 Brake Pad Abnormal</option>
                          <option value="3">3 High Temperature</option>
                          <option value="4">4 Sensor Lost</option>
                          <option value="5">5 Sensor Battery Low</option>
                        </Select>
                        <Input
                          type="number"
                          step="0.1"
                          label="Temperature (°C) tempValue"
                          value={tire.hub?.data?.tempValue || ''}
                          readOnly
                        />
                        <Select label="Battery Level (bat) 0-4" value={tire.hub?.data?.bat || '0'} disabled>
                          {[0, 1, 2, 3, 4].map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </details>
                    );
                  }) : (
                    <div className="text-sm text-gray-500 p-4">No tire data available</div>
                  )}
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="bg-white rounded-xl shadow p-4">
                <h2 className="font-semibold text-gray-900 mb-4">Device</h2>
                <div className="grid grid-cols-1 gap-4">
                  <Input label="SN" value={truck.device?.sn || ''} readOnly />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="number"
                      step="0.000001"
                      label="Longitude"
                      value={truck.device?.data?.lng || ''}
                      readOnly
                    />
                    <Input
                      type="number"
                      step="0.000001"
                      label="Latitude"
                      value={truck.device?.data?.lat || ''}
                      readOnly
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Select label="Host Battery (bat1) 0-4" value={truck.device?.data?.bat1 || '0'} disabled>
                      {[0, 1, 2, 3, 4].map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </Select>
                    <Select label="Repeater 1 (bat2) 0-4" value={truck.device?.data?.bat2 || '0'} disabled>
                      {[0, 1, 2, 3, 4].map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </Select>
                    <Select label="Repeater 2 (bat3) 0-4" value={truck.device?.data?.bat3 || '0'} disabled>
                      {[0, 1, 2, 3, 4].map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <Select label="Lock State" value={truck.device.data.lock} disabled>
                    <option value={0}>0 Unlocked</option>
                    <option value={1}>1 Locked</option>
                  </Select>
                </div>
              </section>

              <section className="bg-white rounded-xl shadow p-4">
                <h2 className="font-semibold text-gray-900 mb-2">Actions</h2>
                <button
                  onClick={handleSave}
                  className="w-full px-4 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700"
                >
                  Save Changes
                </button>
                <p className="text-xs text-gray-500 mt-2">This uses dummy data only for now.</p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </TailwindLayout>
  );
}
