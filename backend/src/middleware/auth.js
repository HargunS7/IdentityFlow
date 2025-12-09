// // backend/src/middleware/auth.js
// import jwt from "jsonwebtoken";
// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// /**
//  * Authentication middleware.
//  * - Verifies JWT
//  * - Loads user
//  * - Loads roles and permissions
//  * - Attaches: req.user, req.userRoles, req.userPerms
//  *
//  * Usage:
//  *   router.get("/me", auth(true), handler);
//  *   router.get("/public", auth(false), handler); // optional
//  */
// export function auth(required = true) {
//   return async (req, res, next) => {
//     try {
//       const header = req.headers.authorization || "";
//       const token = header.startsWith("Bearer ") ? header.slice(7) : null;

//       if (!token) {
//         if (required) {
//           return res.status(401).json({ error: "Missing Authorization token" });
//         }
//         req.user = null;
//         return next();
//       }

//       // Decode + verify JWT
//       const payload = jwt.verify(token, process.env.JWT_SECRET);
//       const userId = payload.id || payload.sub;

//       // Load user
//       const user = await prisma.user.findUnique({
//         where: { id: userId },
//         select: {
//           id: true,
//           email: true,
//         //   username: true,
//           mfaEnabled: true,
//           createdAt: true,
//         },
//       });

//       if (!user) {
//         return res.status(401).json({ error: "User not found" });
//       }

//       // Load roles through UserRole → Role
//       const userRoles = await prisma.userRole.findMany({
//         where: { userId: user.id }, // Prisma uses camelCase even though DB is user_id
//         select: {
//           role: { select: { name: true } },
//         },
//       });
//       const roleNames = userRoles.map((r) => r.role.name);

//       // Load permissions through RolePermission → Permission
//       const rolePerms = await prisma.rolePermission.findMany({
//         where: { role: { name: { in: roleNames } } },
//         select: { permission: { select: { code: true } } },
//       });
//       const permCodes = [...new Set(rolePerms.map((p) => p.permission.code))];

//       // Attach to request so routes can use them
//       req.user = user;
//       req.userRoles = roleNames;
//       // req.userPerms = permCodes;


// //------------------------------------------------------------------------------------
    
// //trying out the JIT access/ temporary privellege escalation

//       // loading  temporary permissions
//       const now = new Date();
//       const tempGrants = await prisma.tempPermissionGrant.findMany({
//         where: {
//           userId: user.id,
//           expiresAt: { gt: now },
//         },
//       });

//       // extracting permission strings
//       const tempPerms = tempGrants.map((g) => g.permission);

//       // meerge (dedupe)
//       req.userPerms = [...new Set([...permCodes, ...tempPerms])];



// //------------------------------------------------------------------------------------


//       // (Later, for RLS) we can also set Postgres session vars here

//       return next();
//     } catch (err) {
//       console.error("Auth middleware error:", err.message);
//       if (!required) {
//         req.user = null;
//         return next();
//       }
//       return res.status(401).json({ error: "Unauthorized" });
//     }
//   };
// }



// backend/src/middleware/auth.js
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Authentication middleware.
 * - Verifies JWT
 * - Loads user
 * - Loads roles and permissions (including temp permissions)
 * - Attaches:
 *    req.user
 *    req.userRoles
 *    req.userPerms        (combined)
 *    req.userPermsPermanent
 *    req.userPermsTemp
 *    req.tempPermissionGrants
 */
export function auth(required = true) {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization || "";
      const token = header.startsWith("Bearer ") ? header.slice(7) : null;

      if (!token) {
        if (required) {
          return res.status(401).json({ error: "Missing Authorization token" });
        }
        req.user = null;
        return next();
      }

      // Decode + verify JWT
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const userId = payload.id || payload.sub;

      // Load user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          mfaEnabled: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      // Load roles through UserRole → Role
      const userRoles = await prisma.userRole.findMany({
        where: { userId: user.id },
        select: {
          role: { select: { name: true } },
        },
      });
      const roleNames = userRoles.map((r) => r.role.name);

      // Load permanent permissions through RolePermission → Permission
      const rolePerms = await prisma.rolePermission.findMany({
        where: { role: { name: { in: roleNames } } },
        select: { permission: { select: { code: true } } },
      });
      const permanentPerms = [
        ...new Set(rolePerms.map((p) => p.permission.code)),
      ];

      // 🔥 Load temporary permission grants (only active)
      const now = new Date();
      const tempGrants = await prisma.tempPermissionGrant.findMany({
        where: {
          userId: user.id,
          expiresAt: { gt: now },
        },
        select: {
          id: true,
          permission: true,
          expiresAt: true,
          reason: true,
          grantedById: true,
          createdAt: true,
        },
      });

      const tempPerms = tempGrants.map((g) => g.permission);

      // Combined permission set
      const allPerms = [...new Set([...permanentPerms, ...tempPerms])];

      // Attach to request so routes/controllers can use them
      req.user = user;
      req.userRoles = roleNames;
      req.userPermsPermanent = permanentPerms;
      req.userPermsTemp = tempPerms;
      req.userPerms = allPerms;
      req.tempPermissionGrants = tempGrants;

      return next();
    } catch (err) {
      console.error("Auth middleware error:", err.message);
      if (!required) {
        req.user = null;
        return next();
      }
      return res.status(401).json({ error: "Unauthorized" });
    }
  };
}
