import React from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";

import { AnimatedFlow } from "../components/flows.jsx";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

// The five core IAM processes, each as an animated, self-playing flow.
const FLOWS = [
  {
    id: "authentication",
    eyebrow: "01 · AUTHENTICATION",
    heading: "How logging in works",
    blurb: "Proving who you are. The system never trusts a request until identity is verified and a session exists.",
    tone: "ok",
    note: "Your password is never stored — only an Argon2id hash. The proof of identity you carry afterwards is a short-lived JWT inside an httpOnly cookie the browser can't read from JavaScript.",
    steps: [
      { label: "Submit credentials", detail: "Email/username + password sent over HTTPS." },
      { label: "Verify password", detail: "Argon2id hash compared — no plaintext stored." },
      { label: "Create session", detail: "A Session row is created (active = true)." },
      { label: "Issue cookie", detail: "JWT with {user id, session id} set httpOnly." },
      { label: "Access granted", detail: "Dashboard loads for the authenticated user." },
    ],
  },
  {
    id: "authorization",
    eyebrow: "02 · AUTHORIZATION",
    heading: "How access is decided",
    blurb: "Being logged in is not the same as being allowed. Every protected request is checked again.",
    tone: "ok",
    note: "Authentication answers “who are you?”; authorization answers “are you allowed?”. If the required permission is missing, the request short-circuits with 403 before any work happens.",
    steps: [
      { label: "Request resource", detail: "e.g. GET /api/admin/users with the cookie." },
      { label: "Check session", detail: "Is the session still active? If revoked → 401." },
      { label: "Load roles", detail: "Resolve the user's roles from the database." },
      { label: "Resolve permissions", detail: "Role perms ∪ active temporary grants." },
      { label: "Grant or deny", detail: "Has the required permission? else 403." },
      { label: "Write audit log", detail: "The action + actor are recorded." },
    ],
  },
  {
    id: "rbac",
    eyebrow: "03 · RBAC",
    heading: "Role-Based Access Control",
    blurb: "Users don't get permissions directly — they get roles, and roles bundle permissions. That's what makes access scale.",
    tone: "ok",
    note: "Change one role and every user with it instantly gains or loses capabilities — far safer than editing permissions per person. One role change, many users updated.",
    steps: [
      { label: "User", detail: "alice@example.com" },
      { label: "Role", detail: "e.g. security_analyst" },
      { label: "Permissions", detail: "AUDIT_READ, SESSION_READ…" },
      { label: "Protected route", detail: "requirePerms() lets the call through." },
    ],
  },
  {
    id: "temporary-access",
    eyebrow: "04 · JUST-IN-TIME ACCESS",
    heading: "Temporary access that expires itself",
    blurb: "Standing privilege is risky. JIT access grants a permission for minutes, then removes it automatically.",
    tone: "ok",
    note: "Nobody has to remember to revoke it. When the timer ends, the permission simply stops counting toward the effective set — and both the grant and its expiry are in the audit log.",
    steps: [
      { label: "Admin grants", detail: "Permission X to user for N minutes, with a reason." },
      { label: "Permission active", detail: "Added to the user's effective permissions." },
      { label: "User acts", detail: "They can now use the gated feature." },
      { label: "Timer expires", detail: "expiresAt passes — no cleanup needed." },
      { label: "Access removed", detail: "Effective set shrinks back automatically." },
    ],
  },
  {
    id: "session-revoke",
    eyebrow: "05 · SESSIONS",
    heading: "Revoking a session, instantly",
    blurb: "A JWT that 'just expires in an hour' can't be turned off. A session can.",
    tone: "deny",
    note: "Because the backend re-checks the session on every request, revocation takes effect on the very next call — there's no waiting for the token to expire. That's the off-switch.",
    steps: [
      { label: "Admin revokes", detail: "Session.active is flipped to false." },
      { label: "Session inactive", detail: "The row no longer authorizes requests." },
      { label: "Next request", detail: "Middleware sees inactive session → 401." },
      { label: "Access lost", detail: "The user is effectively logged out everywhere." },
      { label: "Audit updated", detail: "The revoke is recorded with actor + target." },
    ],
  },
];

export default function Concepts() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  return (
    <div className="mx-auto max-w-6xl px-4 pt-12 pb-20">
      {/* Header */}
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
          Interactive concepts · Watch each flow play
        </motion.div>
        <motion.h1
          variants={fadeUp}
          className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight text-white"
        >
          IAM, one flow at a time.
        </motion.h1>
        <motion.p
          variants={fadeUp}
          className="mt-4 max-w-3xl text-white/70 leading-relaxed"
        >
          Five short, animated walkthroughs of the processes that make up this
          system. Each one plays automatically — hit{" "}
          <span className="text-white">↻ Replay</span> to watch again. Every flow
          maps to something you can do live in the app.
        </motion.p>

        {/* Jump links */}
        <motion.div variants={fadeUp} className="mt-6 flex flex-wrap gap-2">
          {FLOWS.map((f) => (
            <a
              key={f.id}
              href={`#${f.id}`}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/75 hover:bg-white/10 transition"
            >
              {f.heading}
            </a>
          ))}
        </motion.div>
      </motion.div>

      {/* Flows */}
      <div className="mt-10 space-y-10">
        {FLOWS.map((f) => (
          <section key={f.id} id={f.id} className="scroll-mt-24">
            <div className="mb-3">
              <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">
                {f.eyebrow}
              </div>
              <h2 className="mt-1 text-2xl md:text-3xl font-semibold tracking-tight text-white">
                {f.heading}
              </h2>
              <p className="mt-1.5 text-sm md:text-base text-white/65 max-w-3xl leading-relaxed">
                {f.blurb}
              </p>
            </div>
            <AnimatedFlow
              title={f.heading}
              steps={f.steps}
              note={f.note}
              tone={f.tone}
            />
          </section>
        ))}
      </div>

      {/* CTA */}
      <section className="mt-12">
        <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div>
            <h3 className="text-xl font-semibold text-white">
              Now do it for real
            </h3>
            <p className="mt-1 text-sm text-white/65 max-w-2xl">
              Sign in (demo password <span className="font-mono text-white">Demo@12345</span>),
              grant yourself a temporary permission, and watch these flows happen
              live in the console.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate("/learn")}
              className="rounded-2xl px-5 py-3 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition"
            >
              Read the primer
            </button>
            <button
              onClick={() => navigate("/login")}
              className="rounded-2xl px-5 py-3 text-sm font-semibold text-black bg-white hover:bg-white/90 transition shadow"
            >
              Try the live demo →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
