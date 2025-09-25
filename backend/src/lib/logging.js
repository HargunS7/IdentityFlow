import { supabase } from "./SupabaseClient.js";
import crypto from "node:crypto";

export async function logSession(userId, refreshTokenId, req) {
  try {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const userAgent = req.headers["user-agent"] || null;
    const ip = req.ip || null;

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
      // eslint-disable-next-line no-console
      console.error("logSession insert error:", error);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("logSession unexpected error:", e);
  }
}

export async function logAudit(userId, action, req, metaExtra = {}) {
  try {
    const userAgent = req.headers["user-agent"] || null;
    const ip = req.ip || null;
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
      // eslint-disable-next-line no-console
      console.error("logAudit insert error:", error);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("logAudit unexpected error:", e);
  }
}

