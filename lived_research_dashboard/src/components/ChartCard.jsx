// src/components/ChartCard.js
import React from 'react';

export default function ChartCard({ title, content }) {
  return (
    <div className="bg-white shadow-md rounded-2xl p-4">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div>{content}</div>
    </div>
  );
}
