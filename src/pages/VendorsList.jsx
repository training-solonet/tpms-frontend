import React from 'react';
import TailwindLayout from '../components/layout/TailwindLayout.jsx';
import { vendorsAPI } from '../services/api.js';

function Input({ label, ...props }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700">{label}</span>
      <input {...props} className={`mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${props.className || ''}`} />
    </label>
  );
}

export default function VendorsList() {
  const [vendors, setVendors] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [error, setError] = React.useState('');

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await vendorsAPI.getAll();
      if (res.success && Array.isArray(res.data)) {
        setVendors(res.data);
      } else {
        setVendors([]);
      }
    } catch (e) {
      setError(e.message || 'Failed to load vendors');
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase();
    return vendors.filter(v => {
      return !q ||
        (v.name || '').toLowerCase().includes(q) ||
        (v.code || '').toLowerCase().includes(q) ||
        (v.description || '').toLowerCase().includes(q);
    });
  }, [vendors, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageData = filtered.slice(start, end);

  React.useEffect(() => setPage(1), [query, pageSize]);

  const onDelete = async (id) => {
    if (!confirm('Delete this vendor?')) return;
    await vendorsAPI.remove(id);
    await load();
  };

  return (
    <TailwindLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Vendors</h1>
              <p className="text-sm text-gray-500">Master data vendor (non-live), mendukung CRUD</p>
            </div>
            <a href="/vendors/new" className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700">Add Vendor</a>
          </div>

          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input label="Search (name/code/description)" value={query} onChange={e => setQuery(e.target.value)} />
            <label className="block">
              <span className="block text-sm font-medium text-gray-700">Page size</span>
              <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                {[10,25,50,100].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <div className="md:col-span-2 flex items-end text-sm text-gray-600">Showing {start + 1}-{Math.min(end, filtered.length)} of {filtered.length}</div>
          </div>

          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Name</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Code</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Description</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Contact</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td className="px-3 py-6 text-gray-500" colSpan={5}>Loading...</td></tr>
                ) : pageData.length === 0 ? (
                  <tr><td className="px-3 py-6 text-gray-500" colSpan={5}>No data</td></tr>
                ) : pageData.map(v => (
                  <tr key={v.id}>
                    <td className="px-3 py-2 text-gray-900 font-medium">{v.name}</td>
                    <td className="px-3 py-2">{v.code}</td>
                    <td className="px-3 py-2">{v.description}</td>
                    <td className="px-3 py-2">
                      <div>{v.contact_name || '-'}</div>
                      <div className="text-xs text-gray-500">{v.contact_phone || ''} {v.contact_email ? `• ${v.contact_email}` : ''}</div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <a href={`/vendors/${v.id}`} className="inline-flex items-center px-3 py-1.5 rounded-md border text-sm mr-2">Edit</a>
                      <button onClick={() => onDelete(v.id)} className="inline-flex items-center px-3 py-1.5 rounded-md border text-sm text-red-600">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">Page {currentPage} / {totalPages}</div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-50" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
              <button className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-50" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
            </div>
          </div>
        </div>
      </div>
    </TailwindLayout>
  );
}
