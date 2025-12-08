// backend/src/controllers/auditController.js
import prisma from "../PrismaClient.js";

/**
 * GET /api/admin/audit-logs
 * Permission: AUDIT_READ
 * Query params:
 *   identifier? = email or username (actor)
 *   limit? = number (default 100, max 500)
 */
export const listAuditLogs = async (req, res) => {
  try {
    const { identifier } = req.query;
    const limit = Math.min(
      parseInt(req.query.limit ?? "100", 10) || 100,
      500
    );

    let where = {};

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
          logs: [],
          filter: { identifier },
        });
      }

      // Logs performed by this user
      where.actorId = user.id;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        userId: true,
        actorId: true,
        action: true,
        meta: true,
        ip: true,
        createdAt: true,
      },
    });

    return res.json({
      logs,
      filter: { identifier: identifier || null, limit },
    });
  } catch (err) {
    console.error("AUDIT_READ error:", err);
    return res.status(500).json({ error: "Failed to fetch audit logs" });
  }
};