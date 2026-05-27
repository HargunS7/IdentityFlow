// Validate the environment at startup. Throw early so we never run with
// weak/missing secrets in production.

const REQUIRED = ["DATABASE_URL", "JWT_SECRET", "FRONTEND_ORIGIN"];

const PRODUCTION_ONLY_REQUIRED = []; // add as needed

const MIN_JWT_SECRET_BYTES = 32;

export function validateEnv() {
  const env = process.env;
  const isProd = env.NODE_ENV === "production";
  const missing = [];

  for (const key of REQUIRED) {
    if (!env[key] || String(env[key]).trim() === "") missing.push(key);
  }
  if (isProd) {
    for (const key of PRODUCTION_ONLY_REQUIRED) {
      if (!env[key] || String(env[key]).trim() === "") missing.push(key);
    }
  }

  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  // JWT secret strength
  const secret = String(env.JWT_SECRET);
  if (Buffer.byteLength(secret, "utf8") < MIN_JWT_SECRET_BYTES) {
    const msg = `JWT_SECRET is too short (need at least ${MIN_JWT_SECRET_BYTES} bytes).`;
    if (isProd) throw new Error(msg);
    console.warn(`[envCheck] ${msg}`);
  }

  // Block well-known dev placeholders in production
  if (isProd) {
    const banned = ["changeme", "dev", "secret", "password", "test"];
    if (banned.includes(secret.toLowerCase())) {
      throw new Error("JWT_SECRET is a known weak placeholder.");
    }
  }
}
