// // backend/src/routes/iamRoutes.js
// import express from "express";
// import { PrismaClient } from "@prisma/client";
// import { auth } from "../middleware/auth.js";
// import { requireRoles, requirePerms } from "../middleware/rbac.js";

// const prisma = new PrismaClient();
// const router = express.Router();

// /**
//  * GET /api/me
//  * Any logged-in user – returns profile + roles + permissions
//  */
// router.get("/me", auth(true), async (req, res) => {
//   res.json({
//     user: req.user,
//     roles: req.userRoles,
//     permissions: req.userPerms,
//   });
// });

// /**
//  * GET /api/admin/users
//  * Admin-only – list all users
//  */
// router.get(
//   "/admin/users",
//   auth(true),
//   requireRoles("admin"),
//   async (req, res) => {
//     const users = await prisma.user.findMany({
//       select: {
//         id: true,
//         email: true,
//         username: true,
//         mfaEnabled: true,
//         createdAt: true,
//       },
//     });
//     res.json(users);
//   }
// );

// /**
//  * POST /api/admin/assign-role
//  * Admin-only – assign a role to a user
//  * body: { userId: string, roleName: string }
//  */
// router.post(
//   "/admin/assign-role",
//   auth(true),
//   requireRoles("admin"),
//   async (req, res) => {
//     const { userId, roleName } = req.body;

//     if (!userId || !roleName) {
//       return res.status(400).json({ error: "userId and roleName are required" });
//     }

//     const role = await prisma.role.findUnique({ where: { name: roleName } });
//     if (!role) return res.status(400).json({ error: "Role not found" });

//     // Simple create – if you have @@unique([userId, roleId]) you can switch to upsert
//     try {
//       await prisma.userRole.create({
//         data: {
//           userId,
//           roleId: role.id,
//         },
//       });
//     } catch (e) {
//       // ignore duplicate errors
//       console.warn("assign-role: probably duplicate mapping", e.code);
//     }

//     res.json({ success: true });
//   }
// );

// /**
//  * GET /api/users/lookup?email=...
//  * Example permission-based route (requires USER_READ)
//  */
// router.get(
//   "/users/lookup",
//   auth(true),
//   requirePerms("USER_READ"),
//   async (req, res) => {
//     const { email } = req.query;
//     if (!email) return res.status(400).json({ error: "email is required" });

//     const user = await prisma.user.findUnique({
//       where: { email: String(email) },
//       select: { id: true, email: true },
//     });

//     res.json({ found: !!user, user });
//   }
// );

// export default router;



// -----------------------------------------------------------------------------------------------------------------------------------

// backend/src/routes/iamRoutes.js
import express from "express";
import { PrismaClient } from "@prisma/client";
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

import {
  listSessions,
  revokeSession,
} from "../controllers/iamSessionController.js";

import { listAuditLogs } from "../controllers/auditController.js";

const prisma = new PrismaClient();
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

// /**
//  * POST /api/admin/users
//  * Permission: USER_CREATE
//  * Stub endpoint – just to test RBAC. You can later implement real create logic.
//  */
// router.post(
//   "/admin/users",
//   auth(true),
//   requirePerms("USER_CREATE"),
//   async (req, res) => {
//     // For now, don't actually create a user; just prove permission works
//     return res.json({
//       message: "USER_CREATE allowed – implement actual create logic later",
//       performedBy: req.user.id,
//       body: req.body,
//     });
//   }
// );

// /**
//  * PATCH /api/admin/users/:id
//  * Permission: USER_UPDATE
//  * Stub endpoint – for RBAC testing.
//  */
// router.patch(
//   "/admin/users/:id",
//   auth(true),
//   requirePerms("USER_UPDATE"),
//   async (req, res) => {
//     const { id } = req.params;
//     return res.json({
//       message: "USER_UPDATE allowed – implement actual update logic later",
//       targetUserId: id,
//       performedBy: req.user.id,
//       body: req.body,
//     });
//   }
// );

// /**
//  * DELETE /api/admin/users/:id
//  * Permission: USER_DELETE
//  * Stub endpoint – for RBAC testing.
//  */
// router.delete(
//   "/admin/users/:id",
//   auth(true),
//   requirePerms("USER_DELETE"),
//   async (req, res) => {
//     const { id } = req.params;
//     return res.json({
//       message: "USER_DELETE allowed – implement actual delete logic later",
//       targetUserId: id,
//       performedBy: req.user.id,
//     });
//   }
// );


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

/**
 * POST /api/admin/assign-role
 * Permission: ROLE_ASSIGN
 * body: { userId: string, roleName: string }
 */
// router.post(
//   "/admin/assign-role",
//   auth(true),
//   requirePerms("ROLE_ASSIGN"),
//   async (req, res) => {
//     const { userId, roleName } = req.body;

//     if (!userId || !roleName) {
//       return res
//         .status(400)
//         .json({ error: "userId and roleName are required" });
//     }

//     const role = await prisma.role.findUnique({ where: { name: roleName } });
//     if (!role) return res.status(400).json({ error: "Role not found" });

//     try {
//       await prisma.userRole.create({
//         data: {
//           userId,
//           roleId: role.id,
//         },
//       });
//     } catch (e) {
//       // ignore duplicate errors
//       console.warn("assign-role: probably duplicate mapping", e.code);
//     }

//     res.json({ success: true });
//   }
// );

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
