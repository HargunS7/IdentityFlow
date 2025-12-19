import { supabase } from "./SupabaseClient.js";
import crypto from "node:crypto";
import { getClientIp } from "./ip.js";

export async function logSession(userId, refreshTokenId, req) {
  try {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const userAgent = req.headers["user-agent"] || null;
    const ip = getClientIp(req);

    const { error } = await supabase.from("Session").insert({
      id: crypto.randomUUID(),
      userId,
      refreshTokenId,
      userAgent,
      ip,
      active: true,
      expiresAt,
    });

    if (error) {
      console.error("logSession insert error:", error);
    }
  } catch (e) {
    console.error("logSession unexpected error:", e);
  }
}

export async function logAudit(userId, action, req, metaExtra = {}) {
  try {
    const userAgent = req.headers["user-agent"] || null;
    const ip = getClientIp(req);
    const meta = { userAgent, ip, ...metaExtra };

    const { error } = await supabase.from("AuditLog").insert({
      id: crypto.randomUUID(),
      userId,
      actorId: userId,
      action,
      ip,
      meta,
    });

    if (error) {
      console.error("logAudit insert error:", error);
    }
  } catch (e) {
    console.error("logAudit unexpected error:", e);
  }
}
