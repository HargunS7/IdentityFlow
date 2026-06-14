// Central registry of permission codes and role names.
// Anything that gates an action MUST import from here so the strings
// stay in lockstep with the seed and the frontend.

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

// Groupings used to gate the console pages (any of these unlocks the page).
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
