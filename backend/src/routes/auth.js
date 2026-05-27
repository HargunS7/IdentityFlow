import express from "express";
import { signup, login, logout } from "../controllers/authController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);

// auth(false) so that logout works even if the token is already expired/invalid.
// When the token IS valid, req.session is populated and we revoke that session.
router.post("/logout", auth(false), logout);

// /api/auth/me — light profile lookup. The richer profile lives at /api/me
// (mounted from iamRoutes) and includes roles + permissions + temp grants.
router.get("/me", auth(true), (req, res) => {
  return res.json({ user: req.user });
});

export default router;
