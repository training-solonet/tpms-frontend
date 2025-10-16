import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TailwindLayout from '../components/layout/TailwindLayout.jsx';
import { vendors } from '../data/index.js';

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

export default function VendorForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const [form, setForm] = React.useState({
    name: '',
    code: '',
    description: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
  });
  const [loading, setLoading] = React.useState(!isNew);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      if (!isNew) {
        setLoading(true);
        // Use dummy data
        const vendor = vendors.find((v) => v.id === id);
        if (vendor) {
          setForm({
            name: vendor.name || '',
            contact_name: vendor.contact_name || '',
            contact_phone: vendor.contact_phone || '',
            contact_email: vendor.contact_email || '',
          });
        }
        setLoading(false);
      }
    })();
  }, [id, isNew]);

  const update = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const onSave = async () => {
    setSaving(true);
    // Simulate save operation with dummy data
    setTimeout(() => {
      setSaving(false);
      navigate('/vendors');
    }, 1000);
  };

  return (
    <TailwindLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">
              {isNew ? 'Add Vendor' : 'Edit Vendor'}
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/vendors')}
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
              <Input
                label="Code"
                value={form.code}
                onChange={(e) => update('code', e.target.value)}
              />
              <TextArea
                label="Description"
                rows={4}
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Contact Name"
                  value={form.contact_name}
                  onChange={(e) => update('contact_name', e.target.value)}
                />
                <Input
                  label="Contact Phone"
                  value={form.contact_phone}
                  onChange={(e) => update('contact_phone', e.target.value)}
                />
                <Input
                  label="Contact Email"
                  value={form.contact_email}
                  onChange={(e) => update('contact_email', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </TailwindLayout>
  );
}
