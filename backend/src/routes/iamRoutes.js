// backend/src/routes/iamRoutes.js
import express from "express";
import { auth } from "../middleware/auth.js";
import { requireRoles, requirePerms } from "../middleware/rbac.js";

import {
  getMe,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  userLookup
} from "../controllers/iamUserController.js";

import { assignRole,removeRole } from "../controllers/iamRoleController.js";

import { listSessions,revokeSession } from "../controllers/iamSessionController.js";

import { listAuditLogs } from "../controllers/auditController.js";

const router = express.Router();

/**
 * GET /api/me
 * Any logged-in user – returns profile + roles + permissions
 */
router.get(
  "/me", 
  auth(true),
  getMe
);

/* -------------------------------------------------------------------------- */
/*                               USER MANAGEMENT                              */
/* -------------------------------------------------------------------------- */

/**
 * GET /api/admin/users
 * Permission: USER_READ
 * Anyone with USER_READ (admin, manager, user per your mapping) can list users.
 */
router.get(
  "/admin/users",
  auth(true),
  requirePerms("ADMIN"),
  listUsers
);


// POST /api/admin/users  (USER_CREATE)
router.post(
  "/admin/users",
  auth(true),
  requirePerms("USER_CREATE"),
  createUser
);

// PATCH /api/admin/users/:id  (USER_UPDATE)
router.patch(
  "/admin/users/:id",
  auth(true),
  requirePerms("USER_UPDATE"),
  updateUser
);

// DELETE /api/admin/users/:id  (USER_DELETE)
router.delete(
  "/admin/users/:id",
  auth(true),
  requirePerms("USER_DELETE"),
  deleteUser
);

/**
 * GET /api/users/lookup?email=...
 * Permission: USER_READ
 */
router.get(
  "/users/lookup",
  auth(true),
  requirePerms("USER_READ"),
  
  userLookup
);



/* -------------------------------------------------------------------------- */
/*                               ROLE MANAGEMENT                              */
/* -------------------------------------------------------------------------- */



router.post(
  "/admin/assign-role",
  auth(true),
  requirePerms("ROLE_ASSIGN"),
  assignRole
);

// DELETE /api/admin/remove-role
// body: { userId, roleName }
router.delete(
  "/admin/remove-role",
  auth(true),
  requireRoles("admin"),
  removeRole
);


/* -------------------------------------------------------------------------- */
/*                                   SESSIONS                                 */
/* -------------------------------------------------------------------------- */

/**
 * GET /api/admin/sessions
 * Permission: SESSION_READ
 * Lists all sessions (limit 100 for now).
 */
router.get(
  "/admin/sessions",
  auth(true),
  requirePerms("SESSION_READ"),
  listSessions
);

/**
 * POST /api/admin/sessions/revoke
 * Permission: SESSION_REVOKE
 * body: { sessionId?: string, refreshTokenId?: string }
 */
router.post(
  "/admin/sessions/revoke",
  auth(true),
  requirePerms("SESSION_REVOKE"),
  revokeSession
);

/* -------------------------------------------------------------------------- */
/*                                 AUDIT LOGS                                 */
/* -------------------------------------------------------------------------- */

/**
 * GET /api/admin/audit-logs
 * Permission: AUDIT_READ
 * Returns latest 100 audit logs.
 */
router.get(
  "/admin/audit-logs",
  auth(true),
  requirePerms("AUDIT_READ"),
  listAuditLogs
);


// ----------------------------------DEBUG------------------------------------

/**
 * GET /api/debug/rbac
 * Shows the current user's RBAC context.
 * Use ONLY for debugging (don't expose in production)
 */
router.get("/debug/rbac", auth(true), (req, res) => {
  return res.json({
    user: req.user || null,
    roles: req.userRoles || [],
    permissions: req.userPerms || [],
  });
});

export default router;
