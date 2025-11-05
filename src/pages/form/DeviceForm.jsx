import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import TailwindLayout from '../../components/layout/TailwindLayout.jsx';
import AlertModal from '../../components/common/AlertModal.jsx';
import { devicesApi, trucksApi } from '../../services/api2/index.js';
import { useCRUD } from '../../hooks/useApi2.js';
import { useAlert } from '../../hooks/useAlert.js';

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

export default function DeviceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [form, setForm] = React.useState({
    sn: '',
    imei: '', // Will be sent as sim_number to backend
    device_type: 'TPMS',
    status: 'active',
    truck_id: '',
  });

  const [trucks, setTrucks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // Use alert hook
  const { showAlert, alertState } = useAlert();

  // Use CRUD hook
  const { loading: saving, error } = useCRUD(devicesApi);

  // Load data
  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('📡 Loading device form data...');

        // Load trucks for dropdown (legacy endpoint still supported)
        const trucksRes = await trucksApi.getAll().catch(() => ({ data: { trucks: [] } }));
        const trucksArray = trucksRes?.data?.trucks || trucksRes?.data || [];
        setTrucks(Array.isArray(trucksArray) ? trucksArray : []);

        // Load device data if editing
        if (!isNew) {
          const deviceRes = await devicesApi.getById(parseInt(id)); // Convert to Integer
          console.log('✅ Device data loaded:', deviceRes);

          // Handle different response formats
          let device;
          if (deviceRes?.data?.device) {
            device = deviceRes.data.device;
          } else if (deviceRes?.data?.data) {
            device = deviceRes.data.data;
          } else {
            device = deviceRes?.data || deviceRes;
          }

          if (device) {
            setForm({
              sn: device.sn || device.deviceSn || '',
              imei: device.sim_number || device.simNumber || device.imei || '', // Backend uses sim_number
              device_type: device.device_type || device.deviceType || 'TPMS',
              status: device.status || 'active',
              truck_id: device.truck_id?.toString() || device.truckId?.toString() || '', // Convert Integer to string for select
            });
          }
        }
      } catch (err) {
        console.error('❌ Failed to load form data:', err);
        showAlert.error(`Failed to load form data: ${err.message}`, 'Error Loading Data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, isNew, showAlert]);

  const update = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const onSave = async () => {
    try {
      // Validation
      if (!form.sn?.trim()) {
        showAlert.warning('Please enter Device SN', 'Validation Error');
        return;
      }
      if (!form.imei?.trim()) {
        showAlert.warning('Please enter SIM Number', 'Validation Error');
        return;
      }
      if (!form.truck_id) {
        showAlert.warning('Please select a truck', 'Validation Error');
        return;
      }

      console.log('💾 Saving device data...', form);

      let response;
      if (isNew) {
        // CREATE: Use REST endpoint
        console.log('➕ Creating new device');

        try {
          const createData = {
            sn: form.sn.trim(),
            truck_id: parseInt(form.truck_id), // Convert to Integer
            sim_number: form.imei.trim(),
            status: form.status,
          };

          console.log('📤 Create payload:', createData);
          response = await devicesApi.create(createData);

          // Handle response format
          if (response?.data?.success || response?.data?.device || response?.data) {
            console.log('✅ Device created successfully:', response.data);
            const message = response?.data?.message || 'Device has been created successfully!';

            showAlert.success(message, 'Success!', () => {
              // Reset form for adding another device
              setForm({
                sn: '',
                imei: '',
                device_type: 'TPMS',
                truck_id: '',
                status: 'active',
              });
              navigate('/devices/new', { replace: true });
            });
          } else {
            throw new Error('Unexpected response format');
          }
        } catch (error) {
          console.error('❌ Failed to create device:', error);

          // Extract error message from response
          const errorMessage =
            error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            'Unknown error occurred';

          showAlert.error(errorMessage, 'Failed to Create Device');
          throw error;
        }
      } else {
        // UPDATE: Use REST endpoint
        console.log('🔄 Updating device:', id);

        try {
          const updateData = {
            sim_number: form.imei.trim(),
            status: form.status,
            // Note: truck_id and sn cannot be updated after creation
          };

          console.log('📤 Update payload:', updateData);
          response = await devicesApi.update(parseInt(id), updateData);

          // Handle response format
          if (response?.data?.success || response?.data?.device || response?.data) {
            console.log('✅ Device updated successfully:', response.data);
            const message = response?.data?.message || 'Device has been updated successfully!';

            showAlert.success(message, 'Success!', () => {
              navigate('/devices');
            });
          } else {
            throw new Error('Unexpected response format');
          }
        } catch (error) {
          console.error('❌ Failed to update device:', error);

          const errorMessage =
            error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            'Unknown error occurred';

          showAlert.error(errorMessage, 'Failed to Update Device');
          throw error;
        }
      }
    } catch (error) {
      console.error('❌ Failed to save device:', error);
    }
  };

  if (loading) {
    return (
      <TailwindLayout>
        <div className="min-h-screen bg-linear-to-br from-slate-50 to-indigo-50 p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-500 text-sm">Loading device data...</p>
          </div>
        </div>
      </TailwindLayout>
    );
  }

  return (
    <TailwindLayout>
      {/* <div className="min-h-screen bg-linear-to-br from-slate-50 to-indigo-50 p-4 overflow-y-auto"> */}
      <div className="p-6 space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
          <Link to="/" className="hover:text-indigo-600 transition-colors">
            Dashboard
          </Link>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-gray-900 font-medium">Devices</span>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-gray-900 font-medium">Add Device</span>
        </nav>

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isNew ? 'Add New Device' : 'Edit Device'}
              </h1>
              <p className="text-xs text-gray-600 mt-0.5">
                {isNew ? 'Create a new device record' : 'Update device information'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/devices')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
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
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
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
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {isNew ? 'Add Data' : 'Save Changes'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
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

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-12 gap-3">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-8 xl:col-span-7 space-y-3">
            {/* Device Information Card */}
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
                      d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                    />
                  </svg>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Device Information</h2>
                    <p className="text-xs text-gray-600">Device identification details</p>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                  <Input
                    label="Device SN *"
                    placeholder="e.g., DEV001"
                    value={form.sn}
                    onChange={(e) => update('sn', e.target.value)}
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
                    label="SIM Number *"
                    placeholder="e.g., 628123456700"
                    value={form.imei}
                    onChange={(e) => update('imei', e.target.value)}
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
                          d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    }
                  />
                  <Select
                    label="Device Type *"
                    value={form.device_type}
                    onChange={(e) => update('device_type', e.target.value)}
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
                          d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                        />
                      </svg>
                    }
                  >
                    <option value="TPMS">TPMS (Tire Pressure Monitoring)</option>
                    <option value="GPS">GPS Tracker</option>
                    <option value="Fuel">Fuel Sensor</option>
                    <option value="Temperature">Temperature Sensor</option>
                  </Select>
                </div>
              </div>
            </div>

            {/* Assignment Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200 bg-linear-to-r from-green-50 to-emerald-50">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Assignment</h2>
                    <p className="text-xs text-gray-600">Vehicle assignment</p>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <Select
                  label="Assigned Vehicle *"
                  value={form.truck_id}
                  onChange={(e) => update('truck_id', e.target.value)}
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
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  }
                >
                  <option value="">Select Vehicle *</option>
                  {trucks.map((truck) => (
                    <option key={truck.id} value={truck.id}>
                      {truck.truckNumber || truck.truck_number} -{' '}
                      {truck.plate || truck.plate_number}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          {/* Right Column - Status */}
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
                    <p className="text-xs text-gray-600">Device operational status</p>
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
                  <option value="active">✅ Active</option>
                  <option value="inactive">⏸️ Inactive</option>
                  <option value="maintenance">🔧 Maintenance</option>
                  <option value="offline">⛔ Offline</option>
                </Select>

                <div className="pt-2 border-t border-gray-100">
                  <div
                    className={`p-3 rounded-md text-center ${
                      form.status === 'active'
                        ? 'bg-green-50 border border-green-200'
                        : form.status === 'maintenance'
                          ? 'bg-yellow-50 border border-yellow-200'
                          : form.status === 'inactive'
                            ? 'bg-blue-50 border border-blue-200'
                            : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <div
                      className={`text-2xl mb-1 ${
                        form.status === 'active'
                          ? 'text-green-600'
                          : form.status === 'maintenance'
                            ? 'text-yellow-600'
                            : form.status === 'inactive'
                              ? 'text-blue-600'
                              : 'text-red-600'
                      }`}
                    >
                      {form.status === 'active'
                        ? '✓'
                        : form.status === 'maintenance'
                          ? '⚠'
                          : form.status === 'inactive'
                            ? '⏸'
                            : '✕'}
                    </div>
                    <p
                      className={`text-xs font-semibold ${
                        form.status === 'active'
                          ? 'text-green-700'
                          : form.status === 'maintenance'
                            ? 'text-yellow-700'
                            : form.status === 'inactive'
                              ? 'text-blue-700'
                              : 'text-red-700'
                      }`}
                    >
                      {form.status === 'active'
                        ? 'Device Active'
                        : form.status === 'maintenance'
                          ? 'Under Maintenance'
                          : form.status === 'inactive'
                            ? 'Device Inactive'
                            : 'Device Offline'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Footer */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Fields marked with <span className="text-red-500 font-medium">*</span> are required
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/devices')}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {saving ? 'Saving...' : isNew ? 'Add Data' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* </div> */}

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertState.isOpen}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        onConfirm={alertState.onConfirm}
        onCancel={alertState.onCancel}
        confirmText={alertState.confirmText}
        cancelText={alertState.cancelText}
        showCancel={alertState.showCancel}
      />
    </TailwindLayout>
  );
}
