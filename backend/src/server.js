import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

import { validateEnv } from "./lib/envCheck.js";
import authRouter from "./routes/auth.js";
import iamRoutes, { mountDebugRoutes } from "./routes/iamRoutes.js";
import { getClientIp } from "./lib/ip.js";

// Fail fast on missing/weak env.
validateEnv();

const app = express();

// --------------------- MIDDLEWARE ---------------------

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

const allowedOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true, // required so the browser sends our httpOnly cookies
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(morgan("dev"));

// --------------------- HEALTH CHECK ---------------------

app.get("/health", (req, res) => {
  res.json({ ok: true, message: "IAM backend is running" });
});

// --------------------- RATE LIMIT ---------------------
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// --------------------- ROUTES ---------------------
app.use("/api/auth", authLimiter, authRouter);
app.use("/api", iamRoutes);

// --------------------- DEBUG ROUTES (dev/test only) ---------------------
if (process.env.NODE_ENV !== "production") {
  mountDebugRoutes(app);

  app.get("/debug/ip", (req, res) => {
    res.json({
      reqIp: req.ip,
      xff: req.headers["x-forwarded-for"] || null,
      realIp: req.headers["x-real-ip"] || null,
      computed: getClientIp(req),
    });
  });
}

// --------------------- start SERVER ---------------------
const PORT = process.env.PORT || 3000;

// Don't auto-listen when imported by tests.
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
