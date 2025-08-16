// src/icons/DashboardIcon.jsx
import React from 'react';

export default function DashboardIcon({ className = '', filled = false }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 28 28"
      fill="currentColor"
      className={className}
    >
      {/* House body */}
      <path d="M13 2l10 9h-3v11h-6.5v-7h-4v7H5v-11H3l10-9z" />
      {/* Door - narrower to make walls thicker */}
      <rect x="12" y="15" width="3" height="7" fill="white" />
    </svg>
  );
}
