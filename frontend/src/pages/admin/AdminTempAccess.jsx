import React, { useEffect, useMemo, useState } from "react";
import AnimatedWrapper from "../../components/animatedWrapper.jsx";
import AdminGate from "../../components/adminGate.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { hasPerm } from "../../utils/permissions.js";
import {
  grantTempPermission,
  listTempPermissions,
  revokeTempPermission,
} from "../../services/adminService.js";

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function Mono({ children }) {
  return (
    <span className="font-mono text-xs text-white/80 break-all">{children}</span>
  );
}

// ✅ Source of truth: active = expiresAt > now
function isActiveGrant(expiresAt) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() > Date.now();
}

export default function AdminTempAccess() {
  const { permissions } = useAuth();
  const canManage = hasPerm(permissions, "TEMP_GRANT"); // same perm for view/manage for now

  // Grant form
  const [identifier, setIdentifier] = useState("");
  const [permissionCode, setPermissionCode] = useState("SESSION_REVOKE");
  const [minutes, setMinutes] = useState(10);
  const [reason, setReason] = useState("");

  // List filters
  const [q, setQ] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);
  const [limit, setLimit] = useState(30);

  // Pagination (backend doesn’t currently send cursor/hasMore — safe defaults)
  const [cursor, setCursor] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }

  async function load({ resetCursor = false } = {}) {
    try {
      setLoading(true);
      setError("");

      const effectiveCursor = resetCursor ? null : cursor;

      const data = await listTempPermissions({
        identifier: q.trim() || undefined,
        activeOnly: activeOnly ? "true" : "false",
        limit,
        cursor: effectiveCursor || undefined,
      });

      setGrants(data?.grants || []);
      setNextCursor(data?.nextCursor || null);
      setHasMore(!!data?.hasMore);

      if (resetCursor) setCursor(null);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || "Failed to load temporary permissions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (canManage) load({ resetCursor: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage]);

  useEffect(() => {
    if (!canManage) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, activeOnly, limit]);

  // Local filter fallback (in case backend ignores identifier)
  const filtered = useMemo(() => {
    if (!q.trim()) return grants;
    const s = q.toLowerCase();
    return grants.filter((x) => {
      const email = (x.user?.email || "").toLowerCase();
      const uname = (x.user?.username || "").toLowerCase();
      return email.includes(s) || uname.includes(s);
    });
  }, [grants, q]);

  async function onGrant() {
    if (!identifier.trim()) return showToast("Enter an email or username");
    if (!permissionCode.trim()) return showToast("Select a permission");
    if (minutes < 1 || minutes > 30) return showToast("Minutes must be 1–30");

    try {
      setSubmitting(true);
      setError("");

      // ✅ Your backend accepts either identifier-based or userId-based now
      await grantTempPermission({
        identifier: identifier.trim(),
        permissionCode, // backend maps this → permission
        minutes, // backend maps this → durationMinutes
        reason: reason.trim() || undefined,
      });

      showToast("Temporary permission granted ✅");
      setReason("");
      await load({ resetCursor: true });
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || "Grant failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function onRevoke(grant) {
    const active = isActiveGrant(grant.expiresAt);
    if (!active) {
      showToast("Already expired");
      return;
    }
    if (!confirm("Revoke this temporary permission?")) return;

    try {
      await revokeTempPermission({ grantId: grant.id });
      showToast("Revoked ✅");
      await load({ resetCursor: true });
    } catch (e) {
      console.error(e);
      showToast(e?.response?.data?.error || "Revoke failed ❌");
    }
  }

  if (!canManage) {
    return (
      <AnimatedWrapper>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white">
          <h1 className="text-2xl font-semibold">Temporary Access</h1>
          <p className="mt-2 text-white/70">
            You don’t have permission to manage temporary access.
          </p>
        </div>
      </AnimatedWrapper>
    );
  }

  return (
    <AdminGate>
      <AnimatedWrapper>
        <div className="space-y-5">
          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold text-white">Temporary Access</h1>
            <p className="text-sm text-white/60 max-w-xl">
              Grant a user a permission for a short time window (1–30 minutes).
              Use this for “just-in-time” access with audit visibility.
            </p>
          </div>

          {/* Grant Form */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-4">
                <label className="text-xs text-white/60">User</label>
                <input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="email or username..."
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-white/20 transition"
                />
              </div>

              <div className="md:col-span-4">
                <label className="text-xs text-white/60">Permission</label>
                <select
                  value={permissionCode}
                  onChange={(e) => setPermissionCode(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none"
                >
                  <option value="SESSION_REVOKE">SESSION_REVOKE</option>
                  <option value="SESSION_READ">SESSION_READ</option>
                  <option value="AUDIT_READ">AUDIT_READ</option>
                  <option value="USER_READ">USER_READ</option>
                  <option value="USER_UPDATE">USER_UPDATE</option>
                  <option value="ROLE_ASSIGN">ROLE_ASSIGN</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-white/60">Minutes (1–30)</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  disabled={submitting}
                  onClick={onGrant}
                  className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Granting…" : "Grant"}
                </button>
              </div>

              <div className="md:col-span-12">
                <label className="text-xs text-white/60">Reason (optional)</label>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why is this needed?"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-white/20 transition"
                />
              </div>
            </div>
          </div>

          {/* Toast / Error */}
          {toast && (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
              {toast}
            </div>
          )}
          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {/* List Controls */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-5">
                <label className="text-xs text-white/60">Search user</label>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="email or username..."
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-white/20 transition"
                />
              </div>

              <div className="md:col-span-3">
                <label className="text-xs text-white/60">Show</label>
                <select
                  value={activeOnly ? "active" : "all"}
                  onChange={(e) => {
                    setCursor(null);
                    setActiveOnly(e.target.value === "active");
                  }}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none"
                >
                  <option value="active">Active only</option>
                  <option value="all">All</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-white/60">Limit</label>
                <select
                  value={limit}
                  onChange={(e) => {
                    setCursor(null);
                    setLimit(Number(e.target.value));
                  }}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none"
                >
                  <option value={10}>10</option>
                  <option value={30}>30</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="md:col-span-2 flex gap-2">
                <button
                  onClick={() => load({ resetCursor: true })}
                  className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition"
                >
                  Refresh
                </button>

                <button
                  disabled={!hasMore || loading}
                  onClick={() => setCursor(nextCursor)}
                  className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* List */}
          {loading ? (
            <p className="text-white/60">Loading temporary permissions…</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((g) => {
                const active = isActiveGrant(g.expiresAt);

                return (
                  <div
                    key={g.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div className="text-white font-semibold">
                          {g.user?.email || "Unknown user"}
                          {g.user?.username ? (
                            <span className="text-white/60 font-normal">
                              {" "}
                              • @{g.user.username}
                            </span>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold bg-white/10 border-white/10 text-white/80">
                            {g.permission || "—"}
                          </span>

                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${
                              active
                                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-200"
                                : "bg-red-500/15 border-red-500/30 text-red-200"
                            }`}
                          >
                            {active ? "Active" : "Expired"}
                          </span>

                          {/* ✅ Only allow revoke if still active */}
                          {active && (
                            <button
                              onClick={() => onRevoke(g)}
                              className="rounded-xl px-3 py-2 text-xs font-semibold bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-200"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-white/60">
                        Granted:{" "}
                        <span className="text-white/70">{formatDate(g.createdAt)}</span>{" "}
                        <span className="text-white/40">•</span>{" "}
                        Expires:{" "}
                        <span className="text-white/70">{formatDate(g.expiresAt)}</span>
                      </div>

                      <details className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                        <summary className="cursor-pointer text-xs text-white/70 select-none">
                          View details
                        </summary>
                        <div className="mt-2 space-y-1 text-xs text-white/60">
                          <div>
                            Grant ID: <Mono>{g.id}</Mono>
                          </div>
                          <div>
                            User ID: <Mono>{g.userId || "—"}</Mono>
                          </div>
                          <div>
                            Granted By: <Mono>{g.grantedById || "—"}</Mono>
                          </div>
                          <div>
                            Permission: <Mono>{g.permission || "—"}</Mono>
                          </div>
                          {g.reason ? (
                            <div>
                              Reason: <span className="text-white/70">{g.reason}</span>
                            </div>
                          ) : null}
                        </div>
                      </details>
                    </div>
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                  No temporary permissions found.
                </div>
              )}
            </div>
          )}
        </div>
      </AnimatedWrapper>
    </AdminGate>
  );
}
