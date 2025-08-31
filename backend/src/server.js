// import "dotenv/config";
// import express from "express";
// import helmet from "helmet";
// import cors from "cors";
// import morgan from "morgan";
// import argon2 from "argon2";
// import jwt from "jsonwebtoken";
// import { PrismaClient } from "@prisma/client";
// import authRouter from "./routes/auth.js";

// const app = express();
// const prisma = new PrismaClient();

// // --------------------- MIDDLEWARE ---------------------
// app.use(helmet());
// app.use(cors({ origin: "*", credentials: true }));
// app.use(express.json());
// app.use(morgan("dev"));


// // --------------------- HEALTH CHECK ---------------------
// app.get("/health", (req, res) => {
//   res.json({ ok: true, message: "✅ IAM backend is running" });
// });

// // --------------------- JWT UTILS ---------------------
// export const generateToken = (payload) => {
//   return jwt.sign(payload, process.env.JWT_SECRET, {
//     expiresIn: process.env.JWT_EXPIRES_IN || "1h",
//   });
// };

// // --------------------- LOGIN ROUTE ---------------------
// app.post("/api/auth/login", async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     const user = await prisma.user.findUnique({ where: { email } });
//     if (!user) return res.status(401).json({ error: "Invalid credentials" });

//     const valid = await argon2.verify(user.passwordHash, password);
//     if (!valid) return res.status(401).json({ error: "Invalid credentials" });

//     const token = generateToken({ id: user.id, username: user.username });

//     res.json({
//       user: { id: user.id, username: user.username, email: user.email },
//       token,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Login failed" });
//   }
// });

// // --------------------- AUTH MIDDLEWARE ---------------------
// export const authMiddleware = (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader || !authHeader.startsWith("Bearer "))
//     return res.status(401).json({ error: "No token provided" });

//   const token = authHeader.split(" ")[1];

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
//     next();
//   } catch (err) {
//     return res.status(401).json({ error: "Invalid token" });
//   }
// };

// // Example protected route
// app.get("/api/protected", authMiddleware, (req, res) => {
//   res.json({ message: "You accessed a protected route!", user: req.user });
// });

// // --------------------- START SERVER ---------------------
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
// src/server.js
import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { PrismaClient } from "@prisma/client";
import authRouter from "./routes/auth.js";   // ✅ make sure path is correct

const app = express();
const prisma = new PrismaClient();

// --------------------- MIDDLEWARE ---------------------
app.use(helmet());
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use(morgan("dev"));
app.use("/api/auth", authRouter);

// --------------------- HEALTH CHECK ---------------------
app.get("/health", (req, res) => {
  res.json({ ok: true, message: "✅ IAM backend is running" });
});

// --------------------- ROUTES ---------------------
app.use("/api/auth", authRouter);  // mounts /signup and /login

// --------------------- START SERVER ---------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
