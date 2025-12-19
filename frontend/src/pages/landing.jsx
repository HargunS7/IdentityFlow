import React from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import AnimatedWrapper from "../components/animatedWrapper.jsx";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

export default function Landing() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  return (
    <AnimatedWrapper>
      <div className="min-h-screen w-full">
        <div className="mx-auto max-w-6xl px-4 pt-14 pb-14">
          {/* HERO */}
          <motion.div
            initial={reduceMotion ? false : "hidden"}
            whileInView={reduceMotion ? undefined : "show"}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ staggerChildren: reduceMotion ? 0 : 0.06 }}
            className={[
              "rounded-3xl border border-white/10 bg-white/5 p-8 md:p-12",
              "backdrop-blur-md md:backdrop-blur-xl",
              "shadow-[0_12px_40px_rgba(0,0,0,0.32)]",
              "will-change-transform",
            ].join(" ")}
          >
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
              Indentity Flow an Interactive IAM Playground 
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="mt-5 text-4xl md:text-6xl font-semibold tracking-tight text-white"
            >
              Learn IAM by using it —
              <span className="text-white/80"> like a real security console</span>.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-4 max-w-3xl text-base md:text-lg text-white/70"
            >
              Identity & Access Management (IAM) is the backbone of modern application security.
              This project teaches IAM fundamentals through a working dashboard where access
              changes live as roles and permissions change.
            </motion.p>

            <motion.p variants={fadeUp} className="mt-3 max-w-3xl text-sm text-white/60">
              Real IAM systems (cloud consoles, enterprise dashboards, internal tools) all answer the
              same questions: <span className="text-white/80">Who are you?</span>{" "}
              <span className="text-white/80">What can you do?</span>{" "}
              <span className="text-white/80">How do we trace actions?</span>
            </motion.p>

            <motion.div variants={fadeUp} className="mt-7 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate("/login")}
                className="rounded-2xl px-5 py-3 text-sm font-semibold text-black bg-white hover:bg-white/90 transition shadow"
              >
                Try the Dashboard
              </button>

              <button
                onClick={() => navigate("/learn")}
                className="rounded-2xl px-5 py-3 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition"
              >
                Learn IAM Concepts
              </button>
            </motion.div>

            {/* Quick highlights */}
            <motion.div variants={fadeUp} className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
              <FeatureCard
                title="Role-Based Access Control"
                desc="Users get roles, roles map to permissions, and routes enforce access checks."
                tag="RBAC"
              />
              <FeatureCard
                title="Audit Logs & Security Visibility"
                desc="Sensitive actions generate an audit trail for tracing activity and incidents."
                tag="Audit"
              />
              <FeatureCard
                title="Temporary Access (JIT)"
                desc="Grant risky permissions for minutes, not forever. Automatically expires."
                tag="JIT"
              />
            </motion.div>
          </motion.div>

          {/* WHY IAM EXISTS */}
          <motion.div
            initial={reduceMotion ? false : "hidden"}
            whileInView={reduceMotion ? undefined : "show"}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ staggerChildren: reduceMotion ? 0 : 0.06 }}
            className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <InfoBlock
              title="Why IAM exists"
              subtitle="Every secure system must answer these:"
              points={[
                "Who is making this request? (Identity)",
                "How do we prove it’s really them? (Authentication)",
                "What are they allowed to do? (Authorization)",
                "How do we trace actions later? (Audit Logging)",
              ]}
            />

            <InfoBlock
              title="What goes wrong without IAM"
              subtitle="Common security failures:"
              points={[
                "Over-privileged accounts (everyone becomes admin).",
                "Permissions tied to users instead of roles (permission sprawl).",
                "No reliable audit trail (hard to investigate incidents).",
                "Long-lived access for risky actions (no JIT).",
              ]}
            />
          </motion.div>

          {/* IAM IN THE REAL WORLD */}
          <div className="mt-10">
            <SectionHeader
              eyebrow="REAL WORLD"
              title="Where IAM shows up in real systems"
              desc="This project mirrors how production systems structure access control — simplified for learning."
            />

            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <MiniCard
                title="Cloud consoles"
                desc="AWS IAM, Azure AD, GCP IAM — roles, policies, audit trails."
                tag="Cloud"
              />
              <MiniCard
                title="Enterprise dashboards"
                desc="Internal tools enforce role checks before admin actions."
                tag="Enterprise"
              />
              <MiniCard
                title="High-trust industries"
                desc="Finance/healthcare rely on logging + least privilege for compliance."
                tag="Compliance"
              />
              <MiniCard
                title="DevOps & infra"
                desc="Access to deployments, secrets, and incidents should be time-bound."
                tag="DevOps"
              />
            </div>
          </div>

          {/* WHAT YOU'LL LEARN */}
          <div className="mt-10">
            <SectionHeader
              eyebrow="OUTCOMES"
              title="What you’ll learn by using this app"
              desc="These are the same skills you’ll need for backend + security interviews."
            />

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <LearnCard
                title="Understand RBAC deeply"
                bullets={[
                  "Roles bundle permissions.",
                  "User’s effective access comes from roles + temp grants.",
                  "Changing a role changes access across the system.",
                ]}
              />
              <LearnCard
                title="See security visibility in action"
                bullets={[
                  "Sensitive actions produce audit logs.",
                  "Sessions can be investigated and revoked.",
                  "Temporary access reduces risk and expires automatically.",
                ]}
              />
            </div>
          </div>

          {/* YOUR MODELS */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoBlock
              title="Explore as a normal user"
              subtitle="Learn what a user can and can’t do:"
              points={[
                "View identity and effective permissions.",
                "See time-bound grants when assigned.",
                "Understand why routes deny access.",
                "Build intuition for least privilege.",
              ]}
            />

            <InfoBlock
              title="Explore as a privileged role"
              subtitle="Experience real console behavior:"
              points={[
                "User + role management (RBAC).",
                "Session visibility and revocation.",
                "Audit trail review and filtering.",
                "JIT temporary access grants.",
              ]}
            />
          </div>

          {/* FOOTER CTA */}
          <div className="mt-12 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md md:backdrop-blur-xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[0_12px_40px_rgba(0,0,0,0.26)]">
            <div>
              <div className="text-xs uppercase tracking-wider text-white/60">Next step</div>
              <h3 className="mt-2 text-xl font-semibold text-white">Want to learn faster?</h3>
              <p className="mt-1 text-sm text-white/70 max-w-2xl">
                Start with the Learn IAM page, then log in and watch your effective permissions change live.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate("/learn")}
                className="rounded-2xl px-5 py-3 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition"
              >
                Learn IAM
              </button>
              <button
                onClick={() => navigate("/login")}
                className="rounded-2xl px-5 py-3 text-sm font-semibold text-black bg-white hover:bg-white/90 transition shadow"
              >
                Login
              </button>
            </div>
          </div>

          {/* Footer line */}
          <div className="mt-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-white/60 text-sm">
            <p>Built as a modular IAM system + educational demo.</p>
            <div className="flex gap-3">
              <button onClick={() => navigate("/learn")} className="hover:text-white transition">
                Learn
              </button>
              <button onClick={() => navigate("/login")} className="hover:text-white transition">
                Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </AnimatedWrapper>
  );
}

