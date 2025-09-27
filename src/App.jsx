// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ServiceTypePage from "./pages/ServiceTypePage";
import AppLayout from "./pages/AppLayout";
import RegionPage from "./pages/RegionPage";
import AuthorizationManagementPage from "./pages/AuthorizationManagementPage.jsx";
import { initAuth } from "./api/authUtils";   // import

function ProtectedRoute({ children }) {
  const [isReady, setIsReady] = React.useState(false);
  const [isAuthed, setIsAuthed] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    initAuth().then(ok => {
      if (mounted) {
        setIsAuthed(ok);
        setIsReady(true);
      }
    });
    return () => { mounted = false; };
  }, []);

  if (!isReady) {
    return <div>Loading...</div>; // spinner/loader if you want
  }

  return isAuthed ? children : <Navigate to="/login" replace />;
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
          <Route path="/dashboard/:serviceId" element={<Dashboard />} />

          <Route
            path="/dashboard"
            element={
              <Navigate
                to={`/dashboard/${encodeURIComponent(
                  localStorage.getItem("lastServiceId") || "retirement_village"
                )}`}
                replace
              />
            }
          />

          <Route path="/service" element={<ServiceTypePage />} />
          <Route path="/region" element={<RegionPage />} />
          <Route path="/auth" element={<AuthorizationManagementPage />} />
        </Route>
      </Routes>
    </Router>
  );
}