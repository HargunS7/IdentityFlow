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

## 3. Backend on Render (free tier)

A `render.yaml` blueprint is included. Either use it (Render → New → Blueprint →
this repo) or create a Web Service manually with:

- **Root directory:** `backend`
- **Build command:** `npm install && npx prisma generate`
- **Start command:** `npm start`
- **Health check path:** `/health`
- **Env vars** (dashboard, never committed): `DATABASE_URL` (Supabase **pooled**,
  port 6543), `DIRECT_URL` (port 5432), `JWT_SECRET` (fresh ≥32-byte random),
  `FRONTEND_ORIGIN` (exact Vercel URL), `NODE_ENV=production`. `PORT` is injected
  by Render — don't set it.

What `NODE_ENV=production` buys you automatically: `Secure` cookies, debug routes
(`/debug/*`) disabled, and a weak `JWT_SECRET` rejected at boot. `trust proxy` is
already set, so Secure cookies and client IPs work behind Render's proxy.

**Cookies across domains:** Vercel (`*.vercel.app`) and Render (`*.onrender.com`)
are different domains, so the browser only sends the auth cookie if it's
`SameSite=None; Secure` — which the backend sets automatically in production. No
action needed; just don't override `COOKIE_SAMESITE` to `lax`.

### Keeping the free instance awake (uptime pinger)
Render's free tier spins down after ~15 min idle; the next request then pays a
~50s cold start. To avoid that:

- Point an uptime monitor (UptimeRobot, cron-job.org, BetterStack…) at
  `https://<your-api>.onrender.com/health` on a **~10-minute** interval.
- `/health` is a cheap JSON endpoint built for exactly this.
- One always-on free service fits within Render's 750 instance-hours/month
  (a month is ~730h), so a single backend stays free.

⚠️ **Cold-start vs. request timeout:** the frontend's axios timeout is **15s**
(`frontend/src/utils/api.js`). If a *cold* backend is hit (pinger lapsed, or right
after a deploy), the first login can exceed 15s and fail with a confusing error.
The uptime pinger is the real fix. If you want a safety margin for the very first
visitor, bump that `timeout` to ~30000.

## 4. Frontend on Vercel

A `frontend/vercel.json` is included (framework `vite`, output `dist`, and an SPA
rewrite so deep links like `/concepts` or `/admin` don't 404 on refresh).

- **Root directory:** `frontend` (set this in the Vercel project settings).
- **Env var:** `VITE_API_URL` = your Render backend URL
  (`https://<your-api>.onrender.com`). **No secrets** — Vite inlines every
  `VITE_` var into the public bundle.
- After the first deploy, copy the Vercel production URL into the backend's
  `FRONTEND_ORIGIN` and redeploy the backend.

⚠️ **Vercel preview URLs + CORS:** the backend allows a *single* exact origin
(`FRONTEND_ORIGIN`). Vercel preview deployments get unique URLs, so auth won't
work from a preview — test login on the **production** Vercel URL (or extend the
CORS config to allow a list/regex of origins if you need previews to log in).

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

- [ ] Backend deployed on Render, `/health` returns ok.
- [ ] Frontend deployed on Vercel, `VITE_API_URL` points at the Render backend.
- [ ] Backend `FRONTEND_ORIGIN` set to the exact Vercel production URL (then redeploy).
- [ ] Uptime monitor pinging `/health` every ~10 min (keeps the free instance warm).
- [ ] Login works end-to-end on the **production** Vercel URL (cookie sent cross-site).
- [ ] Deep-link refresh works (e.g. open `/concepts` directly) — confirms the SPA rewrite.
- [ ] Demo users seeded and documented.
- [ ] Rate limiting active on `/api/auth` (already configured).
