# Deployment & Security Guide

How to host IdentityFlow publicly **safely**. The architecture is:

```
Frontend (static, e.g. Vercel/Netlify)  →  Express backend (e.g. Render/Railway/Fly)  →  Prisma  →  Supabase Postgres
```

The browser only ever talks to the Express backend. Supabase is reached only by
the backend, through Prisma, using a connection string.

---

## 1. Supabase access strategy (decision)

| Question | Answer |
|---|---|
| Publishable / anon key in the frontend? | **No.** The browser never calls Supabase. |
| Secret / service-role key in the backend? | **No.** Backend uses Prisma + `DATABASE_URL`. |
| Is the Supabase Data API needed? | **No.** Nothing uses PostgREST/GraphQL. |
| Should the Data API be locked down? | **Yes — done** (RLS + grant revocation). |
| Any Supabase keys in frontend code? | **No** (the unused `supabase-js` client was removed). |
| Any dangerous keys committed? | The frontend anon key was tracked in git history; it's an *anon* (publishable) key (low-risk by design) and is no longer used. `frontend/.env` is now untracked. Optional: rotate it in the dashboard. |

### Why enabling RLS is safe here
Prisma connects as the `postgres` role, which **owns** the tables and has
`BYPASSRLS`. RLS only constrains the `anon`/`authenticated` API roles. So
RLS-with-no-policies = deny-all to the browser, zero impact on the app.

### What was applied (migrations, already on the live DB)
- `20260614120000_enable_rls` — `ENABLE ROW LEVEL SECURITY` on all 9 tables, **no policies** (deny-all).
- `20260614120100_lock_down_data_api` — revoke all `anon`/`authenticated` privileges (current + future via default privileges), pin trigger-function `search_path`.

After these, the only remaining security advisors are:
- `rls_enabled_no_policy` (INFO) — **intended**; deny-all is the goal.
- `vulnerable_postgres_version` (WARN) — see manual steps below.

---

## 2. Manual Supabase dashboard steps

These can't be done from code — do them in the Supabase dashboard:

1. **Disable the Data API for `public`** (belt-and-suspenders):
   *Project Settings → API → "Exposed schemas"* → remove `public` (and `graphql_public`).
   The backend doesn't use it, so this is safe and removes the API surface entirely.
2. **Upgrade Postgres** to clear the `vulnerable_postgres_version` advisor:
   *Project Settings → Infrastructure → Upgrade*. Take a backup first.
3. **(Optional) Rotate the anon key:** *Project Settings → API → Rotate*. Harmless
   since it's unused, but tidy if it was ever public.
4. **Restrict the database password / connection** and confirm `DATABASE_URL`
   uses the **pooler** (port 6543) for the app and `DIRECT_URL` the direct port
   (5432) for migrations.

---

## 3. Backend hosting (Render / Railway / Fly / etc.)

- Set env vars (see README): `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET` (generate
  a fresh ≥32-byte secret for prod), `FRONTEND_ORIGIN` (exact deployed frontend
  URL), `NODE_ENV=production`.
- `NODE_ENV=production` automatically: forces `Secure` cookies, disables debug
  routes (`/debug/*`), and rejects a weak `JWT_SECRET`.
- The app already calls `app.set("trust proxy", 1)` — required behind a hosting
  proxy so `Secure` cookies and client IPs work.
- **Cookies across domains:** if frontend and backend are on different domains
  (the usual case), keep the default `COOKIE_SAMESITE=none` (prod default).
  Cross-site cookies require `SameSite=None; Secure`, which the backend sets
  automatically in production. Only set `COOKIE_SAMESITE=lax` if they share a site.
- Start command: `npm start` (runs `node src/server.js`).

## 4. Frontend hosting (Vercel / Netlify / static)

- Build: `npm run build` (output in `frontend/dist`).
- Env: `VITE_API_URL` = the deployed backend URL. **No secrets** — Vite inlines
  all `VITE_` vars into the public bundle.
- Ensure the deployed frontend URL exactly matches the backend `FRONTEND_ORIGIN`.

---

## 5. Real-time strategy comparison (decision: TanStack Query)

| Option | Verdict |
|---|---|
| **TanStack Query polling + optimistic + invalidation** | ✅ **Chosen.** Already implemented, backend-driven, no extra infra, no table exposure. |
| Short polling (manual) | Subset of the above. |
| SSE from Express | Reasonable later upgrade for push; more infra. Not needed now. |
| WebSockets from Express | Overkill for this workload. |
| Supabase Realtime | ❌ Rejected — would require exposing IAM tables to the browser, contradicting the security model. |

---

## 6. Public-demo safety

- All destructive actions are **permission-gated** server-side (no admin bypass);
  RBAC is enforced on every route regardless of what the UI shows.
- Self-service signup creates only a low-privilege `user` (no console access),
  so anonymous visitors can't harm the system.
- Per-role demo users (seed) let reviewers explore each permission level.
- `npx prisma db seed` is **idempotent** (upserts) — safe to re-run to restore
  demo roles/users.
- Consider a separate Supabase project/branch for the public demo so the live
  data is disposable, and/or a scheduled reset that re-runs the seed.

---

## 7. Pre-deployment security checklist

- [ ] Fresh, strong `JWT_SECRET` in production (not the dev value).
- [ ] `NODE_ENV=production` on the backend (debug routes off, Secure cookies on).
- [ ] `FRONTEND_ORIGIN` set to the exact deployed frontend origin (CORS allow-list).
- [ ] `COOKIE_SAMESITE`/`COOKIE_DOMAIN` correct for your domain layout.
- [ ] No `.env` committed; only `.env.example` is in git.
- [ ] No Supabase keys in frontend (`grep -ri "VITE_SUPABASE" frontend/` is empty).
- [ ] RLS enabled on all tables; `anon`/`authenticated` have zero grants.
- [ ] Data API `public` schema un-exposed in the Supabase dashboard.
- [ ] Postgres upgraded (clears the version advisor).
- [ ] `DATABASE_URL` uses the pooler; `DIRECT_URL` only for migrations.
- [ ] Backend behind HTTPS with `trust proxy` (already set).
- [ ] `npm test` (backend) and `npm run build` (frontend) pass.

## 8. Public-hosting checklist

- [ ] Backend deployed, `/health` returns ok.
- [ ] Frontend deployed, `VITE_API_URL` points at the backend.
- [ ] Login works end-to-end in the deployed environment (cookie is sent cross-site).
- [ ] Demo users seeded and documented.
- [ ] Rate limiting active on `/api/auth` (already configured).