/* -------------------- UI pieces -------------------- */

function FeatureCard({ title, desc, tag }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 md:backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-white">{title}</div>
        <span className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10 text-white/70">
          {tag}
        </span>
      </div>
      <p className="mt-2 text-sm text-white/70">{desc}</p>
    </div>
  );
}

function InfoBlock({ title, subtitle, points }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:backdrop-blur-md">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-white/60">{subtitle}</p>}
      <ul className="mt-4 space-y-2 text-sm text-white/70">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2">
            <span className="mtt mt-1 h-2 w-2 rounded-full bg-white/40" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SectionHeader({ eyebrow, title, desc }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8 md:backdrop-blur-md">
      <div className="text-xs uppercase tracking-wider text-white/60">{eyebrow}</div>
      <h2 className="mt-2 text-2xl md:text-3xl font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm md:text-base text-white/70 max-w-4xl">{desc}</p>
    </div>
  );
}

function MiniCard({ title, desc, tag }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">{title}</div>
          <p className="mt-2 text-sm text-white/70">{desc}</p>
        </div>
        <span className="shrink-0 text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10 text-white/70">
          {tag}
        </span>
      </div>
    </div>
  );
}

function LearnCard({ title, bullets }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="text-base font-semibold text-white">{title}</div>
      <ul className="mt-3 space-y-2 text-sm text-white/70">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-white/40" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
