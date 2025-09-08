// src/pages/LiveTracking.jsx
import React from 'react';
import TailwindLayout from '../components/layout/TailwindLayout';
import LiveTrackingMapNew from '../components/dashboard/LiveTrackingMapNew';
import '../styles/tracking.css'; // Import tracking styles

const LiveTracking = () => {
  return (
    <TailwindLayout>
      <div className="h-full">
        <LiveTrackingMapNew />
        {/* <LiveTrackingMap /> */}
      </div>
    </TailwindLayout>
  );
};

export default LiveTracking;
