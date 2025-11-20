// backend/src/routes/iamRoutes.js
import express from "express";
import { PrismaClient } from "@prisma/client";
import { auth } from "../middleware/auth.js";
import { requireRoles, requirePerms } from "../middleware/rbac.js";

const prisma = new PrismaClient();
const router = express.Router();

/**
 * GET /api/me
 * Any logged-in user – returns profile + roles + permissions
 */
router.get("/me", auth(true), async (req, res) => {
  res.json({
    user: req.user,
    roles: req.userRoles,
    permissions: req.userPerms,
  });
});

/**
 * GET /api/admin/users
 * Admin-only – list all users
 */
router.get(
  "/admin/users",
  auth(true),
  requireRoles("admin"),
  async (req, res) => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        mfaEnabled: true,
        createdAt: true,
      },
    });
    res.json(users);
  }
);

/**
 * POST /api/admin/assign-role
 * Admin-only – assign a role to a user
 * body: { userId: string, roleName: string }
 */
router.post(
  "/admin/assign-role",
  auth(true),
  requireRoles("admin"),
  async (req, res) => {
    const { userId, roleName } = req.body;

    if (!userId || !roleName) {
      return res.status(400).json({ error: "userId and roleName are required" });
    }

    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) return res.status(400).json({ error: "Role not found" });

    // Simple create – if you have @@unique([userId, roleId]) you can switch to upsert
    try {
      await prisma.userRole.create({
        data: {
          userId,
          roleId: role.id,
        },
      });
    } catch (e) {
      // ignore duplicate errors
      console.warn("assign-role: probably duplicate mapping", e.code);
    }

    res.json({ success: true });
  }
);

/**
 * GET /api/users/lookup?email=...
 * Example permission-based route (requires USER_READ)
 */
router.get(
  "/users/lookup",
  auth(true),
  requirePerms("USER_READ"),
  async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "email is required" });

    const user = await prisma.user.findUnique({
      where: { email: String(email) },
      select: { id: true, email: true },
    });

    res.json({ found: !!user, user });
  }
);

export default router;
