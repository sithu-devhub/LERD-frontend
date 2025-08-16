// App.jsx

import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ServiceTypePage from "./pages/ServiceTypePage";
import AppLayout from "./pages/AppLayout";
import RegionPage from "./pages/RegionPage";
import AuthorizationManagementPage from "./pages/AuthorizationManagementPage.jsx";

function ProtectedRoute({ children }) {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* public */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* protected with sidebar layout */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/service" element={<ServiceTypePage />} />
          <Route path="/region" element={<RegionPage />} /> 
          <Route path="/auth" element={<AuthorizationManagementPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
