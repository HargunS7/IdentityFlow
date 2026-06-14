# Demo data seed + self-healing reset

Run these in the **Supabase dashboard → SQL Editor**. Run **one section at a
time, top to bottom** (highlight a section and click *Run*). Each section is
self-contained and idempotent — safe to re-run. If a section errors, note which
one and the exact message.

> The `Demo@12345` password and these hashes are **intentionally public**
> sandbox credentials (also shown on the site). They are not secrets.

Verified against the live schema:
`User(email, "passwordHash", username)`, `UserRole(user_id, role_id)`,
`RolePermission("roleId", "permissionId")`, unique indexes on `User.email`,
`UserRole(user_id, role_id)`, `RolePermission(roleId, permissionId)`.

---

## Section 0 — One-time fix: drop a broken trigger on `Role`

If inserting a role fails with
`record "new" has no field "createdAt"`, it's because the `set_timestamp()`
trigger was mistakenly attached to `Role` — but `Role` has no
`createdAt`/`updatedAt` columns (only `User` does). This is unrelated to RLS.
Drop the misapplied trigger (safe — `Role` has no timestamps; the correct
`set_timestamp_user` trigger on `User` is untouched):

```sql
drop trigger if exists set_timestamp_role on public."Role";
```

## Section 1 — Create the scoped `demo` role

> `Role.id` has **no database default** — Prisma's `@default(uuid())` generates
> the id in application code, not in Postgres. So a raw SQL insert must supply
> `id` explicitly. (`Permission`, `RolePermission`, `UserRole`, and `User` use
> DB-level UUID defaults, so their inserts omit `id`.)

```sql
insert into "Role"(id, name) values (gen_random_uuid(), 'demo')
on conflict (name) do nothing;
```

## Section 2 — Give the `demo` role its (non-destructive) permissions

Read access to every console page + the self-expiring JIT flow. No delete /
revoke / role-assign.

```sql
insert into "RolePermission"("roleId","permissionId")
select r.id, p.id
from "Role" r
join "Permission" p
  on p.code in ('USER_READ','SESSION_READ','AUDIT_READ','TEMP_GRANT')
where r.name = 'demo'
on conflict ("roleId","permissionId") do nothing;
```

## Section 3 — Create the `reset_demo()` function

Re-asserts every demo account (password + exactly one role, clears any username
a visitor set) and wipes visitor-created temp grants. This is the single source
of truth used both to seed now and to auto-heal later.

```sql
create or replace function public.reset_demo() returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare r record; uid uuid;
begin
  for r in
    select * from (values
      ('admin@example.com',    'admin',            '$argon2id$v=19$m=65536,t=3,p=4$PEPTxqDFDlzLdHk/pixf/w$V6+PP9zvGo1ju4FXt+pMmufLqIN4ZYm3qCN+72Nvuyo'),
      ('manager@example.com',  'manager',          '$argon2id$v=19$m=65536,t=3,p=4$pb70Gso/qETH3EOaKUjJ+g$9nTYLaO4tMJdHb0SCKGy985IC4ITBfaKjOfwaK7gzPA'),
      ('security@example.com', 'security_analyst', '$argon2id$v=19$m=65536,t=3,p=4$qtDnXEkV/Y5EEHrC4r7tIg$LoWS1Z81fswJdffuAzBXjQTrxdFRwHv3BVlqKtVMJuo'),
      ('auditor@example.com',  'auditor',          '$argon2id$v=19$m=65536,t=3,p=4$Z3/lFiusoNanFqeQoDhROw$CgGcJd0eNUf8Cfi+s58yrVyXIcByWrHa0XTf3jc1dS8'),
      ('user@example.com',     'user',             '$argon2id$v=19$m=65536,t=3,p=4$Qc0/zuETsb2P8Z8kkTmPgQ$SjvXWGwA81p6xxFAL4TPR8lf2U5DE3jkD0Ny/jy/qWY'),
      ('demo@example.com',     'demo',             '$argon2id$v=19$m=65536,t=3,p=4$AbpeXy7RD+VdJ2pIykaRJw$FdA63d+tJyvuCdLke/Ulorw/TYeDO2C5E1//gXbVO3M')
    ) as t(email, role_name, hash)
  loop
    insert into "User"(email, "passwordHash")
    values (r.email, r.hash)
    on conflict (email) do update
      set "passwordHash" = excluded."passwordHash", username = null
    returning id into uid;

    delete from "UserRole" where user_id = uid;
    insert into "UserRole"(user_id, role_id)
    select uid, id from "Role" where name = r.role_name;
  end loop;

  delete from "TempPermissionGrant";
end
$fn$;
```

