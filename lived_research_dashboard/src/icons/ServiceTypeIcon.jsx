// src/icons/ServiceTypeIcon.jsx
import React from 'react';

export default function ServiceTypeIcon({ className = '', filled = false }) {
  const sizeClass = `${className} w-[18px] h-[18px]`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 21 21"
      fill="currentColor"
      className={sizeClass}
    >
      <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 
               0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2zM7.16 14l.84-2h8.59c.75 
               0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 20 3H5.21l-.94-2H0v2h2l3.6 
               7.59-1.35 2.44C3.52 13.37 4.48 15 6 15h12v-2H7.42c-.14 0-.25-.11-.26-.25z" />
    </svg>
  );
}
