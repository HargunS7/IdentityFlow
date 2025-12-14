// src/components/protectedRoutes.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Supports:
 * - requireRoles: user must have ANY of these roles
 * - requirePerms: user must have ALL of these perms
 * - requireAnyPerms: user must have ANY of these perms
 */
export default function ProtectedRoute({
  children,
  requireRoles,
  requirePerms,
  requireAnyPerms,
}) {
  const { user, roles, permissions, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const userRoles = roles || [];
  const combinedPerms = permissions?.combined || [];

  // Role gate (ANY match)
  if (Array.isArray(requireRoles) && requireRoles.length > 0) {
    const ok = requireRoles.some((r) => userRoles.includes(r));
    if (!ok) return <Navigate to="/dashboard" replace />;
  }

  // Permission gate (ALL required)
  if (Array.isArray(requirePerms) && requirePerms.length > 0) {
    const ok = requirePerms.every((p) => combinedPerms.includes(p));
    if (!ok) return <Navigate to="/dashboard" replace />;
  }

  // Permission gate (ANY required)
  if (Array.isArray(requireAnyPerms) && requireAnyPerms.length > 0) {
    const ok = requireAnyPerms.some((p) => combinedPerms.includes(p));
    if (!ok) return <Navigate to="/dashboard" replace />;
  }

  return children;
}
