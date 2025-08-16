// AppLayout.jsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import SideBar from '../components/SideBar'; 

export default function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <SideBar />
      <main className="flex-1 p-6 bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}
