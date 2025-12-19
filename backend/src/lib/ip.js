function normalizeIp(ip) {
  if (!ip) return null;

  const s = String(ip).trim();

  // Handle IPv6-mapped IPv4 like ::ffff:127.0.0.1
  if (s.startsWith("::ffff:")) return s.slice(7);

  // Normalize loopback IPv6
  if (s === "::1") return "127.0.0.1";

  return s;
}

export function getClientIp(req) {
  // x-forwarded-for can be a list: "client, proxy1, proxy2"
  const xff = req.headers["x-forwarded-for"];
  if (xff) {
    const first = String(xff).split(",")[0].trim();
    const ip = normalizeIp(first);
    if (ip) return ip;
  }

  const realIp = req.headers["x-real-ip"];
  if (realIp) {
    const ip = normalizeIp(realIp);
    if (ip) return ip;
  }

  // If trust proxy is enabled, Express sets req.ip correctly
  if (req.ip) return normalizeIp(req.ip);

  // Last fallback
  return normalizeIp(req.socket?.remoteAddress);
}
