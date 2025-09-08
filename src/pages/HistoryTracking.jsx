// src/pages/HistoryTracking.jsx
import React from 'react';
import TailwindLayout from '../components/layout/TailwindLayout';
import LiveTrackingMap from '../components/dashboard/LiveTrackingMap';
import '../styles/tracking.css';

const HistoryTracking = () => {
  return (
    <TailwindLayout>
      <div className="h-full">
        <LiveTrackingMap forceViewMode="history" />
      </div>
    </TailwindLayout>
  );
};

export default HistoryTracking;
