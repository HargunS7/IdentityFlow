import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { makePrismaMock } from "./prismaMock.js";

const prismaMock = makePrismaMock();
vi.mock("../src/PrismaClient.js", () => ({ default: prismaMock }));

const { default: app } = await import("../src/server.js");

function authedAs({ perms = [] }) {
  prismaMock.user.findUnique.mockResolvedValue({
    id: "admin-1",
    email: "admin@example.com",
    username: "admin",
    mfaEnabled: false,
    createdAt: new Date(),
  });
  prismaMock.session.findUnique.mockResolvedValue({
    id: "session-A",
    userId: "admin-1",
    active: true,
    expiresAt: new Date(Date.now() + 86400000),
  });
  prismaMock.userRole.findMany.mockResolvedValue([
    { role: { name: "admin" } },
  ]);
  prismaMock.rolePermission.findMany.mockResolvedValue(
    perms.map((code) => ({ permission: { code } }))
  );
  prismaMock.tempPermissionGrant.findMany.mockResolvedValue([]);
  return jwt.sign(
    { id: "admin-1", sid: "session-A" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
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

describe("session revocation", () => {
  it("revokes by sessionId (marks active=false)", async () => {
    const token = authedAs({ perms: ["SESSION_REVOKE"] });
    prismaMock.session.updateMany.mockResolvedValue({ count: 1 });

    const res = await request(app)
      .post("/api/admin/sessions/revoke")
      .set("Cookie", [`access_token=${token}`])
      .send({ sessionId: "session-target" });

    expect(res.status).toBe(200);
    expect(prismaMock.session.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "session-target" },
        data: { active: false },
      })
    );
  });

  it("rejects revoke when caller lacks SESSION_REVOKE", async () => {
    const token = authedAs({ perms: ["SESSION_READ"] });
    const res = await request(app)
      .post("/api/admin/sessions/revoke")
      .set("Cookie", [`access_token=${token}`])
      .send({ sessionId: "session-target" });
    expect(res.status).toBe(403);
  });

  it("subsequent requests with revoked session are rejected by auth middleware", async () => {
    // Caller's own session is now inactive.
    prismaMock.user.findUnique.mockResolvedValue({
      id: "admin-1",
      email: "admin@example.com",
      username: "admin",
      mfaEnabled: false,
      createdAt: new Date(),
    });
    prismaMock.session.findUnique.mockResolvedValue({
      id: "session-A",
      userId: "admin-1",
      active: false,
      expiresAt: new Date(Date.now() + 86400000),
    });

    const token = jwt.sign(
      { id: "admin-1", sid: "session-A" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const res = await request(app)
      .get("/api/me")
      .set("Cookie", [`access_token=${token}`]);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/revoked/i);
  });
});
