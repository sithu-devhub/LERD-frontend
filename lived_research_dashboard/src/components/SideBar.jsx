import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function SideBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Service Type', path: '/service' },
    { name: 'Region', path: '/region' },
    { name: 'Authorisation Management', path: '/auth' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="w-64 min-h-screen bg-white flex flex-col justify-between border-r border-gray-200">
      {/* Top section */}
      <div>
        <h2 className="text-center text-lg font-semibold text-gray-800 py-6">Menu</h2>

        {/* Profile section */}
        <div className="flex flex-col items-center mb-6">
          <img
            src="https://i.pravatar.cc/100?img=32" 
            alt="Profile"
            className="w-16 h-16 rounded-full mb-2"
          />
          <p className="text-sm font-medium text-gray-800">Name</p>
          <p className="text-xs text-gray-500">Position</p>
        </div>

        {/* Navigation */}
        <nav className="space-y-2 px-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <div
                key={item.name}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => navigate(item.path)}
              >
                {item.name}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Logout */}
      <div className="p-6">
        <button
          onClick={handleLogout}
          className="w-full py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
