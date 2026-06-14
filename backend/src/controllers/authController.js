import argon2 from "argon2";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import prisma from "../PrismaClient.js";
import { createSession, logAudit } from "../lib/logging.js";
import {
  validateEmailFormat,
  validateUsernameFormat,
  validatePasswordStrength,
} from "../lib/validation.js";
import { ROLES } from "../lib/permissions.js";

const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7d

function signAccessToken({ userId, sessionId }) {
  return jwt.sign(
    { id: userId, sid: sessionId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
  );
}

function cookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  // When the frontend and backend are on DIFFERENT domains (typical for a
  // public deploy, e.g. frontend on Vercel + backend on Render), the browser
  // only sends the auth cookie cross-site if SameSite=None; Secure. Same-site
  // deploys can override to "lax" via COOKIE_SAMESITE.
  const sameSite = process.env.COOKIE_SAMESITE || (isProd ? "none" : "lax");
  return {
    httpOnly: true,
    // SameSite=None is rejected by browsers unless Secure is also set.
    secure: isProd || sameSite === "none",
    sameSite,
    path: "/",
    // Optional: scope cookies to a shared parent domain (e.g. ".example.com").
    ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
  };
}

// Clearing a cookie must use the same attributes it was set with (notably
// path/domain), otherwise the browser keeps the original.
function clearAuthCookies(res) {
  const { httpOnly, secure, sameSite, path, domain } = cookieOptions();
  const base = { httpOnly, secure, sameSite, path, ...(domain ? { domain } : {}) };
  res.clearCookie("access_token", base);
  res.clearCookie("refresh_token_id", base);
}

function setAuthCookies(res, accessToken, refreshTokenId) {
  res.cookie("access_token", accessToken, {
    ...cookieOptions(),
    maxAge: ACCESS_TOKEN_TTL_MS,
  });
  res.cookie("refresh_token_id", refreshTokenId, {
    ...cookieOptions(),
    maxAge: REFRESH_TOKEN_TTL_MS,
  });
}

export const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const emailCheck = validateEmailFormat(email);
    if (!emailCheck.valid) return res.status(400).json({ error: emailCheck.reason });

    if (username) {
      const usernameCheck = validateUsernameFormat(username);
      if (!usernameCheck.valid) {
        return res.status(400).json({ error: usernameCheck.reason });
      }
    }

    const passwordCheck = validatePasswordStrength(password, { email, username });
    if (!passwordCheck.valid) {
      return res.status(400).json({ error: passwordCheck.reason });
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    if (username) {
      const existingUsername = await prisma.user.findUnique({
        where: { username },
        select: { id: true },
      });
      if (existingUsername) {
        return res.status(409).json({ error: "Username already taken" });
      }
    }

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      timeCost: 3,
      memoryCost: 19456,
      parallelism: 1,
    });

    const user = await prisma.user.create({
      data: {
        email,
        username: username || null,
        passwordHash,
      },
      select: { id: true, email: true, username: true },
    });

    // Attach the default "user" role so RBAC checks behave consistently.
    const baseRole = await prisma.role.findUnique({
      where: { name: ROLES.USER },
      select: { id: true },
    });
    if (baseRole) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: baseRole.id } },
        update: {},
        create: { userId: user.id, roleId: baseRole.id },
      });
    }

    const refreshTokenId = crypto.randomUUID();
    const session = await createSession({
      userId: user.id,
      refreshTokenId,
      req,
      ttlMs: REFRESH_TOKEN_TTL_MS,
    });
    const accessToken = signAccessToken({
      userId: user.id,
      sessionId: session.id,
    });

    setAuthCookies(res, accessToken, refreshTokenId);

    logAudit(user.id, "SIGNUP", req, {
      user: { id: user.id, email: user.email, username: user.username || null },
    });

    return res.status(201).json({
      message: "User created successfully",
      user: { id: user.id, email: user.email, username: user.username },
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
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
      if (!emailCheck.valid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      user = await prisma.user.findUnique({
        where: { email: loginId },
        select: { id: true, email: true, passwordHash: true, username: true },
      });
    } else {
      const usernameCheck = validateUsernameFormat(loginId);
      if (!usernameCheck.valid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      user = await prisma.user.findUnique({
        where: { username: loginId },
        select: { id: true, email: true, passwordHash: true, username: true },
      });
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const refreshTokenId = crypto.randomUUID();
    const session = await createSession({
      userId: user.id,
      refreshTokenId,
      req,
      ttlMs: REFRESH_TOKEN_TTL_MS,
    });
    const accessToken = signAccessToken({
      userId: user.id,
      sessionId: session.id,
    });

    setAuthCookies(res, accessToken, refreshTokenId);

    logAudit(user.id, "LOGIN", req, { sessionId: session.id });

    return res.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        username: user.username || undefined,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshTokenId = req.cookies?.refresh_token_id || null;
    const sessionId = req.session?.id || null;
    const userId = req.user?.id || null;

    if (sessionId) {
      await prisma.session.update({
        where: { id: sessionId },
        data: { active: false },
      });
    } else if (refreshTokenId) {
      await prisma.session.updateMany({
        where: { refreshTokenId },
        data: { active: false },
      });
    }

    if (userId) {
      logAudit(userId, "LOGOUT", req, { sessionId });
    }

    clearAuthCookies(res);
    return res.json({ message: "Logged out" });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ error: "Logout failed" });
  }
};
