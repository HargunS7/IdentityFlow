import prisma from "../PrismaClient.js";
import { logAudit } from "../lib/logging.js";

export const grantTemporaryPermission = async (req, res) => {
  try {
    // accept either naming style
    const {
      userId: rawUserId,
      identifier: rawIdentifier,
      permission: rawPermission,
      permissionCode: rawPermissionCode,
      durationMinutes: rawDuration,
      minutes: rawMinutes,
      reason,
    } = req.body;

    const permission = rawPermission || rawPermissionCode;
    const durationMinutes = Number(rawDuration ?? rawMinutes);

    let userId = rawUserId;
    const identifier = rawIdentifier ? String(rawIdentifier).trim() : null;

    // Resolve userId from identifier if needed
    if (!userId && identifier) {
      const user = await prisma.user.findFirst({
        where: {
          OR: [{ email: identifier }, { username: identifier }],
        },
        select: { id: true },
      });
      if (!user) return res.status(404).json({ error: "User not found" });
      userId = user.id;
    }

    if (!userId || !permission || !durationMinutes) {
      return res
        .status(400)
        .json({ error: "userId/identifier, permission, durationMinutes required" });
    }

    if (durationMinutes < 1 || durationMinutes > 30) {
      return res.status(400).json({ error: "durationMinutes must be between 1 and 30" });
    }

    // (Optional) protect from nonsense "admin" string (permissions are codes, not roles)
    if (String(permission).toLowerCase() === "admin") {
      return res.status(400).json({ error: "cannot assign admin as a permission" });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true },
    });
    if (!targetUser) return res.status(404).json({ error: "User not found" });

    const expiresAt = new Date(Date.now() + durationMinutes * 60_000);

    const grant = await prisma.tempPermissionGrant.create({
      data: {
        userId,
        permission,
        expiresAt,
        grantedById: req.user.id,
        reason: reason || null,
      },
    });

    logAudit(req.user.id, "TEMP_PERMISSION_GRANT", req, {
      targetUserId: userId,
      targetIdentifier: identifier,
      permission,
      durationMinutes,
      expiresAt,
      reason: reason || null,
    });

    return res.json({ success: true, grant });
  } catch (err) {
    console.error("TEMP_GRANT error:", err);
    return res.status(500).json({ error: "Failed to grant temporary permission" });
  }
};


/**
 * GET /api/admin/temp-permissions
 * Permission: TEMP_GRANT (you could create TEMP_VIEW later)
 * Query params:
 *   identifier? = email or username
 *   limit? = number (default 100, max 500)
 *   activeOnly? = "true" | "false"  (default true)
 */
export const listTemporaryPermissions = async (req, res) => {
  try {
    const { identifier, activeOnly } = req.query;
    const limit = Math.min(
      parseInt(req.query.limit ?? "100", 10) || 100,
      500
    );

    const now = new Date();
    let where = {};

    // Filter by active grants unless explicitly disabled
    if (activeOnly !== "false") {
      where.expiresAt = { gt: now };
    }

    // Filter by user email/username if identifier provided
    if (identifier) {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: String(identifier) },
            { username: String(identifier) },
          ],
        },
        select: { id: true, email: true, username: true },
      });

      if (!user) {
        return res.json({
          grants: [],
          filter: { identifier, activeOnly: activeOnly !== "false", limit },
        });
      }

      where.userId = user.id;
    }

    const grants = await prisma.tempPermissionGrant.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        userId: true,
        permission: true,
        reason: true,
        expiresAt: true,
        createdAt: true,
        grantedById: true,
        user: { select: { id: true, email: true, username: true } },
      },
    });


    return res.json({
      grants,
      filter: { identifier: identifier || null, activeOnly: activeOnly !== "false", limit },
    });
  } catch (err) {
    console.error("TEMP_GRANT_LIST error:", err);
    return res.status(500).json({ error: "Failed to list temporary permissions" });
  }
};

/**
 * POST /api/admin/temp-permissions/revoke
 * Permission: TEMP_GRANT (or TEMP_REVOKE if you add it later)
 * body: { grantId: string }
 */
export const revokeTemporaryPermission = async (req, res) => {
  try {
    const { grantId } = req.body;
    if (!grantId) {
      return res.status(400).json({ error: "grantId is required" });
    }

    const grant = await prisma.tempPermissionGrant.findUnique({
      where: { id: grantId },
      select: {
        id: true,
        userId: true,
        permission: true,
        expiresAt: true,
        reason: true,
      },
    });

    if (!grant) {
      return res.status(404).json({ error: "Temporary permission not found" });
    }

    await prisma.tempPermissionGrant.delete({
      where: { id: grantId },
    });

    // Audit
    logAudit(req.user.id, "TEMP_PERMISSION_REVOKE", req, {
      grantId,
      targetUserId: grant.userId,
      permission: grant.permission,
      wasExpired: grant.expiresAt <= new Date(),
      reason: grant.reason,
    });

    return res.json({
      success: true,
      revokedGrantId: grantId,
    });
  } catch (err) {
    console.error("TEMP_GRANT_REVOKE error:", err);
    return res.status(500).json({ error: "Failed to revoke temporary permission" });
  }
};