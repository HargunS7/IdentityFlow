// src/pages/LearnIAM.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import AnimatedWrapper from "../components/animatedWrapper.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

export default function LearnIAM() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { user } = useAuth();

  const isAuthed = !!user;

  // Smart targets
  const dashboardTarget = isAuthed ? "/dashboard" : "/login";
  const loginTarget = isAuthed ? "/dashboard" : "/login";
  const signupTarget = isAuthed ? "/dashboard" : "/signup";

  return (
    <AnimatedWrapper>
      <div className="mx-auto max-w-6xl px-4 pt-14 pb-16">
        {/* Header */}
        <motion.div
          initial={reduceMotion ? false : "hidden"}
          animate={reduceMotion ? undefined : "show"}
          transition={{ staggerChildren: reduceMotion ? 0 : 0.08 }}
          className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 md:p-12"
        >
          <motion.div variants={fadeUp} className="flex items-center justify-between gap-3">
            <div className="text-xs uppercase tracking-wider text-white/60">Learn IAM</div>

            {isAuthed && (
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
                Signed in as <span className="text-white">{user?.username || user?.email || "user"}</span>
              </div>
            )}
          </motion.div>

          <motion.h1 variants={fadeUp} className="mt-3 text-4xl md:text-5xl font-semibold text-white">
            Identity & Access Management — explained simply.
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-4 max-w-3xl text-white/70">
            IAM is how systems decide <span className="text-white">who</span> you are,{" "}
            <span className="text-white">what</span> you can do, and{" "}
            <span className="text-white">how</span> actions are tracked for security. Below are the core
            building blocks — and how they show up in this project.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-7 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate(dashboardTarget)}
              className="rounded-2xl px-5 py-3 text-sm font-semibold text-black bg-white hover:bg-white/90 transition shadow"
            >
              Open Dashboard
            </button>

            <button
              onClick={() => navigate("/")}
              className="rounded-2xl px-5 py-3 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition"
            >
              Back to Home
            </button>

            {!isAuthed && (
              <button
                onClick={() => navigate(signupTarget)}
                className="rounded-2xl px-5 py-3 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition"
              >
                Create account
              </button>
            )}
          </motion.div>
        </motion.div>

        {/* Content grid */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          <ConceptCard
            title="Identity"
            subtitle="Who is the user?"
            body="Identity is the user account and its attributes (email, username, MFA enabled, createdAt). Every decision starts with identifying the actor."
            actions={[
              { label: isAuthed ? "See your profile" : "See your profile (login)", to: isAuthed ? "/account" : "/login" },
            ]}
            locked={!isAuthed}
          />

          <ConceptCard
            title="Authentication"
            subtitle="How do we prove identity?"
            body="Authentication is the login process. In this project, you log in to receive a JWT token (Bearer token) which is then used to call protected APIs."
            actions={[
              { label: isAuthed ? "You're logged in → Dashboard" : "Try login", to: loginTarget },
            ]}
          />

          <ConceptCard
            title="Authorization"
            subtitle="What is the user allowed to do?"
            body="Authorization is permission checking. We use RBAC (Role-Based Access Control): users have roles, roles map to permissions, and routes check required roles/perms."
            actions={[
              { label: isAuthed ? "View roles/perms" : "View roles/perms (login)", to: dashboardTarget },
            ]}
            locked={!isAuthed}
          />

          <ConceptCard
            title="Roles"
            subtitle="Grouped permissions"
            body="A role is a named bundle of permissions (e.g., admin, security_analyst). Assigning a role instantly changes what a user can do across the system."
            actions={[
              { label: "Admin (if allowed)", to: isAuthed ? "/admin" : "/login", admin: true },
            ]}
            locked={!isAuthed}
          />

          <ConceptCard
            title="Permissions"
            subtitle="Atomic actions"
            body="Permissions are fine-grained capabilities like USER_READ, SESSION_REVOKE, ROLE_ASSIGN. Routes enforce permissions to prevent unauthorized actions."
            actions={[
              { label: isAuthed ? "Check permissions" : "Check permissions (login)", to: dashboardTarget },
            ]}
            locked={!isAuthed}
          />

          <ConceptCard
            title="Sessions"
            subtitle="Active logins across devices"
            body="Sessions represent ongoing access. Admins can search sessions by user and revoke them if needed. Users can review their own sessions (coming soon)."
            actions={[
              { label: "Sessions (admin)", to: isAuthed ? "/admin/sessions" : "/login", admin: true },
            ]}
            locked={!isAuthed}
          />

          <ConceptCard
            title="Audit Logs"
            subtitle="Who did what, when?"
            body="Audit logging is critical for security. Sensitive actions produce audit entries for traceability, incident response, and compliance."
            actions={[
              { label: "Audit logs (admin)", to: isAuthed ? "/admin/audit-logs" : "/login", admin: true },
            ]}
            locked={!isAuthed}
          />

          <ConceptCard
            title="Temporary Access (JIT)"
            subtitle="Time-bound permissions"
            body="Just-In-Time access is a best practice: grant a permission only for the duration needed (e.g., 10 minutes), then automatically revoke it."
            actions={[
              { label: "Temp access (admin)", to: isAuthed ? "/admin/temp-access" : "/login", admin: true },
            ]}
            locked={!isAuthed}
          />
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-white">
              {isAuthed ? "You're ready to explore the console." : "Want to see IAM in action?"}
            </h3>
            <p className="mt-1 text-white/70 text-sm">
              {isAuthed
                ? "Open your dashboard to inspect roles, permissions, and (soon) sessions & audit logs."
                : "Login and inspect roles, permissions, and temporary grants live."}
            </p>
          </div>

          <button
            onClick={() => navigate(dashboardTarget)}
            className="rounded-2xl px-5 py-3 text-sm font-semibold text-black bg-white hover:bg-white/90 transition shadow"
          >
            {isAuthed ? "Go to Dashboard" : "Go to Login"}
          </button>
        </div>
      </div>
    </AnimatedWrapper>
  );
}

function ConceptCard({ title, subtitle, body, actions, locked }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-3xl border border-white/10 bg-white/5 p-6 relative"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">{title}</div>
          <div className="text-xs text-white/60 mt-1">{subtitle}</div>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10 text-white/70">
          IAM
        </span>
      </div>

      <p className="mt-3 text-sm text-white/70 leading-relaxed">{body}</p>

      {locked && (
        <div className="mt-4 text-xs text-white/50">
          🔒 Log in to view your live data for this section.
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {actions?.map((a) => (
          <button
            key={a.label + a.to}
            onClick={() => navigate(a.to)}
            className="rounded-xl px-3 py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition"
          >
            {a.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
