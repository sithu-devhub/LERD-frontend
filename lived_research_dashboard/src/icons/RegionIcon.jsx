// src/icons/RegionIcon.jsx
import React from 'react';

export default function RegionIcon({ className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      {/* Left bar */}
      <rect x="5" y="9" width="3" height="8" rx="1.5" />
      {/* Middle (tallest) bar */}
      <rect x="10.5" y="5" width="3" height="12" rx="1.5" />
      {/* Right bar */}
      <rect x="16" y="11" width="3" height="6" rx="1.5" />
    </svg>
  );
}
