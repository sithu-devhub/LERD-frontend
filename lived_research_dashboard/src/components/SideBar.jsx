import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/sidebar.css';
import DashboardIcon from '../icons/DashboardIcon';
import ServiceTypeIcon from '../icons/ServiceTypeIcon';
import AuthorisationIcon from '../icons/AuthorisationIcon';
import LogoutIcon from '../icons/LogoutIcon';
import RegionIcon from '../icons/RegionIcon';

export default function SideBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', Icon: DashboardIcon },
    { name: 'Service Type', path: '/service', Icon: ServiceTypeIcon },
    { name: 'Region', path: '/region', Icon: RegionIcon },
    { name: 'Authorisation Management', path: '/auth', Icon: AuthorisationIcon },
    { name: 'Log out', action: 'logout', Icon: LogoutIcon },
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

            // treat all local icons as "custom"
            const isCustom =
              Icon === DashboardIcon ||
              Icon === ServiceTypeIcon ||
              Icon === AuthorisationIcon ||
              Icon === RegionIcon ||
              Icon === LogoutIcon;

            const size = Icon === DashboardIcon ? 'w-8 h-8' : 'w-6 h-6';

            return (
              <div
                key={item.name}
                onClick={() => handleNavClick(item)}
                className={`sidebar-item ${active ? 'sidebar-active' : 'sidebar-inactive'}`}
              >
                {isCustom ? (
                  // local SVGs (fill=currentColor); color via classes
                  <Icon
                    className={`${size} ${active ? 'sidebar-icon-active' : 'sidebar-icon-inactive'}`}
                    // Home & ServiceType use this; others safely ignore it
                    filled={active}
                  />
                ) : (
                  // fallback for any lucide icons if added later
                  <Icon
                    className={`w-6 h-6 ${active ? 'sidebar-icon-active' : 'sidebar-icon-inactive'}`}
                    strokeWidth={2.5}
                  />
                )}

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
