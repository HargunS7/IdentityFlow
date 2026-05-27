import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { useAuth } from "../../context/AuthContext.jsx";
import { PERMISSIONS, ROLES, hasAnyPerm } from "../../utils/permissions.js";
import { useAdminSummary } from "../../services/queries.js";

import {
  PageHeader,
  Card,
  CardHeader,
  Stat,
  Button,
  Badge,
  Chip,
  Skeleton,
  Breadcrumbs,
} from "../../components/ui.jsx";
import { formatRelative } from "../../utils/format.js";

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function AdminHome() {
  const navigate = useNavigate();
  const { user, roles, permissions } = useAuth();

  const username = user?.username || user?.email || "user";
  const roleList = Array.isArray(roles) ? roles : [];
  const perms = Array.isArray(permissions?.combined) ? permissions.combined : [];
  const isAdmin = roleList.includes(ROLES.ADMIN);

  const { data: summary, isLoading: summaryLoading } = useAdminSummary({
    enabled: hasAnyPerm(permissions, [
      PERMISSIONS.USER_READ,
      PERMISSIONS.SESSION_READ,
      PERMISSIONS.AUDIT_READ,
      PERMISSIONS.TEMP_GRANT,
    ]),
  });

  const modules = [
    {
      title: "Users & Roles",
      desc: "Search users, assign roles, validate RBAC outcomes.",
      to: "/admin/users",
      badge: "USER_READ",
      show: hasAnyPerm(permissions, [
        PERMISSIONS.USER_READ,
        PERMISSIONS.USER_UPDATE,
        PERMISSIONS.USER_CREATE,
        PERMISSIONS.USER_DELETE,
        PERMISSIONS.ROLE_ASSIGN,
      ]),
    },
    {
      title: "Sessions",
      desc: "Live view of active sessions per user. Revoke takes effect immediately.",
      to: "/admin/sessions",
      badge: "SESSION_READ",
      show: hasAnyPerm(permissions, [
        PERMISSIONS.SESSION_READ,
        PERMISSIONS.SESSION_REVOKE,
      ]),
    },
    {
      title: "Audit Logs",
      desc: "Trace sensitive actions across the system for review and compliance.",
      to: "/admin/audit-logs",
      badge: "AUDIT_READ",
      show: hasAnyPerm(permissions, [PERMISSIONS.AUDIT_READ]),
    },
    {
      title: "Temporary Access",
      desc: "Grant time-bound permissions (1–30 min) and let them expire automatically.",
      to: "/admin/temp-access",
      badge: "TEMP_GRANT",
      show: hasAnyPerm(permissions, [PERMISSIONS.TEMP_GRANT]),
    },
  ];
  const visible = modules.filter((m) => m.show);

  return (
    <motion.div
      initial="hidden"
      animate="show"
      transition={{ staggerChildren: 0.06 }}
      className="space-y-6"
    >
      <motion.div variants={fadeUp}>
        <Breadcrumbs items={[{ label: "Console" }]} />
      </motion.div>

      <motion.div variants={fadeUp}>
        <PageHeader
          eyebrow="ADMIN CONSOLE"
          title={isAdmin ? "Welcome back, admin" : "Security Console"}
          subtitle={
            isAdmin
              ? `You're signed in as ${username}. Manage users, sessions, audit trails, and just-in-time access — all live from the backend.`
              : `You're signed in as ${username}. Available modules depend on your current permissions (including temporary grants).`
          }
          actions={
            visible[0] && (
              <Button onClick={() => navigate(visible[0].to)}>
                Open {visible[0].title} →
              </Button>
            )
          }
        />
      </motion.div>

      {/* Live stats */}
      <motion.div
        variants={fadeUp}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <Stat
          label="Users"
          value={summary?.users?.total ?? "—"}
          hint="Total registered"
          loading={summaryLoading}
        />
        <Stat
          label="Active sessions"
          value={summary?.sessions?.active ?? "—"}
          hint={
            summary?.sessions?.total != null
              ? `of ${summary.sessions.total} total`
              : "Across all users"
          }
          accent="good"
          loading={summaryLoading}
        />
        <Stat
          label="Audit entries"
          value={summary?.auditLogs?.total ?? "—"}
          hint="All time"
          loading={summaryLoading}
        />
        <Stat
          label="JIT grants live"
          value={summary?.tempGrants?.active ?? "—"}
          hint="Right now"
          accent="warn"
          loading={summaryLoading}
        />
      </motion.div>

      {/* Two-column: your access + recent activity */}
      <motion.div
        variants={fadeUp}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <Card padded className="md:col-span-1">
          <CardHeader
            eyebrow="YOUR ACCESS"
            title="Role & permissions"
            subtitle="What this account can do right now."
          />
          <div className="mt-5 space-y-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">
                Roles
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {roleList.length ? (
                  roleList.map((r) => <Chip key={r}>{r}</Chip>)
                ) : (
                  <span className="text-sm text-white/55">No roles assigned</span>
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">
                  Permissions
                </div>
                <div className="text-xs text-white/55">{perms.length} total</div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {perms.slice(0, 10).map((p) => (
                  <span
                    key={p}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-white/80 font-mono"
                  >
                    {p}
                  </span>
                ))}
                {perms.length > 10 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-white/55">
                    +{perms.length - 10} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card padded className="md:col-span-2">
          <CardHeader
            eyebrow="LIVE"
            title="Recent activity"
            subtitle="Latest entries from the audit log."
            right={
              summary && (
                <span className="text-[11px] text-white/45">
                  Updated {formatRelative(summary.generatedAt)}
                </span>
              )
            }
          />
          <div className="mt-5">
            {summaryLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : summary?.auditLogs?.recent?.length ? (
              <ul className="divide-y divide-white/5">
                {summary.auditLogs.recent.map((row) => (
                  <li
                    key={row.id}
                    className="py-2.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <Badge variant={badgeVariant(row.action)}>{row.action}</Badge>
                      <span className="text-sm text-white/75 truncate">
                        {row.user?.email || "system"}
                      </span>
                    </div>
                    <span className="text-xs text-white/50 shrink-0">
                      {formatRelative(row.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-white/55">
                {hasAnyPerm(permissions, [PERMISSIONS.AUDIT_READ])
                  ? "No recent activity."
                  : "You don't have permission to view audit logs."}
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Modules */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {visible.map((m) => (
          <Card key={m.to} padded interactive className="!p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-white">{m.title}</div>
                <p className="mt-2 text-sm text-white/65 leading-relaxed">
                  {m.desc}
                </p>
              </div>
              <span className="shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-white/65">
                {m.badge}
              </span>
            </div>
            <div className="mt-5">
              <Button variant="secondary" onClick={() => navigate(m.to)}>
                Open →
              </Button>
            </div>
          </Card>
        ))}
      </motion.div>

      {/* Tip */}
      <motion.div variants={fadeUp}>
        <Card padded>
          <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">
            Security tip
          </div>
          <p className="mt-2 text-sm text-white/70 leading-relaxed">
            Try the JIT loop: grant a temporary{" "}
            <span className="font-mono text-white/85">SESSION_REVOKE</span>{" "}
            permission to a non-admin user for 5 minutes. They'll see the
            Sessions tab appear in their navbar within seconds, then watch it
            disappear when the grant expires. That's RBAC + audit + JIT in
            action.
          </p>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function badgeVariant(action) {
  if (!action) return "neutral";
  if (action.includes("DELETE") || action.includes("REVOKE")) return "bad";
  if (action.includes("GRANT") || action.includes("ASSIGN")) return "good";
  if (action.startsWith("LOGIN") || action.startsWith("SIGNUP")) return "info";
  return "neutral";
}
