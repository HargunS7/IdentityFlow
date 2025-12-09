import prisma from "../PrismaClient.js";
import { logAudit } from "../lib/logging.js";

export const grantTemporaryPermission = async (req, res) => {
  try {
    const { userId, permission, durationMinutes, reason } = req.body;

    // Validate inputs
    if (!userId || !permission || !durationMinutes) {
      return res.status(400).json({ error: "userId, permission, durationMinutes required" });
    }
    if (permission === 'admin'){
        return res.status(401).json({error: "cannot assign admin permission"});
    }
    if (durationMinutes < 1 || durationMinutes > 30) {
      return res.status(400).json({ error: "durationMinutes must be between 1 and 30" });
    }

    // Check target user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    // Compute expiration
    const expiresAt = new Date(Date.now() + durationMinutes * 60000);

    // Insert record
    const grant = await prisma.tempPermissionGrant.create({
      data: {
        userId,
        permission,
        expiresAt,
        grantedById: req.user.id,
        reason: reason || null,
      },
    });

    // Audit log
    logAudit(req.user.id, "TEMP_PERMISSION_GRANT", req, {
      targetUserId: userId,
      permission,
      durationMinutes,
      expiresAt,
      reason,
    });

    return res.json({
      success: true,
      grant,
    });
  } catch (err) {
    console.error("TEMP_GRANT error:", err);
    return res.status(500).json({ error: "Failed to grant temporary permission" });
  }
};
