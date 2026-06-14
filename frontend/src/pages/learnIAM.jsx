import React from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";
import { ROLES } from "../utils/permissions.js";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

export default function LearnIAM() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const { user, roles, permissions } = useAuth();
  const isAuthed = !!user;
  const isAdmin = roles?.includes(ROLES.ADMIN);

  const combined = permissions?.combined || [];
  const safePerms = Array.isArray(combined) ? combined : [];

  return (
    <div className="mx-auto max-w-6xl px-4 pt-12 pb-20">
      {/* HEADER */}
      <motion.div
        initial={reduce ? false : "hidden"}
        animate="show"
        transition={{ staggerChildren: reduce ? 0 : 0.08 }}
        className="rounded-[28px] border border-white/10 bg-white/[0.04] backdrop-blur-xl p-8 md:p-12"
      >
        <motion.div
          variants={fadeUp}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
        >
          IAM Primer · Free read
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight text-white"
        >
          Identity & Access Management,{" "}
          <span className="text-white/80">explained simply.</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mt-4 max-w-3xl text-white/70 leading-relaxed"
        >
          A short, opinionated tour of IAM — what it is, why it exists, and how
          this project implements every piece. Every concept here is wired to a
          page you can open in the dashboard.
        </motion.p>

        <motion.div variants={fadeUp} className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => navigate(isAuthed ? "/dashboard" : "/login")}
            className="rounded-2xl px-5 py-3 text-sm font-semibold text-black bg-white hover:bg-white/90 transition shadow"
          >
            {isAuthed ? "Open dashboard" : "Sign in to try it"}
          </button>
          <button
            onClick={() => navigate("/concepts")}
            className="rounded-2xl px-5 py-3 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition"
          >
            Watch animated flows
          </button>
          <button
            onClick={() => navigate("/")}
            className="rounded-2xl px-5 py-3 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition"
          >
            Back to home
          </button>
        </motion.div>
      </motion.div>

      {/* LIVE PREVIEW */}
      {isAuthed && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">
                Your live access
              </div>
              <div className="mt-1 text-lg font-semibold text-white">
                Signed in as {user?.username || user?.email}
              </div>
              <div className="mt-1 text-sm text-white/65">
                Role:{" "}
                <span className="text-white">
                  {roles?.length ? roles.join(", ") : "none"}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate("/account")}
              className="rounded-2xl px-4 py-2 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition"
            >
              View account
            </button>
          </div>

          {!!safePerms.length && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {safePerms.slice(0, 12).map((p) => (
                <span
                  key={p}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-white/75"
                >
                  {p}
                </span>
              ))}
              {safePerms.length > 12 && (
                <span className="text-[11px] text-white/55 self-center">
                  +{safePerms.length - 12} more
                </span>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* WHAT IS IAM */}
      <section className="mt-12">
        <SectionHeader
          eyebrow="01 · CORE IDEA"
          title="What is IAM, really?"
        />
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card title="Identity">
            Who is the actor making this request? In this app, every action is
            tied to a <span className="text-white">User</span> with a stable id,
            email, and (optionally) username.
          </Card>
          <Card title="Access">
            What can that actor do? Driven by{" "}
            <span className="text-white">roles</span> (which bundle permissions)
            and time-bound{" "}
            <span className="text-white">temporary grants</span>.
          </Card>
          <Card title="Visibility">
            Who did what, when? Every sensitive action lands in the audit log
            with actor, IP, and metadata.
          </Card>
        </div>
      </section>

      {/* AUTH vs AUTHZ */}
      <section className="mt-14">
        <SectionHeader
          eyebrow="02 · COMMON CONFUSION"
          title="Authentication vs authorization"
          desc="These are different stages of the same request — and both can fail independently."
        />

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card title="Authentication (AuthN)" eyebrow="Are you who you say you are?">
            <p className="text-sm text-white/70 leading-relaxed">
              You prove identity by logging in with a password. The backend
              hashes with Argon2id, verifies, then issues a JWT inside an{" "}
              <span className="text-white">httpOnly cookie</span>. The cookie
              embeds your <span className="text-white">user id</span> and{" "}
              <span className="text-white">session id</span>.
            </p>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-xs font-mono text-white/65">
              POST /api/auth/login<br />
              → Set-Cookie: access_token (HttpOnly)
            </div>
          </Card>

          <Card title="Authorization (AuthZ)" eyebrow="Are you allowed to do this?">
            <p className="text-sm text-white/70 leading-relaxed">
              On every protected request, the backend loads your roles +
              permissions + active temporary grants. The route declares which
              permission it needs; the middleware short-circuits with{" "}
              <span className="text-white">403</span> if you don't have it.
            </p>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-xs font-mono text-white/65">
              GET /api/admin/users<br />
              → requirePerms(USER_READ)
            </div>
          </Card>
        </div>
      </section>

      {/* RBAC */}
      <section className="mt-14">
        <SectionHeader
          eyebrow="03 · MODEL"
          title="RBAC — Role-Based Access Control"
          desc="The shape of permissions in this app. Three layers, one effective set."
        />

        <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <RbacBox
              n="User"
              chips={["admin@example.com"]}
              hint="A person or service account."
            />
            <RbacBox
              n="Role"
              chips={["admin", "manager", "auditor"]}
              hint="A group of permissions bundled by job function."
            />
            <RbacBox
              n="Permission"
              chips={["USER_READ", "SESSION_REVOKE", "AUDIT_READ"]}
              hint="An atomic, checkable capability."
            />
          </div>

          <div className="mt-6 text-sm text-white/65 leading-relaxed">
            <span className="text-white">Effective permissions</span> ={" "}
            permissions from your roles{" "}
            <span className="text-white/80">∪</span> active temporary grants.
            Routes check the effective set — if anything in that union matches
            the required permission, the call goes through.
          </div>
        </div>
      </section>

      {/* JIT */}
      <section className="mt-14">
        <SectionHeader
          eyebrow="04 · BEST PRACTICE"
          title="Temporary / just-in-time access"
          desc="Long-lived privilege is the enemy of secure systems. JIT replaces it."
        />

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card title="The problem">
            Most breaches don't start with a brand-new attack — they start with
            an over-privileged account that should have lost access months ago.
            Permanent admin = permanent blast radius.
          </Card>
          <Card title="The fix">
            Grant a permission for a short window (1–30 minutes in this app),
            with a reason, granted by another user. The grant{" "}
            <span className="text-white">expires automatically</span>, and the
            grant + revoke are both audited.
          </Card>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="text-sm font-semibold text-white">In this app</div>
          <p className="mt-2 text-sm text-white/70 leading-relaxed">
            Go to <span className="text-white">/admin/temp-access</span>, grant
            yourself <span className="font-mono text-white/80">SESSION_REVOKE</span>{" "}
            for 5 minutes with a reason like “investigating user X”, then refresh
            your dashboard. The Sessions tab unlocks. Five minutes later, it locks
            itself again. No cleanup, no forgotten access.
          </p>
        </div>
      </section>

      {/* SESSIONS */}
      <section className="mt-14">
        <SectionHeader
          eyebrow="05 · SECURITY"
          title="Why session management matters"
          desc="A JWT that 'just expires in an hour' is not enough. You need an off-switch."
        />

        <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
          <p className="text-sm text-white/70 leading-relaxed">
            Every login creates a <span className="text-white">Session row</span>{" "}
            with active = true, an IP, and a user-agent. The JWT carries that
            session id. On every protected request, the auth middleware checks
            that the session row still says active.{" "}
            <span className="text-white">
              Revoking a session takes effect on the very next request — no
              waiting for the JWT to expire.
            </span>
          </p>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-white/65">
            <SessionStep n="1" label="Login" body="Create Session row, sign JWT with sid." />
            <SessionStep n="2" label="Verify" body="Look up sid → active === true?" />
            <SessionStep n="3" label="Revoke" body="Flip active = false. Done." />
          </div>
        </div>
      </section>

      {/* AUDIT */}
      <section className="mt-14">
        <SectionHeader
          eyebrow="06 · TRACEABILITY"
          title="Why audit logs matter"
          desc="If you can't explain what happened, you can't fix what's broken."
        />

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card title="What gets logged">
            Login, signup, role assign/remove, user create/update/delete,
            session revoke, temporary grant + revoke. Each entry stores
            actor id, target id, action, IP, user agent, and a JSON{" "}
            <span className="text-white">meta</span> blob.
          </Card>
          <Card title="Why it matters">
            Audit logs power incident response, compliance evidence (SOC2,
            HIPAA, ISO 27001), and internal investigations.{" "}
            <span className="text-white">Append-only</span> is the default — you
            never delete entries.
          </Card>
        </div>
      </section>

      {/* CONCEPT-TO-PAGE MAP */}
      <section className="mt-14">
        <SectionHeader
          eyebrow="07 · MAP TO THE APP"
          title="Where each concept lives"
        />

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <ConceptLink
            title="Identity & RBAC"
            badge="USER_READ"
            to="/admin/users"
            disabled={!isAuthed}
            desc="See every user, their roles, and (if you have ROLE_ASSIGN) change them."
            onNavigate={navigate}
          />
          <ConceptLink
            title="Sessions"
            badge="SESSION_READ"
            to="/admin/sessions"
            disabled={!isAuthed}
            desc="Inspect active sessions per user; revoke a suspicious one and watch it disappear from the user's next request."
            onNavigate={navigate}
          />
          <ConceptLink
            title="Audit Logs"
            badge="AUDIT_READ"
            to="/admin/audit-logs"
            disabled={!isAuthed}
            desc="Filter by user or action. Click a row to see the full meta JSON."
            onNavigate={navigate}
          />
          <ConceptLink
            title="Temporary Access"
            badge="TEMP_GRANT"
            to="/admin/temp-access"
            disabled={!isAuthed}
            desc="Grant a permission for 1–30 minutes with a reason. Watch it expire on the dashboard automatically."
            onNavigate={navigate}
          />
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="mt-14">
        <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div>
            <h3 className="text-xl font-semibold text-white">
              Ready to see it run?
            </h3>
            <p className="mt-1 text-sm text-white/65 max-w-2xl">
              {isAuthed
                ? "Jump back to the dashboard and try granting yourself a temporary permission."
                : "Sign in and walk through every concept on this page in 5 minutes."}
            </p>
          </div>
          <button
            onClick={() => navigate(isAuthed ? "/dashboard" : "/login")}
            className="rounded-2xl px-5 py-3 text-sm font-semibold text-black bg-white hover:bg-white/90 transition shadow"
          >
            {isAuthed ? "Go to dashboard" : "Sign in"}
          </button>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------- Small UI ------------------------------- */

function SectionHeader({ eyebrow, title, desc }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">
        {eyebrow}
      </div>
      <h2 className="mt-1 text-2xl md:text-3xl font-semibold tracking-tight text-white">
        {title}
      </h2>
      {desc && (
        <p className="mt-2 text-sm md:text-base text-white/65 max-w-3xl leading-relaxed">
          {desc}
        </p>
      )}
    </div>
  );
}

function Card({ title, eyebrow, children }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-6"
    >
      {eyebrow && (
        <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">
          {eyebrow}
        </div>
      )}
      <div className="text-base font-semibold text-white">{title}</div>
      <div className="mt-2 text-sm text-white/70 leading-relaxed">{children}</div>
    </motion.div>
  );
}

function RbacBox({ n, chips, hint }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">
        {n}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <span
            key={c}
            className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-white/80 font-mono"
          >
            {c}
          </span>
        ))}
      </div>
      <div className="mt-3 text-xs text-white/55">{hint}</div>
    </div>
  );
}

function SessionStep({ n, label, body }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <div className="text-[11px] font-mono text-white/45">{n}</div>
      <div className="mt-1 text-sm font-semibold text-white">{label}</div>
      <div className="mt-1 text-xs text-white/60 leading-relaxed">{body}</div>
    </div>
  );
}

function ConceptLink({ title, badge, to, desc, onNavigate, disabled }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 flex flex-col"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold text-white">{title}</div>
          <span className="mt-1 inline-block text-[10px] px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-white/65 font-mono">
            {badge}
          </span>
        </div>
      </div>
      <p className="mt-3 text-sm text-white/70 leading-relaxed flex-1">
        {desc}
      </p>
      <div className="mt-4">
        <button
          onClick={() => onNavigate(disabled ? "/login" : to)}
          className="rounded-xl px-3 py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition"
        >
          {disabled ? "Sign in to open" : "Open page →"}
        </button>
      </div>
    </motion.div>
  );
}
