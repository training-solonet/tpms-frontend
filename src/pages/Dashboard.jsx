// src/pages/Dashboard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import TailwindLayout from '../components/layout/TailwindLayout';
import TailwindFleetOverview from '../components/dashboard/TailwindFleetOverview';

const Dashboard = () => {
  return (
    <TailwindLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header with primary CTA */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Ringkasan cepat + shortcut ke Live Tracking
              </p>
            </div>
            <Link
              to="/live-tracking"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Go to Live Tracking
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path
                  fillRule="evenodd"
                  d="M3.75 10a.75.75 0 01.75-.75h8.69L10.22 6.28a.75.75 0 111.06-1.06l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 11-1.06-1.06l2.97-2.97H4.5A.75.75 0 013.75 10z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </div>

          {/* Quick shortcuts */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/fleet"
              className="group rounded-xl border border-indigo-200/40 bg-white/60 p-4 shadow-sm backdrop-blur-sm transition hover:bg-white"
            >
              <p className="text-sm font-semibold text-gray-900">Fleet Management</p>
              <p className="mt-1 text-xs text-gray-600">Daftar & filter kendaraan, fleet groups</p>
              <span className="mt-2 inline-flex items-center text-indigo-600 text-xs font-semibold">
                Open <span className="ml-1 group-hover:translate-x-0.5 transition">→</span>
              </span>
            </Link>
            <Link
              to="/devices"
              className="group rounded-xl border border-indigo-200/40 bg-white/60 p-4 shadow-sm backdrop-blur-sm transition hover:bg-white"
            >
              <p className="text-sm font-semibold text-gray-900">IoT Devices</p>
              <p className="mt-1 text-xs text-gray-600">
                Status device, assignment, sensor & locks
              </p>
              <span className="mt-2 inline-flex items-center text-indigo-600 text-xs font-semibold">
                Open <span className="ml-1 group-hover:translate-x-0.5 transition">→</span>
              </span>
            </Link>
            <Link
              to="/telemetry/tires"
              className="group rounded-xl border border-indigo-200/40 bg-white/60 p-4 shadow-sm backdrop-blur-sm transition hover:bg-white"
            >
              <p className="text-sm font-semibold text-gray-900">Telemetry</p>
              <p className="mt-1 text-xs text-gray-600">Tekanan ban, suhu hub, fuel, kecepatan</p>
              <span className="mt-2 inline-flex items-center text-indigo-600 text-xs font-semibold">
                Open <span className="ml-1 group-hover:translate-x-0.5 transition">→</span>
              </span>
            </Link>
            <Link
              to="/alerts"
              className="group rounded-xl border border-indigo-200/40 bg-white/60 p-4 shadow-sm backdrop-blur-sm transition hover:bg-white"
            >
              <p className="text-sm font-semibold text-gray-900">Alerts</p>
              <p className="mt-1 text-xs text-gray-600">Alert aktif & riwayat pelanggaran</p>
              <span className="mt-2 inline-flex items-center text-indigo-600 text-xs font-semibold">
                Open <span className="ml-1 group-hover:translate-x-0.5 transition">→</span>
              </span>
            </Link>
          </div>

          {/* Existing overview content */}
          <TailwindFleetOverview />
        </div>
      </div>
    </TailwindLayout>
  );
};

export default Dashboard;
