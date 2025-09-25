import express from "express";
import { signup, login } from "../controllers/authController.js";
import { supabase } from "../lib/SupabaseClient.js";
import { logAudit } from "../lib/logging.js";
import { requireAuth } from "../middleware/jwtAuth.js";

const router = express.Router();

// --------------------- SIGNUP ---------------------
router.post("/signup", signup);

// --------------------- LOGIN ---------------------
router.post("/login", login);

// --------------------- LOGOUT ---------------------
router.post("/logout", async (req, res) => {
  try {
    const refreshTokenId = req.cookies?.refresh_token_id;
    const userId = req.body?.userId; // In real use, extract from auth middleware
    if (refreshTokenId) {
      await supabase
        .from("Session")
        .update({ active: false })
        .eq("refreshTokenId", refreshTokenId);
    }
    if (userId) {
      logAudit(userId, "LOGOUT", req);
    }

    res.clearCookie("access_token", { path: "/" });
    res.clearCookie("refresh_token_id", { path: "/" });
    return res.json({ message: "Logged out" });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ error: "Logout failed" });
  }
});

// --------------------- CURRENT USER ---------------------
router.get("/me", requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { data, error } = await supabase
      .from("User")
      .select("id, email, mfaEnabled, createdAt")
      .eq("id", userId)
      .maybeSingle();
    if (error || !data) return res.status(404).json({ error: "Not found" });
    return res.json({ user: data });
  } catch (err) {
    console.error("/me error:", err);
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// --------------------- PLACEHOLDER ROUTES (to avoid 404 during UI build) ---------------------
// TODO: Move to dedicated routers/controllers when implementing real logic
router.get("/sessions", requireAuth, async (req, res) => {
  // Return empty array or mock until backend implemented
  return res.json({ sessions: [] });
});

router.get("/audit-logs", requireAuth, async (req, res) => {
  // Return empty array or mock until backend implemented
  return res.json({ logs: [] });
});

export default router;