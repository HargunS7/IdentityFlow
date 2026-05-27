import api from "../utils/api.js";

/**
 * Fetch authenticated user IAM profile.
 *   { user, roles, permissions, tempGrants }
 */
export async function getMe() {
  const res = await api.get("/api/me");
  return res.data;
}

/**
 * Dashboard summary counts (USER_READ, SESSION_READ, AUDIT_READ, TEMP_GRANT).
 *   { users, sessions, auditLogs, tempGrants, generatedAt }
 */
export async function getAdminSummary() {
  const res = await api.get("/api/admin/summary");
  return res.data;
}
