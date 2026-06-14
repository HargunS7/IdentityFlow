import express from "express";
import { auth } from "../middleware/auth.js";
import { requireRoles, requirePerms } from "../middleware/rbac.js";
import { PERMISSIONS, ROLES } from "../lib/permissions.js";

import {
  getMe,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  userLookup,
  updateMe,
} from "../controllers/iamUserController.js";

import { assignRole, removeRole } from "../controllers/iamRoleController.js";

import {
  listSessions,
  revokeSession,
} from "../controllers/iamSessionController.js";

import { listAuditLogs } from "../controllers/auditController.js";

import {
  grantTemporaryPermission,
  listTemporaryPermissions,
  revokeTemporaryPermission,
} from "../controllers/iamTempPermController.js";

import { getSummary } from "../controllers/iamSummaryController.js";
import { resetDemo } from "../controllers/iamDemoController.js";

const router = express.Router();

/**
 * GET /api/me
 * Any logged-in user – returns profile + roles + permissions
 */
router.get("/me", auth(true), getMe);

/* -------------------------------------------------------------------------- */
/*                              ADMIN SUMMARY                                 */
/* -------------------------------------------------------------------------- */

// GET /api/admin/summary  — any console-relevant permission unlocks the
// fields they're allowed to see; non-permitted fields come back as null.
router.get(
  "/admin/summary",
  auth(true),
  requirePerms(
    PERMISSIONS.USER_READ,
    PERMISSIONS.SESSION_READ,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.TEMP_GRANT
  ),
  getSummary
);

// POST /api/admin/reset-demo — admin-only; restores demo accounts + clears
// visitor-created temp grants via the DB reset_demo() function.
router.post(
  "/admin/reset-demo",
  auth(true),
  requireRoles(ROLES.ADMIN),
  resetDemo
);

/* -------------------------------------------------------------------------- */
/*                               USER MANAGEMENT                              */
/* -------------------------------------------------------------------------- */

// GET /api/admin/users  (USER_READ — needed by anyone who can manage users)
router.get(
  "/admin/users",
  auth(true),
  requirePerms(PERMISSIONS.USER_READ),
  listUsers
);

// POST /api/admin/users  (USER_CREATE)
router.post(
  "/admin/users",
  auth(true),
  requirePerms(PERMISSIONS.USER_CREATE),
  createUser
);

// PATCH /api/admin/users/:id  (USER_UPDATE)
router.patch(
  "/admin/users/:id",
  auth(true),
  requirePerms(PERMISSIONS.USER_UPDATE),
  updateUser
);

// DELETE /api/admin/users/:id  (USER_DELETE)
router.delete(
  "/admin/users/:id",
  auth(true),
  requirePerms(PERMISSIONS.USER_DELETE),
  deleteUser
);

// GET /api/users/lookup?email=...  (USER_READ)
router.get(
  "/users/lookup",
  auth(true),
  requirePerms(PERMISSIONS.USER_READ),
  userLookup
);

// PATCH /api/me  — any logged-in user can update their own username
router.patch("/me", auth(true), updateMe);

/* -------------------------------------------------------------------------- */
/*                               ROLE MANAGEMENT                              */
/* -------------------------------------------------------------------------- */

// PUT /api/admin/assign-role  (ROLE_ASSIGN)
router.put(
  "/admin/assign-role",
  auth(true),
  requirePerms(PERMISSIONS.ROLE_ASSIGN),
  assignRole
);

// PUT /api/admin/remove-role  (ROLE_ASSIGN — same gate as assignRole)
router.put(
  "/admin/remove-role",
  auth(true),
  requirePerms(PERMISSIONS.ROLE_ASSIGN),
  removeRole
);

/* -------------------------------------------------------------------------- */
/*                                   SESSIONS                                 */
/* -------------------------------------------------------------------------- */

// GET /api/admin/sessions  (SESSION_READ)
router.get(
  "/admin/sessions",
  auth(true),
  requirePerms(PERMISSIONS.SESSION_READ),
  listSessions
);

// POST /api/admin/sessions/revoke  (SESSION_REVOKE)
router.post(
  "/admin/sessions/revoke",
  auth(true),
  requirePerms(PERMISSIONS.SESSION_REVOKE),
  revokeSession
);

/* -------------------------------------------------------------------------- */
/*                                 AUDIT LOGS                                 */
/* -------------------------------------------------------------------------- */

// GET /api/admin/audit-logs  (AUDIT_READ)
router.get(
  "/admin/audit-logs",
  auth(true),
  requirePerms(PERMISSIONS.AUDIT_READ),
  listAuditLogs
);

/* -------------------------------------------------------------------------- */
/*                          TEMP PERMISSION MANAGEMENT                        */
/* -------------------------------------------------------------------------- */

router.post(
  "/admin/temp-permissions/grant",
  auth(true),
  requirePerms(PERMISSIONS.TEMP_GRANT),
  grantTemporaryPermission
);

router.get(
  "/admin/temp-permissions",
  auth(true),
  requirePerms(PERMISSIONS.TEMP_GRANT),
  listTemporaryPermissions
);

router.post(
  "/admin/temp-permissions/revoke",
  auth(true),
  requirePerms(PERMISSIONS.TEMP_GRANT),
  revokeTemporaryPermission
);

/* ----------------------------------DEBUG------------------------------------ */

// /api/debug/rbac — mounted from server.js only when NODE_ENV !== "production"
export function mountDebugRoutes(app) {
  app.get("/api/debug/rbac", auth(true), (req, res) => {
    return res.json({
      user: req.user || null,
      roles: req.userRoles || [],
      permissions: req.userPerms || [],
    });
  });
}

export default router;
