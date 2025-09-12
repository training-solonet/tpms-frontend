// src/pages/ComingSoon.jsx
import React from 'react';
import TailwindLayout from '../components/layout/TailwindLayout';
import { ClockIcon, CogIcon } from '@heroicons/react/24/outline';

const ComingSoon = ({
  title = 'Coming Soon',
  description = 'This feature is under development and will be available soon.',
}) => {
  return (
    <TailwindLayout>
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="max-w-md w-full mx-auto text-center p-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-white/20">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <ClockIcon className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center animate-pulse">
                  <CogIcon className="w-4 h-4 text-white animate-spin" />
                </div>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>

            <p className="text-gray-600 mb-6 leading-relaxed">{description}</p>

            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: '0.1s' }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: '0.2s' }}
              ></div>
              <span className="ml-3">Under Development</span>
            </div>
          </div>
        </div>
      </div>
    </TailwindLayout>
  );
};

export default ComingSoon;
