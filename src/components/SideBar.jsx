// components/SideBar.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/sidebar.css';
import { MdHome, MdShoppingCart, MdBarChart } from "react-icons/md";
import { FaUsers } from "react-icons/fa";
import AuthorisationIcon from "../icons/AuthorisationIcon";
import LogoutIcon from "../icons/LogoutIcon";
import http from '../api/http';               // axios instance with interceptor
import { logout as logoutApi, getAllUsers } from '../api/authService';

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

  // Stores whether the logged-in user is an active admin
  const [canViewAuthManagement, setCanViewAuthManagement] = useState(false);

  useEffect(() => {
    // Load from localStorage (fullName, position)
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);

      // Initial sidebar visibility check using saved login data
      const isActiveAdmin =
        String(parsedUser?.userRole || "").toLowerCase() === "admin" &&
        String(parsedUser?.isActive).toLowerCase() === "true";

      setCanViewAuthManagement(isActiveAdmin);
    }

    // Validate token and fetch current user info
    // async function validateToken() {
    //   try {
    //     const res = await http.get("/Auth/me"); // axios with auto-refresh
    //     console.log("🔎 /Auth/me response:", res.data); // Debug log

    //     if (res?.data?.userId) {
    //       // Merge current logged-in user data from /Auth/me into localStorage
    //       const localUser = JSON.parse(localStorage.getItem("user")) || {};

    //       const updatedUser = {
    //         ...localUser,
    //         userId: res.data.userId,
    //         username: res.data.username,
    //         // keep existing role if /Auth/me does not return it
    //         userRole: res.data.userRole ?? localUser.userRole,
    //         // keep existing active status if /Auth/me does not return it
    //         isActive: res.data.isActive ?? localUser.isActive,
    //       };

    //       // Save updated logged-in user details
    //       localStorage.setItem("user", JSON.stringify(updatedUser));
    //       setUser(updatedUser);

    //       // Show Authorization Management tab only for active admin users
    //       const isActiveAdmin =
    //         String(updatedUser?.userRole || "").toLowerCase() === "admin" &&
    //         String(updatedUser?.isActive).toLowerCase() === "true";

    //       setCanViewAuthManagement(isActiveAdmin);

    //       console.log("✅ Updated user stored in localStorage:", updatedUser);
    //     } else {
    //       handleLogout();
    //     }
    //   } catch (e) {
    //     console.warn("❌ Token validation failed:", e);
    //     handleLogout();
    //   }
    // }
    async function validateToken() {
      try {
        // 1. Only use /Auth/me to validate session/token
        const res = await http.get("/Auth/me");
        console.log("🔎 /Auth/me response:", res.data);

        if (!res?.data?.userId) {
          handleLogout();
          return;
        }

        const localUser = JSON.parse(localStorage.getItem("user")) || {};
        const username = res.data.username || localUser.username;

        // Save basic logged-in user info first
        let updatedUser = {
          ...localUser,
          userId: res.data.userId,
          username: username,
          fullName: localUser.fullName,
          position: localUser.position,
        };

        // 2. Try to fetch role/active status separately
        // If this fails for non-admins, DO NOT logout
        try {
          if (username) {
            const searchRes = await getAllUsers({
              PageNumber: 1,
              PageSize: 10,
              Search: username,
            });

            const matchedUser = searchRes?.data?.data?.find(
              (u) => String(u.username).toLowerCase() === String(username).toLowerCase()
            );

            if (matchedUser) {
              updatedUser = {
                ...updatedUser,
                userRole: matchedUser.userRole,
                isActive: matchedUser.isActive,
              };
            }
          }
        } catch (searchError) {
          console.warn("Search user API not available for this user:", searchError);

          // Non-admins may not be allowed to call this endpoint.
          // Just hide admin-only tab and continue.
          updatedUser = {
            ...updatedUser,
            userRole: updatedUser.userRole ?? null,
            isActive: updatedUser.isActive ?? null,
          };
        }

        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);

        const isActiveAdmin =
          String(updatedUser?.userRole || "").toLowerCase() === "admin" &&
          String(updatedUser?.isActive).toLowerCase() === "true";

        setCanViewAuthManagement(isActiveAdmin);

        console.log("✅ Updated user stored in localStorage:", updatedUser);
        console.log("✅ canViewAuthManagement:", isActiveAdmin);
      } catch (e) {
        // Only logout if /Auth/me itself fails
        console.warn("❌ Token validation failed:", e);
        handleLogout();
      }
    }

    validateToken();
  }, []);

  // Build sidebar items and only show Authorization Management for active admins
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', Icon: MdHome },
    { name: 'Service Type', path: '/service', Icon: MdShoppingCart },
    { name: 'Region', path: '/region', Icon: MdBarChart },
    ...(canViewAuthManagement
      ? [{ name: 'Authorisation Management', path: '/auth', Icon: AuthorisationIcon }]
      : []),
    // { name: 'Attributes', path: '/attributes', Icon: MdBarChart },
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
