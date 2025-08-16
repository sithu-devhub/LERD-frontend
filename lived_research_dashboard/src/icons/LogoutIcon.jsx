// src/icons/LogoutIcon.jsx
import React from 'react';

export default function LogoutIcon({ className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      {/* Lock body */}
      <rect x="6" y="9" width="12" height="10" rx="2" />
      {/* Open shackle */}
      <path d="M9 9V6a3 3 0 0 1 6 0" />
    </svg>
  );
}
