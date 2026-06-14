import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import PublicLayout from "./layouts/publicLayout.jsx";
import AuthLayout from "./layouts/authLayout.jsx";
import AppLayout from "./layouts/appLayout.jsx";

import ProtectedRoute from "./components/protectedRoutes.jsx";
import { Spinner } from "./components/ui.jsx";

import {
  PERMISSIONS,
  CONSOLE_PERMS,
  ALL_CONSOLE_PERMS,
} from "./utils/permissions.js";

// All pages are code-split. The route loading state shows a centered spinner.
const Landing       = lazy(() => import("./pages/landing.jsx"));
const LearnIAM      = lazy(() => import("./pages/learnIAM.jsx"));
const Concepts      = lazy(() => import("./pages/concepts.jsx"));
const Login         = lazy(() => import("./pages/login.jsx"));
const Signup        = lazy(() => import("./pages/signup.jsx"));
const Dashboard     = lazy(() => import("./pages/dashboard.jsx"));
const Account       = lazy(() => import("./pages/accounts.jsx"));

const AdminHome      = lazy(() => import("./pages/admin/AdminHome.jsx"));
const AdminUsers     = lazy(() => import("./pages/admin/AdminUsers.jsx"));
const AdminSessions  = lazy(() => import("./pages/admin/AdminSessions.jsx"));
const AdminAuditLogs = lazy(() => import("./pages/admin/AdminAuditLogs.jsx"));
const AdminTempAccess = lazy(() => import("./pages/admin/AdminTempAccess.jsx"));

function RouteFallback() {
  return (
    <div className="min-h-[40vh] w-full flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

function PageTransition({ children }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function AppRoutes() {
  return (
    <PageTransition>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* PUBLIC */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/learn" element={<LearnIAM />} />
            <Route path="/concepts" element={<Concepts />} />
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
              <div className="min-h-screen bg-[#06080f] text-white flex items-center justify-center px-4">
                <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl px-8 py-7 text-center max-w-md">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-white/50">
                    404
                  </div>
                  <h2 className="mt-1 text-2xl font-semibold">Page not found</h2>
                  <p className="mt-2 text-sm text-white/60">
                    The page you're looking for doesn't exist or has been moved.
                  </p>
                </div>
              </div>
            }
          />
        </Routes>
      </Suspense>
    </PageTransition>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
