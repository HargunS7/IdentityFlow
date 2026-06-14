import prisma from "../PrismaClient.js";
import { logAudit } from "../lib/logging.js";

/**
 * POST /api/admin/reset-demo   (admin only)
 *
 * Restores the demo to a clean state by calling the DB `reset_demo()` function
 * — the SAME routine the optional pg_cron schedule uses — so demo data has a
 * single source of truth. See docs/DEMO_SEED.md.
 */
export async function resetDemo(req, res) {
  try {
    await prisma.$executeRawUnsafe("select public.reset_demo()");
    logAudit(req.user?.id || null, "DEMO_RESET", req, {});
    return res.json({ ok: true, message: "Demo data reset to a clean state." });
  } catch (err) {
    console.error("DEMO_RESET error:", err);
    const msg = String(err?.message || "");
    if (msg.includes("reset_demo") || msg.includes("does not exist")) {
      return res.status(503).json({
        error:
          "reset_demo() isn't installed yet. Run docs/DEMO_SEED.md Section 3 once, then try again.",
      });
    }
    return res.status(500).json({ error: "Failed to reset demo data" });
  }
}
