import prisma from "../PrismaClient.js";
import { getClientIp } from "./ip.js";

/**
 * Persist a new session row and return it.
 * Caller signs a JWT containing the returned session.id so we can
 * verify session.active === true on every request.
 *
 * Synchronous (awaitable) — do not fire-and-forget; the session row
 * must exist before we sign and hand back the JWT.
 */
export async function createSession({ userId, refreshTokenId, req, ttlMs }) {
  const userAgent = req.headers["user-agent"] || null;
  const ip = getClientIp(req);
  const expiresAt = new Date(Date.now() + (ttlMs ?? 7 * 24 * 60 * 60 * 1000));

  return prisma.session.create({
    data: {
      userId,
      refreshTokenId,
      userAgent,
      ip,
      active: true,
      expiresAt,
    },
    select: {
      id: true,
      userId: true,
      refreshTokenId: true,
      active: true,
      expiresAt: true,
    },
  });
}

/**
 * Write an audit log entry. Fire-and-forget (we don't want to block the
 * request on a logging failure), but errors are surfaced to stderr.
 */
export function logAudit(userId, action, req, metaExtra = {}) {
  const userAgent = req?.headers?.["user-agent"] || null;
  const ip = req ? getClientIp(req) : null;
  const meta = { userAgent, ip, ...metaExtra };

  return prisma.auditLog
    .create({
      data: {
        userId: userId || null,
        actorId: userId || null,
        action,
        ip,
        meta,
      },
    })
    .catch((err) => {
      console.error("logAudit insert error:", err);
    });
}
