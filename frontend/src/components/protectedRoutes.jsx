// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({
  children,
  requireRoles = [],
  requirePerms = [],
}) {
  const { isAuthenticated, loading, roles, permissions } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-6 py-4">
          <p className="text-sm text-white/80">Checking session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const roleList = roles || [];
  const permList = permissions?.combined || permissions || [];

  if (requireRoles.length > 0) {
    const hasRole = requireRoles.some((r) => roleList.includes(r));
    if (!hasRole) {
      return (
        <div className="min-h-screen flex items-center justify-center text-white px-4">
          <div className="max-w-lg w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
            <h1 className="text-xl font-semibold mb-2">Access denied</h1>
            <p className="text-white/70 text-sm mb-4">
              You don’t have the required role(s) to view this page.
            </p>
            <div className="text-xs text-white/60">
              Required roles:{" "}
              <span className="text-white/80">{requireRoles.join(", ")}</span>
            </div>
          </div>
        </div>
      );
    }
  }

  if (requirePerms.length > 0) {
    const hasAllPerms = requirePerms.every((p) => permList.includes(p));
    if (!hasAllPerms) {
      return (
        <div className="min-h-screen flex items-center justify-center text-white px-4">
          <div className="max-w-lg w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
            <h1 className="text-xl font-semibold mb-2">Access denied</h1>
            <p className="text-white/70 text-sm mb-4">
              You don’t have the required permission(s) to view this page.
            </p>
            <div className="text-xs text-white/60">
              Required permissions:{" "}
              <span className="text-white/80">{requirePerms.join(", ")}</span>
            </div>
          </div>
        </div>
      );
    }
  }

  return children;
}
