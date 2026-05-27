import React from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Route guard.
 *  - requireRoles: ANY of these roles unlocks the route.
 *  - requirePerms: ALL of these perms must be present.
 *  - requireAnyPerms: ANY of these perms unlocks the route.
 */
export default function ProtectedRoute({
  children,
  requireRoles = [],
  requirePerms = [],
  requireAnyPerms = [],
}) {
  const { isAuthenticated, loading, roles, permissions } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoading />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const userRoles = Array.isArray(roles) ? roles : [];
  const effectivePerms = Array.isArray(permissions?.combined)
    ? permissions.combined
    : [];

  if (requireRoles.length) {
    const ok = requireRoles.some((r) => userRoles.includes(r));
    if (!ok) return <AccessDenied />;
  }

  if (requirePerms.length) {
    const ok = requirePerms.every((p) => effectivePerms.includes(p));
    if (!ok) return <AccessDenied />;
  }

  if (requireAnyPerms.length) {
    const ok = requireAnyPerms.some((p) => effectivePerms.includes(p));
    if (!ok) return <AccessDenied />;
  }

  return children;
}

function AuthLoading() {
  return (
    <div className="min-h-[40vh] w-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-white/70">
        <div className="h-10 w-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        <div className="text-sm">Checking your session…</div>
      </div>
    </div>
  );
}

function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div className="w-full flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-7 text-white"
      >
        <div className="text-xs uppercase tracking-wider text-white/60">
          Access restricted
        </div>
        <h1 className="mt-2 text-2xl font-semibold">Admin access required</h1>
        <p className="mt-3 text-sm text-white/70 leading-relaxed">
          This section is protected by role-based access control (RBAC). Only users with the required
          role/permissions can manage users, sessions, audit logs, and temporary access.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-black bg-white hover:bg-white/90 transition shadow"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => navigate("/learn")}
            className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition"
          >
            Learn about IAM
          </button>
        </div>

        <div className="mt-4 text-xs text-white/50">
          Tip: Roles/permissions can be granted temporarily (JIT) for testing.
        </div>
      </motion.div>
    </div>
  );
}
