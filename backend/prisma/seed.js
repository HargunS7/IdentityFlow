const { PrismaClient } = require("@prisma/client");
const argon2 = require("argon2");
const prisma = new PrismaClient();

// Define roles and permissions
const ROLES = ["admin", "manager", "security_analyst", "auditor", "user"];

const PERMISSIONS = [
  "USER_READ",
  "USER_CREATE",
  "USER_UPDATE",
  "USER_DELETE",
  "ROLE_ASSIGN",
  "AUDIT_READ",
  "SESSION_READ",
  "SESSION_REVOKE",
];

async function main() {
  // 1. Create all permissions
  const permissionRecords = {};
  for (const code of PERMISSIONS) {
    const perm = await prisma.permission.upsert({
      where: { code },
      update: {},
      create: { code },
    });
    permissionRecords[code] = perm;
  }

  // 2. Create all roles
  const roleRecords = {};
  for (const name of ROLES) {
    const role = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    roleRecords[name] = role;
  }

  // 3. Attach permissions to roles
  // Helper function to assign permissions to a role
  async function assignPermissions(roleName, permCodes) {
    const role = roleRecords[roleName];
    for (const code of permCodes) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permissionRecords[code].id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permissionRecords[code].id,
        },
      });
    }
  }

  // Admin → all permissions
  await assignPermissions("admin", PERMISSIONS);

  // Manager → manage users
  await assignPermissions("manager", ["USER_READ", "USER_UPDATE"]);

  // Security analyst → audit + sessions
  await assignPermissions("security_analyst", ["AUDIT_READ", "SESSION_READ"]);

  // Auditor → read-only audit
  await assignPermissions("auditor", ["AUDIT_READ"]);

  // Normal user → basic read
  await assignPermissions("user", ["USER_READ"]);

  // 4. Create a default admin user
  const adminEmail = "admin@example.com";
  const adminPass = "Admin@12345"; // ⚠️ Change this later!
  const hash = await argon2.hash(adminPass, { type: argon2.argon2id });

  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, passwordHash: hash },
  });

  // 5. Attach admin role to admin user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: roleRecords["admin"].id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      roleId: roleRecords["admin"].id,
    },
  });

  console.log("✅ Seed complete");
  console.log("Default Admin:", adminEmail, "Password:", adminPass);
}

main()
  .catch((err) => {
    console.error("❌ Error seeding DB:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
