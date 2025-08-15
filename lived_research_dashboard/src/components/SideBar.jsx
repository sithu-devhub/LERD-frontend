import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, BarChart2, Grid, Lock } from 'lucide-react';
import '../styles/sidebar.css';

export default function SideBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', Icon: Home },
    { name: 'Service Type', path: '/service', Icon: ShoppingCart },
    { name: 'Region', path: '/region', Icon: BarChart2 },
    { name: 'Authorisation Management', path: '/auth', Icon: Grid },
    { name: 'Log out', action: 'logout', Icon: Lock },
  ];

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleNavClick = (item) => {
    if (item.action === 'logout') handleLogout();
    else navigate(item.path);
  };

  const isActivePath = (p) =>
    p && (location.pathname === p || location.pathname.startsWith(p + '/'));

  return (
    <div className="w-64 min-h-screen bg-white flex flex-col border-r border-gray-200">
      <div>
        <h2 className="text-center text-lg font-semibold text-gray-800 py-6">Menu</h2>

        <div className="flex flex-col items-center mb-6">
          <img src="https://i.pravatar.cc/100?img=32" alt="Profile" className="w-16 h-16 rounded-full mb-2" />
          <p className="text-sm font-medium text-gray-800">Name</p>
          <p className="text-xs text-gray-500">Position</p>
        </div>

        <nav className="space-y-4 px-6">
          {navItems.map((item) => {
            const active = isActivePath(item.path);
            const Icon = item.Icon;
            return (
              <div
                key={item.name}
                onClick={() => handleNavClick(item)}
                className={`sidebar-item ${active ? 'sidebar-active' : 'sidebar-inactive'}`}
              >
                <Icon
                  className={`sidebar-icon ${active ? 'sidebar-icon-active' : 'sidebar-icon-inactive'}`}
                  strokeWidth={2.5}
                />
                <span className="text-[18px]">{item.name}</span>
                {active && <span className="sidebar-rail sidebar-rail--pill" />}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
