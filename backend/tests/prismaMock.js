// Reusable Prisma client mock. Tests configure individual methods with
// `mockResolvedValueOnce` etc.
import { vi } from "vitest";

export function makePrismaMock() {
  return {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    role: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    permission: {
      findMany: vi.fn(),
    },
    userRole: {
      findMany: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
      upsert: vi.fn(),
    },
    rolePermission: {
      findMany: vi.fn(),
    },
    session: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    auditLog: {
      create: vi.fn().mockResolvedValue({}),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    tempPermissionGrant: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(async (ops) => {
      if (Array.isArray(ops)) return Promise.all(ops);
      if (typeof ops === "function") return ops(this);
      return ops;
    }),
  };
}
