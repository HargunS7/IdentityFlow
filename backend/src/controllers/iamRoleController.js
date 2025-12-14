// backend/src/controllers/iamRoleController.js
import prisma from "../PrismaClient.js";
import { logAudit } from "../lib/logging.js";


/**
 * PUT /api/admin/role
 * Permission: ROLE_ASSIGN
 * body: { userId: string, roleName: string }
 */
export const assignRole = async (req, res) => {
  try {
    const { userId, roleName } = req.body;

    if (!userId || !roleName) {
      return res
        .status(400)
        .json({ error: "userId and roleName are required" });
    }

    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });
    if (!role) {
      return res.status(400).json({ error: "Role not found" });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (!targetUser) {
      return res.status(404).json({ error: "Target user not found" });
    }

    // 🔁 Replace role (enforce single role)
    await prisma.$transaction([
      prisma.userRole.deleteMany({
        where: { userId },
      }),
      prisma.userRole.create({
        data: {
          userId,
          roleId: role.id,
        },
      }),
    ]);

    // 🔐 Audit
    await logAudit(req.user.id, "ROLE_ASSIGN", req, {
      targetUserId: userId,
      targetUserEmail: targetUser.email,
      newRole: roleName,
    });

    return res.json({
      success: true,
      role: roleName,
    });
  } catch (err) {
    console.error("ROLE_ASSIGN error:", err);
    return res.status(500).json({ error: "Failed to assign role" });
  }
};


/**
 * PUT /api/admin/role/remove
 * Permission: ROLE_ASSIGN
 * body: { userId: string, roleName: string }
 */
export const removeRole = async (req, res) => {
  try {
    const { userId, roleName } = req.body;

    if (!userId || !roleName) {
      return res
        .status(400)
        .json({ error: "userId and roleName are required" });
    }

    if (roleName === "user") {
      return res
        .status(400)
        .json({ error: "Base role 'user' cannot be removed" });
    }

    const baseRole = await prisma.role.findUnique({
      where: { name: "user" },
    });
    if (!baseRole) {
      return res.status(500).json({ error: "Base role not found" });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (!targetUser) {
      return res.status(404).json({ error: "Target user not found" });
    }

    // 🔁 Reset role back to "user"
    await prisma.$transaction([
      prisma.userRole.deleteMany({
        where: { userId },
      }),
      prisma.userRole.create({
        data: {
          userId,
          roleId: baseRole.id,
        },
      }),
    ]);

    // 🔐 Audit
    await logAudit(req.user.id, "ROLE_RESET", req, {
      targetUserId: userId,
      targetUserEmail: targetUser.email,
      previousRole: roleName,
      newRole: "user",
    });

    return res.json({
      success: true,
      role: "user",
    });
  } catch (err) {
    console.error("ROLE_REMOVE error:", err);
    return res.status(500).json({ error: "Failed to remove role" });
  }
};
