// components/SideBar.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/sidebar.css';
import { MdHome, MdShoppingCart, MdBarChart } from "react-icons/md";
import { FaUsers } from "react-icons/fa";
// import AuthorisationIcon from "../icons/AuthorisationIcon";
import LogoutIcon from "../icons/LogoutIcon";
import http from '../api/http';               // axios instance with interceptor
import { logout as logoutApi } from '../api/authService'; // logout service

export default function SideBar() {
  const navigate = useNavigate();
  const location = useLocation();

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

  const [user, setUser] = useState(null);

  useEffect(() => {
    // Load from localStorage (fullName, position)
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // Validate token and fetch current user info
    async function validateToken() {
      try {
        const res = await http.get("/Auth/me"); // axios with auto-refresh
        console.log("🔎 /Auth/me response:", res.data); // Debug log

        if (res?.data?.userId) {
          // Merge with local user data
          const localUser = JSON.parse(localStorage.getItem("user")) || {};
          const updatedUser = {
            ...localUser,
            userId: res.data.userId,
            username: res.data.username,
          };

          localStorage.setItem("user", JSON.stringify(updatedUser));
          setUser(updatedUser);

          console.log("✅ Updated user stored in localStorage:", updatedUser); // Debug log
        } else {
          handleLogout();
        }
      } catch (e) {
        console.warn("❌ Token validation failed:", e);
        handleLogout();
      }
    }
    validateToken();
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', Icon: MdHome },
    { name: 'Service Type', path: '/service', Icon: MdShoppingCart },
    { name: 'Region', path: '/region', Icon: MdBarChart },
    // { name: 'Authorisation Management', path: '/auth', Icon: AuthorisationIcon },
    { name: 'Attributes', path: '/attributes', Icon: MdBarChart },
    { name: 'Log out', action: 'logout', Icon: LogoutIcon },
  ];

  const handleLogout = async () => {
    try {
      await logoutApi(); // call /api/Auth/logout
    } catch (e) {
      console.warn("Logout request failed:", e);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      navigate('/login');
    }
  };

  const handleNavClick = (item) => {
    if (item.action === 'logout') handleLogout();
    else navigate(item.path);
  };

  const isActivePath = (p) =>
    p && (location.pathname === p || location.pathname.startsWith(p + '/'));

  return (
    <div
      className={`sidebar min-h-screen bg-white flex flex-col border-r border-gray-200 ${collapsed ? 'sidebar--collapsed' : ''
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
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 6l6 6-6 6" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 6l6 6-6 6" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 6l-6 6 6 6" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 6l-6 6 6 6" />
            </svg>
          )}
        </button>
      </div>

      {/* Profile */}
      <div className={`flex items-center mb-6 px-6 ml-2 profile-block ${collapsed ? 'mt-12' : 'mt-12'}`}>
        <img
          src="https://i.pravatar.cc/100?img=32"
          alt="Profile"
          className={`rounded-full ${collapsed ? 'w-8 h-8' : 'w-8 h-8'}`}
        />
        {!collapsed && (
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-800">
              {user?.fullName || "Name"}
            </p>
            <p className="text-xs text-gray-500">
              {user?.position || "Position"}
            </p>
            {/* Optionally show username for debug */}
            <p className="text-xs text-gray-400">
              {user?.username ? `@${user.username}` : ""}
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="space-y-4 px-6">
        {navItems.map((item) => {
          const active = isActivePath(item.path);
          const Icon = item.Icon;

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
              <Icon
                className={`w-6 h-6 ${active ? 'sidebar-icon-active' : 'sidebar-icon-inactive'}`}
              />
              {!collapsed && <span className="sidebar-label">{item.name}</span>}
              {active && <span className="sidebar-rail sidebar-rail--pill" />}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
