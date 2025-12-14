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

  const { user, roles, permissions } = useAuth();
  const isAuthed = !!user;
  const isAdmin = roles?.includes("admin");

  const combinedPerms = permissions?.combined || permissions || [];
  const safePerms = Array.isArray(combinedPerms) ? combinedPerms : [];

  const goDashboard = () => navigate(isAuthed ? "/dashboard" : "/login");
  const goHome = () => navigate(isAuthed ? "/dashboard" : "/");

  return (
    <AnimatedWrapper>
      <div className="mx-auto max-w-6xl px-4 pt-14 pb-16">
        {/* Header */}
        <motion.div
          initial={reduceMotion ? false : "hidden"}
          animate="show"
          transition={{ staggerChildren: reduceMotion ? 0 : 0.08 }}
          className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 md:p-12"
        >
          <motion.div variants={fadeUp} className="text-xs uppercase tracking-wider text-white/60">
            Learn IAM
          </motion.div>

          <motion.h1 variants={fadeUp} className="mt-3 text-4xl md:text-5xl font-semibold text-white">
            Identity & Access Management — explained simply.
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-4 max-w-3xl text-white/70">
            IAM is how systems decide <span className="text-white">who</span> you are,{" "}
            <span className="text-white">what</span> you can do, and{" "}
            <span className="text-white">how</span> actions are tracked for security.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-7 flex flex-col sm:flex-row gap-3">
            <button
              onClick={goDashboard}
              className="rounded-2xl px-5 py-3 text-sm font-semibold text-black bg-white hover:bg-white/90 transition shadow"
            >
              Open Dashboard
            </button>

            <button
              onClick={goHome}
              className="rounded-2xl px-5 py-3 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition"
            >
              {isAuthed ? "Back to Dashboard" : "Back to Home"}
            </button>
          </motion.div>
        </motion.div>

        {/* ✅ Live preview (only when logged in) */}
        {isAuthed && (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-white/60">Live preview</div>
                <div className="mt-1 text-lg font-semibold text-white">
                  Logged in as {user?.username || user?.email}
                </div>
                <div className="mt-1 text-sm text-white/70">
                  Role:{" "}
                  <span className="text-white">{(roles?.length ? roles.join(", ") : "none")}</span>
                </div>
              </div>

              <button
                onClick={() => navigate("/account")}
                className="rounded-2xl px-5 py-3 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition"
              >
                View Account
              </button>
            </div>

            {!!safePerms.length && (
              <div className="mt-4 flex flex-wrap gap-2">
                {safePerms.slice(0, 10).map((p) => (
                  <span
                    key={p}
                    className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10 text-white/70"
                  >
                    {p}
                  </span>
                ))}
                {safePerms.length > 10 && (
                  <span className="text-xs text-white/60">+{safePerms.length - 10} more</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Content grid */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          <ConceptCard
            title="Identity"
            subtitle="Who is the user?"
            body="Identity is the user account and its attributes (email, username, MFA enabled, createdAt). Every decision starts with identifying the actor."
            actions={[{ label: "See your profile", to: "/dashboard", requireAuth: true }]}
          />

          <ConceptCard
            title="Authentication"
            subtitle="How do we prove identity?"
            body="Authentication is the login process. In this project, you log in to receive a JWT token (Bearer token) which is then used to call protected APIs."
            actions={[
              { label: isAuthed ? "Go to Dashboard" : "Try login", to: isAuthed ? "/dashboard" : "/login" },
            ]}
          />

          <ConceptCard
            title="Authorization"
            subtitle="What is the user allowed to do?"
            body="Authorization is permission checking. We use RBAC: users have roles, roles map to permissions, and routes check required roles/perms."
            actions={[{ label: "View roles/perms", to: "/dashboard", requireAuth: true }]}
          />

          <ConceptCard
            title="Roles"
            subtitle="Grouped permissions"
            body="A role is a named bundle of permissions. Assigning a role instantly changes what a user can do across the system."
            actions={[{ label: "Admin (if allowed)", to: "/admin", requireAuth: true, requireAdmin: true }]}
          />

          <ConceptCard
            title="Permissions"
            subtitle="Atomic actions"
            body="Permissions are fine-grained capabilities like USER_READ, SESSION_REVOKE, ROLE_ASSIGN. Routes enforce permissions to prevent unauthorized actions."
            actions={[{ label: "Check permissions", to: "/dashboard", requireAuth: true }]}
          />

          <ConceptCard
            title="Sessions"
            subtitle="Active logins across devices"
            body="Sessions represent ongoing access. Admins can search sessions by user and revoke them if needed."
            actions={[{ label: "Sessions (admin)", to: "/admin/sessions", requireAuth: true, requireAdmin: true }]}
          />

          <ConceptCard
            title="Audit Logs"
            subtitle="Who did what, when?"
            body="Audit logging is critical for security. Sensitive actions produce audit entries for traceability and incident response."
            actions={[{ label: "Audit logs (admin)", to: "/admin/audit-logs", requireAuth: true, requireAdmin: true }]}
          />

          <ConceptCard
            title="Temporary Access (JIT)"
            subtitle="Time-bound permissions"
            body="Just-In-Time access: grant a permission only for the duration needed, then automatically revoke it."
            actions={[{ label: "Temp access (admin)", to: "/admin/temp-access", requireAuth: true, requireAdmin: true }]}
          />
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-white">Want to see IAM in action?</h3>
            <p className="mt-1 text-white/70 text-sm">
              {isAuthed
                ? "Jump back to the dashboard to inspect roles, permissions, and activity."
                : "Login and inspect your roles, permissions, and temporary grants live."}
            </p>
          </div>
          <button
            onClick={goDashboard}
            className="rounded-2xl px-5 py-3 text-sm font-semibold text-black bg-white hover:bg-white/90 transition shadow"
          >
            {isAuthed ? "Go to Dashboard" : "Go to Login"}
          </button>
        </div>
      </div>
    </AnimatedWrapper>
  );
}

function ConceptCard({ title, subtitle, body, actions }) {
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const isAuthed = !!user;
  const isAdmin = roles?.includes("admin");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-3xl border border-white/10 bg-white/5 p-6"
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

      <div className="mt-5 flex flex-wrap gap-2">
        {actions?.map((a) => {
          const needsAuth = !!a.requireAuth;
          const needsAdmin = !!a.requireAdmin;

          const allowed =
            (!needsAuth || isAuthed) && (!needsAdmin || (isAuthed && isAdmin));

          return (
            <button
              key={a.to}
              onClick={() => {
                if (!allowed) {
                  navigate(!isAuthed ? "/login" : "/dashboard");
                  return;
                }
                navigate(a.to);
              }}
              disabled={!allowed}
              className={[
                "rounded-xl px-3 py-2 text-xs font-semibold border transition",
                allowed
                  ? "text-white bg-white/10 hover:bg-white/15 border-white/10"
                  : "text-white/40 bg-white/5 border-white/10 cursor-not-allowed",
              ].join(" ")}
              title={!allowed ? (!isAuthed ? "Login required" : "Admin only") : undefined}
            >
              {a.label}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
