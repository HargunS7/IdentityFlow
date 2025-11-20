// backend/src/middleware/rbac.js

// Require user to have at least one of the given roles
export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const userRoles = req.userRoles || [];
    const ok = userRoles.some((r) => roles.includes(r));

    if (!ok) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    return next();
  };
}

// Require user to have ALL of the given permissions
export function requirePerms(...perms) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const permSet = new Set(req.userPerms || []);
    const ok = perms.every((p) => permSet.has(p));

    if (!ok) {
      return res
        .status(403)
        .json({ error: "Forbidden: insufficient permissions" });
    }
    return next();
  };
}
