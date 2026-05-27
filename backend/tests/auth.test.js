import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { makePrismaMock } from "./prismaMock.js";

const prismaMock = makePrismaMock();
vi.mock("../src/PrismaClient.js", () => ({ default: prismaMock }));

// Import after mocking so server.js picks up the mock.
const { default: app } = await import("../src/server.js");

function signTestToken({ userId, sid }) {
  return jwt.sign({ id: userId, sid }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
}

beforeEach(() => {
  Object.values(prismaMock).forEach((model) => {
    if (typeof model === "object") {
      Object.values(model).forEach((fn) => {
        if (typeof fn?.mockReset === "function") fn.mockReset();
      });
    }
  });
  prismaMock.auditLog.create.mockResolvedValue({});
});

describe("POST /api/auth/login", () => {
  it("rejects missing credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(400);
  });

  it("rejects unknown user with generic message", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ identifier: "nope@example.com", password: "Password!1" });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid credentials/i);
  });

  it("rejects bad password", async () => {
    const hash = await argon2.hash("CorrectHorse!1");
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "a@b.com",
      username: null,
      passwordHash: hash,
    });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ identifier: "a@b.com", password: "WrongPass!1" });
    expect(res.status).toBe(401);
  });

  it("sets cookies and returns user on success", async () => {
    const hash = await argon2.hash("CorrectHorse!1");
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "a@b.com",
      username: "alice",
      passwordHash: hash,
    });
    prismaMock.session.create.mockResolvedValue({
      id: "session-1",
      userId: "user-1",
      active: true,
      expiresAt: new Date(Date.now() + 86400000),
      refreshTokenId: "rt-1",
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ identifier: "a@b.com", password: "CorrectHorse!1" });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: "user-1", email: "a@b.com" });
    expect(res.body).not.toHaveProperty("token");
    const cookies = res.headers["set-cookie"].join(";");
    expect(cookies).toContain("access_token=");
    expect(cookies).toContain("HttpOnly");
  });
});

describe("auth middleware", () => {
  it("rejects requests with no cookie", async () => {
    const res = await request(app).get("/api/me");
    expect(res.status).toBe(401);
  });

  it("rejects tokens without sid (legacy tokens)", async () => {
    const token = jwt.sign({ id: "user-1" }, process.env.JWT_SECRET);
    const res = await request(app)
      .get("/api/me")
      .set("Cookie", [`access_token=${token}`]);
    expect(res.status).toBe(401);
  });

  it("rejects when the session is inactive (revocation works)", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "a@b.com",
      username: null,
      mfaEnabled: false,
      createdAt: new Date(),
    });
    prismaMock.session.findUnique.mockResolvedValue({
      id: "session-1",
      userId: "user-1",
      active: false, // revoked
      expiresAt: new Date(Date.now() + 86400000),
    });

    const token = signTestToken({ userId: "user-1", sid: "session-1" });
    const res = await request(app)
      .get("/api/me")
      .set("Cookie", [`access_token=${token}`]);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/revoked/i);
  });

  it("rejects when the session has expired", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "a@b.com",
      username: null,
      mfaEnabled: false,
      createdAt: new Date(),
    });
    prismaMock.session.findUnique.mockResolvedValue({
      id: "session-1",
      userId: "user-1",
      active: true,
      expiresAt: new Date(Date.now() - 1000),
    });

    const token = signTestToken({ userId: "user-1", sid: "session-1" });
    const res = await request(app)
      .get("/api/me")
      .set("Cookie", [`access_token=${token}`]);
    expect(res.status).toBe(401);
  });

  it("accepts a valid active session and returns the IAM profile", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "a@b.com",
      username: null,
      mfaEnabled: false,
      createdAt: new Date(),
    });
    prismaMock.session.findUnique.mockResolvedValue({
      id: "session-1",
      userId: "user-1",
      active: true,
      expiresAt: new Date(Date.now() + 86400000),
    });
    prismaMock.userRole.findMany.mockResolvedValue([
      { role: { name: "user" } },
    ]);
    prismaMock.rolePermission.findMany.mockResolvedValue([
      { permission: { code: "USER_READ" } },
    ]);
    prismaMock.tempPermissionGrant.findMany.mockResolvedValue([]);

    const token = signTestToken({ userId: "user-1", sid: "session-1" });
    const res = await request(app)
      .get("/api/me")
      .set("Cookie", [`access_token=${token}`]);
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: "user-1" });
    expect(res.body.permissions.combined).toContain("USER_READ");
  });
});
