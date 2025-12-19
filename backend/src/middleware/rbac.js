/**
 * requireRoles("admin", "manager")
 * Passes if the user has *any* of the required roles.
 */
export function requireRoles(...requiredRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userRoles = req.userRoles || [];

    // if no roles defined on user, deny
    if (!Array.isArray(userRoles) || userRoles.length === 0) {
      return res.status(403).json({
        error: "Forbidden: no roles assigned",
        requiredRoles,
        userRoles,
      });
    }

    const hasRole = requiredRoles.some((r) => userRoles.includes(r));

    if (!hasRole) {
      return res.status(403).json({
        error: "Forbidden: missing required role",
        requiredRoles,
        userRoles,
      });
    }

    return next();
  };
}

/**
 * requirePerms("USER_READ", "SESSION_READ")
 * Passes if the user has *any* of the required permissions.
 */
export function requirePerms(...requiredPerms) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userPerms = req.userPerms || [];

    if (!Array.isArray(userPerms) || userPerms.length === 0) {
      return res.status(403).json({
        error: "Forbidden: no permissions assigned",
        requiredPerms,
        userPerms,
      });
    }

    const hasPerm = requiredPerms.some((p) => userPerms.includes(p));

    if (!hasPerm) {
      return res.status(403).json({
        error: "Forbidden: missing required permission",
        requiredPerms,
        userPerms,
      });
    }

    return next();
  };
}
