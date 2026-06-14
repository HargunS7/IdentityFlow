import React from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function Landing() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  return (
    <div className="min-h-screen w-full">
      <div className="mx-auto max-w-6xl px-4 pt-12 pb-20">
        {/* HERO */}
        <motion.div
          initial={reduce ? false : "hidden"}
          animate="show"
          transition={{ staggerChildren: reduce ? 0 : 0.08 }}
          className="rounded-[28px] border border-white/10 bg-white/[0.04] backdrop-blur-xl p-8 md:p-12 shadow-[0_30px_80px_rgba(0,0,0,0.4)] relative overflow-hidden"
        >
          {/* Decorative orbs */}
          <div className="pointer-events-none absolute -top-32 -right-24 h-72 w-72 rounded-full bg-fuchsia-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400/80 animate-pulse" />
            IdentityFlow · Interactive IAM playground
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mt-5 text-4xl md:text-6xl font-semibold tracking-tight text-white"
          >
            Learn IAM by{" "}
            <span className="bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent">
              actually using it
            </span>
            .
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-3xl text-base md:text-lg text-white/70 leading-relaxed"
          >
            Identity & Access Management is the backbone of every secure system.
            This is a working dashboard that lets you{" "}
            <span className="text-white">see roles, permissions, sessions, audit logs,</span> and{" "}
            <span className="text-white">just-in-time access</span> change in real time as you use them.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-7 flex flex-col sm:flex-row gap-3"
          >
            <button
              onClick={() => navigate("/login")}
              className="rounded-2xl px-5 py-3 text-sm font-semibold text-black bg-white hover:bg-white/90 transition shadow-[0_10px_30px_rgba(255,255,255,0.2)]"
            >
              Open the dashboard →
            </button>
            <button
              onClick={() => navigate("/learn")}
              className="rounded-2xl px-5 py-3 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition"
            >
              Read the IAM primer
            </button>
            <button
              onClick={() => navigate("/concepts")}
              className="rounded-2xl px-5 py-3 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition"
            >
              Watch IAM flows
            </button>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <FeatureCard
              tag="RBAC"
              title="Role-Based Access Control"
              desc="Users get roles, roles map to permissions, and every protected route enforces the check before running."
            />
            <FeatureCard
              tag="Audit"
              title="Security visibility"
              desc="Every sensitive action is logged with actor, target, IP, and metadata for investigation and compliance."
            />
            <FeatureCard
              tag="JIT"
              title="Just-in-time access"
              desc="Grant a risky permission for minutes, not forever. Expiry is automatic — no cleanup needed."
            />
          </motion.div>
        </motion.div>

        {/* WHO IT'S FOR */}
        <section className="mt-14">
          <SectionHeader
            eyebrow="WHO IT'S FOR"
            title="One live system, four kinds of learner"
            desc="This isn't a slideshow — it's a working IAM system you can poke at. Here's how each person gets value."
          />
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AudienceCard
              tag="Students"
              title="Learn by doing"
              desc="Explore auth, RBAC, sessions, audit logs, and JIT access, and watch each flow happen in real time as you click."
            />
            <AudienceCard
              tag="Teachers"
              title="Demo live in class"
              desc="Assign a role, revoke a session, or grant 5-minute access in front of students and show the effect instantly."
            />
            <AudienceCard
              tag="Recruiters"
              title="See real depth"
              desc="A custom auth + RBAC system with sessions, audit logging, and least-privilege design — not a tutorial clone."
            />
            <AudienceCard
              tag="Developers"
              title="Reference design"
              desc="A clean Express + Prisma implementation: httpOnly-cookie JWTs, session-aware auth, permission-gated routes."
            />
          </div>

          {/* Demo credentials callout */}
          <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-emerald-300/80">
                  Try it instantly
                </div>
                <p className="mt-1 text-sm text-white/75 leading-relaxed">
                  Log in as different roles to see RBAC change what the console
                  exposes. All demo accounts use the password{" "}
                  <span className="font-mono text-white">Demo@12345</span>.
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {[
                    "admin@example.com",
                    "manager@example.com",
                    "security@example.com",
                    "auditor@example.com",
                    "user@example.com",
                  ].map((e) => (
                    <span
                      key={e}
                      className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-white/75 font-mono"
                    >
                      {e}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => navigate("/login")}
                className="shrink-0 rounded-2xl px-5 py-3 text-sm font-semibold text-black bg-white hover:bg-white/90 transition shadow"
              >
                Log in as a demo user →
              </button>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS — visual flow */}
        <section className="mt-14">
          <SectionHeader
            eyebrow="HOW IT WORKS"
            title="The path of every protected request"
            desc="Identity, authentication, authorization, and audit — wired end-to-end."
          />
          <div className="mt-6">
            <FlowDiagram />
          </div>
        </section>

        {/* CORE CONCEPTS */}
        <section className="mt-14">
          <SectionHeader
            eyebrow="THE FUNDAMENTALS"
            title="Four questions every secure system must answer"
            desc="These are the same questions AWS IAM, Azure AD, and every internal admin tool is built around."
          />

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <QuestionCard
              n="01"
              question="Who is making this request?"
              answer="Identity"
              body="Every action is tied to a user. The system needs a stable identifier (id, email) and attributes (MFA, createdAt) to reason about access."
              keyword="IDENTITY"
            />
            <QuestionCard
              n="02"
              question="How do we prove it's really them?"
              answer="Authentication"
              body="Login flow + token issuance. In this project, you log in with a password and receive an httpOnly JWT cookie. The cookie proves identity to every protected route."
              keyword="AUTHENTICATION"
            />
            <QuestionCard
              n="03"
              question="What are they allowed to do?"
              answer="Authorization"
              body="A user's roles unlock permission codes (USER_READ, SESSION_REVOKE). Routes enforce required permissions before running — even temporary grants are honored."
              keyword="AUTHORIZATION"
            />
            <QuestionCard
              n="04"
              question="How do we trace it later?"
              answer="Audit logging"
              body="Sensitive actions append to an immutable audit log with actor, target, action, IP, user-agent, and metadata. Critical for incident response and compliance."
              keyword="AUDIT"
            />
          </div>
        </section>

        {/* REAL WORLD */}
        <section className="mt-14">
          <SectionHeader
            eyebrow="WHERE THIS LIVES"
            title="Where IAM shows up in real systems"
            desc="This project is simplified for learning, but the model maps directly to production tools."
          />

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MiniCard
              tag="Cloud"
              title="Cloud consoles"
              desc="AWS IAM, Azure AD, GCP IAM — roles, policies, and audit trails."
            />
            <MiniCard
              tag="SaaS"
              title="Enterprise dashboards"
              desc="Internal admin tools enforce per-permission checks before any privileged action."
            />
            <MiniCard
              tag="Compliance"
              title="High-trust industries"
              desc="Finance and healthcare rely on audit logs + least privilege to satisfy auditors."
            />
            <MiniCard
              tag="DevOps"
              title="Infrastructure access"
              desc="Production access, secrets, and runbooks are time-bound — JIT is the default."
            />
          </div>
        </section>

        {/* OUTCOMES */}
        <section className="mt-14">
          <SectionHeader
            eyebrow="WHAT YOU'LL LEARN"
            title="Skills you can put on your résumé"
            desc="These map directly to backend, security, and platform-engineering interview topics."
          />

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <LearnCard
              title="Understand RBAC deeply"
              bullets={[
                "How roles bundle permissions and why that scales better than per-user grants.",
                "How a single role change instantly shifts what a user can do.",
                "How temporary grants compose with permanent ones (least privilege, JIT).",
              ]}
            />
            <LearnCard
              title="See security visibility in action"
              bullets={[
                "How sensitive actions produce audit logs you can investigate.",
                "How session lookup + revocation work, and why JWT-only ≠ logout.",
                "How time-bound access dramatically reduces blast radius.",
              ]}
            />
          </div>
        </section>

        {/* CTA */}
        <section className="mt-14">
          <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-xl p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-[0_18px_55px_rgba(0,0,0,0.35)]">
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-white/50">
                Try it
              </div>
              <h3 className="mt-1 text-2xl md:text-3xl font-semibold text-white">
                Watch permissions change live.
              </h3>
              <p className="mt-2 text-sm md:text-base text-white/70 max-w-2xl">
                Sign in, grant yourself a temporary permission, and see the admin
                console unlock new modules in real time.
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
                Try the dashboard
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-white/55 text-xs">
          <p>
            Built as a modular IAM demo · Prisma · React · Tailwind ·
            httpOnly cookies · session-aware JWTs
          </p>
          <div className="flex gap-4">
            <button onClick={() => navigate("/learn")} className="hover:text-white transition">
              Learn
            </button>
            <button onClick={() => navigate("/concepts")} className="hover:text-white transition">
              Concepts
            </button>
            <button onClick={() => navigate("/login")} className="hover:text-white transition">
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------- UI pieces -------------------- */

function FeatureCard({ tag, title, desc }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-white">{title}</div>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-white/70">
          {tag}
        </span>
      </div>
      <p className="mt-2 text-sm text-white/70 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function AudienceCard({ tag, title, desc }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md flex flex-col"
    >
      <span className="self-start text-[11px] px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-white/70">
        {tag}
      </span>
      <div className="mt-3 text-sm font-semibold text-white">{title}</div>
      <p className="mt-1.5 text-sm text-white/70 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

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
        <p className="mt-2 text-sm md:text-base text-white/65 max-w-3xl">{desc}</p>
      )}
    </div>
  );
}

