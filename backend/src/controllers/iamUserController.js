// backend/src/controllers/iamUserController.js
import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import {
  validateEmailFormat,
  validateUsernameFormat,
  validatePasswordStrength,
} from "../lib/validation.js";

const prisma = new PrismaClient();

// /**
//  * GET /api/me
//  * Just returns what auth middleware put on req
//  */
// export const getMe = (req, res) => {
//   return res.json({
//     user: req.user,
//     roles: req.userRoles || [],
//     permissions: req.userPerms || [],
//   });
// };

// /**
//  * GET /api/admin/users
//  * Requires USER_READ (enforced in route)
//  */
// export const listUsers = async (req, res) => {
//   try {
//     const users = await prisma.user.findMany({
//       select: {
//         id: true,
//         email: true,
//         username: true,
//         mfaEnabled: true,
//         createdAt: true,
//       },
//     });
//     return res.json(users);
//   } catch (err) {
//     console.error("listUsers error:", err);
//     return res.status(500).json({ error: "Failed to list users" });
//   }
// };

/**
 * POST /api/admin/users
 * Permission: USER_CREATE
 * body: { email, username?, password }
 */
export const createUser = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "email and password are required" });
    }

    // 1. Validate email
    const emailCheck = validateEmailFormat(email);
    if (!emailCheck.valid) {
      return res.status(400).json({ error: emailCheck.reason });
    }

    // 2. Validate username (if present)
    if (username) {
      const usernameCheck = validateUsernameFormat(username);
      if (!usernameCheck.valid) {
        return res.status(400).json({ error: usernameCheck.reason });
      }
    }

    // 3. Validate password strength
    const passwordCheck = validatePasswordStrength(password, {
      email,
      username,
    });
    if (!passwordCheck.valid) {
      return res.status(400).json({ error: passwordCheck.reason });
    }

    // 4. Check for existing email / username
    const existingByEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingByEmail) {
      return res.status(409).json({ error: "Email already registered" });
    }

    if (username) {
      const existingByUsername = await prisma.user.findUnique({
        where: { username },
        select: { id: true },
      });
      if (existingByUsername) {
        return res
          .status(409)
          .json({ error: "Username already taken" });
      }
    }

    // 5. Hash password
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      timeCost: 3,
      memoryCost: 19456,
      parallelism: 1,
    });

    // 6. Create user
    const user = await prisma.user.create({
      data: {
        email,
        username: username || null,
        passwordHash,
        mfaEnabled: false,
      },
      select: {
        id: true,
        email: true,
        username: true,
        mfaEnabled: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: "User created successfully",
      user,
    });
  } catch (err) {
    console.error("USER_CREATE error:", err);
    return res.status(500).json({ error: "Failed to create user" });
  }
};

/**
 * PATCH /api/admin/users/:id
 * Permission: USER_UPDATE
 * body: { email?, username?, password?, mfaEnabled? }
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, username, password, mfaEnabled } = req.body;

    if (
      email === undefined &&
      username === undefined &&
      password === undefined &&
      mfaEnabled === undefined
    ) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const data = {};

    // 1. Email
    if (email !== undefined) {
      const emailCheck = validateEmailFormat(email);
      if (!emailCheck.valid) {
        return res.status(400).json({ error: emailCheck.reason });
      }

      const existingEmail = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id },
        },
        select: { id: true },
      });
      if (existingEmail) {
        return res
          .status(409)
          .json({ error: "Email already in use by another user" });
      }

      data.email = email;
    }

    // 2. Username
    if (username !== undefined) {
      if (username !== null && username !== "") {
        const usernameCheck = validateUsernameFormat(username);
        if (!usernameCheck.valid) {
          return res.status(400).json({ error: usernameCheck.reason });
        }

        const existingUsername = await prisma.user.findFirst({
          where: {
            username,
            NOT: { id },
          },
          select: { id: true },
        });
        if (existingUsername) {
          return res
            .status(409)
            .json({ error: "Username already in use by another user" });
        }

        data.username = username;
      } else {
        // allow clearing username
        data.username = null;
      }
    }

    // 3. Password
    if (password !== undefined) {
      const effectiveEmail = email ?? undefined;
      const effectiveUsername = username ?? undefined;

      const passwordCheck = validatePasswordStrength(password, {
        email: effectiveEmail,
        username: effectiveUsername,
      });
      if (!passwordCheck.valid) {
        return res.status(400).json({ error: passwordCheck.reason });
      }

      const passwordHash = await argon2.hash(password, {
        type: argon2.argon2id,
        timeCost: 3,
        memoryCost: 19456,
        parallelism: 1,
      });

      data.passwordHash = passwordHash;
    }

    // 4. mfaEnabled
    if (mfaEnabled !== undefined) {
      data.mfaEnabled = !!mfaEnabled;
    }

    // 5. Update
    let updated;
    try {
      updated = await prisma.user.update({
        where: { id },
        data,
        select: {
          id: true,
          email: true,
          username: true,
          mfaEnabled: true,
          createdAt: true,
        },
      });
    } catch (e) {
      console.error("USER_UPDATE prisma error:", e);
      return res
        .status(404)
        .json({ error: "User not found or could not be updated" });
    }

    return res.json({
      message: "User updated successfully",
      user: updated,
    });
  } catch (err) {
    console.error("USER_UPDATE error:", err);
    return res.status(500).json({ error: "Failed to update user" });
  }
};

/**
 * DELETE /api/admin/users/:id
 * Permission: USER_DELETE
 */
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true },
    });

    if (!existing) {
      return res.status(404).json({ error: "User not found" });
    }

    await prisma.$transaction([
      prisma.session.deleteMany({ where: { userId: id } }),
      prisma.userRole.deleteMany({ where: { userId: id } }),
      prisma.auditLog.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    return res.json({
      message: "User deleted successfully",
      deletedUserId: id,
      deletedEmail: existing.email,
    });
  } catch (err) {
    console.error("USER_DELETE error:", err);
    return res.status(500).json({ error: "Failed to delete user" });
  }
};
