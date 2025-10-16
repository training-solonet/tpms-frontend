// src/components/icons/WheelFrontIcon.jsx
import React from 'react';

/**
 * WheelFrontIcon
 * Simple front-facing wheel/tire SVG icon.
 *
 * Props:
 * - size: number (px)
 * - color: stroke/fill color (default: currentColor)
 * - filled: boolean (filled tire) default false
 * - className: string
 */
const WheelFrontIcon = ({ size = 24, color = 'currentColor', filled = false, className = '' }) => {
  const stroke = color;
  const fill = filled ? color : 'none';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Tire outer */}
      <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="2" fill={fill} />

      {/* Sidewall ring (only when not filled) */}
      {!filled && (
        <circle cx="12" cy="12" r="6.5" stroke={stroke} strokeWidth="1.5" opacity="0.6" />
      )}

      {/* Rim hub */}
      <circle cx="12" cy="12" r="2.25" stroke={stroke} strokeWidth="1.5" fill="white" />

      {/* Lug nuts */}
      <circle cx="12" cy="8.75" r="0.7" fill={stroke} />
      <circle cx="15.1" cy="10.2" r="0.7" fill={stroke} />
      <circle cx="15.1" cy="13.8" r="0.7" fill={stroke} />
      <circle cx="12" cy="15.25" r="0.7" fill={stroke} />
      <circle cx="8.9" cy="13.8" r="0.7" fill={stroke} />
      <circle cx="8.9" cy="10.2" r="0.7" fill={stroke} />
    </svg>
  );
};

export default WheelFrontIcon;