## Section 4 — Seed the accounts now

```sql
select public.reset_demo();
```

## Section 5 — Verify (expect 6 rows, one role each)

```sql
select u.email, array_agg(r.name) as roles
from "User" u
join "UserRole" ur on ur.user_id = u.id
join "Role" r on r.id = ur.role_id
where u.email like '%@example.com'
group by u.email
order by u.email;
```

After this, all demo logins and the site's "Explore the live demo" button work
with password `Demo@12345`. You can re-run `select public.reset_demo();` any time
to restore the demo to a clean state.

---

## Optional: self-healing schedule (idle-aware auto-reset)

Makes the demo restore itself **only after a period of no activity** — so an
active lesson is never interrupted. "Activity" = the most recent login or
audited action (logins, role changes, session revokes, temp grants/revokes all
write to `AuditLog`). If someone is actively using the demo, the idle clock
keeps resetting and nothing is wiped; the demo only self-heals once it's been
left untouched for the threshold (default 60 min). Runs entirely inside Postgres
(works even while the backend sleeps).

### Section 6 — Enable the scheduler

```sql
create extension if not exists pg_cron;
```

> If this errors with a permissions message, enable **pg_cron** in
> *Supabase Dashboard → Database → Extensions*, then continue.

### Section 7 — Create the idle-aware guard function

Resets **only** if there's been no login/audited activity for `idle_minutes`
(default 60). The manual admin "Reset demo data" button still forces an
immediate reset via `reset_demo()` directly — this guard is just for the timer.

```sql
create or replace function public.reset_demo_if_idle(idle_minutes int default 60)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  la_audit timestamptz;
  la_sess  timestamptz;
  last_activity timestamptz;
begin
  -- AuditLog/Session store UTC in `timestamp without time zone`; cast to tz.
  select max("createdAt") at time zone 'UTC' into la_audit from "AuditLog";
  select max("createdAt") at time zone 'UTC' into la_sess  from "Session";

  last_activity := greatest(
    coalesce(la_audit, 'epoch'::timestamptz),
    coalesce(la_sess,  'epoch'::timestamptz)
  );

  if last_activity < now() - make_interval(mins => idle_minutes) then
    perform public.reset_demo();
  end if;
end
$fn$;
```

### Section 8 — Schedule the idle check

Checks every 15 minutes, but only resets after 60 idle minutes. Safe to re-run
(drops any existing job of the same name first).

```sql
do $do$
begin
  perform cron.unschedule('reset-demo');
exception when others then null;
end
$do$;

select cron.schedule('reset-demo', '*/15 * * * *', $cron$ select public.reset_demo_if_idle(60); $cron$);
```

Tune it: change `60` for a different idle window, or `*/15 * * * *` for how
often it checks (e.g. `*/5 * * * *` to check every 5 minutes).

### Manage / inspect the schedule

```sql
-- See scheduled jobs
select jobid, schedule, command, jobname, active from cron.job;

-- See recent runs (status/errors)
select jobid, status, return_message, start_time
from cron.job_run_details
order by start_time desc
limit 10;

-- Stop auto-reset
select cron.unschedule('reset-demo');
```

---

## Notes
- Visitor **signups** create low-privilege `user` accounts that accumulate
  harmlessly; `reset_demo()` deliberately does not delete them (that would mean
  cascading through their sessions/audit logs). Prune manually if desired.
- The `demo` account can view every page and try the JIT flow, but holds no
  destructive permission, so a one-click public visitor can't break the dataset.
