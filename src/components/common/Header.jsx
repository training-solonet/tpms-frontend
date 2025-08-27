// src/components/common/Header.jsx
import React from 'react';
import { Bell, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Header = ({ autoRefresh, setAutoRefresh, dashboardStats }) => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 border-b">
      <div>
        <h1 className="font-bold text-xl text-gray-800">Fleet Monitoring System</h1>
        <p className="text-sm text-gray-500">PT Borneo Indobara - Real-time truck tracking & monitoring</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 rounded ${autoRefresh ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
          >
            Auto Refresh {autoRefresh ? 'ON' : 'OFF'}
          </button>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-lg relative">
          <Bell size={20} className="text-gray-600" />
          {dashboardStats.alertsCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <User size={18} className="text-blue-600" />
          <span className="text-sm font-medium text-blue-700">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;