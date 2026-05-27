import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext.jsx";
import { ROLES } from "../utils/permissions.js";
import { updateMe } from "../services/adminService.js";

import {
  PageHeader,
  Card,
  CardHeader,
  Button,
  Input,
  Field,
  Badge,
  Chip,
  Mono,
  EmptyState,
  Stat,
} from "../components/ui.jsx";
import { formatDate, minutesUntil } from "../utils/format.js";

export default function Account() {
  const navigate = useNavigate();
  const { user, roles, permissions, tempGrants, logout, refreshProfile } = useAuth();

  const [refreshing, setRefreshing] = useState(false);

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

  const isAdmin = useMemo(
    () => roleList.includes(ROLES.ADMIN),
    [roleList]
  );

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refreshProfile();
      toast.success("Profile refreshed");
    } catch {
      toast.error("Refresh failed");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  async function handleSaveUsername() {
    const next = usernameInput.trim();
    if (!next) {
      toast.error("Username cannot be empty");
      return;
    }
    setSavingUsername(true);
    try {
      await updateMe({ username: next });
      await refreshProfile();
      toast.success("Username updated");
      setEditingUsername(false);
    } catch (e) {
      toast.error(e?.response?.data?.error || "Update failed");
    } finally {
      setSavingUsername(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ACCOUNT"
        title="Your account"
        subtitle="Manage your identity and review your access state."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={handleRefresh}
              loading={refreshing}
            >
              Refresh
            </Button>
            {isAdmin && (
              <Button onClick={() => navigate("/admin")}>
                Admin Console
              </Button>
            )}
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Roles" value={roleList.length} />
        <Stat
          label="Permissions"
          value={permCombined.length}
          hint={`${permPermanent.length} permanent`}
        />
        <Stat
          label="Temp grants"
          value={grants.length}
          accent={grants.length ? "warn" : undefined}
        />
        <Stat
          label="MFA"
          value={user?.mfaEnabled ? "On" : "Off"}
          accent={user?.mfaEnabled ? "good" : "warn"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Identity */}
        <Card padded>
          <CardHeader
            eyebrow="IDENTITY"
            title="Profile"
            subtitle="Basic account attributes."
          />
          <div className="mt-5 space-y-3">
            <Row label="Email" value={user?.email || "—"} />

            {/* Username row (editable) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-white/55">Username</div>
                {!editingUsername ? (
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-white">
                      {user?.username || "—"}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingUsername(true)}
                    >
                      Edit
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setUsernameInput(user?.username || "");
                      setEditingUsername(false);
                    }}
                  >
                    Close
                  </Button>
                )}
              </div>

              {editingUsername && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className="rounded-2xl border border-white/10 bg-black/20 p-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Input
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="Enter username"
                      maxLength={32}
                      autoFocus
                    />
                    <Button
                      onClick={handleSaveUsername}
                      loading={savingUsername}
                    >
                      Save
                    </Button>
                  </div>
                  <div className="mt-2 text-xs text-white/50">
                    Letters, numbers, _ . - (3–32 chars, must start with a letter).
                  </div>
                </motion.div>
              )}
            </div>

            <Row label="User ID" value={<Mono>{user?.id || "—"}</Mono>} />
            <Row label="Created" value={formatDate(user?.createdAt)} />
          </div>

          <div className="mt-6 flex gap-2">
            <Button variant="danger" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </Card>

        {/* Security */}
        <Card padded>
          <CardHeader
            eyebrow="SECURITY"
            title="MFA & session hygiene"
            subtitle="Stronger auth keeps you safer."
          />
          <div className="mt-5 space-y-3">
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
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">
                Coming soon
              </div>
              <p className="mt-2 text-sm text-white/65 leading-relaxed">
                MFA enrollment is in the next phase. The schema, libraries
                (speakeasy + qrcode), and the mfaEnabled flag are already in
                place — just the flow isn't built yet.
              </p>
            </div>
            <div className="text-xs text-white/55">
              Tip: prefer temporary access for risky tasks over permanent
              privileges.
            </div>
          </div>
        </Card>

        {/* Access */}
        <Card padded>
          <CardHeader
            eyebrow="ACCESS"
            title="Roles & permissions"
            subtitle="What this account can do right now."
          />
          <div className="mt-5">
            <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">
              Roles
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {roleList.length ? (
                roleList.map((r) => <Chip key={r}>{r}</Chip>)
              ) : (
                <span className="text-sm text-white/55">None</span>
              )}
            </div>
          </div>
          <div className="mt-5">
            <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">
              Permission breakdown
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge>{permPermanent.length} permanent</Badge>
              <Badge variant="info">{permTemporary.length} temp</Badge>
              <Badge variant="good">{permCombined.length} effective</Badge>
            </div>
            <div className="mt-3 text-xs text-white/55 leading-relaxed">
              Effective = permanent ∪ active temporary. That's the set every
              route checks.
            </div>
          </div>
        </Card>
      </div>

      {/* Temp grants */}
      <Card padded>
        <CardHeader
          eyebrow="JUST-IN-TIME"
          title="Active temporary grants"
          subtitle="Time-bound permissions assigned to your account."
        />
        <div className="mt-5">
          {grants.length === 0 ? (
            <EmptyState
              title="No active grants"
              subtitle="Ask an admin for a temporary permission when you need elevated access for a short task."
            />
          ) : (
            <div className="space-y-3">
              {grants.map((g) => {
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
                        <Badge variant="info">{g.permission}</Badge>
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
