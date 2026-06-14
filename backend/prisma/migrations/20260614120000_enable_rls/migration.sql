-- Enable Row Level Security (RLS) on all public IAM tables.
--
-- WHY THIS IS SAFE FOR THIS PROJECT:
--   * The app accesses the database ONLY through Prisma, using DATABASE_URL,
--     which connects as the `postgres` role.
--   * `postgres` OWNS these tables AND has the BYPASSRLS attribute, so it is
--     completely unaffected by RLS (we deliberately do NOT use FORCE RLS).
--   * The only roles that respect RLS are `anon` and `authenticated` — the
--     roles used by the Supabase Data API / anon key. With RLS enabled and
--     ZERO policies, those roles can read/write NOTHING (default deny).
--
-- NET EFFECT: the Express + Prisma backend keeps full access; the browser
-- (anon key / Data API) is fully locked out of every IAM table. This closes
-- the Supabase "RLS disabled" security advisor without weakening the app.
--
-- We intentionally add NO policies — a policy would re-open access and make
-- the protection meaningless. All authorization stays in the Express/RBAC layer.
--
-- ENABLE ROW LEVEL SECURITY is idempotent (re-running on an already-enabled
-- table is a harmless no-op), so this migration is safe to apply more than once.

ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Role" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Permission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."RolePermission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."UserRole" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TempPermissionGrant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
