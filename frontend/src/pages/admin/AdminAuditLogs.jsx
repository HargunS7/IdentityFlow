import React, { useEffect, useMemo, useState } from "react";
import AnimatedWrapper from "../../components/animatedWrapper.jsx";
import AdminGate from "../../components/adminGate.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { hasPerm } from "../../utils/permissions.js";
import { listAuditLogs } from "../../services/adminService.js";

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

function pretty(obj) {
    try {
        return JSON.stringify(obj, null, 2);
    } catch {
        return String(obj);
    }
}

export default function AdminAuditLogs() {
    const { permissions } = useAuth();
    const canRead = hasPerm(permissions, "AUDIT_READ");

    const [q, setQ] = useState("");
    const [action, setAction] = useState("all");
    const [limit, setLimit] = useState(30);

    const [cursor, setCursor] = useState(null);
    const [nextCursor, setNextCursor] = useState(null);
    const [hasMore, setHasMore] = useState(false);

    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function load({ resetCursor = false } = {}) {
        try {
            setLoading(true);
            setError("");

            const effectiveCursor = resetCursor ? null : cursor;

            const data = await listAuditLogs({
                identifier: q.trim() || undefined,
                action,
                limit,
                cursor: effectiveCursor || undefined,
            });

            setLogs(data?.logs || []);
            setNextCursor(data?.nextCursor || null);
            setHasMore(!!data?.hasMore);

            if (resetCursor) setCursor(null);
        } catch (e) {
            console.error(e);
            setError(e?.response?.data?.error || "Failed to load audit logs");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (canRead) load({ resetCursor: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canRead]);

    useEffect(() => {
        if (!canRead) return;
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cursor, action, limit]);

    // Optional local filter fallback (if you ever remove identifier support backend-side)
    const filtered = useMemo(() => {
        if (!q.trim()) return logs;
        const s = q.toLowerCase();
        return logs.filter((x) => {
            const email = (x.user?.email || "").toLowerCase();
            const uname = (x.user?.username || "").toLowerCase();
            return email.includes(s) || uname.includes(s);
        });
    }, [logs, q]);

    if (!canRead) {
        return (
            <AnimatedWrapper>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white">
                    <h1 className="text-2xl font-semibold">Audit Logs</h1>
                    <p className="mt-2 text-white/70">
                        You don’t have permission to view audit logs.
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
                        <h1 className="text-3xl font-semibold text-white">Audit Logs</h1>
                        <p className="text-sm text-white/60 max-w-xl">
                            Track security events across the system. Filter by user and action, Inspect details from{" "}
                            <span className="whitespace-nowrap font-medium text-white/70">
                                meta
                            </span>.
                        </p>
                    </div>


                    {/* Controls */}
                    <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                            {/* Search */}
                            <div className="md:col-span-5">
                                <label className="text-xs text-white/60">Search user</label>
                                <input
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    placeholder="email or username..."
                                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-white/20 transition"
                                />
                            </div>

                            {/* Action */}
                            <div className="md:col-span-3">
                                <label className="text-xs text-white/60">Action</label>
                                <select
                                    value={action}
                                    onChange={(e) => {
                                        setCursor(null);
                                        setAction(e.target.value);
                                    }}
                                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none"
                                >
                                    <option value="all">All</option>
                                    <option value="LOGIN">LOGIN</option>
                                    <option value="LOGOUT">LOGOUT</option>
                                    <option value="SIGNUP">SIGNUP</option>
                                    <option value="USER_CREATE">USER_CREATE</option>
                                    <option value="USER_UPDATE">USER_UPDATE</option>
                                    <option value="USER_DELETE">USER_DELETE</option>
                                    <option value="ROLE_ASSIGN">ROLE_ASSIGN</option>
                                    <option value="ROLE_REMOVE">ROLE_REMOVE</option>
                                    <option value="SESSION_REVOKE">SESSION_REVOKE</option>
                                    <option value="TEMP_PERMISSION_GRANT">TEMP_PERMISSION_GRANT</option>
                                    <option value="TEMP_PERMISSION_REVOKE">TEMP_PERMISSION_REVOKE</option>
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

                    {error && (
                        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <p className="text-white/60">Loading audit logs…</p>
                    ) : (
                        <div className="space-y-3">
                            {filtered.map((l) => (
                                <div
                                    key={l.id}
                                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                                >
                                    <div className="space-y-2">
                                        {/* Header row */}
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                            <div className="text-white font-semibold">
                                                {l.action}
                                                <span className="text-white/50 font-normal">
                                                    {" "}
                                                    • {formatDate(l.createdAt)}
                                                </span>
                                            </div>

                                            <div className="text-xs text-white/60">
                                                IP: <span className="text-white/70">{l.ip || "—"}</span>
                                            </div>
                                        </div>

                                        {/* Summary */}
                                        <div className="text-xs text-white/60">
                                            Target User:{" "}
                                            <span className="text-white/70">
                                                {l.user?.email || "—"}
                                                {l.user?.username ? ` (@${l.user.username})` : ""}
                                            </span>{" "}
                                            <span className="text-white/40">•</span> Actor ID:{" "}
                                            <Mono>{l.actorId || "—"}</Mono>
                                        </div>

                                        {/* Details */}
                                        <details className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                                            <summary className="cursor-pointer text-xs text-white/70 select-none">
                                                View details
                                            </summary>
                                            <div className="mt-2 space-y-2 text-xs text-white/60">
                                                <div>
                                                    Log ID: <Mono>{l.id}</Mono>
                                                </div>
                                                <div>
                                                    User ID: <Mono>{l.userId || "—"}</Mono>
                                                </div>
                                                <div>
                                                    Meta:
                                                    <pre className="mt-2 max-h-64 overflow-auto rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/80">
                                                        {pretty(l.meta ?? {})}
                                                    </pre>
                                                </div>
                                            </div>
                                        </details>
                                    </div>
                                </div>
                            ))}

                            {filtered.length === 0 && (
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                                    No audit logs found.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </AnimatedWrapper>
        </AdminGate>
    );
}
