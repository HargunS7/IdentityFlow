// backend/src/controllers/iamSessionController.js
import prisma from "../PrismaClient.js";
import { logAudit } from "../lib/logging.js";

/**
 * GET /api/admin/sessions
 * Permission: SESSION_READ
 */
export const listSessions = async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        userId: true,
        refreshTokenId: true,
        userAgent: true,
        ip: true,
        active: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    // Optional audit
    logAudit(req.user.id, "SESSION_LIST", req, {
      resultCount: sessions.length,
    });

    return res.json(sessions);
  } catch (err) {
    console.error("SESSION_READ error:", err);
    return res.status(500).json({ error: "Failed to list sessions" });
  }
};

/**
 * POST /api/admin/sessions/revoke
 * Permission: SESSION_REVOKE
 * body: { sessionId?: string, refreshTokenId?: string }
 */
export const revokeSession = async (req, res) => {
  try {
    const { sessionId, refreshTokenId } = req.body;
    if (!sessionId && !refreshTokenId) {
      return res
        .status(400)
        .json({ error: "sessionId or refreshTokenId is required" });
    }

    let where;
    if (sessionId) where = { id: sessionId };
    else where = { refreshTokenId };

    const updated = await prisma.session.updateMany({
      where,
      data: { active: false },
    });

    // 🔐 Audit
    logAudit(req.user.id, "SESSION_REVOKE", req, {
      where,
      updatedCount: updated.count,
    });

    return res.json({
      success: true,
      updatedCount: updated.count,
    });
  } catch (err) {
    console.error("SESSION_REVOKE error:", err);
    return res.status(500).json({ error: "Failed to revoke session" });
  }
};
