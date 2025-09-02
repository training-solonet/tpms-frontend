// src/pages/LiveTracking.jsx
import React from 'react';
import TailwindLayout from '../components/layout/TailwindLayout';
import LiveTrackingMap from '../components/dashboard/LiveTrackingMap';
import '../styles/tracking.css'; // Import tracking styles

const LiveTracking = () => {
  return (
    <TailwindLayout>
      <div className="h-full">
        <LiveTrackingMap />
      </div>
    </TailwindLayout>
  );
};

export default LiveTracking;
