// src/components/common/CommandPalette.jsx
import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { devices } from '../../data/devices.js';
import { trucks as trucksList } from '../../data/trucks.js';
import { trucksAPI } from '../../services/api.js';

const debounce = (fn, ms) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

const CommandPalette = ({ open, setOpen }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [vehicleResults, setVehicleResults] = useState([]);
  const [deviceResults, setDeviceResults] = useState([]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setVehicleResults([]);
      setDeviceResults([]);
    }
  }, [open]);

  const search = async (q) => {
    const term = q.trim().toLowerCase();
    if (!term) {
      setVehicleResults([]);
      setDeviceResults([]);
      return;
    }
    setLoading(true);
    try {
      // Vehicles: try backend first
      let vehicles = [];
      try {
        const res = await trucksAPI.getRealTimeLocations();
        if (res?.success && Array.isArray(res.data?.features)) {
          vehicles = res.data.features.map(f => ({
            id: f.properties.truckNumber,
            name: f.properties.truckName || f.properties.truckNumber,
            status: (f.properties.status || 'offline').toLowerCase(),
          }));
        }
      } catch {
        // ignore, fallback
      }
      if (!vehicles.length) {
        vehicles = trucksList.map(t => ({ id: t.id, name: t.name, status: 'offline' }));
      }
      const vMatches = vehicles.filter(v => `${v.id} ${v.name}`.toLowerCase().includes(term)).slice(0, 8);
      setVehicleResults(vMatches);

      // Devices search from local
      const dMatches = devices.filter(d => `${d.sn} ${d.sim_number}`.toLowerCase().includes(term)).slice(0, 8);
      setDeviceResults(dMatches);
    } finally {
      setLoading(false);
    }
  };

  const debounced = useMemo(() => debounce(search, 250), []);

  useEffect(() => {
    debounced(query);
  }, [query]);

  const onSelectVehicle = (v) => {
    setOpen(false);
    // Navigate to live map with focus param; use truckNumber or id fragment
    const focusParam = encodeURIComponent(v.id);
    navigate(`/live-tracking?focus=${focusParam}`);
  };

  const onSelectDevice = (d) => {
    setOpen(false);
    const q = encodeURIComponent(d.sn);
    navigate(`/devices?q=${q}`);
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[2000]" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6 md:p-20">
          <Transition.Child
            as={Fragment}
            enter="transition ease-out duration-150"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="mx-auto max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
                <MagnifyingGlassIcon className="w-5 h-5 text-slate-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search vehicles or devices..."
                  className="w-full bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-400"
                />
                <div className="text-[11px] text-slate-400">Ctrl/Cmd + K</div>
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                <div className="px-4 py-3">
                  <div className="text-[11px] font-semibold text-slate-500 mb-2">Vehicles</div>
                  {loading && <div className="text-xs text-indigo-600">Searching...</div>}
                  {!loading && vehicleResults.length === 0 && (
                    <div className="text-xs text-slate-400">No results</div>
                  )}
                  <ul className="space-y-1">
                    {vehicleResults.map(v => (
                      <li key={v.id}>
                        <button
                          onClick={() => onSelectVehicle(v)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-indigo-50 text-sm text-slate-800"
                        >
                          <span className="font-semibold">{v.id}</span>
                          {v.name ? <span className="text-slate-500"> · {v.name}</span> : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="px-4 py-3">
                  <div className="text-[11px] font-semibold text-slate-500 mb-2">Devices</div>
                  {!loading && deviceResults.length === 0 && (
                    <div className="text-xs text-slate-400">No results</div>
                  )}
                  <ul className="space-y-1">
                    {deviceResults.map(d => (
                      <li key={d.id}>
                        <button
                          onClick={() => onSelectDevice(d)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-indigo-50 text-sm text-slate-800"
                        >
                          <span className="font-semibold">{d.sn}</span>
                          <span className="text-slate-500"> · {d.sim_number}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default CommandPalette;
