// src/pages/Dashboard.jsx
import React from 'react';
import TailwindLayout from '../components/layout/TailwindLayout';
import TailwindFleetOverview from '../components/dashboard/TailwindFleetOverview';

const Dashboard = () => {
  return (
    <TailwindLayout>
      <div className="h-full">
        <TailwindFleetOverview />
      </div>
    </TailwindLayout>
  );
};

export default Dashboard;