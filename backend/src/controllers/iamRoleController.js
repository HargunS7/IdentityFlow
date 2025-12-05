// backend/src/controllers/iamRoleController.js
import prisma from "../PrismaClient.js";
import { logAudit } from "../lib/logging.js";

/**
 * POST /api/admin/assign-role
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

    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) return res.status(400).json({ error: "Role not found" });

    // Make sure target user exists (optional but nice)
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (!targetUser) {
      return res.status(404).json({ error: "Target user not found" });
    }

    try {
      await prisma.userRole.create({
        data: {
          userId,
          roleId: role.id,
        },
      });
    } catch (e) {
      console.warn("assign-role: probably duplicate mapping", e.code);
    }

    // 🔐 Audit
    logAudit(req.user.id, "ROLE_ASSIGN", req, {
      targetUserId: userId,
      targetUserEmail: targetUser.email,
      roleName,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("ROLE_ASSIGN error:", err);
    return res.status(500).json({ error: "Failed to assign role" });
  }
};


/**
 * POST /api/admin/remove-role
 * Permission: ROLE_ASSIGN (you can later make a separate ROLE_REMOVE)
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

      if(roleName==='user'){
        return res.status(400).json({error:"Cannot remove base role 'user'"});
      }

    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) return res.status(400).json({ error: "Role not found" });

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (!targetUser) {
      return res.status(404).json({ error: "Target user not found" });
    }

    const result = await prisma.userRole.deleteMany({
      where: {
        userId,
        roleId: role.id,
      },
    });

    // 🔐 Audit
    logAudit(req.user.id, "ROLE_REMOVE", req, {
      targetUserId: userId,
      targetUserEmail: targetUser.email,
      roleName,
      removedCount: result.count,
    });

    return res.json({
      success: true,
      removedCount: result.count,
    });
  } catch (err) {
    console.error("ROLE_REMOVE error:", err);
    return res.status(500).json({ error: "Failed to remove role" });
  }
};