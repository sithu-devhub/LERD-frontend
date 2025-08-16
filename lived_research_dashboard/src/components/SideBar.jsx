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

  // collapsed state (persisted)
  const [collapsed, setCollapsed] = React.useState(
    () => localStorage.getItem('sidebarCollapsed') === '1'
  );
  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem('sidebarCollapsed', next ? '1' : '0');
      return next;
    });
  };

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
    <div
      className={`sidebar min-h-screen bg-white flex flex-col border-r border-gray-200 ${
        collapsed ? 'sidebar--collapsed' : ''
      }`}
    >
      {/* Header */}
      <div>
        {!collapsed && (
          <>
            <h2 className="text-center text-lg font-bold text-[#1B2559] py-10">
              Menu
            </h2>
            <div className="mx-6 -mt-2 mb-4 h-px bg-gray-200/70" />
          </>
        )}

        {/* collapse toggle */}
        <button
          type="button"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          onClick={toggleCollapsed}
          className="sidebar-toggle"
        >
          {collapsed ? (
            // Double chevron pointing right (outline)
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 6l6 6-6 6" />   {/* right arrow 1 */}
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 6l6 6-6 6" />  {/* right arrow 2 */}
            </svg>
          ) : (
            // Double chevron pointing left (outline)
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 6l-6 6 6 6" />  {/* left arrow 1 */}
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 6l-6 6 6 6" />  {/* left arrow 2 */}
            </svg>
          )}
        </button>
      </div>

      {/* Profile */}
      <div className={`flex items-center mb-6 px-6 ml-2 profile-block ${collapsed ? 'mt-12' : 'mt-12'}`}>
        <img
          src="https://i.pravatar.cc/100?img=32"
          alt="Profile"
          className={`rounded-full ${
            collapsed ? 'w-8 h-8' : 'w-8 h-8'
          }`}
        />
        {!collapsed && (
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-800">Name</p>
            <p className="text-xs text-gray-500">Position</p>
          </div>
        )}
      </div>


      {/* Nav */}
      <nav className="space-y-4 px-6">
        {navItems.map((item) => {
          const active = isActivePath(item.path);
          const Icon = item.Icon;

          const isCustom =
            Icon === DashboardIcon ||
            Icon === ServiceTypeIcon ||
            Icon === AuthorisationIcon ||
            Icon === RegionIcon ||
            Icon === LogoutIcon;

          return (
            <div
              key={item.name}
              onClick={() => handleNavClick(item)}
              className={`sidebar-item ${active ? 'sidebar-active' : 'sidebar-inactive'}`}
              title={collapsed ? item.name : undefined}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleNavClick(item)}
            >

              {isCustom ? (
                <Icon
                  className={`sidebar-icon ${active ? 'sidebar-icon-active' : 'sidebar-icon-inactive'}`}
                  filled={active}
                />

              ) : (
                <Icon
                  className={`w-6 h-6 ${active ? 'sidebar-icon-active' : 'sidebar-icon-inactive'}`}
                  strokeWidth={2.5}
                />
              )}


              {!collapsed && <span className="sidebar-label">{item.name}</span>}
              {active && <span className="sidebar-rail sidebar-rail--pill" />}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
