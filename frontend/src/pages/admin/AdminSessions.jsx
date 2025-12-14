import React, { useEffect, useMemo, useState } from "react";
import AnimatedWrapper from "../../components/animatedWrapper.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { hasPerm } from "../../utils/permissions.js";
import { listSessions, revokeSession } from "../../services/adminService.js";
import AdminGate from "../../components/adminGate.jsx";

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

export default function AdminSessions() {
  const { permissions } = useAuth();

  const canRead = hasPerm(permissions, "SESSION_READ");
  const canRevoke = hasPerm(permissions, "SESSION_REVOKE");

  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(30);

  // status filter: active (default), inactive, all
  const [status, setStatus] = useState("active");

  // cursor pagination
  const [cursor, setCursor] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
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

      const data = await listSessions({
        identifier: q.trim() || undefined,
        limit,
        status,
        cursor: effectiveCursor || undefined,
      });

      const list = data?.sessions || [];
      setSessions(list);

      setNextCursor(data?.nextCursor || null);
      setHasMore(!!data?.hasMore);

      if (resetCursor) setCursor(null);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }

  // initial load
  useEffect(() => {
    if (canRead) load({ resetCursor: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRead]);

  // reload when pagination/filter/limit changes
  useEffect(() => {
    if (!canRead) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, status, limit]);

  // fallback local filter (in case backend ignores identifier)
  const filtered = useMemo(() => {
    if (!q.trim()) return sessions;
    const s = q.toLowerCase();
    return sessions.filter(
      (x) =>
        (x.user?.email || "").toLowerCase().includes(s) ||
        (x.user?.username || "").toLowerCase().includes(s)
    );
  }, [sessions, q]);

  async function handleRevoke(session) {
    if (!canRevoke) return;
    if (!confirm("Revoke this session?")) return;

    try {
      const payload = session.id
        ? { sessionId: session.id }
        : { refreshTokenId: session.refreshTokenId };

      await revokeSession(payload);
      showToast("Session revoked ✅");
      await load({ resetCursor: true });
    } catch (e) {
      console.error(e);
      showToast(e?.response?.data?.error || "Revoke failed ❌");
    }
  }

  if (!canRead) {
    return (
      <AnimatedWrapper>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white">
          <h1 className="text-2xl font-semibold">Sessions</h1>
          <p className="mt-2 text-white/70">
            You don’t have permission to view sessions.
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
            <h1 className="text-3xl font-semibold text-white">Sessions</h1>
            <p className="text-sm text-white/60 max-w-xl">
              Manage active and inactive user sessions. Search by email or username
              and revoke access when needed.
            </p>
          </div>

          {/* Controls */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              {/* Search */}
              <div className="md:col-span-5">
                <label className="text-xs text-white/60">Search</label>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="email or username..."
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-white/20 transition"
                />
              </div>

              {/* Status */}
              <div className="md:col-span-3">
                <label className="text-xs text-white/60">Status</label>
                <select
                  value={status}
                  onChange={(e) => {
                    setCursor(null);
                    setStatus(e.target.value);
                  }}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="all">All</option>
                </select>
              </div>

              {/* Limit */}
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

              {/* Actions */}
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

          {loading ? (
            <p className="text-white/60">Loading sessions…</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((s) => (
                <div
                  key={s.id || s.refreshTokenId}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="space-y-2">
                    {/* Header row */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div className="text-white font-semibold">
                        {s.user?.email || "Unknown user"}
                        {s.user?.username ? (
                          <span className="text-white/60 font-normal">
                            {" "}
                            • @{s.user.username}
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${
                            s.active
                              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-200"
                              : "bg-white/10 border-white/10 text-white/70"
                          }`}
                        >
                          {s.active ? "Active" : "Inactive"}
                        </span>

                        {canRevoke && s.active && (
                          <button
                            onClick={() => handleRevoke(s)}
                            className="rounded-xl px-3 py-2 text-xs font-semibold bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-200"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Summary row */}
                    <div className="text-xs text-white/60">
                      <span className="text-white/70">Created:</span>{" "}
                      {formatDate(s.createdAt)}{" "}
                      <span className="text-white/40">•</span>{" "}
                      <span className="text-white/70">Expires:</span>{" "}
                      {formatDate(s.expiresAt)}
                    </div>

                    {/* Collapsible details */}
                    <details className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                      <summary className="cursor-pointer text-xs text-white/70 select-none">
                        View details
                      </summary>

                      <div className="mt-2 space-y-1 text-xs text-white/60">
                        <div>
                          Session ID: <Mono>{s.id || "—"}</Mono>
                        </div>
                        <div>
                          RefreshToken ID:{" "}
                          <Mono>{s.refreshTokenId || "—"}</Mono>
                        </div>
                        <div>
                          IP:{" "}
                          <span className="text-white/70">{s.ip || "—"}</span>
                        </div>
                        <div className="break-words">
                          UA:{" "}
                          <span className="text-white/70">
                            {s.userAgent || "—"}
                          </span>
                        </div>
                      </div>
                    </details>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                  No sessions found.
                </div>
              )}
            </div>
          )}
        </div>
      </AnimatedWrapper>
    </AdminGate>
  );
}
