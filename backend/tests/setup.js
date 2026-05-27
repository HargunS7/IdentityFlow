// Vitest setup: define the env BEFORE any module under test is imported.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET =
  process.env.JWT_SECRET ||
  "this-is-a-long-enough-test-jwt-secret-of-at-least-32-bytes";
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://test:test@localhost/test";
process.env.FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN || "http://localhost:5173";
