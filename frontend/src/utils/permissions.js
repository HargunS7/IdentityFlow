// Mirrors backend/src/lib/permissions.js.
// Keep these two files in sync.

export const PERMISSIONS = Object.freeze({
  USER_READ: "USER_READ",
  USER_CREATE: "USER_CREATE",
  USER_UPDATE: "USER_UPDATE",
  USER_DELETE: "USER_DELETE",
  ROLE_ASSIGN: "ROLE_ASSIGN",
  AUDIT_READ: "AUDIT_READ",
  SESSION_READ: "SESSION_READ",
  SESSION_REVOKE: "SESSION_REVOKE",
  TEMP_GRANT: "TEMP_GRANT",
});

export const ROLES = Object.freeze({
  ADMIN: "admin",
  MANAGER: "manager",
  SECURITY_ANALYST: "security_analyst",
  AUDITOR: "auditor",
  USER: "user",
  DEMO: "demo",
});

export const CONSOLE_PERMS = Object.freeze({
  USERS: [
    PERMISSIONS.ROLE_ASSIGN,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
  ],
  SESSIONS: [PERMISSIONS.SESSION_READ, PERMISSIONS.SESSION_REVOKE],
  AUDIT: [PERMISSIONS.AUDIT_READ],
  TEMP: [PERMISSIONS.TEMP_GRANT],
});

export const ALL_CONSOLE_PERMS = Object.freeze([
  ...CONSOLE_PERMS.USERS,
  ...CONSOLE_PERMS.SESSIONS,
  ...CONSOLE_PERMS.AUDIT,
  ...CONSOLE_PERMS.TEMP,
]);

// Helpers
function permList(permissions) {
  if (!permissions) return [];
  return permissions.combined || permissions;
}

export function hasPerm(permissions, perm) {
  return permList(permissions).includes(perm);
}

export function hasAnyPerm(permissions, perms = []) {
  const list = permList(permissions);
  return perms.some((p) => list.includes(p));
}

export function hasAllPerms(permissions, perms = []) {
  const list = permList(permissions);
  return perms.every((p) => list.includes(p));
}
