// src/server.js
import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import authRouter from "./routes/auth.js";   // ✅ make sure path is correct
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

import iamRoutes from "./routes/iamRoutes.js";
import { getClientIp } from "./lib/ip.js";

const app = express();

// --------------------- MIDDLEWARE ---------------------

console.log("Runtime DATABASE_URL:", process.env.DATABASE_URL);


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
    credentials: true,
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
  res.json({ ok: true, message: "✅ IAM backend is running" });
});




// --------------------- ROUTES ---------------------
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});





app.use("/api/auth", authLimiter, authRouter);  // mounts /signup and /login
app.use("/api",iamRoutes); // mounting iamRoutes to check rbac


app.get("/debug/ip", (req, res) => {
  res.json({
    reqIp: req.ip,
    xff: req.headers["x-forwarded-for"] || null,
    realIp: req.headers["x-real-ip"] || null,
    computed: getClientIp(req),
  });
});



// --------------------- START SERVER ---------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
