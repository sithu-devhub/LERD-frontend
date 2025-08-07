import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function SideBar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="w-64 bg-gray-100 p-4 flex flex-col justify-between">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">LET Dashboard</h2>
        <nav className="space-y-2">
          <div className="p-2 bg-blue-100 text-blue-800 rounded">Dashboard</div>
          <div className="p-2 text-gray-600">Service</div>
          <div className="p-2 text-gray-600">Region</div>
        </nav>
      </div>
      
      <div className="mt-8">
        <button
          onClick={handleLogout}
          className="w-full p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
