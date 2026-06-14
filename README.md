# IdentityFlow — Interactive IAM Learning Platform

An interactive **Identity & Access Management** learning platform that teaches
authentication, authorization, RBAC, sessions, audit logs, and temporary
(just-in-time) access through a **real, working security system** — not slides.

You don't just read about IAM here; you log in, get roles, watch permissions
resolve, revoke a session and see it die on the next request, grant yourself a
permission that expires in minutes, and watch every action land in an audit log.

---

## Who it's for

| Audience | What they get |
|---|---|
| **Students** learning security/backend | A hands-on system to explore every IAM concept and watch flows happen live. |
| **Teachers / instructors** | A live demo to drive an IAM lesson — assign roles, revoke sessions, grant JIT access in front of a class. |
| **Recruiters / interviewers** | A concrete, well-architected project that shows real understanding of auth, RBAC, sessions, and audit design. |
| **Developers** | A clean reference implementation of custom auth + RBAC on Express + Prisma. |

## What you'll learn

- **Authentication** — password hashing (Argon2id), login, JWT-in-httpOnly-cookie, session creation.
- **Authorization** — why being logged in ≠ being allowed; permission-gated routes.
- **RBAC** — Users → Roles → Permissions, and the effective permission set.
- **Sessions** — active vs revoked, and why a revocable session beats a "JWT that just expires".
- **Audit logs** — who did what, when, from where — and why security teams need it.
- **Temporary / JIT access** — grant a permission for minutes, auto-expiring, fully audited.

---

## Tech stack

- **Frontend:** React 19 + Vite, React Router, TanStack Query, Framer Motion, Tailwind CSS.
- **Backend:** Node + Express 5, Prisma ORM, Argon2id, JWT, Helmet, rate limiting.
- **Database:** PostgreSQL (hosted on Supabase).

## Architecture

```
Browser (React/Vite)
        │  HTTPS + httpOnly cookie (credentials: include)
        ▼
Express backend  ── custom auth + RBAC middleware ──┐
        │                                           │ all authz enforced here
        ▼                                           │
Prisma ORM  ──────────────────────────────────────┘
        │  DATABASE_URL (connects as `postgres`, table owner)
        ▼
Supabase PostgreSQL
```

**The browser never talks to the database or to Supabase directly.** Every read
and write goes through the Express API, where authentication and RBAC are
enforced. Supabase is used purely as managed Postgres (via Prisma) — not as a
client SDK, not via the Data API.

### How the core pieces work

- **Auth:** `POST /api/auth/login` verifies the Argon2id hash, creates a
  `Session` row, signs a JWT carrying `{ user id, session id }`, and sets it in
  an **httpOnly** cookie. Every protected request re-checks that the session row
  is still `active` — so revocation is instant, not "whenever the JWT expires".
- **RBAC:** A user has roles; roles bundle permission codes (e.g.
  `SESSION_REVOKE`). Routes declare `requirePerms(...)`; the effective set is
  `role permissions ∪ active temporary grants`. There is **no admin bypass** —
  admin works because it's granted every permission.
- **Sessions:** Created on login, carry IP + user-agent, can be revoked; the
  next request from that session gets 401.
- **Audit logs:** Login, signup, role assign/remove, user CRUD, session revoke,
  and temp grant/revoke append to `AuditLog` with actor, target, action, IP, meta.
- **Temporary access:** `TempPermissionGrant` gives a user a permission until
  `expiresAt`; it's added to the effective set while live, then silently lapses.

### Real-time strategy
Near-real-time updates use **TanStack Query** (short polling on the live tabs +
optimistic updates + cache invalidation after mutations) — all backend-driven.
We deliberately do **not** use Supabase Realtime, which would require exposing
IAM tables to the browser. See docs/DEPLOYMENT.md for the comparison.

---

## Run locally

### 1. Install
```bash
cd backend  && npm install
cd ../frontend && npm install
```

