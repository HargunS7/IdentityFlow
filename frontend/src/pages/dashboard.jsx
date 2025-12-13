// src/pages/dashboard.jsx
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AnimatedWrapper from "../components/animatedWrapper.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function minutesLeft(expiresAt) {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60)));
}

export default function DashboardPage() {
  const { user, roles, permissions, tempGrants } = useAuth();
  const navigate = useNavigate();

  const roleList = roles || [];
  const permCombined = permissions?.combined || [];
  const permPermanent = permissions?.permanent || [];
  const permTemporary = permissions?.temporary || [];

  const isAdmin = useMemo(() => roleList.includes("admin"), [roleList]);

  const sortedTempGrants = useMemo(() => {
    const list = Array.isArray(tempGrants) ? [...tempGrants] : [];
    list.sort((a, b) => new Date(a.expiresAt || 0) - new Date(b.expiresAt || 0));
    return list;
  }, [tempGrants]);

  return (
    <AnimatedWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-white">Dashboard</h1>
            <p className="mt-1 text-sm text-white/60">
              Your identity, access, and security context — live from the backend.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate("/learn")}
              className="rounded-2xl px-4 py-2 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition"
            >
              Learn IAM
            </button>
            <button
              onClick={() => navigate("/account")}
              className="rounded-2xl px-4 py-2 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition"
            >
              Account
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

        {/* Top grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile */}
          <Card title="Profile" subtitle="Identity & security flags">
            <div className="space-y-3">
              <Row label="Email" value={user?.email || "—"} />
              <Row label="Username" value={user?.username || "—"} />
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
              <Row label="Created" value={formatDate(user?.createdAt)} />
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-wider text-white/60">
                Security hint
              </div>
              <p className="mt-1 text-sm text-white/70">
                IAM starts with identity. Your token proves who you are; roles and permissions decide what you can do.
              </p>
            </div>
          </Card>

          {/* Roles */}
          <Card
            title="Roles"
            subtitle="Role-based access control (RBAC)"
            right={
              <span className="text-xs text-white/60">
                {roleList.length} role{roleList.length === 1 ? "" : "s"}
              </span>
            }
          >
            {roleList.length === 0 ? (
              <EmptyState text="No roles assigned yet." />
            ) : (
              <div className="flex flex-wrap gap-2">
                {roleList.map((r) => (
                  <Chip key={r}>{r}</Chip>
                ))}
              </div>
            )}

            <div className="mt-5 text-sm text-white/70">
              Roles bundle permissions. Assigning/removing a role instantly changes access across the app.
            </div>
          </Card>

          {/* Permissions summary */}
          <Card
            title="Permissions"
            subtitle="Your effective permissions"
            right={
              <span className="text-xs text-white/60">
                {permCombined.length} total
              </span>
            }
          >
            <div className="grid grid-cols-3 gap-3">
              <StatMini label="Permanent" value={permPermanent.length} />
              <StatMini label="Temporary" value={permTemporary.length} />
              <StatMini label="Combined" value={permCombined.length} />
            </div>

            <div className="mt-5">
              <div className="text-xs uppercase tracking-wider text-white/60 mb-2">
                Combined
              </div>
              {permCombined.length === 0 ? (
                <EmptyState text="No permissions granted yet." />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {permCombined.slice(0, 10).map((p) => (
                    <Chip key={p}>{p}</Chip>
                  ))}
                  {permCombined.length > 10 && (
                    <span className="text-xs text-white/60 self-center">
                      +{permCombined.length - 10} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Temp grants */}
        <div className="grid grid-cols-1 gap-6">
          <Card
            title="Temporary Access (JIT)"
            subtitle="Time-bound permissions you currently have"
            right={
              <span className="text-xs text-white/60">
                {sortedTempGrants.length} active
              </span>
            }
          >
            {sortedTempGrants.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-white/70">
                  You have no temporary grants right now. Temporary access is used for short tasks (e.g., 10–30 minutes).
                </p>
                <div className="mt-3">
                  <button
                    onClick={() => navigate("/learn")}
                    className="rounded-2xl px-4 py-2 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition"
                  >
                    Learn about JIT access
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedTempGrants.map((g) => {
                  const mins = minutesLeft(g.expiresAt);
                  const expiringSoon = mins !== null && mins <= 5;

                  return (
                    <motion.div
                      key={g.id || `${g.permission}-${g.expiresAt}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="text-sm font-semibold text-white">
                            {g.permission || g.permissionCode || "TEMP_PERMISSION"}
                          </div>
                          {mins !== null && (
                            <Badge variant={expiringSoon ? "warn" : "neutral"}>
                              {mins === 0 ? "Expired" : `Expires in ${mins} min`}
                            </Badge>
                          )}
                        </div>

                        <div className="mt-1 text-xs text-white/60">
                          Expires at: <span className="text-white/70">{formatDate(g.expiresAt)}</span>
                        </div>

                        {g.reason && (
                          <div className="mt-2 text-sm text-white/70">
                            <span className="text-white/60">Reason:</span> {g.reason}
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-white/60">
                        Granted: <span className="text-white/70">{formatDate(g.createdAt)}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Bottom education section */}
        <Card title="How IAM works here" subtitle="Quick mental model">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MiniExplain
              title="Authenticate"
              text="You log in and receive a JWT. Every request uses Authorization: Bearer <token>."
            />
            <MiniExplain
              title="Authorize"
              text="Routes check your roles/permissions. You can also receive temporary permissions."
            />
            <MiniExplain
              title="Audit"
              text="Sensitive actions create audit logs for traceability and incident response."
            />
          </div>
        </Card>
      </div>
    </AnimatedWrapper>
  );
}

/* ------------------ UI helpers ------------------ */

function Card({ title, subtitle, right, children }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-white/60">{subtitle}</p>}
        </div>
        {right}
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
    <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${styles}`}>
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

function MiniExplain({ title, text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="text-sm font-semibold text-white">{title}</div>
      <p className="mt-2 text-sm text-white/70">{text}</p>
    </div>
  );
}
