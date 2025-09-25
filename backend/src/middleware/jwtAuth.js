import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.access_token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.auth = { userId: decoded.id };
    return next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

