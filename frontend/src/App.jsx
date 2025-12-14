// src/App.jsx
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

// Admin pages
import AdminHome from "./pages/admin/AdminHome.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminSessions from "./pages/admin/AdminSessions.jsx";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs.jsx";
import AdminTempAccess from "./pages/admin/AdminTempAccess.jsx";

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

          {/* ADMIN / CONSOLE AREA (permission-gated) */}

          {/* Console home: allow anyone with at least one console-relevant permission */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute
                requireAnyPerms={[
                  "ADMIN",
                  "ROLE_ASSIGN",
                  "USER_READ",
                  "USER_UPDATE",
                  "USER_CREATE",
                  "USER_DELETE",
                  "SESSION_READ",
                  "SESSION_REVOKE",
                  "AUDIT_READ",
                  "TEMP_GRANT",
                ]}
              >
                <AdminHome />
              </ProtectedRoute>
            }
          />

          {/* Users & Roles */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute
                requireAnyPerms={[
                  "ADMIN",
                  "ROLE_ASSIGN",
                  "USER_READ",
                  "USER_UPDATE",
                  "USER_CREATE",
                  "USER_DELETE",
                ]}
              >
                <AdminUsers />
              </ProtectedRoute>
            }
          />

          {/* Sessions */}
          <Route
            path="/admin/sessions"
            element={
              <ProtectedRoute
                requireAnyPerms={["ADMIN", "SESSION_READ", "SESSION_REVOKE"]}
              >
                <AdminSessions />
              </ProtectedRoute>
            }
          />

          {/* Audit Logs */}
          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute requireAnyPerms={["ADMIN", "AUDIT_READ"]}>
                <AdminAuditLogs />
              </ProtectedRoute>
            }
          />

          {/* Temp Access */}
          <Route
            path="/admin/temp-access"
            element={
              <ProtectedRoute requireAnyPerms={["ADMIN", "TEMP_GRANT"]}>
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
                <h2 className="text-lg font-semibold">404</h2>
                <p className="text-white/70 text-sm">Page not found</p>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