### 2. Environment
Copy the templates and fill them in (never commit the real `.env`):
```bash
cp backend/.env.example  backend/.env
cp frontend/.env.example frontend/.env
```
See **[Environment variables](#environment-variables)** below.

### 3. Prisma
```bash
cd backend
npx prisma generate
# Apply migrations to a fresh database (creates tables + enables RLS):
npx prisma migrate deploy
# Seed roles, permissions, and one demo user per role:
npx prisma db seed
```
> If you're connecting to the **already-provisioned** shared database, do **not**
> run `migrate`/`seed` — the schema and data already exist. These commands are
> for spinning up your own database.

### 4. Start
```bash
# terminal 1
cd backend  && npm run dev      # http://localhost:3000
# terminal 2
cd frontend && npm run dev      # http://localhost:5173
```

### Demo users (from the seed)
All share the password `Demo@12345` (override with `DEMO_PASSWORD` when seeding).
Log in as each to see how RBAC changes what the console exposes:

| Role | Email | Can do |
|---|---|---|
| admin | admin@example.com | Everything |
| manager | manager@example.com | Read/update users |
| security_analyst | security@example.com | Read audit + read/revoke sessions |
| auditor | auditor@example.com | Read audit logs |
| user | user@example.com | Basic read only |

---

## Environment variables

### Backend (`backend/.env`) — secrets, never committed
| Var | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | Pooled Postgres connection (Prisma runtime). |
| `DIRECT_URL` | for migrations | Direct Postgres connection (Prisma CLI). |
| `JWT_SECRET` | ✅ | Signs access tokens (≥32 bytes; enforced in prod). |
| `JWT_EXPIRES_IN` | optional | Access-token lifetime (default `1h`). |
| `FRONTEND_ORIGIN` | ✅ | Exact frontend origin for CORS. |
| `PORT` | optional | Default `3000`. |
| `NODE_ENV` | ✅ in prod | `production` hardens cookies + disables debug routes. |
| `COOKIE_SAMESITE` | optional | `none` (default in prod) for cross-domain hosting; `lax` for same-site. |
| `COOKIE_DOMAIN` | optional | Shared parent domain for cookies, if any. |

### Frontend (`frontend/.env`) — public only
| Var | Purpose |
|---|---|
| `VITE_API_URL` | Base URL of the Express backend. |

> **No Supabase keys anywhere.** See the Supabase strategy below.

---

## Supabase access strategy

This project uses Supabase **only as managed Postgres, accessed through Prisma**.

- **Supabase publishable / anon key?** ❌ Not needed. The browser never calls Supabase.
- **Supabase secret / service-role key?** ❌ Not needed. The backend uses Prisma with `DATABASE_URL`, not the Supabase SDK.
- **Supabase Data API (PostgREST/GraphQL)?** ❌ Not used — and it's been locked down (see below).
- **What the backend needs:** just `DATABASE_URL` (+ `DIRECT_URL` for migrations).

### RLS / Data API hardening (already applied)
The IAM tables were fully exposed to the `anon`/`authenticated` API roles. Two
migrations fix this without affecting the app (Prisma connects as `postgres`,
the table owner, which bypasses RLS):

- `…_enable_rls` — **RLS enabled, no policies** on every table → deny-all to the browser/API roles.
- `…_lock_down_data_api` — **revokes all `anon`/`authenticated` grants** (current + future) so the tables aren't even discoverable via the Data API, and pins trigger-function `search_path`.

Result: the browser cannot read or write IAM tables through Supabase at all;
all access is forced through the Express + RBAC layer.

See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for the hosting checklist,
security checklist, and the manual Supabase dashboard steps.

---

## Testing
```bash
cd backend && npm test         # Vitest: auth, RBAC, sessions
cd frontend && npm run build   # production build must succeed
```

## Out of scope (by design, this phase)
Password reset, MFA enrollment flows, SSO, webhooks, and API tokens are
intentionally **not** part of this phase.
