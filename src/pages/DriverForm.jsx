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

function TextArea({ label, ...props }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700">{label}</span>
      <textarea
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
    badge_id: '',
    license_number: '',
    phone: '',
    address: '',
    notes: '',
    status: 'active',
  });
  const [loading, setLoading] = React.useState(isEdit);
  const [saving, setSaving] = React.useState(false);

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
            name: driver.name || `${driver.first_name || ''} ${driver.last_name || ''}`.trim(),
            badge_id: driver.badge_id || '',
            license_number: driver.license_number || '',
            phone: driver.phone || '',
            address: driver.address || '',
            notes: driver.notes || '',
            status: driver.status || 'active',
          });
        }
      } catch (error) {
        console.error('❌ Failed to load driver:', error);
      }
      setLoading(false);
    };
    loadDriver();
  }, [id, isEdit]);

  const update = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const onSave = async () => {
    try {
      setSaving(true);
      console.log('💾 Saving driver data to Backend 2...', form);

      const driverData = {
        name: form.name,
        badge_id: form.badge_id,
        license_number: form.license_number,
        phone: form.phone,
        address: form.address,
        notes: form.notes,
        status: form.status,
      };

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

      alert('Driver saved successfully!');
      navigate('/drivers');
    } catch (error) {
      console.error('❌ Failed to save driver:', error);
      alert(`Failed to save driver: ${error.message || 'Unknown error'}`);
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
            <div className="bg-white rounded-xl shadow p-4 grid grid-cols-1 gap-4">
              <Input
                label="Name"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Badge ID"
                  value={form.badge_id}
                  onChange={(e) => update('badge_id', e.target.value)}
                />
                <Input
                  label="License Number"
                  value={form.license_number}
                  onChange={(e) => update('license_number', e.target.value)}
                />
                <Input
                  label="Phone"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                />
              </div>

              <Input
                label="Address"
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
              />
              <TextArea
                label="Notes"
                rows={3}
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
              />

              <label className="block">
                <span className="block text-sm font-medium text-gray-700">Status</span>
                <select
                  value={form.status}
                  onChange={(e) => update('status', e.target.value)}
                  className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>
          )}
        </div>
      </div>
    </TailwindLayout>
  );
}
