// backend/src/controllers/iamSessionController.js
import prisma from "../PrismaClient.js";
import { logAudit } from "../lib/logging.js";


/**
 * GET /api/admin/sessions
 * Permission: SESSION_READ
 * Query params:
 *   identifier? = email or username
 *   limit? = number (default 100, max 500)
 */
export const listSessions = async (req, res) => {
  try {
    const identifier = req.query.identifier ? String(req.query.identifier) : null;

    const limit = Math.min(parseInt(req.query.limit ?? "30", 10) || 30, 200);

    // status: active (default), inactive, all
    const status = String(req.query.status ?? "active");
    const cursor = req.query.cursor ? String(req.query.cursor) : null;

    const where = {};

    // Filter by status
    if (status === "active") where.active = true;
    else if (status === "inactive") where.active = false;
    // else "all" => no active filter

    // Resolve user by email/username if identifier is provided
    if (identifier) {
      const user = await prisma.user.findFirst({
        where: {
          OR: [{ email: identifier }, { username: identifier }],
        },
        select: { id: true },
      });

      if (!user) {
        return res.json({
          sessions: [],
          filter: { identifier, status, limit },
          nextCursor: null,
          hasMore: false,
        });
      }

      where.userId = user.id;
    }

    const sessions = await prisma.session.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1, // fetch one extra to know if there's more
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1, // skip the cursor itself
          }
        : {}),
      select: {
        id: true,
        userId: true,
        refreshTokenId: true,
        userAgent: true,
        ip: true,
        active: true,
        createdAt: true,
        expiresAt: true,
        user: {
          select: { id: true, email: true, username: true },
        },
      },
    });

    const hasMore = sessions.length > limit;
    const pageItems = hasMore ? sessions.slice(0, limit) : sessions;
    const nextCursor = hasMore ? pageItems[pageItems.length - 1]?.id : null;

    return res.json({
      sessions: pageItems,
      filter: { identifier, status, limit },
      nextCursor,
      hasMore,
    });
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
