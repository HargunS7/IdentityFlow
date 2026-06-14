const { PrismaClient } = require("@prisma/client");
const argon2 = require("argon2");
const prisma = new PrismaClient();

// Roles and permissions. Keep PERMISSIONS in lockstep with
// backend/src/lib/permissions.js (the runtime registry).
const ROLES = ["admin", "manager", "security_analyst", "auditor", "user", "demo"];

const PERMISSIONS = [
  "USER_READ",
  "USER_CREATE",
  "USER_UPDATE",
  "USER_DELETE",
  "ROLE_ASSIGN",
  "AUDIT_READ",
  "SESSION_READ",
  "SESSION_REVOKE",
  "TEMP_GRANT", // <-- was missing; required for the Temporary Access feature
];

// Per-role permission grants. `admin` gets everything.
const ROLE_PERMISSIONS = {
  admin: PERMISSIONS,
  manager: ["USER_READ", "USER_UPDATE"],
  security_analyst: ["AUDIT_READ", "SESSION_READ", "SESSION_REVOKE"],
  auditor: ["AUDIT_READ"],
  user: ["USER_READ"],
  // Public one-click demo: can SEE every console page + try the self-expiring
  // JIT flow, but holds NO destructive permission (no delete/revoke/role-assign).
  demo: ["USER_READ", "SESSION_READ", "AUDIT_READ", "TEMP_GRANT"],
};

// Demo users — one per role so reviewers can log in and SEE how RBAC changes
// what the console exposes. Password is shared and overridable via env so it
// is never hardcoded for a real deployment.
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "Demo@12345";
const DEMO_USERS = [
  { email: "admin@example.com", role: "admin" },
  { email: "manager@example.com", role: "manager" },
  { email: "security@example.com", role: "security_analyst" },
  { email: "auditor@example.com", role: "auditor" },
  { email: "user@example.com", role: "user" },
  { email: "demo@example.com", role: "demo" },
];

async function main() {
  // 1. Permissions
  const permissionRecords = {};
  for (const code of PERMISSIONS) {
    permissionRecords[code] = await prisma.permission.upsert({
      where: { code },
      update: {},
      create: { code },
    });
  }

  // 2. Roles
  const roleRecords = {};
  for (const name of ROLES) {
    roleRecords[name] = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // 3. Role → permission mapping
  for (const [roleName, codes] of Object.entries(ROLE_PERMISSIONS)) {
    const role = roleRecords[roleName];
    for (const code of codes) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permissionRecords[code].id,
          },
        },
        update: {},
        create: { roleId: role.id, permissionId: permissionRecords[code].id },
      });
    }
  }

  // 4. Demo users (one per role)
  const passwordHash = await argon2.hash(DEMO_PASSWORD, { type: argon2.argon2id });
  for (const { email, role } of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, passwordHash },
    });
    await prisma.userRole.upsert({
      where: {
        userId_roleId: { userId: user.id, roleId: roleRecords[role].id },
      },
      update: {},
      create: { userId: user.id, roleId: roleRecords[role].id },
    });
  }

  console.log("✅ Seed complete");
  console.log("Demo users (password:", DEMO_PASSWORD + "):");
  for (const u of DEMO_USERS) console.log(`  ${u.role.padEnd(16)} ${u.email}`);
}

main()
  .catch((err) => {
    console.error("❌ Error seeding DB:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
