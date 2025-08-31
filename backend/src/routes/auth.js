import express from "express";
import argon2 from "argon2";
import prisma from "../PrismaClient.js"; // Make sure this file exists and exports PrismaClient
import jwt from "jsonwebtoken";

const router = express.Router();

// JWT helper
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
  );
};

// --------------------- SIGNUP ---------------------
router.post("/signup", async (req, res) => {
  try {
    // ⚡ Properly destructure username, email, password from req.body
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await argon2.hash(password);

    const user = await prisma.user.create({
      data: {
        username, // ⚡ must be present
        email,
        passwordHash: hashedPassword,
      },
    });

    const token = generateToken(user);

    return res.status(201).json({ message: "User created successfully", user, token });
  } catch (err) {
    console.error("🔥 Signup error:", err);
    return res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

// --------------------- LOGIN ---------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = generateToken(user);

    return res.json({
      message: "Login successful",
      user: { id: user.id, username: user.username, email: user.email },
      token,
    });
  } catch (err) {
    console.error("🔥 Login error:", err);
    return res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

export default router;