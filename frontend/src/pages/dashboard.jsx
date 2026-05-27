import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { useAuth } from "../context/AuthContext.jsx";
import { ROLES } from "../utils/permissions.js";

import {
  PageHeader,
  Card,
  CardHeader,
  Stat,
  Button,
  Badge,
  Chip,
  EmptyState,
} from "../components/ui.jsx";
import { formatDate, minutesUntil } from "../utils/format.js";

export default function DashboardPage() {
  const { user, roles, permissions, tempGrants } = useAuth();
  const navigate = useNavigate();

  const roleList = roles || [];
  const permCombined = permissions?.combined || [];
  const permPermanent = permissions?.permanent || [];
  const permTemporary = permissions?.temporary || [];

  const isAdmin = useMemo(
    () => roleList.includes(ROLES.ADMIN),
    [roleList]
  );

  const sortedTempGrants = useMemo(() => {
    const list = Array.isArray(tempGrants) ? [...tempGrants] : [];
    list.sort(
      (a, b) => new Date(a.expiresAt || 0) - new Date(b.expiresAt || 0)
    );
    return list;
  }, [tempGrants]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="DASHBOARD"
        title={`Hi, ${user?.username || user?.email?.split("@")[0] || "there"}`}
        subtitle="Your identity, access, and live security context — pulled fresh from the backend."
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate("/account")}>
              Account
            </Button>
            <Button variant="secondary" onClick={() => navigate("/learn")}>
              Learn IAM
            </Button>
            {isAdmin && (
              <Button onClick={() => navigate("/admin")}>
                Admin Console
              </Button>
            )}
          </>
        }
      />

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat
          label="Roles"
          value={roleList.length}
          hint={roleList.join(", ") || "None"}
        />
        <Stat
          label="Permissions"
          value={permCombined.length}
          hint={`${permPermanent.length} permanent · ${permTemporary.length} temp`}
        />
        <Stat
          label="JIT grants"
          value={sortedTempGrants.length}
          hint="Active right now"
          accent={sortedTempGrants.length ? "warn" : undefined}
        />
        <Stat
          label="MFA"
          value={user?.mfaEnabled ? "On" : "Off"}
          hint={user?.mfaEnabled ? "Multi-factor enabled" : "Not enabled yet"}
          accent={user?.mfaEnabled ? "good" : "warn"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile */}
        <Card padded>
          <CardHeader
            eyebrow="PROFILE"
            title="Identity"
            subtitle="Your account and security flags."
          />
          <div className="mt-5 space-y-3">
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
          <div className="mt-5 text-xs text-white/55 leading-relaxed">
            IAM starts here — identity is the anchor for every authorization
            decision and every audit log entry.
          </div>
        </Card>

        {/* Roles */}
        <Card padded>
          <CardHeader
            eyebrow="ACCESS"
            title="Roles"
            subtitle="Roles bundle permissions. Changes apply instantly."
            right={
              <span className="text-xs text-white/55">
                {roleList.length} role{roleList.length === 1 ? "" : "s"}
              </span>
            }
          />
          <div className="mt-5">
            {roleList.length === 0 ? (
              <EmptyState
                title="No roles yet"
                subtitle="An admin can assign you a role from the Users & Roles page."
              />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {roleList.map((r) => (
                  <Chip key={r}>{r}</Chip>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Permissions */}
        <Card padded>
          <CardHeader
            eyebrow="EFFECTIVE"
            title="Permissions"
            subtitle="Permanent + temporary. The union is what routes check."
            right={
              <span className="text-xs text-white/55">
                {permCombined.length} total
              </span>
            }
          />
          <div className="mt-5">
            {permCombined.length === 0 ? (
              <EmptyState
                title="No permissions"
                subtitle="Even baseline access is missing — contact an admin."
              />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {permCombined.slice(0, 12).map((p) => (
                  <span
                    key={p}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-white/80 font-mono"
                  >
                    {p}
                  </span>
                ))}
                {permCombined.length > 12 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-white/55">
                    +{permCombined.length - 12} more
                  </span>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Temp grants */}
      <Card padded>
        <CardHeader
          eyebrow="JUST-IN-TIME"
          title="Your temporary grants"
          subtitle="Time-bound permissions assigned to you. They expire automatically."
          right={
            <span className="text-xs text-white/55">
              {sortedTempGrants.length} active
            </span>
          }
        />
        <div className="mt-5">
          {sortedTempGrants.length === 0 ? (
            <EmptyState
              title="No active grants"
              subtitle="Temporary access is used for short tasks (5–30 minutes). Ask an admin for a grant when you need elevated permissions."
              action={
                <Button variant="secondary" onClick={() => navigate("/learn")}>
                  Learn how JIT works
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {sortedTempGrants.map((g) => {
                const mins = minutesUntil(g.expiresAt);
                const expiringSoon = mins !== null && mins <= 5;
                return (
                  <motion.div
                    key={g.id || `${g.permission}-${g.expiresAt}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="info">{g.permission || "TEMP_PERMISSION"}</Badge>
                        {mins !== null && (
                          <Badge variant={expiringSoon ? "warn" : "good"}>
                            {mins === 0 ? "Expiring" : `${mins} min left`}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-white/55">
                        Expires {formatDate(g.expiresAt)}
                      </div>
                      {g.reason && (
                        <div className="mt-2 text-sm text-white/70">
                          <span className="text-white/50">Reason:</span> {g.reason}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-white/55">
                      Granted {formatDate(g.createdAt)}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Education recap */}
      <Card padded>
        <CardHeader
          eyebrow="MENTAL MODEL"
          title="How IAM works in this app"
        />
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <MiniExplain
            n="1"
            title="Authenticate"
            text="You log in. The backend sets an httpOnly cookie that carries your user id + session id."
          />
          <MiniExplain
            n="2"
            title="Authorize"
            text="Every request is checked against your permissions — including active temporary grants."
          />
          <MiniExplain
            n="3"
            title="Audit"
            text="Sensitive actions write to the audit log so you can answer 'who did what, when'."
          />
        </div>
      </Card>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm text-white/55">{label}</div>
      <div className="text-sm text-white text-right truncate max-w-[60%]">
        {value}
      </div>
    </div>
  );
}

function MiniExplain({ n, title, text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="text-[11px] font-mono text-white/45">{n}</div>
      <div className="mt-1 text-sm font-semibold text-white">{title}</div>
      <p className="mt-2 text-sm text-white/65 leading-relaxed">{text}</p>
    </div>
  );
}
