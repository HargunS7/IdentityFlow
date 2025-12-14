import React, { useEffect, useMemo, useState } from "react";
import AnimatedWrapper from "../../components/animatedWrapper.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { hasPerm } from "../../utils/permissions.js";
import { listUsers, assignRole, removeRole, deleteUser } from "../../services/adminService.js";

// ✅ Non-admin roles only
const ASSIGNABLE_ROLES = ["user", "manager", "security_analyst", "auditor"];

function Chip({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
      {children}
    </span>
  );
}

export default function AdminUsers() {
  const { permissions } = useAuth();

  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const [selectedAssignByUser, setSelectedAssignByUser] = useState({});
  const [selectedRemoveByUser, setSelectedRemoveByUser] = useState({});

  const canReadUsers =  hasPerm(permissions, "ADMIN");
  const canAssign = hasPerm(permissions, "ROLE_ASSIGN");
  const canDelete = hasPerm(permissions, "USER_DELETE");

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");
      const data = await listUsers();
      setUsers(data?.users || data || []);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (canReadUsers) loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUsers = useMemo(() => {
    if (!q.trim()) return users;
    const s = q.toLowerCase();
    return users.filter((u) =>
      (u.email || "").toLowerCase().includes(s) ||
      (u.username || "").toLowerCase().includes(s)
    );
  }, [users, q]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }

  async function handleAssign(userId) {
    const roleName = selectedAssignByUser[userId];
    if (!roleName) return;

    try {
      await assignRole(userId, roleName);
      showToast(`Assigned ${roleName} ✅`);
      await loadUsers();
    } catch (e) {
      console.error(e);
      showToast(e?.response?.data?.error || "Assign failed ❌");
    }
  }

  async function handleRemove(userId) {
    const roleName = selectedRemoveByUser[userId];
    if (!roleName) return;

    try {
      await removeRole(userId, roleName);
      showToast(`Removed ${roleName} ✅`);
      await loadUsers();
    } catch (e) {
      console.error(e);
      showToast(e?.response?.data?.error || "Remove failed ❌");
    }
  }

  async function handleDelete(userId) {
    if (!confirm("Delete this user?")) return;
    try {
      await deleteUser(userId);
      showToast("User deleted ✅");
      await loadUsers();
    } catch (e) {
      console.error(e);
      showToast(e?.response?.data?.error || "Delete failed ❌");
    }
  }

  if (!canReadUsers) {
    return (
      <AnimatedWrapper>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white">
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="mt-2 text-white/70">You don’t have permission to view users.</p>
        </div>
      </AnimatedWrapper>
    );
  }

  return (
    <AnimatedWrapper>
      <div className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-white">Users</h1>
            <p className="mt-1 text-sm text-white/60">
              Search, assign roles, and manage users.
            </p>
          </div>

          <div className="w-full md:w-80">
            <label className="text-xs text-white/60">Search</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="email or username..."
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-white/20 focus:bg-white/10 transition"
            />
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
          <p className="text-white/60">Loading users…</p>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((u) => {
              const userRoles = Array.isArray(u.roles) ? u.roles : [];
              const removableRoles = userRoles.filter((r) => r !== "admin");

              return (
                <div
                  key={u.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  {/* Left */}
                  <div>
                    <div className="text-white font-semibold">
                      {u.email}
                      {u.username ? (
                        <span className="text-white/60 font-normal"> • @{u.username}</span>
                      ) : null}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {userRoles.length === 0 ? (
                        <span className="text-xs text-white/60">No roles</span>
                      ) : (
                        userRoles.map((r) => <Chip key={r}>{r}</Chip>)
                      )}
                    </div>
                  </div>

                  {/* Right */}
                  <div className="flex flex-col md:flex-row gap-2 md:items-center">
                    {/* Assign */}
                    {canAssign && (
                      <div className="flex gap-2 items-center">
                        <select
                          value={selectedAssignByUser[u.id] || ""}
                          onChange={(e) =>
                            setSelectedAssignByUser((prev) => ({
                              ...prev,
                              [u.id]: e.target.value,
                            }))
                          }
                          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                        >
                          <option value="">Select role…</option>
                          {ASSIGNABLE_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => handleAssign(u.id)}
                          disabled={!selectedAssignByUser[u.id]}
                          className="rounded-xl px-3 py-2 text-xs font-semibold bg-white/10 hover:bg-white/15 border border-white/10 text-white disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Assign
                        </button>
                      </div>
                    )}

                    {/* Remove */}
                    {canAssign && (
                      <div className="flex gap-2 items-center">
                        <select
                          value={selectedRemoveByUser[u.id] || ""}
                          onChange={(e) =>
                            setSelectedRemoveByUser((prev) => ({
                              ...prev,
                              [u.id]: e.target.value,
                            }))
                          }
                          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                        >
                          <option value="">Remove role…</option>
                          {removableRoles.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => handleRemove(u.id)}
                          disabled={!selectedRemoveByUser[u.id]}
                          className="rounded-xl px-3 py-2 text-xs font-semibold bg-white/10 hover:bg-white/15 border border-white/10 text-white disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    {/* Delete */}
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="rounded-xl px-3 py-2 text-xs font-semibold bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-200"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredUsers.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                No users match your search.
              </div>
            )}
          </div>
        )}
      </div>
    </AnimatedWrapper>
  );
}
