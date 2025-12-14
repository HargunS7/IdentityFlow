// src/pages/admin/AdminHome.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "../../context/AuthContext.jsx";

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function AdminHome() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { user, roles, permissions } = useAuth();

const username = user?.username || user?.email || "admin";
const safeRoles = Array.isArray(roles) ? roles : [];
const perms = Array.isArray(permissions?.combined) ? permissions.combined : [];


  const topPerms = perms.slice(0, 8);
  const remaining = Math.max(perms.length - topPerms.length, 0);

  const modules = [
    {
      title: "Users & Roles",
      desc: "Search users, assign roles, and validate RBAC outcomes.",
      to: "/admin/users",
      badge: "ROLE_ASSIGN",
    },
    {
      title: "Sessions",
      desc: "Investigate active sessions and revoke access when needed.",
      to: "/admin/sessions",
      badge: "SESSION_REVOKE",
    },
    {
      title: "Audit Logs",
      desc: "Trace sensitive actions for security review and compliance.",
      to: "/admin/audit-logs",
      badge: "AUDIT_READ",
    },
    {
      title: "Temporary Access (JIT)",
      desc: "Grant time-bound permissions and let them expire automatically.",
      to: "/admin/temp-access",
      badge: "TEMP_GRANT",
    },
  ];

  return (
    <motion.div
      initial={reduceMotion ? false : "hidden"}
      animate={reduceMotion ? undefined : "show"}
      transition={{ staggerChildren: reduceMotion ? 0 : 0.06 }}
      className="space-y-6"
    >
      {/* Hero */}
      <motion.div
        variants={fadeUp}
        className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 md:p-10 shadow-[0_18px_55px_rgba(0,0,0,0.35)]"
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div>
            {/* <div className="text-xs uppercase tracking-wider text-white/60">
              Console Home
            </div> */}
            <h1 className="mt-2 text-3xl md:text-4xl font-semibold text-white">
                Console Home
            </h1>
            <p className="mt-2 max-w-2xl text-white/70">
              You’re logged in as <span className="text-white">{username}</span>. Admin access
              lets you manage users, roles, sessions, audits, and temporary permissions — like a real
              security console.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => navigate("/admin/users")}
                className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-black bg-white hover:bg-white/90 transition shadow"
              >
                Manage Users
              </button>
              <button
                onClick={() => navigate("/admin/audit-logs")}
                className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition"
              >
                View Audit Logs
              </button>
            </div>
          </div>

          {/* Your access card */}
          <div className="w-full md:w-[360px] rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-white">Your Access</div>
              <span className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10 text-white/70">
                RBAC
              </span>
            </div>

            <div className="mt-3">
              <div className="text-xs text-white/60">Roles</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {safeRoles.length ? (
                  safeRoles.map((r) => (
                    <span
                      key={r}
                      className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10 text-white/80"
                    >
                      {r}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-white/50">No roles found.</span>
                )}
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-white/60">Permissions</div>
                <div className="text-xs text-white/60">{perms.length} total</div>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {topPerms.length ? (
                  topPerms.map((p) => (
                    <span
                      key={p}
                      className="text-[11px] px-2 py-1 rounded-full bg-white/10 border border-white/10 text-white/75"
                    >
                      {p}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-white/50">No permissions found.</span>
                )}
                {remaining > 0 && (
                  <span className="text-[11px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/60">
                    +{remaining} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* What you can do */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoBlock
          title="What admins do in real systems"
          points={[
            "Enforce least privilege (don’t give more access than needed).",
            "Investigate incidents using audit trails.",
            "Revoke sessions when credentials are suspected.",
            "Use time-bound access for risky tasks (JIT).",
          ]}
        />

        <InfoBlock
          title="How this console maps to IAM concepts"
          points={[
            "Users get Roles → Roles map to Permissions.",
            "Routes enforce access checks (RBAC) before actions.",
            "Sensitive actions produce Audit Logs.",
            "Temporary grants expire automatically to reduce risk.",
          ]}
        />
      </motion.div>

      {/* Modules */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((m) => (
          <ModuleCard
            key={m.to}
            title={m.title}
            desc={m.desc}
            badge={m.badge}
            onOpen={() => navigate(m.to)}
          />
        ))}
      </motion.div>

      {/* Small footer hint */}
      <motion.div
        variants={fadeUp}
        className="rounded-3xl border border-white/10 bg-white/5 p-6"
      >
        <div className="text-sm font-semibold text-white">Security tip</div>
        <p className="mt-2 text-sm text-white/70 leading-relaxed">
          If you’re testing: create a user, assign a role, then re-open the dashboard and verify the
          effective permissions change. That’s the core RBAC loop.
        </p>
      </motion.div>
    </motion.div>
  );
}

function ModuleCard({ title, desc, badge, onOpen }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold text-white">{title}</div>
          <p className="mt-2 text-sm text-white/70">{desc}</p>
        </div>
        <span className="shrink-0 text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10 text-white/70">
          {badge}
        </span>
      </div>

      <div className="mt-5">
        <button
          onClick={onOpen}
          className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition"
        >
          Open
        </button>
      </div>
    </div>
  );
}

function InfoBlock({ title, points }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-white/70">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-white/40" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
