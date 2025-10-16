// src/pages/HistoryTracking.jsx
import React from 'react';
import TailwindLayout from '../components/layout/TailwindLayout';
import HistoryTrackingMap from '../components/dashboard/HistoryTrackingMap';

const HistoryTracking = () => {
  return (
    <TailwindLayout>
      <div className="h-full">
        <HistoryTrackingMap />
      </div>
    </TailwindLayout>
  );
};

export default HistoryTracking;
