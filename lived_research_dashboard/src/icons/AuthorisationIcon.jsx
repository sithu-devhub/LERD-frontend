// src/icons/AuthorisationIcon.jsx
import React from 'react';

export default function AuthorisationIcon({ className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      {/* Top left - vertical rectangle */}
      <rect x="0" y="0" width="6" height="9" rx="1" />

      {/* Top right - square */}
      <rect x="7" y="0" width="6" height="5" rx="1" />

      {/* Bottom left - square */}
      <rect x="0" y="11" width="6" height="5" rx="1" />

      {/* Bottom right - vertical rectangle */}
      <rect x="7" y="7" width="6" height="9" rx="1" />
    </svg>

  );
}
