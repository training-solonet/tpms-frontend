// src/components/debug/DebugPanel.jsx
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { CogIcon, XMarkIcon } from '@heroicons/react/24/outline';

const DebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, debugMode, toggleDebugMode, logout } = useAuth();

  if (!debugMode && !isAuthenticated) return null;

  return (
    <>
      {/* Debug Toggle Button - Fixed Position */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-full shadow-lg transition-colors"
        title="Debug Panel"
      >
        <CogIcon className="w-5 h-5" />
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="fixed bottom-16 right-4 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Debug Panel</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3 text-xs">
            {/* Auth Status */}
            <div className="bg-gray-50 p-2 rounded">
              <div className="font-medium text-gray-700 mb-1">Authentication Status</div>
              <div className="space-y-1">
                <div>Authenticated: <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>{isAuthenticated ? 'Yes' : 'No'}</span></div>
                <div>Debug Mode: <span className={debugMode ? 'text-orange-600' : 'text-gray-600'}>{debugMode ? 'ON' : 'OFF'}</span></div>
                <div>User: <span className="text-blue-600">{user?.username || 'None'}</span></div>
                <div>Role: <span className="text-blue-600">{user?.role || 'None'}</span></div>
              </div>
            </div>

            {/* localStorage Status */}
            <div className="bg-gray-50 p-2 rounded">
              <div className="font-medium text-gray-700 mb-1">Storage Status</div>
              <div className="space-y-1">
                <div>Auth Token: <span className="text-blue-600">{localStorage.getItem('authToken') ? 'Present' : 'None'}</span></div>
                <div>User Data: <span className="text-blue-600">{localStorage.getItem('user') ? 'Present' : 'None'}</span></div>
                <div>Debug Flag: <span className="text-blue-600">{localStorage.getItem('debugMode') || 'false'}</span></div>
              </div>
            </div>

            {/* Backend Status */}
            <div className="bg-gray-50 p-2 rounded">
              <div className="font-medium text-gray-700 mb-1">Backend Status</div>
              <div className="space-y-1">
                <div>URL: <span className="text-blue-600">http://localhost:3001/api</span></div>
                <div>Status: <span className="text-red-600">Offline (Demo Mode)</span></div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={toggleDebugMode}
                className={`w-full px-3 py-2 text-xs rounded ${
                  debugMode 
                    ? 'bg-orange-100 text-orange-700 border border-orange-200' 
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                {debugMode ? 'Disable Debug Mode' : 'Enable Debug Mode'}
              </button>
              
              {isAuthenticated && (
                <button
                  onClick={logout}
                  className="w-full px-3 py-2 text-xs rounded bg-red-100 text-red-700 border border-red-200"
                >
                  Force Logout
                </button>
              )}
              
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="w-full px-3 py-2 text-xs rounded bg-yellow-100 text-yellow-700 border border-yellow-200"
              >
                Clear All Data & Reload
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DebugPanel;
