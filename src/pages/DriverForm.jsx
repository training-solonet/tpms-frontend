import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TailwindLayout from '../components/layout/TailwindLayout.jsx';
import { driversApi } from '../services/api2/index.js';

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

export default function DriverForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const isEdit = id && id !== 'new';

  const [form, setForm] = React.useState({
    name: '',
    licenseNumber: '', // Badge ID (required)
    phone: '',
    email: '',
    address: '',
    status: 'aktif', // 'aktif' or 'nonaktif'
  });
  const [loading, setLoading] = React.useState(isEdit);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [validationErrors, setValidationErrors] = React.useState([]);

  // Load driver data if editing
  React.useEffect(() => {
    if (!isEdit) return;
    const loadDriver = async () => {
      try {
        setLoading(true);
        console.log('📡 Loading driver data from Backend 2...');
        const res = await driversApi.getById(id);
        console.log('✅ Driver response:', res);
        const driver = res?.data;
        if (driver) {
          setForm({
            name: driver.name || '',
            licenseNumber: driver.licenseNumber || driver.license_number || '',
            phone: driver.phone || '',
            email: driver.email || '',
            address: driver.address || '',
            status: driver.status || 'aktif',
          });
        }
      } catch (err) {
        console.error('❌ Failed to load driver:', err);
        setError(err.message || 'Failed to load driver data');
      }
      setLoading(false);
    };
    loadDriver();
  }, [id, isEdit]);

  const update = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const onSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setValidationErrors([]);
      console.log('💾 Saving driver data to Backend 2...', form);

      // Prepare data according to API documentation
      const driverData = {
        name: form.name,
        licenseNumber: form.licenseNumber, // Badge ID (required)
        phone: form.phone || undefined, // Remove if empty
        email: form.email || undefined, // Remove if empty
        address: form.address || undefined, // Remove if empty
        status: form.status,
      };

      // Remove undefined fields
      Object.keys(driverData).forEach(
        (key) => driverData[key] === undefined && delete driverData[key]
      );

      let response;
      if (isEdit) {
        // UPDATE existing driver
        console.log('🔄 Updating driver:', id);
        response = await driversApi.update(id, driverData);
        console.log('✅ Driver updated successfully:', response);
      } else {
        // CREATE new driver
        console.log('➕ Creating new driver');
        response = await driversApi.create(driverData);
        console.log('✅ Driver created successfully:', response);
      }

      alert(`Driver "${response.data?.name || form.name}" berhasil disimpan!`);
      navigate('/drivers');
    } catch (err) {
      console.error('❌ Failed to save driver:', err);

      // Handle validation errors from backend
      if (err.data?.errors && Array.isArray(err.data.errors)) {
        setValidationErrors(err.data.errors);
        const errorMessages = err.data.errors.map((e) => `${e.field}: ${e.message}`).join('\n');
        alert(`Validation Error:\n${errorMessages}`);
      } else {
        const errorMsg = err.message || err.data?.message || 'Unknown error';
        setError(errorMsg);
        alert(`Failed to save driver: ${errorMsg}`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <TailwindLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">
              {isNew ? 'Add Driver' : 'Edit Driver'}
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/drivers')}
                className="px-3 py-2 rounded-md border text-sm"
              >
                Back
              </button>
              <button
                onClick={onSave}
                disabled={saving}
                className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-gray-500">Loading...</div>
          ) : (
            <div className="bg-white rounded-xl shadow p-6 space-y-4">
              {/* Error Alert */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">
                    <strong>Error:</strong> {error}
                  </p>
                </div>
              )}

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm font-semibold text-yellow-800 mb-2">Validation Errors:</p>
                  <ul className="list-disc list-inside text-sm text-yellow-700">
                    {validationErrors.map((err, idx) => (
                      <li key={idx}>
                        <strong>{err.field}:</strong> {err.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Form Fields */}
              <Input
                label={
                  <>
                    Nama Driver <span className="text-red-500">*</span>
                  </>
                }
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Masukkan nama driver"
                required
              />

              <Input
                label={
                  <>
                    Badge ID / License Number <span className="text-red-500">*</span>
                  </>
                }
                value={form.licenseNumber}
                onChange={(e) => update('licenseNumber', e.target.value)}
                placeholder="Contoh: BADGE001"
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nomor Telepon"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="+628123456789 atau 08123456789"
                  type="tel"
                />
                <Input
                  label="Email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="driver@example.com"
                  type="email"
                />
              </div>

              <Input
                label="Alamat / Notes"
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                placeholder="Masukkan alamat atau catatan"
              />

              <label className="block">
                <span className="block text-sm font-medium text-gray-700">Status</span>
                <select
                  value={form.status}
                  onChange={(e) => update('status', e.target.value)}
                  className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Non-Aktif</option>
                </select>
              </label>

              {/* Help Text */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  <span className="text-red-500">*</span> Field yang wajib diisi
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </TailwindLayout>
  );
}
