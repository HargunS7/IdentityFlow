import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "../../context/AuthContext.jsx";
import { hasPerm, PERMISSIONS } from "../../utils/permissions.js";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";

import {
  useTempPermissionsQuery,
  useGrantTempPermission,
  useRevokeTempPermission,
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
import { formatDate, minutesUntil } from "../../utils/format.js";

const GRANTABLE_PERMS = [
  PERMISSIONS.SESSION_REVOKE,
  PERMISSIONS.SESSION_READ,
  PERMISSIONS.AUDIT_READ,
  PERMISSIONS.USER_READ,
  PERMISSIONS.USER_UPDATE,
  PERMISSIONS.ROLE_ASSIGN,
];

function isActive(expiresAt) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() > Date.now();
}

export default function AdminTempAccess() {
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const canManage = hasPerm(permissions, PERMISSIONS.TEMP_GRANT);

  // Grant form
  const [identifier, setIdentifier] = useState("");
  const [permission, setPermission] = useState(PERMISSIONS.SESSION_REVOKE);
  const [minutes, setMinutes] = useState(10);
  const [reason, setReason] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search, 300);
  const [activeOnly, setActiveOnly] = useState(true);
  const [limit, setLimit] = useState(30);

  const params = useMemo(
    () => ({
      identifier: debounced.trim() || undefined,
      activeOnly: activeOnly ? "true" : "false",
      limit,
    }),
    [debounced, activeOnly, limit]
  );

  const { data, isLoading, isFetching, refetch } = useTempPermissionsQuery(
    params,
    { enabled: canManage }
  );

  const grants = data?.grants || [];

  const grantM = useGrantTempPermission();
  const revokeM = useRevokeTempPermission();

  const [toRevoke, setToRevoke] = useState(null);

  if (!canManage) {
    return <NoAccess title="Temporary access" />;
  }

  async function handleGrant(e) {
    e?.preventDefault?.();
    if (!identifier.trim()) return;
    if (minutes < 1 || minutes > 30) return;

    await grantM.mutateAsync({
      identifier: identifier.trim(),
      permissionCode: permission,
      minutes,
      reason: reason.trim() || undefined,
    });
    setReason("");
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Console", to: "/admin", onClick: () => navigate("/admin") },
          { label: "Temp Access" },
        ]}
      />

      <PageHeader
        eyebrow="JUST-IN-TIME"
        title="Temporary Access"
        subtitle="Grant a permission for a short window (1–30 minutes). Expiry is automatic; grants + revokes are audited."
        actions={
          <Button variant="secondary" onClick={() => refetch()} loading={isFetching}>
            Refresh
          </Button>
        }
      />

      {/* Grant form */}
      <Card padded>
        <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">
          Grant a temporary permission
        </div>
        <form
          onSubmit={handleGrant}
          className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-3"
        >
          <div className="md:col-span-4">
            <Field label="User (email or username)">
              <Input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="alice@example.com"
              />
            </Field>
          </div>
          <div className="md:col-span-4">
            <Field label="Permission">
              <Select
                value={permission}
                onChange={(e) => setPermission(e.target.value)}
              >
                {GRANTABLE_PERMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Minutes (1–30)">
              <Input
                type="number"
                min={1}
                max={30}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
              />
            </Field>
          </div>
          <div className="md:col-span-2 flex items-end">
            <Button
              type="submit"
              loading={grantM.isPending}
              disabled={!identifier.trim() || minutes < 1 || minutes > 30}
              className="w-full"
            >
              Grant
            </Button>
          </div>

          <div className="md:col-span-12">
            <Field label="Reason (optional)" hint="A short note that gets stored in the audit trail.">
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. investigating user X"
              />
            </Field>
          </div>
        </form>
      </Card>

      {/* Filters */}
      <Card padded>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6">
            <Field label="Search user">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Email or username…"
              />
            </Field>
          </div>
          <div className="md:col-span-3">
            <Field label="Show">
              <Select
                value={activeOnly ? "active" : "all"}
                onChange={(e) => setActiveOnly(e.target.value === "active")}
              >
                <option value="active">Active only</option>
                <option value="all">All</option>
              </Select>
            </Field>
          </div>
          <div className="md:col-span-3">
            <Field label="Per page">
              <Select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
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
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : grants.length === 0 ? (
        <EmptyState
          title="No temporary grants"
          subtitle="Grants will appear here as soon as they're created."
        />
      ) : (
        <motion.div layout className="space-y-3">
          <AnimatePresence initial={false}>
            {grants.map((g) => (
              <motion.div
                key={g.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <GrantRow
                  grant={g}
                  onRevoke={() => setToRevoke(g)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <ConfirmDialog
        open={!!toRevoke}
        title="Revoke this grant?"
        description={
          toRevoke && (
            <>
              The grant{" "}
              <span className="text-white font-semibold">
                {toRevoke.permission}
              </span>{" "}
              for{" "}
              <span className="text-white font-semibold">
                {toRevoke.user?.email || "this user"}
              </span>{" "}
              will be revoked immediately.
            </>
          )
        }
        confirmLabel="Revoke"
        variant="danger"
        loading={revokeM.isPending}
        onClose={() => !revokeM.isPending && setToRevoke(null)}
        onConfirm={async () => {
          if (!toRevoke) return;
          await revokeM.mutateAsync(toRevoke.id);
          setToRevoke(null);
        }}
      />
    </div>
  );
}

function GrantRow({ grant, onRevoke }) {
  const active = isActive(grant.expiresAt);
  const mins = minutesUntil(grant.expiresAt);
  const expiringSoon = active && mins !== null && mins <= 5;

  return (
    <Card padded className="!p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="info">{grant.permission}</Badge>
            <span className="text-sm text-white/65">
              for{" "}
              <span className="text-white/85">
                {grant.user?.email || "—"}
              </span>
              {grant.user?.username && (
                <span className="text-white/50"> · @{grant.user.username}</span>
              )}
            </span>
            {active ? (
              <Badge variant={expiringSoon ? "warn" : "good"}>
                {mins === 0 ? "Expiring" : `${mins} min left`}
              </Badge>
            ) : (
              <Badge variant="bad">Expired</Badge>
            )}
          </div>
          <div className="mt-2 text-xs text-white/55">
            Granted {formatDate(grant.createdAt)} · expires{" "}
            {formatDate(grant.expiresAt)}
          </div>
          {grant.reason && (
            <div className="mt-2 text-sm text-white/70">
              <span className="text-white/50">Reason:</span> {grant.reason}
            </div>
          )}
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-white/50 hover:text-white/70 transition">
              IDs
            </summary>
            <div className="mt-1 text-xs text-white/55 space-y-1">
              <div>
                Grant id: <Mono>{grant.id}</Mono>
              </div>
              <div>
                User id: <Mono>{grant.userId}</Mono>
              </div>
              <div>
                Granted by: <Mono>{grant.grantedById}</Mono>
              </div>
            </div>
          </details>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {active && (
            <Button size="sm" variant="danger" onClick={onRevoke}>
              Revoke
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function NoAccess({ title }) {
  return (
    <div className="space-y-4">
      <PageHeader title={title} eyebrow="ACCESS DENIED" />
      <Card padded>
        <p className="text-sm text-white/70">
          You need the TEMP_GRANT permission to manage temporary access.
        </p>
      </Card>
    </div>
  );
}
