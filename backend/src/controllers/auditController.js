// backend/src/controllers/auditController.js
import prisma from "../PrismaClient.js";

/**
 * GET /api/admin/audit-logs
 * Permission: AUDIT_READ
 * Query params (optional):
 *   ?limit=50
 */
export const listAuditLogs = async (req, res) => {
  try {
    const limit = Math.min(
      parseInt(req.query.limit ?? "100", 10) || 100,
      500
    );

    const logs = await prisma.auditLog.findMany({
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

    return res.json(logs);
  } catch (err) {
    console.error("AUDIT_READ error:", err);
    return res.status(500).json({ error: "Failed to fetch audit logs" });
  }
};
