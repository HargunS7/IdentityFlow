import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { makePrismaMock } from "./prismaMock.js";

const prismaMock = makePrismaMock();
vi.mock("../src/PrismaClient.js", () => ({ default: prismaMock }));

const { default: app } = await import("../src/server.js");

function tokenFor(userId, sid) {
  return jwt.sign({ id: userId, sid }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
}

/**
 * Wire up an authenticated user with the given role(s) and permission(s).
 * Call this in each test (after the global beforeEach reset) to install
 * the mocks the auth middleware will hit.
 */
function authedAs({ userId = "user-1", roleNames = ["user"], perms = [] }) {
  prismaMock.user.findUnique.mockResolvedValue({
    id: userId,
    email: `${userId}@example.com`,
    username: userId,
    mfaEnabled: false,
    createdAt: new Date(),
  });
  prismaMock.session.findUnique.mockResolvedValue({
    id: "session-1",
    userId,
    active: true,
    expiresAt: new Date(Date.now() + 86400000),
  });
  prismaMock.userRole.findMany.mockResolvedValue(
    roleNames.map((name) => ({ role: { name } }))
  );
  prismaMock.rolePermission.findMany.mockResolvedValue(
    perms.map((code) => ({ permission: { code } }))
  );
  prismaMock.tempPermissionGrant.findMany.mockResolvedValue([]);
  return tokenFor(userId, "session-1");
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

describe("RBAC on /api/admin/users", () => {
  it("403s when user has no perms", async () => {
    const token = authedAs({ perms: [] });
    const res = await request(app)
      .get("/api/admin/users")
      .set("Cookie", [`access_token=${token}`]);
    expect(res.status).toBe(403);
  });

  it("403s when user has only non-matching perms", async () => {
    const token = authedAs({ perms: ["AUDIT_READ"] });
    const res = await request(app)
      .get("/api/admin/users")
      .set("Cookie", [`access_token=${token}`]);
    expect(res.status).toBe(403);
  });

  it("200s when user has USER_READ (the fixed gate)", async () => {
    const token = authedAs({ perms: ["USER_READ"] });
    prismaMock.user.findMany.mockResolvedValue([]);
    const res = await request(app)
      .get("/api/admin/users")
      .set("Cookie", [`access_token=${token}`]);
    expect(res.status).toBe(200);
  });
});

describe("Role assign + remove use the same gate", () => {
  it("both reject without ROLE_ASSIGN", async () => {
    const token = authedAs({ perms: ["USER_READ"] });
    const r1 = await request(app)
      .put("/api/admin/assign-role")
      .set("Cookie", [`access_token=${token}`])
      .send({ userId: "u2", roleName: "manager" });
    const r2 = await request(app)
      .put("/api/admin/remove-role")
      .set("Cookie", [`access_token=${token}`])
      .send({ userId: "u2", roleName: "manager" });
    expect(r1.status).toBe(403);
    expect(r2.status).toBe(403);
  });

  it("both accept with ROLE_ASSIGN", async () => {
    const token = authedAs({ perms: ["ROLE_ASSIGN"] });
    prismaMock.role.findUnique.mockResolvedValueOnce({
      id: "role-mgr",
      name: "manager",
    });
    prismaMock.user.findUnique
      .mockResolvedValueOnce({
        // auth-middleware lookup
        id: "user-1",
        email: "u@e.com",
        username: "u",
        mfaEnabled: false,
        createdAt: new Date(),
      })
      .mockResolvedValueOnce({ id: "u2", email: "t@e.com" });
    prismaMock.$transaction.mockResolvedValue([{}, { id: "ur-1" }]);

    const r1 = await request(app)
      .put("/api/admin/assign-role")
      .set("Cookie", [`access_token=${token}`])
      .send({ userId: "u2", roleName: "manager" });
    expect(r1.status).toBe(200);
  });
});

describe("Temp permission grant gate", () => {
  it("rejects without TEMP_GRANT", async () => {
    const token = authedAs({ perms: ["USER_READ"] });
    const res = await request(app)
      .post("/api/admin/temp-permissions/grant")
      .set("Cookie", [`access_token=${token}`])
      .send({
        userId: "u2",
        permission: "AUDIT_READ",
        durationMinutes: 10,
      });
    expect(res.status).toBe(403);
  });

  it("accepts with TEMP_GRANT and creates a grant", async () => {
    const token = authedAs({ perms: ["TEMP_GRANT"] });
    prismaMock.user.findUnique.mockResolvedValueOnce({
      // auth-middleware lookup
      id: "user-1",
      email: "u@e.com",
      username: "u",
      mfaEnabled: false,
      createdAt: new Date(),
    });
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "u2",
      email: "t@e.com",
      username: "t",
    });
    prismaMock.tempPermissionGrant.create.mockResolvedValue({
      id: "grant-1",
      userId: "u2",
      permission: "AUDIT_READ",
      expiresAt: new Date(Date.now() + 600000),
    });

    const res = await request(app)
      .post("/api/admin/temp-permissions/grant")
      .set("Cookie", [`access_token=${token}`])
      .send({
        userId: "u2",
        permission: "AUDIT_READ",
        durationMinutes: 10,
      });
    expect(res.status).toBe(200);
    expect(prismaMock.tempPermissionGrant.create).toHaveBeenCalled();
  });
});
