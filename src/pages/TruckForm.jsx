/* eslint-disable no-unused-vars */
import React from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { allDummyTrucks } from '../data/dummyTrucks';
import TailwindLayout from '../components/layout/TailwindLayout.jsx';
import { vendors as vendorsData, trucks } from '../data/index.js';

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

  const initialTruck = React.useMemo(() => {
    if (location.state?.truck) return location.state.truck;
    return allDummyTrucks.find((t) => t.id === id) || allDummyTrucks[0];
  }, [id, location.state]);

  const clusters = React.useMemo(
    () => Array.from(new Set(allDummyTrucks.map((t) => t.cluster))),
    []
  );

  const [truck, setTruck] = React.useState(initialTruck);

  const updateTruck = (path, value) => {
    setTruck((prev) => {
      const clone = structuredClone(prev);
      // simple path update like ['driver','name']
      let obj = clone;
      for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]];
      obj[path[path.length - 1]] = value;
      return clone;
    });
  };

  // Load vendors for assignment (CRUD master data)
  const [vendors, setVendors] = React.useState([]);
  const [selectedVendorId, setSelectedVendorId] = React.useState('');

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Use dummy vendors data from import
        if (mounted) setVendors(vendorsData);
      } catch { /* empty */ }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    // initialize from existing truck vendor if present
    if (truck && truck.vendor_id) {
      setSelectedVendorId(truck.vendor_id);
    }
  }, [truck]);

  const handleSave = async () => {
    try {
      // Persist vendor assignment if available
      if (selectedVendorId) {
        // Simulate truck update with dummy data
        console.log('Updated truck vendor assignment:', { truck_id: truck.id, vendor_id: selectedVendorId });
      }
    } catch (e) {
      console.warn('Failed to update truck vendor:', e?.message);
    }
    alert('Saved');
    navigate('/trucks');
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
                  {truck.tires.map((tire, idx) => (
                    <details key={tire.tireNo} className="group border rounded-lg">
                      <summary className="cursor-pointer select-none px-4 py-2 flex items-center justify-between">
                        <span className="font-medium">Tire #{tire.tireNo}</span>
                        <span className="text-xs text-gray-500">SN {tire.sensor.sn}</span>
                      </summary>
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-1 md:col-span-2">
                          <h3 className="text-sm font-semibold text-gray-800">TPMS (tpdata)</h3>
                        </div>
                        <Input label="SN" value={tire.sensor.sn} readOnly />
                        <Input label="SIM Number" value={tire.sensor.data.simNumber} readOnly />
                        <Select
                          label="Exception Types (exType)"
                          value={tire.sensor.data.exType}
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
                          value={tire.sensor.data.tiprValue}
                          readOnly
                        />
                        <Input
                          type="number"
                          step="0.1"
                          label="Temperature (°C) tempValue"
                          value={tire.sensor.data.tempValue}
                          readOnly
                        />
                        <Select
                          label="Battery Level (bat) 0-4"
                          value={tire.sensor.data.bat}
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
                        <Input label="SN" value={tire.hub.sn} readOnly />
                        <Input label="SIM Number" value={tire.hub.data.simNumber} readOnly />
                        <Select
                          label="Exception Types (exType)"
                          value={tire.hub.data.exType}
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
                          value={tire.hub.data.tempValue}
                          readOnly
                        />
                        <Select label="Battery Level (bat) 0-4" value={tire.hub.data.bat} disabled>
                          {[0, 1, 2, 3, 4].map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="bg-white rounded-xl shadow p-4">
                <h2 className="font-semibold text-gray-900 mb-4">Device</h2>
                <div className="grid grid-cols-1 gap-4">
                  <Input label="SN" value={truck.device.sn} readOnly />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="number"
                      step="0.000001"
                      label="Longitude"
                      value={truck.device.data.lng}
                      readOnly
                    />
                    <Input
                      type="number"
                      step="0.000001"
                      label="Latitude"
                      value={truck.device.data.lat}
                      readOnly
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Select label="Host Battery (bat1) 0-4" value={truck.device.data.bat1} disabled>
                      {[0, 1, 2, 3, 4].map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </Select>
                    <Select label="Repeater 1 (bat2) 0-4" value={truck.device.data.bat2} disabled>
                      {[0, 1, 2, 3, 4].map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </Select>
                    <Select label="Repeater 2 (bat3) 0-4" value={truck.device.data.bat3} disabled>
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
