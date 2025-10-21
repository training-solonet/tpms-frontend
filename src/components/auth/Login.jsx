// src/components/auth/Login.jsx
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, User, Lock, Eye, EyeOff, Shield, Wifi, WifiOff } from 'lucide-react';
import { API_BASE_URL } from '../../services/api2/config.js';

const Login = () => {
  const { login, loading, isOnline } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(formData);
      console.log('🔑 Login form result:', result);

      if (!result.success) {
        setError(result.message || 'Login failed');
      } else {
        console.log('✅ Login successful, redirecting to dashboard');
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      setError('Login failed - please try again');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] [background-size:32px_32px]"></div>

      <div className="relative w-full max-w-md">
        {/* Company Logo Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
          {/* Company Header */}
          <div className="text-center mb-8">
            {/* Company Logo */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl mb-4 shadow-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>

            {/* Company Info */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Fleet Monitor</h1>
            <p className="text-gray-600 mb-1">Sistem Monitoring Truk Tambang</p>

            {/* Company Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
              <MapPin className="w-4 h-4" />
              PT Borneo Indobara
            </div>

            {/* Connection Status */}
            <div className="mt-3 flex items-center justify-center gap-2">
              {isOnline ? (
                <div className="flex items-center gap-1 text-green-600 text-sm">
                  <Wifi className="w-4 h-4" />
                  <span>Online</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-orange-600 text-sm">
                  <WifiOff className="w-4 h-4" />
                  <span>Offline Mode</span>
                </div>
              )}
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="username"
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Masukkan username"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Masukkan password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                <Shield className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Connecting...
                </div>
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-center text-sm text-gray-600">
              <p className="font-medium mb-2">Demo Credentials:</p>
              <div className="space-y-1">
                <p>
                  Username:{' '}
                  <code className="bg-white px-2 py-1 rounded text-blue-600 font-mono">admin</code>
                </p>
                <p>
                  Password:{' '}
                  <code className="bg-white px-2 py-1 rounded text-blue-600 font-mono">
                    admin123
                  </code>
                </p>
              </div>
              <p className="mt-3 text-xs text-gray-500">Backend: {API_BASE_URL}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-white/70 text-sm"> 2024 PT Borneo Indobara. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
