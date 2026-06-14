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

    // Build the list of UTC day buckets for the last 7 days (oldest → newest)
    // so the logins-over-time chart always has a stable 7-column shape.
    const dayKeys = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setUTCDate(d.getUTCDate() - i);
      dayKeys.push(d.toISOString().slice(0, 10)); // YYYY-MM-DD
    }

    const [
      usersTotal,
      sessionsActive,
      sessionsTotal,
      auditLogsTotal,
      tempGrantsActive,
      auditRecent,
      usersByRoleRaw,
      auditByTypeRaw,
      loginsByDayRaw,
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
      // Users per role (chart: "who has which role").
      canUsers
        ? prisma.role.findMany({
            select: { name: true, _count: { select: { userRoles: true } } },
          })
        : Promise.resolve(null),
      // Audit events grouped by action type (chart: "what's happening").
      canAudit
        ? prisma.auditLog.groupBy({
            by: ["action"],
            _count: { _all: true },
            orderBy: { _count: { action: "desc" } },
          })
        : Promise.resolve(null),
      // Logins per day for the last 7 days (chart: "activity over time").
      canAudit
        ? prisma.$queryRaw`
            SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day,
                   count(*)::int AS count
            FROM "AuditLog"
            WHERE action = 'LOGIN'
              AND "createdAt" >= ${new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)}
            GROUP BY 1
            ORDER BY 1`
        : Promise.resolve(null),
    ]);

    // Shape chart data for the frontend (stable shapes; empty arrays, not null,
    // when the user is permitted but there's simply no data yet).
    const usersByRole = canUsers
      ? usersByRoleRaw
          .map((r) => ({ role: r.name, count: r._count.userRoles }))
          .sort((a, b) => b.count - a.count)
      : null;

    const auditByType = canAudit
      ? auditByTypeRaw.map((r) => ({ action: r.action, count: r._count._all }))
      : null;

    const loginsByDay = canAudit
      ? (() => {
          const counts = Object.fromEntries(
            loginsByDayRaw.map((r) => [r.day, Number(r.count)])
          );
          return dayKeys.map((day) => ({ day, count: counts[day] || 0 }));
        })()
      : null;

    return res.json({
      users: { total: usersTotal, byRole: usersByRole },
      sessions: {
        active: sessionsActive,
        total: sessionsTotal,
        revoked:
          sessionsActive != null && sessionsTotal != null
            ? Math.max(0, sessionsTotal - sessionsActive)
            : null,
      },
      auditLogs: { total: auditLogsTotal, recent: auditRecent, byType: auditByType },
      tempGrants: { active: tempGrantsActive },
      loginsByDay,
      generatedAt: now.toISOString(),
    });
  } catch (err) {
    console.error("SUMMARY error:", err);
    return res.status(500).json({ error: "Failed to load summary" });
  }
}
