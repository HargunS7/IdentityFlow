import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext.jsx";
import { hasPerm, PERMISSIONS } from "../../utils/permissions.js";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";
import { useAuditLogsQuery } from "../../services/queries.js";

import {
  PageHeader,
  Card,
  Button,
  Input,
  Select,
  Field,
  Badge,
  Mono,
  SkeletonRow,
  EmptyState,
  Breadcrumbs,
} from "../../components/ui.jsx";
import { formatDate, formatRelative } from "../../utils/format.js";

const ACTION_OPTIONS = [
  "all",
  "LOGIN",
  "LOGOUT",
  "SIGNUP",
  "USER_CREATE",
  "USER_UPDATE",
  "USER_DELETE",
  "USER_SELF_UPDATE",
  "ROLE_ASSIGN",
  "ROLE_RESET",
  "SESSION_REVOKE",
  "TEMP_PERMISSION_GRANT",
  "TEMP_PERMISSION_REVOKE",
];

function actionVariant(action) {
  if (!action) return "neutral";
  if (action.startsWith("LOGIN") || action.startsWith("SIGNUP")) return "info";
  if (action.includes("DELETE") || action.includes("REVOKE")) return "bad";
  if (action.includes("GRANT") || action.includes("ASSIGN")) return "good";
  return "neutral";
}

export default function AdminAuditLogs() {
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const canRead = hasPerm(permissions, PERMISSIONS.AUDIT_READ);

  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search, 300);
  const [action, setAction] = useState("all");
  const [limit, setLimit] = useState(30);
  const [cursor, setCursor] = useState(null);

  const params = useMemo(
    () => ({
      identifier: debounced.trim() || undefined,
      action,
      limit,
      cursor: cursor || undefined,
    }),
    [debounced, action, limit, cursor]
  );

  const { data, isLoading, isFetching, refetch } = useAuditLogsQuery(params, {
    enabled: canRead,
  });

  const logs = data?.logs || [];
  const hasMore = !!data?.hasMore;
  const nextCursor = data?.nextCursor || null;

  if (!canRead) {
    return <NoAccess title="Audit logs" />;
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Console", to: "/admin", onClick: () => navigate("/admin") },
          { label: "Audit Logs" },
        ]}
      />

      <PageHeader
        eyebrow="SECURITY TRAIL"
        title="Audit Logs"
        subtitle="Every sensitive action lands here. Filter by user or action, expand any row for the full metadata."
        actions={
          <Button variant="secondary" onClick={() => refetch()} loading={isFetching}>
            Refresh
          </Button>
        }
      />

      {/* Filters */}
      <Card padded>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6">
            <Field label="Search user">
              <Input
                value={search}
                onChange={(e) => {
                  setCursor(null);
                  setSearch(e.target.value);
                }}
                placeholder="Email or username…"
              />
            </Field>
          </div>
          <div className="md:col-span-3">
            <Field label="Action">
              <Select
                value={action}
                onChange={(e) => {
                  setCursor(null);
                  setAction(e.target.value);
                }}
              >
                {ACTION_OPTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a === "all" ? "All actions" : a}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="md:col-span-3">
            <Field label="Per page">
              <Select
                value={limit}
                onChange={(e) => {
                  setCursor(null);
                  setLimit(Number(e.target.value));
                }}
              >
                <option value={10}>10</option>
                <option value={30}>30</option>
                <option value={100}>100</option>
              </Select>
            </Field>
          </div>
        </div>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          title="No audit logs match"
          subtitle="Adjust your filters, or wait for the next action to be logged."
        />
      ) : (
        <motion.div layout className="space-y-3">
          <AnimatePresence initial={false}>
            {logs.map((l) => (
              <motion.div
                key={l.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <AuditRow log={l} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-white/55">
          {logs.length} shown
          {isFetching && (
            <span className="ml-2 text-white/40">· refreshing…</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCursor(null)}
            disabled={!cursor}
          >
            First page
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCursor(nextCursor)}
            disabled={!hasMore}
          >
            Next →
          </Button>
        </div>
      </div>
    </div>
  );
}

function AuditRow({ log }) {
  const [open, setOpen] = useState(false);

  async function copyMeta() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(log.meta ?? {}, null, 2));
      toast.success("Meta copied");
    } catch {
      toast.error("Copy failed");
    }
  }

  return (
    <Card padded className="!p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={actionVariant(log.action)}>{log.action}</Badge>
            <span className="text-sm text-white/65">
              by{" "}
              <span className="text-white/85">
                {log.user?.email || log.actorId || "system"}
              </span>
            </span>
            <span className="text-xs text-white/45">
              · {formatRelative(log.createdAt)}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/55">
            <span>{formatDate(log.createdAt)}</span>
            {log.ip && (
              <span>
                IP <span className="text-white/75">{log.ip}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant="ghost" onClick={() => setOpen((v) => !v)}>
            {open ? "Hide" : "View meta"}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">
                  Meta
                </div>
                <Button size="sm" variant="ghost" onClick={copyMeta}>
                  Copy
                </Button>
              </div>
              <pre className="text-xs text-white/80 max-h-72 overflow-auto whitespace-pre-wrap break-words font-mono">
                {JSON.stringify(log.meta ?? {}, null, 2)}
              </pre>
              <div className="mt-3 text-xs text-white/55 space-y-1">
                <div>
                  Log id: <Mono>{log.id}</Mono>
                </div>
                <div>
                  User id: <Mono>{log.userId || "—"}</Mono>
                </div>
                <div>
                  Actor id: <Mono>{log.actorId || "—"}</Mono>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function NoAccess({ title }) {
  return (
    <div className="space-y-4">
      <PageHeader title={title} eyebrow="ACCESS DENIED" />
      <Card padded>
        <p className="text-sm text-white/70">
          You need the AUDIT_READ permission to view audit logs.
        </p>
      </Card>
    </div>
  );
}
