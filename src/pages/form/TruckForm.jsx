/* eslint-disable no-unused-vars */
import React from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import TailwindLayout from '../../components/layout/TailwindLayout.jsx';
import { trucksApi, vendorsApi } from '../../services/api2/index.js';

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
  const [saving, setSaving] = React.useState(false);
  const isNewTruck = id === 'new';

  // Initialize form data
  const [formData, setFormData] = React.useState({
    truckNumber: '',
    plateNumber: '',
    model: '',
    year: new Date().getFullYear(),
    type: '',
    vin: '',
    capacity: 0,
    vendorId: '',
    status: 'active',
    manufacturer: 'Caterpillar',
  });

  React.useEffect(() => {
    const loadData = async () => {
      try {
        console.log('📡 Loading truck form data from Backend 2...');
        setLoading(true);

        // Load vendors
        const vendorsRes = await vendorsApi.getAll().catch(() => ({ data: { vendors: [] } }));
        const vendorsArray = vendorsRes?.data?.vendors || vendorsRes?.data || [];
        setVendors(Array.isArray(vendorsArray) ? vendorsArray : []);

        // Load truck data if editing existing truck
        if (!isNewTruck) {
          try {
            const truckRes = await trucksApi.getById(id);
            console.log('✅ Truck data loaded:', truckRes);
            const truckData = truckRes?.data?.truck || truckRes?.data || {};

            // Map backend data to form
            setFormData({
              truckNumber: truckData.truckNumber || truckData.truck_number || '',
              plateNumber: truckData.plateNumber || truckData.plate_number || '',
              model: truckData.model || '',
              year: truckData.year || new Date().getFullYear(),
              type: truckData.type || truckData.truckType || '',
              vin: truckData.vin || truckData.vinNumber || '',
              capacity: truckData.capacity || 0,
              vendorId: truckData.vendorId || truckData.vendor_id || '',
              status: truckData.status || 'active',
              manufacturer: truckData.manufacturer || 'Caterpillar',
            });
          } catch (error) {
            console.error('❌ Failed to load truck:', error);
            alert('Failed to load truck data. Redirecting to truck list.');
            navigate('/trucks');
            return;
          }
        }
      } catch (error) {
        console.error('❌ Failed to load form data:', error);
        alert('Failed to load form data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, isNewTruck, navigate]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.truckNumber?.trim()) {
      errors.push('Truck Number is required');
    }
    if (!formData.plateNumber?.trim()) {
      errors.push('Plate Number is required');
    }
    if (!formData.model?.trim()) {
      errors.push('Model is required');
    }
    if (!formData.year || formData.year < 1900 || formData.year > 2100) {
      errors.push('Valid Year is required');
    }

    if (errors.length > 0) {
      alert('Please fix the following errors:\n\n' + errors.join('\n'));
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      console.log('💾 Saving truck data to Backend 2...', formData);

      const truckData = {
        truckNumber: formData.truckNumber,
        plateNumber: formData.plateNumber,
        model: formData.model,
        year: parseInt(formData.year),
        type: formData.type,
        vin: formData.vin,
        capacity: parseFloat(formData.capacity) || 0,
        vendorId: formData.vendorId || null,
        status: formData.status,
        manufacturer: formData.manufacturer,
      };

      let response;
      if (isNewTruck) {
        // CREATE new truck
        console.log('➕ Creating new truck');
        response = await trucksApi.create(truckData);
        console.log('✅ Truck created successfully:', response);
        alert('Truck created successfully!');
      } else {
        // UPDATE existing truck
        console.log('🔄 Updating truck:', id);
        response = await trucksApi.update(id, truckData);
        console.log('✅ Truck updated successfully:', response);
        alert('Truck updated successfully!');
      }

      navigate('/trucks');
    } catch (error) {
      console.error('❌ Failed to save truck:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      alert(`Failed to save truck:\n${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <TailwindLayout>
        <div className="min-h-screen bg-linear-to-br from-slate-50 to-indigo-50 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-600">Loading truck data...</p>
          </div>
        </div>
      </TailwindLayout>
    );
  }

  return (
    <TailwindLayout>
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-indigo-50 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {isNewTruck ? 'Add New Vehicle' : `Edit Vehicle: ${formData.truckNumber || id}`}
              </h1>
              <p className="text-sm text-gray-500">
                {isNewTruck ? 'Create a new vehicle entry' : 'Update vehicle information'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/trucks"
                className="px-3 py-2 rounded-md border border-gray-300 text-sm hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Vehicle'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <section className="bg-white rounded-xl shadow p-4">
                <h2 className="font-semibold text-gray-900 mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Truck Number *"
                    value={formData.truckNumber}
                    onChange={(e) => handleInputChange('truckNumber', e.target.value)}
                    placeholder="e.g., TRUCK001"
                    required
                  />
                  <Input
                    label="Plate Number *"
                    value={formData.plateNumber}
                    onChange={(e) => handleInputChange('plateNumber', e.target.value)}
                    placeholder="e.g., B 1234 XYZ"
                    required
                  />
                  <Input
                    label="Model *"
                    value={formData.model}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                    placeholder="e.g., 777D"
                    required
                  />
                  <Input
                    type="number"
                    label="Year *"
                    value={formData.year}
                    onChange={(e) => handleInputChange('year', e.target.value)}
                    placeholder="e.g., 2024"
                    min="1900"
                    max="2100"
                    required
                  />
                  <Input
                    label="Type"
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    placeholder="e.g., Dump Truck, Hauler"
                  />
                  <Input
                    label="VIN"
                    value={formData.vin}
                    onChange={(e) => handleInputChange('vin', e.target.value)}
                    placeholder="Vehicle Identification Number"
                  />
                  <Input
                    type="number"
                    step="0.1"
                    label="Capacity (tons)"
                    value={formData.capacity}
                    onChange={(e) => handleInputChange('capacity', e.target.value)}
                    placeholder="e.g., 100"
                  />
                  <Input
                    label="Manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                    placeholder="e.g., Caterpillar"
                  />
                </div>
              </section>

              {/* Assignment */}
              <section className="bg-white rounded-xl shadow p-4">
                <h2 className="font-semibold text-gray-900 mb-4">Assignment</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="block text-sm font-medium text-gray-700">Vendor</span>
                    <select
                      className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={formData.vendorId}
                      onChange={(e) => handleInputChange('vendorId', e.target.value)}
                    >
                      <option value="">Select Vendor (Optional)</option>
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} {v.code ? `(${v.code})` : ''}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="block text-sm font-medium text-gray-700">Status</span>
                    <select
                      className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                    >
                      <option value="active">Active</option>
                      <option value="operational">Operational</option>
                      <option value="idle">Idle</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="out-of-service">Out of Service</option>
                    </select>
                  </label>
                </div>
              </section>
            </div>

            {/* Actions Sidebar */}
            <div className="space-y-6">
              <section className="bg-white rounded-xl shadow p-4">
                <h2 className="font-semibold text-gray-900 mb-4">Actions</h2>
                <div className="space-y-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full px-4 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : isNewTruck ? 'Create Vehicle' : 'Update Vehicle'}
                  </button>
                  <Link
                    to="/trucks"
                    className="block w-full px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm text-center hover:bg-gray-50"
                  >
                    Cancel
                  </Link>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    <strong>Note:</strong> Fields marked with * are required.
                  </p>
                </div>
              </section>

              {/* Info Card */}
              <section className="bg-blue-50 rounded-xl border border-blue-200 p-4">
                <div className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-blue-600 mt-0.5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900 mb-1">Vehicle Management</h3>
                    <p className="text-xs text-blue-700">
                      {isNewTruck
                        ? 'Fill in the vehicle details to add it to your fleet. Make sure all required fields are completed.'
                        : 'Update vehicle information as needed. Changes will be saved immediately.'}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </TailwindLayout>
  );
}
