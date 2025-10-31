import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TailwindLayout from '../../components/layout/TailwindLayout.jsx';
import { driversApi } from '../../services/api2/index.js';

function Input({ label, icon, ...props }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-700 mb-1.5">{label}</span>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`w-full ${icon ? 'pl-9' : 'pl-3'} pr-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${props.className || ''}`}
        />
      </div>
    </label>
  );
}

function TextArea({ label, ...props }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-700 mb-1.5">{label}</span>
      <textarea
        {...props}
        className={`w-full pl-3 pr-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${props.className || ''}`}
      />
    </label>
  );
}

function Select({ label, icon, children, ...props }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-700 mb-1.5">{label}</span>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <select
          {...props}
          className={`w-full ${icon ? 'pl-9' : 'pl-3'} pr-8 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none bg-white cursor-pointer ${props.className || ''}`}
        >
          {children}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </label>
  );
}

export default function DriverForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const isEdit = id && id !== 'new';

  const [form, setForm] = React.useState({
    // Basic Info
    name: '',
    phone: '',
    email: '',
    license_number: '', // License Number (required)
    license_type: '', // License Type
    license_expiry: '', // License Expiry Date
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
            phone: driver.phone || '',
            email: driver.email || '',
            license_number: driver.license_number || '',
            license_type: driver.license_type || '',
            license_expiry: driver.license_expiry || '',
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

      // Validation
      if (!form.name || !form.license_number) {
        alert('Name and License Number are required fields!');
        setSaving(false);
        return;
      }

      console.log('💾 Saving driver data to Backend 2...', form);

      // Prepare data according to API documentation
      const driverData = {
        name: form.name,
        phone: form.phone || undefined,
        email: form.email || undefined,
        license_number: form.license_number,
        license_type: form.license_type || undefined,
        license_expiry: form.license_expiry || undefined,
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
        alert('Driver updated successfully!');
      } else {
        // CREATE new driver
        console.log('➕ Creating new driver');
        response = await driversApi.create(driverData);
        console.log('✅ Driver created successfully:', response);
        alert('Driver created successfully!');
      }

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
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-indigo-50 p-4 overflow-y-auto">
        <div className="max-w-full mx-auto px-2">
          {/* Header */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isNew ? 'Add New Driver' : 'Edit Driver'}
                </h1>
                <p className="text-xs text-gray-600 mt-0.5">
                  {isNew ? 'Create a new driver record' : 'Update driver information'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/drivers')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-gray-300 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Back
                </button>
                <button
                  onClick={onSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Save Driver
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-gray-200">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="text-gray-500 text-sm mt-3">Loading driver data...</p>
            </div>
          ) : (
            <>
              {/* Error Alerts - Full Width */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-xs text-red-800">
                      <strong>Error:</strong> {error}
                    </span>
                  </div>
                </div>
              )}

              {validationErrors.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3">
                  <p className="text-xs font-semibold text-yellow-800 mb-2">Validation Errors:</p>
                  <ul className="list-disc list-inside text-xs text-yellow-700 space-y-1">
                    {validationErrors.map((err, idx) => (
                      <li key={idx}>
                        <strong>{err.field}:</strong> {err.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Bento Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-12 gap-3">
                {/* Left Column - Main Info (spans 7 columns on xl, 8 on lg) */}
                <div className="lg:col-span-8 xl:col-span-7 space-y-3">
                  {/* Personal Info Card */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-4 py-3 border-b border-gray-200 bg-linear-to-r from-indigo-50 to-blue-50">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-indigo-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <div>
                          <h2 className="text-sm font-semibold text-gray-900">
                            Personal Information
                          </h2>
                          <p className="text-xs text-gray-600">Driver identity and contact</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                        <Input
                          label="Driver Name *"
                          placeholder="Enter driver name"
                          value={form.name}
                          onChange={(e) => update('name', e.target.value)}
                          icon={
                            <svg
                              className="w-4 h-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          }
                        />
                        <Input
                          label="Phone Number"
                          placeholder="+62812345678"
                          value={form.phone}
                          onChange={(e) => update('phone', e.target.value)}
                          type="tel"
                          icon={
                            <svg
                              className="w-4 h-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                              />
                            </svg>
                          }
                        />
                        <Input
                          label="Email"
                          placeholder="driver@example.com"
                          value={form.email}
                          onChange={(e) => update('email', e.target.value)}
                          type="email"
                          icon={
                            <svg
                              className="w-4 h-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                          }
                        />
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                        <Input
                          label="License Number *"
                          placeholder="e.g., LICENSE001"
                          value={form.license_number}
                          onChange={(e) => update('license_number', e.target.value)}
                          icon={
                            <svg
                              className="w-4 h-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                              />
                            </svg>
                          }
                        />
                        <Input
                          label="License Type"
                          placeholder="e.g., A, B1, B2"
                          value={form.license_type}
                          onChange={(e) => update('license_type', e.target.value)}
                          icon={
                            <svg
                              className="w-4 h-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                              />
                            </svg>
                          }
                        />
                        <Input
                          label="License Expiry"
                          placeholder="YYYY-MM-DD"
                          value={form.license_expiry}
                          onChange={(e) => update('license_expiry', e.target.value)}
                          type="date"
                          icon={
                            <svg
                              className="w-4 h-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Additional Info (spans 5 columns on xl, 4 on lg) */}
                <div className="lg:col-span-4 xl:col-span-5 space-y-3">
                  {/* Status Card */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-4 py-3 border-b border-gray-200 bg-linear-to-r from-purple-50 to-pink-50">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-purple-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <div>
                          <h2 className="text-sm font-semibold text-gray-900">Status</h2>
                          <p className="text-xs text-gray-600">Driver status</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <Select
                        label="Status *"
                        value={form.status}
                        onChange={(e) => update('status', e.target.value)}
                        icon={
                          <svg
                            className="w-4 h-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        }
                      >
                        <option value="aktif">✅ Active</option>
                        <option value="nonaktif">⛔ Inactive</option>
                      </Select>

                      <div className="pt-2 border-t border-gray-100">
                        <div
                          className={`p-3 rounded-md text-center ${form.status === 'aktif' ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}
                        >
                          <div
                            className={`text-2xl mb-1 ${form.status === 'aktif' ? 'text-green-600' : 'text-gray-400'}`}
                          >
                            {form.status === 'aktif' ? '✓' : '○'}
                          </div>
                          <p
                            className={`text-xs font-semibold ${form.status === 'aktif' ? 'text-green-700' : 'text-gray-600'}`}
                          >
                            {form.status === 'aktif' ? 'Driver Active' : 'Driver Inactive'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Footer - Full Width */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <svg
                      className="w-3.5 h-3.5 text-red-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Fields marked with <span className="text-red-500 font-medium">*</span> are
                    required
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate('/drivers')}
                      className="px-3 py-1.5 rounded-md border border-gray-300 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={onSave}
                      disabled={saving}
                      className="px-3.5 py-1.5 rounded-md bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                      {saving ? 'Saving...' : isNew ? 'Create Driver' : 'Update Driver'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </TailwindLayout>
  );
}
