import prisma from "../PrismaClient.js";

/**
 * GET /api/admin/summary
 * Returns counts for the admin dashboard widgets. Each field is gated by
 * the caller's permissions — fields the user can't view return null so
 * the frontend can hide that card cleanly.
 *
 * Permissions checked (per-field):
 *   - users.total        : USER_READ
 *   - sessions.active    : SESSION_READ
 *   - sessions.total     : SESSION_READ
 *   - auditLogs.total    : AUDIT_READ
 *   - tempGrants.active  : TEMP_GRANT
 *
 * Route-level gate: requireAnyPerm of any of those.
 */
export async function getSummary(req, res) {
  try {
    const perms = req.userPerms || [];
    const canUsers = perms.includes("USER_READ");
    const canSessions = perms.includes("SESSION_READ");
    const canAudit = perms.includes("AUDIT_READ");
    const canTemp = perms.includes("TEMP_GRANT");

    const now = new Date();

    const [
      usersTotal,
      sessionsActive,
      sessionsTotal,
      auditLogsTotal,
      tempGrantsActive,
      auditRecent,
    ] = await Promise.all([
      canUsers ? prisma.user.count() : Promise.resolve(null),
      canSessions
        ? prisma.session.count({ where: { active: true, expiresAt: { gt: now } } })
        : Promise.resolve(null),
      canSessions ? prisma.session.count() : Promise.resolve(null),
      canAudit ? prisma.auditLog.count() : Promise.resolve(null),
      canTemp
        ? prisma.tempPermissionGrant.count({ where: { expiresAt: { gt: now } } })
        : Promise.resolve(null),
      // Last 5 audit entries, redacted to safe fields.
      canAudit
        ? prisma.auditLog.findMany({
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
              id: true,
              action: true,
              createdAt: true,
              user: { select: { email: true, username: true } },
            },
          })
        : Promise.resolve(null),
    ]);

    return res.json({
      users: { total: usersTotal },
      sessions: { active: sessionsActive, total: sessionsTotal },
      auditLogs: { total: auditLogsTotal, recent: auditRecent },
      tempGrants: { active: tempGrantsActive },
      generatedAt: now.toISOString(),
    });
  } catch (err) {
    console.error("SUMMARY error:", err);
    return res.status(500).json({ error: "Failed to load summary" });
  }
}
