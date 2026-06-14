-- Defense-in-depth: lock the Supabase Data API (PostgREST + GraphQL) out of the
-- IAM tables entirely. RLS (previous migration) already blocks row access for
-- `anon`/`authenticated`; this additionally removes their table-level GRANTs so
-- the tables are not even discoverable in the auto-generated API/GraphQL schema.
--
-- SAFE FOR THIS PROJECT: all DB access is Prisma → `postgres` (table owner,
-- BYPASSRLS). `postgres` keeps full access. Only the browser-facing API roles
-- lose access — which is exactly what we want for a Prisma-only architecture.

-- 1. Revoke everything the Supabase API roles currently hold on existing tables.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- 2. Stop future Prisma-created tables from being auto-granted to the API roles.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON FUNCTIONS FROM anon, authenticated;

-- 3. Pin search_path on the trigger functions (fixes the mutable-search_path
--    security lint). Behavior is unchanged.
--    set_timestamp touches only NEW + now() (pg_catalog), so '' is safe.
ALTER FUNCTION public.set_timestamp() SET search_path = '';
--    assign_default_user_role references public."Role"/"UserRole" unqualified,
--    so pin to public (not '') to preserve resolution.
ALTER FUNCTION public.assign_default_user_role() SET search_path = public;
