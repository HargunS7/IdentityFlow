import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AnimatedWrapper from "../components/animatedWrapper.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { updateMe } from "../services/adminService.js";

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function Account() {
  const navigate = useNavigate();
  const { user, roles, permissions, tempGrants, logout, refreshProfile } =
    useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState("");

  // Username edit state
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState(user?.username || "");
  const [savingUsername, setSavingUsername] = useState(false);

  useEffect(() => {
    setUsernameInput(user?.username || "");
  }, [user?.username]);

  const roleList = roles || [];
  const permCombined = permissions?.combined || [];
  const permPermanent = permissions?.permanent || [];
  const permTemporary = permissions?.temporary || [];
  const grants = Array.isArray(tempGrants) ? tempGrants : [];

  const isAdmin = useMemo(() => roleList.includes("admin"), [roleList]);

  async function handleRefresh() {
    setToast("");
    setRefreshing(true);
    try {
      await refreshProfile();
      setToast("Refreshing Profile...");
      setTimeout(() => setToast(""), 2500);
    } catch (e) {
      console.error(e);
      setToast("Refresh failed ❌");
      setTimeout(() => setToast(""), 2500);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  async function handleSaveUsername() {
    setToast("");
    setSavingUsername(true);
    try {
      const next = usernameInput.trim();

      if (!next) {
        setToast("Username cannot be empty ❌");
        setTimeout(() => setToast(""), 2500);
        return;
      }

      await updateMe({ username: next });
      await refreshProfile();

      setToast("Username updated ✅");
      setEditingUsername(false);
      setTimeout(() => setToast(""), 2500);
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.error || e?.message || "Update failed ❌";
      setToast(msg);
      setTimeout(() => setToast(""), 3000);
    } finally {
      setSavingUsername(false);
    }
  }

  return (
    <AnimatedWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-white">Account</h1>
            <p className="mt-1 text-sm text-white/60">
              Manage your identity settings and review your access state.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate("/dashboard")}
              className="rounded-2xl px-4 py-2 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition"
            >
              Back to Dashboard
            </button>

            {isAdmin && (
              <button
                onClick={() => navigate("/admin")}
                className="rounded-2xl px-4 py-2 text-sm font-semibold text-black bg-white hover:bg-white/90 transition shadow"
              >
                Admin Console
              </button>
            )}
          </div>
        </div>

        {toast && (
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-4 py-3 text-sm text-white/80">
            {toast}
          </div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Identity card */}
          <Card title="Identity" subtitle="Account & basic attributes">
            <div className="space-y-3">
              <Row label="Email" value={user?.email || "—"} />

              {/* Username row */}
<div className="space-y-2">
  <div className="flex items-center justify-between gap-3">
    <div className="text-sm text-white/60">Username</div>

    {!editingUsername ? (
      <div className="flex items-center gap-2">
        <div className="text-sm text-white">{user?.username || "—"}</div>
        <button
          onClick={() => setEditingUsername(true)}
          className="rounded-xl px-3 py-1 text-xs font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition"
        >
          Edit
        </button>
      </div>
    ) : (
      <button
        onClick={() => {
          setUsernameInput(user?.username || "");
          setEditingUsername(false);
        }}
        className="rounded-xl px-3 py-1 text-xs font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition"
      >
        Close
      </button>
    )}
  </div>

  {editingUsername && (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <input
          value={usernameInput}
          onChange={(e) => setUsernameInput(e.target.value)}
          className="w-full sm:w-56 rounded-xl px-3 py-2 text-sm text-white bg-black/30 border border-white/10 outline-none focus:border-white/25 transition"
          placeholder="Enter username"
          maxLength={32}
          autoFocus
        />

        <button
          onClick={handleSaveUsername}
          disabled={savingUsername}
          className="rounded-xl px-4 py-2 text-xs font-semibold text-black bg-white hover:bg-white/90 transition shadow disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {savingUsername ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="mt-2 text-xs text-white/50">
        Tip: letters, numbers, and underscore only.
      </div>
    </div>
  )}
</div>

              <Row label="User ID" value={<Mono>{user?.id || "—"}</Mono>} />
              <Row label="Created" value={formatDate(user?.createdAt)} />
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="rounded-2xl px-4 py-2 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {refreshing ? "Refreshing..." : "Refresh profile"}
              </button>
              <button
                onClick={handleLogout}
                className="rounded-2xl px-4 py-2 text-sm font-semibold text-black bg-white hover:bg-white/90 transition shadow"
              >
                Logout
              </button>
            </div>
          </Card>

          {/* Security card */}
          <Card title="Security" subtitle="MFA and session hygiene">
            <div className="space-y-3">
              <Row
                label="MFA"
                value={
                  user?.mfaEnabled ? (
                    <Badge variant="good">Enabled</Badge>
                  ) : (
                    <Badge variant="warn">Not enabled</Badge>
                  )
                }
              />

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-wider text-white/60">
                  MFA setup
                </div>
                <p className="mt-2 text-sm text-white/70">
                  We’ll wire MFA setup when the backend flow is ready. For now,
                  this page shows your MFA flag from /api/me.
                </p>

                <button
                  onClick={() => navigate("/mfa-setup")}
                  className="mt-3 rounded-2xl px-4 py-2 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition"
                >
                  Go to MFA Setup (coming soon)
                </button>
              </div>

              <div className="text-xs text-white/60">
                Tip: Use temporary access for high-risk tasks instead of
                permanent privileges.
              </div>
            </div>
          </Card>

          {/* Access card */}
          <Card title="Access" subtitle="Roles and permissions overview">
            <div className="grid grid-cols-3 gap-3">
              <StatMini label="Roles" value={roleList.length} />
              <StatMini label="Perms" value={permCombined.length} />
              <StatMini label="Temp Grants" value={grants.length} />
            </div>

            <div className="mt-5">
              <div className="text-xs uppercase tracking-wider text-white/60 mb-2">
                Roles
              </div>
              {roleList.length === 0 ? (
                <EmptyState text="No roles assigned." />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {roleList.map((r) => (
                    <Chip key={r}>{r}</Chip>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5">
              <div className="text-xs uppercase tracking-wider text-white/60 mb-2">
                Permissions
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge>Permanent: {permPermanent.length}</Badge>
                <Badge>Temporary: {permTemporary.length}</Badge>
                <Badge>Combined: {permCombined.length}</Badge>
              </div>

              <div className="mt-3 text-sm text-white/70">
                Your effective access is{" "}
                <span className="text-white">Combined</span> permissions
                (permanent + temporary).
              </div>
            </div>
          </Card>
        </div>

        {/* Temp grants table-like list */}
        <Card title="Temporary grants" subtitle="Active JIT access assigned to you">
          {grants.length === 0 ? (
            <EmptyState text="No temporary grants active." />
          ) : (
            <div className="space-y-3">
              {grants.map((g) => (
                <motion.div
                  key={g.id || `${g.permission}-${g.expiresAt}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {g.permission || g.permissionCode || "TEMP_PERMISSION"}
                    </div>
                    <div className="mt-1 text-xs text-white/60">
                      Expires:{" "}
                      <span className="text-white/70">
                        {formatDate(g.expiresAt)}
                      </span>
                    </div>
                    {g.reason && (
                      <div className="mt-2 text-sm text-white/70">
                        <span className="text-white/60">Reason:</span> {g.reason}
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-white/60">
                    Granted:{" "}
                    <span className="text-white/70">
                      {formatDate(g.createdAt)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AnimatedWrapper>
  );
}

/* -------------- UI helpers -------------- */

function Card({ title, subtitle, children }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] p-6">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-white/60">{subtitle}</p>}
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm text-white/60">{label}</div>
      <div className="text-sm text-white">{value}</div>
    </div>
  );
}

function Chip({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
      {children}
    </span>
  );
}

function Badge({ children, variant = "neutral" }) {
  const styles =
    variant === "good"
      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-200"
      : variant === "warn"
      ? "bg-amber-500/15 border-amber-500/30 text-amber-200"
      : "bg-white/10 border-white/10 text-white/70";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${styles}`}
    >
      {children}
    </span>
  );
}

function StatMini({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs text-white/60">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
      {text}
    </div>
  );
}

function Mono({ children }) {
  return (
    <span className="font-mono text-xs text-white/80 break-all">{children}</span>
  );
}
