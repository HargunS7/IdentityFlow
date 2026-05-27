import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import PublicLayout from "./layouts/publicLayout.jsx";
import AuthLayout from "./layouts/authLayout.jsx";
import AppLayout from "./layouts/appLayout.jsx";

import ProtectedRoute from "./components/protectedRoutes.jsx";

import Landing from "./pages/landing.jsx";
import LearnIAM from "./pages/learnIAM.jsx";
import Login from "./pages/login.jsx";
import Signup from "./pages/signup.jsx";
import Dashboard from "./pages/dashboard.jsx";
import Account from "./pages/accounts.jsx";

// Admin / Console pages
import AdminHome from "./pages/admin/AdminHome.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminSessions from "./pages/admin/AdminSessions.jsx";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs.jsx";
import AdminTempAccess from "./pages/admin/AdminTempAccess.jsx";

import {
  PERMISSIONS,
  CONSOLE_PERMS,
  ALL_CONSOLE_PERMS,
} from "./utils/permissions.js";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/learn" element={<LearnIAM />} />
        </Route>

        {/* AUTH */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        {/* PROTECTED APP */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/account" element={<Account />} />

          {/* =======================
              CONSOLE (permission-based)
              ======================= */}

          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAnyPerms={ALL_CONSOLE_PERMS}>
                <AdminHome />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requireAnyPerms={CONSOLE_PERMS.USERS}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/sessions"
            element={
              <ProtectedRoute requireAnyPerms={CONSOLE_PERMS.SESSIONS}>
                <AdminSessions />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute requireAnyPerms={[PERMISSIONS.AUDIT_READ]}>
                <AdminAuditLogs />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/temp-access"
            element={
              <ProtectedRoute requireAnyPerms={[PERMISSIONS.TEMP_GRANT]}>
                <AdminTempAccess />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center">
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-6 py-4">
                <h2 className="text-lg font-semibold">Coming Soon...</h2>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
