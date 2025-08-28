// src/pages/LiveTracking.jsx
import React from 'react';
import TailwindLayout from '../components/layout/TailwindLayout';
import LeafletMap from '../components/dashboard/LeafletMap';

const LiveTracking = () => {
  return (
    <TailwindLayout>
      <div className="h-full">
        <LeafletMap />
      </div>
    </TailwindLayout>
  );
};

export default LiveTracking;
