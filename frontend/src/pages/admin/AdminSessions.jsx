import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "../../context/AuthContext.jsx";
import { hasPerm, PERMISSIONS } from "../../utils/permissions.js";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";

import {
  useSessionsQuery,
  useRevokeSession,
} from "../../services/queries.js";

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
  ConfirmDialog,
  Breadcrumbs,
} from "../../components/ui.jsx";
import { formatDate, formatRelative } from "../../utils/format.js";

export default function AdminSessions() {
  const navigate = useNavigate();
  const { permissions } = useAuth();

  const canRead = hasPerm(permissions, PERMISSIONS.SESSION_READ);
  const canRevoke = hasPerm(permissions, PERMISSIONS.SESSION_REVOKE);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [status, setStatus] = useState("active");
  const [limit, setLimit] = useState(30);
  const [cursor, setCursor] = useState(null);

  const queryParams = useMemo(
    () => ({
      identifier: debouncedSearch.trim() || undefined,
      status,
      limit,
      cursor: cursor || undefined,
    }),
    [debouncedSearch, status, limit, cursor]
  );

  const { data, isLoading, isFetching, refetch } = useSessionsQuery(
    queryParams,
    { enabled: canRead }
  );

  const sessions = data?.sessions || [];
  const hasMore = !!data?.hasMore;
  const nextCursor = data?.nextCursor || null;

  const [toRevoke, setToRevoke] = useState(null);
  const revokeM = useRevokeSession();

  if (!canRead) {
    return <NoAccess title="Sessions" />;
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Console", to: "/admin", onClick: () => navigate("/admin") },
          { label: "Sessions" },
        ]}
      />

      <PageHeader
        eyebrow="ACCESS · LIVE"
        title="Sessions"
        subtitle="Active and historical sessions across all users. Revocation takes effect immediately."
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
            <Field label="Search">
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
            <Field label="Status">
              <Select
                value={status}
                onChange={(e) => {
                  setCursor(null);
                  setStatus(e.target.value);
                }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="all">All</option>
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
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          title="No sessions match"
          subtitle="Try a different status or clear the search."
        />
      ) : (
        <motion.div layout className="space-y-3">
          <AnimatePresence initial={false}>
            {sessions.map((s) => (
              <motion.div
                key={s.id || s.refreshTokenId}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <SessionRow
                  session={s}
                  canRevoke={canRevoke}
                  onRevoke={() => setToRevoke(s)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-white/55">
          {sessions.length} shown
          {isFetching && <span className="ml-2 text-white/40">· refreshing…</span>}
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

      <ConfirmDialog
        open={!!toRevoke}
        title="Revoke this session?"
        description={
          toRevoke && (
            <>
              The session for{" "}
              <span className="text-white font-semibold">
                {toRevoke.user?.email || "this user"}
              </span>{" "}
              will be revoked. Their next request will return 401 — the JWT
              won't wait to expire.
            </>
          )
        }
        confirmLabel="Revoke session"
        variant="danger"
        loading={revokeM.isPending}
        onClose={() => !revokeM.isPending && setToRevoke(null)}
        onConfirm={async () => {
          if (!toRevoke) return;
          const payload = toRevoke.id
            ? { sessionId: toRevoke.id }
            : { refreshTokenId: toRevoke.refreshTokenId };
          await revokeM.mutateAsync(payload);
          setToRevoke(null);
        }}
      />
    </div>
  );
}

function SessionRow({ session, canRevoke, onRevoke }) {
  const [open, setOpen] = useState(false);
  const isExpired =
    session.expiresAt && new Date(session.expiresAt).getTime() <= Date.now();
  const status = !session.active
    ? { label: "Revoked", variant: "bad" }
    : isExpired
    ? { label: "Expired", variant: "warn" }
    : { label: "Active", variant: "good" };

  return (
    <Card padded className="!p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-white font-semibold truncate">
              {session.user?.email || "Unknown user"}
            </div>
            {session.user?.username && (
              <span className="text-white/50 text-sm">
                @{session.user.username}
              </span>
            )}
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/60">
            <span>
              Started{" "}
              <span className="text-white/80">
                {formatRelative(session.createdAt)}
              </span>
            </span>
            <span>
              Expires{" "}
              <span className="text-white/80">
                {formatRelative(session.expiresAt)}
              </span>
            </span>
            {session.ip && (
              <span>
                IP <span className="text-white/80">{session.ip}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Hide" : "Details"}
          </Button>
          {canRevoke && session.active && !isExpired && (
            <Button size="sm" variant="danger" onClick={onRevoke}>
              Revoke
            </Button>
          )}
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
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-white/70 space-y-1.5">
              <div>
                <span className="text-white/50">Session ID:</span>{" "}
                <Mono>{session.id || "—"}</Mono>
              </div>
              <div>
                <span className="text-white/50">Refresh token id:</span>{" "}
                <Mono>{session.refreshTokenId || "—"}</Mono>
              </div>
              <div>
                <span className="text-white/50">Created:</span>{" "}
                {formatDate(session.createdAt)}
              </div>
              <div>
                <span className="text-white/50">Expires:</span>{" "}
                {formatDate(session.expiresAt)}
              </div>
              <div className="break-words">
                <span className="text-white/50">User agent:</span>{" "}
                {session.userAgent || "—"}
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
          You need the SESSION_READ permission. Ask an admin to grant it, or
          request a temporary grant on the Temp Access page.
        </p>
      </Card>
    </div>
  );
}
