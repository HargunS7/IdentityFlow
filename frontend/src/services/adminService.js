import api from "../utils/api.js";

/* -------------------------------------------------------------------------- */
/*                                   USERS                                    */
/* -------------------------------------------------------------------------- */

export async function listUsers(params = {}) {
  const res = await api.get("/api/admin/users", { params });
  return res.data;
}

export async function createUser(payload) {
  const res = await api.post("/api/admin/users", payload);
  return res.data;
}

export async function updateUser(userId, payload) {
  const res = await api.patch(`/api/admin/users/${userId}`, payload);
  return res.data;
}

export async function deleteUser(userId) {
  const res = await api.delete(`/api/admin/users/${userId}`);
  return res.data;
}

// Self-service: update your own profile (username for now)
export async function updateMe(payload) {
  const res = await api.patch("/api/me", payload);
  return res.data;
}

export async function userLookup(query) {
  const res = await api.get("/api/users/lookup", {
    params: query.includes("@")
      ? { email: query }
      : { username: query },
  });
  return res.data;
}

/* -------------------------------------------------------------------------- */
/*                                   ROLES                                    */
/* -------------------------------------------------------------------------- */

export async function assignRole(userId, roleName) {
  const res = await api.put("/api/admin/assign-role", {
    userId,
    roleName,
  });
  return res.data;
}

export async function removeRole(userId, roleName) {
  const res = await api.put("/api/admin/remove-role", {
     userId, 
     roleName,
  });
  return res.data;
}

/* -------------------------------------------------------------------------- */
/*                                  SESSIONS                                  */
/* -------------------------------------------------------------------------- */

export async function listSessions(params = {}) {
  const res = await api.get("/api/admin/sessions", { params });
  return res.data;
}

export async function revokeSession(payload) {
  const res = await api.post("/api/admin/sessions/revoke", payload);
  return res.data;
}

/* -------------------------------------------------------------------------- */
/*                                 AUDIT LOGS                                 */
/* -------------------------------------------------------------------------- */

export async function listAuditLogs(params = {}) {
  const res = await api.get("/api/admin/audit-logs", { params });
  return res.data;
}

/* -------------------------------------------------------------------------- */
/*                           TEMPORARY PERMISSIONS                             */
/* -------------------------------------------------------------------------- */

export async function grantTempPermission(payload) {
  const res = await api.post("/api/admin/temp-permissions/grant", payload);
  return res.data;
}

export async function listTempPermissions(params = {}) {
  const res = await api.get("/api/admin/temp-permissions", { params });
  return res.data;
}

export async function revokeTempPermission(payload) {
  const res = await api.post("/api/admin/temp-permissions/revoke", payload);
  return res.data;
}
