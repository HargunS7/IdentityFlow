// backend/src/controllers/auditController.js
import prisma from "../PrismaClient.js";

/**
 * GET /api/admin/audit-logs
 * Permission: AUDIT_READ
 * Query params:
 *   identifier? = email or username (matches userId OR actorId)
 *   action?     = action string or "all" (default "all")
 *   limit?      = number (default 30, max 200)
 *   cursor?     = auditLog.id for cursor pagination
 *
 * Response:
 *   { logs, filter, nextCursor, hasMore }
 */
export const listAuditLogs = async (req, res) => {
  try {
    const identifier = req.query.identifier
      ? String(req.query.identifier).trim()
      : null;

    const action = req.query.action ? String(req.query.action).trim() : "all";

    const cursor = req.query.cursor ? String(req.query.cursor).trim() : null;

    const limit = Math.min(parseInt(req.query.limit ?? "30", 10) || 30, 200);

    const where = {};

    // action filter
    if (action && action !== "all") {
      where.action = action;
    }

    // identifier filter (email/username -> userId OR actorId)
    if (identifier) {
      const user = await prisma.user.findFirst({
        where: {
          OR: [{ email: identifier }, { username: identifier }],
        },
        select: { id: true, email: true, username: true },
      });

      if (!user) {
        return res.json({
          logs: [],
          filter: { identifier, action, limit },
          nextCursor: null,
          hasMore: false,
        });
      }

      // Show logs where user is target OR actor
      where.OR = [{ userId: user.id }, { actorId: user.id }];
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
      select: {
        id: true,
        userId: true,
        actorId: true,
        action: true,
        meta: true,
        ip: true,
        createdAt: true,

        // Requires AuditLog -> User relation named "user" in Prisma schema.
        // If your relation field is named differently, rename this block.
        user: {
          select: { id: true, email: true, username: true },
        },
      },
    });

    const hasMore = logs.length > limit;
    const pageItems = hasMore ? logs.slice(0, limit) : logs;
    const nextCursor = hasMore ? pageItems[pageItems.length - 1]?.id : null;

    return res.json({
      logs: pageItems,
      filter: { identifier: identifier || null, action, limit },
      nextCursor,
      hasMore,
    });
  } catch (err) {
    console.error("AUDIT_READ error:", err);
    return res.status(500).json({ error: "Failed to list audit logs" });
  }
};