function MiniCard({ tag, title, desc }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/[0.07]">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-semibold text-white">{title}</div>
        <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-white/70">
          {tag}
        </span>
      </div>
      <p className="mt-2 text-sm text-white/70 leading-relaxed">{desc}</p>
    </div>
  );
}

function LearnCard({ title, bullets }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="text-base font-semibold text-white">{title}</div>
      <ul className="mt-3 space-y-2.5 text-sm text-white/70">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2.5">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-white/50" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function QuestionCard({ n, question, answer, body, keyword }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
    >
      <div className="flex items-center gap-3">
        <div className="text-[11px] font-mono text-white/40">{n}</div>
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60 tracking-wider">
          {keyword}
        </span>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-white">{question}</h3>
      <div className="mt-1 text-sm text-white/55">
        Answer: <span className="text-white/85">{answer}</span>
      </div>
      <p className="mt-3 text-sm text-white/70 leading-relaxed">{body}</p>
    </motion.div>
  );
}

function FlowDiagram() {
  const steps = [
    { label: "Login", sub: "POST /api/auth/login" },
    { label: "JWT issued", sub: "httpOnly cookie + sid" },
    { label: "Request", sub: "with cookie attached" },
    { label: "Verify", sub: "user + session active" },
    { label: "Authorize", sub: "role/permission gate" },
    { label: "Audit", sub: "log actor + action" },
  ];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {steps.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-3"
          >
            <div className="text-[11px] text-white/45 font-mono">
              {String(i + 1).padStart(2, "0")}
            </div>
            <div className="mt-1 text-sm font-semibold text-white">
              {s.label}
            </div>
            <div className="text-[11px] text-white/55 mt-0.5">{s.sub}</div>
            {i < steps.length - 1 && (
              <div className="hidden md:block absolute right-[-10px] top-1/2 -translate-y-1/2 text-white/25">
                →
              </div>
            )}
          </motion.div>
        ))}
      </div>
      <div className="mt-4 text-xs text-white/55">
        Any failure short-circuits the request with a 401/403 and the next
        request restarts from step 3. Revoking a session immediately breaks
        step 4 — no waiting for the JWT to expire.
      </div>
    </div>
  );
}
