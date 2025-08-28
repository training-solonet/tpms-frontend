// src/pages/Dashboard.jsx
import React, { Suspense } from 'react';
import TailwindLayout from '../components/layout/TailwindLayout';
import TailwindFleetOverview from '../components/dashboard/TailwindFleetOverview';

const LoadingSpinner = () => (
  <div className="h-full flex items-center justify-center">
    <div className="flex flex-col items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      <p className="mt-4 text-gray-600">Loading dashboard data...</p>
    </div>
  </div>
);

const Dashboard = () => {
  return (
    <TailwindLayout>
      <div className="h-full">
        <Suspense fallback={<LoadingSpinner />}>
          <TailwindFleetOverview />
        </Suspense>
      </div>
    </TailwindLayout>
  );
};

export default Dashboard;