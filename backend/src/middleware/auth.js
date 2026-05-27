import jwt from "jsonwebtoken";
import prisma from "../PrismaClient.js";

/**
 * Read the JWT from the access_token cookie first, falling back to the
 * Authorization: Bearer header so API testing tools still work.
 */
function extractToken(req) {
  const cookieToken = req.cookies?.access_token;
  if (cookieToken) return cookieToken;

  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7);

  return null;
}

/**
 * Authentication middleware.
 *
 * Side effects on req:
 *   req.user                  - { id, email, username, mfaEnabled, createdAt }
 *   req.session               - { id, active, expiresAt }
 *   req.userRoles             - string[]
 *   req.userPerms             - string[]  (combined permanent + temp)
 *   req.userPermsPermanent    - string[]
 *   req.userPermsTemp         - string[]
 *   req.tempPermissionGrants  - TempPermissionGrant[] (active only)
 *
 * The session is looked up in the same query as the user, so this stays
 * to two parallel Prisma calls per request.
 */
export function auth(required = true) {
  return async (req, res, next) => {
    try {
      const token = extractToken(req);
      if (!token) {
        if (required) {
          return res.status(401).json({ error: "Not authenticated" });
        }
        req.user = null;
        return next();
      }

      let payload;
      try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
      } catch {
        if (!required) {
          req.user = null;
          return next();
        }
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      const userId = payload.id || payload.sub;
      const sid = payload.sid || null;

      // Reject tokens that predate the session-id requirement.
      if (!sid) {
        return res.status(401).json({ error: "Session expired, please sign in again" });
      }

      const now = new Date();
      const [user, session] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            username: true,
            mfaEnabled: true,
            createdAt: true,
          },
        }),
        prisma.session.findUnique({
          where: { id: sid },
          select: { id: true, userId: true, active: true, expiresAt: true },
        }),
      ]);

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }
      if (!session || session.userId !== user.id) {
        return res.status(401).json({ error: "Session not found" });
      }
      if (!session.active) {
        return res.status(401).json({ error: "Session has been revoked" });
      }
      if (session.expiresAt && session.expiresAt <= now) {
        return res.status(401).json({ error: "Session has expired" });
      }

      // RBAC lookups
      const userRoles = await prisma.userRole.findMany({
        where: { userId: user.id },
        select: { role: { select: { name: true } } },
      });
      const roleNames = userRoles.map((r) => r.role.name);

      const rolePerms = await prisma.rolePermission.findMany({
        where: { role: { name: { in: roleNames } } },
        select: { permission: { select: { code: true } } },
      });
      const permanentPerms = [
        ...new Set(rolePerms.map((p) => p.permission.code)),
      ];

      const tempGrants = await prisma.tempPermissionGrant.findMany({
        where: { userId: user.id, expiresAt: { gt: now } },
        select: {
          id: true,
          permission: true,
          expiresAt: true,
          reason: true,
          grantedById: true,
          createdAt: true,
        },
      });
      const tempPerms = tempGrants.map((g) => g.permission);
      const allPerms = [...new Set([...permanentPerms, ...tempPerms])];

      req.user = user;
      req.session = session;
      req.userRoles = roleNames;
      req.userPermsPermanent = permanentPerms;
      req.userPermsTemp = tempPerms;
      req.userPerms = allPerms;
      req.tempPermissionGrants = tempGrants;

      return next();
    } catch (err) {
      console.error("Auth middleware error:", err);
      if (!required) {
        req.user = null;
        return next();
      }
      return res.status(401).json({ error: "Unauthorized" });
    }
  };
}
