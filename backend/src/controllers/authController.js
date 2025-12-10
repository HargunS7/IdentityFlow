import argon2 from "argon2";
import jwt from "jsonwebtoken";
import prisma from "../PrismaClient.js";
import { supabase } from "../lib/SupabaseClient.js";
import { logSession, logAudit } from "../lib/logging.js";
import {
  validateEmailFormat,
  validateUsernameFormat,
  validatePasswordStrength,
} from "../lib/validation.js";

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
  );
};

export const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const emailCheck = validateEmailFormat(email);
    if (!emailCheck.valid) return res.status(400).json({ error: emailCheck.reason });

    // Username is optional depending on Supabase schema; validate only if present
    if (username) {
      const usernameCheck = validateUsernameFormat(username);
      if (!usernameCheck.valid) return res.status(400).json({ error: usernameCheck.reason });
    }

    const passwordCheck = validatePasswordStrength(password, { email, username });
    if (!passwordCheck.valid) return res.status(400).json({ error: passwordCheck.reason });

    // Check existing user in Supabase
    const { data: existing, error: existingErr } = await supabase
      .from("User")
      .select("id")
      .eq("email", email)
      .limit(1)
      .maybeSingle();
    if (existingErr) {
      console.error("Supabase existing user check error:", existingErr);
      return res.status(500).json({ error: "Database error" });
    }
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      timeCost: 3,
      memoryCost: 19456,
      parallelism: 1,
    });

    // Insert user into Supabase
    const { data: inserted, error: insertErr } = await supabase
      .from("User")
      .insert({
        username,
        email,
        passwordHash: hashedPassword,
      })
      .select("id, email")
      .maybeSingle();
    if (insertErr) {
      console.error("Supabase insert user error:", insertErr);
      return res.status(500).json({ error: "Failed to create user" });
    }

    const token = generateToken(inserted);

    const cookieSecure = process.env.NODE_ENV === "production";
    res.cookie("access_token", token, {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: "lax",
      maxAge: 60 * 60 * 1000,
      path: "/",
    });

    // Async audit log; do not block signup
    logAudit(inserted.id, "SIGNUP", req, {
      user: { id: inserted.id, email: inserted.email, username: username || null },
    });

    return res.status(201).json({
      message: "User created successfully",
      user: { id: inserted.id, email: inserted.email },
      token
    });
  } catch (err) {
    console.error("🔥 Signup error:", err);
    return res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { identifier, email, password } = req.body;

    const loginId = identifier || email;
    if (!loginId || !password) {
      return res.status(400).json({ error: "Identifier and password required" });
    }

    let user;
    if (loginId.includes("@")) {
      const emailCheck = validateEmailFormat(loginId);
      if (!emailCheck.valid) return res.status(400).json({ error: emailCheck.reason });
      const q = await supabase
        .from("User")
        .select("id, email, passwordHash, username")
        .eq("email", loginId)
        .limit(1)
        .maybeSingle();
      if (q.error || !q.data) return res.status(401).json({ error: "Invalid credentials" });
      user = q.data;
    } else {
      // Treat as username
      const usernameCheck = validateUsernameFormat(loginId);
      if (!usernameCheck.valid) return res.status(400).json({ error: usernameCheck.reason });
      const q = await supabase
        .from("User")
        .select("id, email, passwordHash, username")
        .eq("username", loginId)
        .limit(1)
        .maybeSingle();
      if (q.error || !q.data) return res.status(401).json({ error: "Invalid credentials" });
      user = q.data;
    }

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = generateToken(user);
    const refreshTokenId = crypto.randomUUID();

    const cookieSecure = process.env.NODE_ENV === "production";
    res.cookie("access_token", token, {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: "lax",
      maxAge: 60 * 60 * 1000,
      path: "/",
    });
    res.cookie("refresh_token_id", refreshTokenId, {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    // Async logs; do not block login
    logSession(user.id, refreshTokenId, req);
    logAudit(user.id, "LOGIN", req);

    return res.json({
      message: "Login successful",
      user: { id: user.id, email: user.email, username: user.username || undefined ,token:token},
    });
  } catch (err) {
    console.error("🔥 Login error:", err);
    return res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
};

