import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import { motion } from "framer-motion";

const card = {
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16,
  padding: "1rem",
  marginBottom: "1rem",
  background: "linear-gradient(180deg, rgba(13,23,67,0.9), rgba(13,23,67,0.75))",
  boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  color: "#e5e7eb",
};

const Dashboard = () => {
  const { user, logout } = useAuth();

  const [profileOpen, setProfileOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState("");

  const [audits, setAudits] = useState([]);
  const [auditsLoading, setAuditsLoading] = useState(false);
  const [auditsError, setAuditsError] = useState("");

  const [adminUsers, setAdminUsers] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");

  const isAdmin = useMemo(() => {
    const roles = user?.roles || [];
    return Array.isArray(roles) && roles.includes("admin");
  }, [user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setSessionsLoading(true);
      setSessionsError("");
      try {
        const res = await api.get("/api/auth/sessions");
        setSessions(Array.isArray(res.data) ? res.data : res.data?.sessions || []);
      } catch (e) {
        setSessionsError("Failed to load sessions");
      } finally {
        setSessionsLoading(false);
      }
    })();

    (async () => {
      setAuditsLoading(true);
      setAuditsError("");
      try {
        const res = await api.get("/api/auth/audit-logs?limit=10");
        setAudits(Array.isArray(res.data) ? res.data : res.data?.logs || []);
      } catch (e) {
        setAuditsError("Failed to load audit logs");
      } finally {
        setAuditsLoading(false);
      }
    })();

    if (isAdmin) {
      (async () => {
        setAdminLoading(true);
        setAdminError("");
        try {
          const res = await api.get("/api/admin/users");
          setAdminUsers(Array.isArray(res.data) ? res.data : res.data?.users || []);
        } catch (e) {
          setAdminError("Failed to load users");
        } finally {
          setAdminLoading(false);
        }
      })();
    }
  }, [user, isAdmin]);

  if (!user) {
    return <div style={{ maxWidth: 960, margin: "2rem auto" }}>Please log in.</div>;
  }

  const onUpdateProfile = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    try {
      // TODO: Wire to backend API
      // await api.patch("/api/profile", { username, password: newPassword });
      alert("Profile update submitted (placeholder)");
      setProfileOpen(false);
      setUsername("");
      setNewPassword("");
    } catch (_) {
      alert("Failed to update profile");
    } finally {
      setLoadingProfile(false);
    }
  };

  const revokeSession = async (sessionId) => {
    try {
      // TODO: Wire to backend API
      // await api.post(`/api/sessions/${sessionId}/revoke`)
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, active: false } : s)));
    } catch (_) {
      alert("Failed to revoke session");
    }
  };

  const sectionTitle = (title) => (
    <h3 style={{ marginTop: 0, marginBottom: "0.75rem", fontSize: "1.1rem", color: "#c084fc" }}>{title}</h3>
  );

  return (
    <motion.div style={{ maxWidth: 960, margin: "2rem auto", padding: "0 1rem", color: "#e5e7eb" }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <h2 style={{ marginBottom: "1rem", color: "#c084fc" }}>Dashboard</h2>

      {/* Profile */}
      <motion.div style={card} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        {sectionTitle("Profile")}
        <div style={{ display: "grid", gap: "0.25rem" }}>
          <div><strong>User ID:</strong> {user.id}</div>
          <div><strong>Email:</strong> {user.email}</div>
          {user.username && <div><strong>Username:</strong> {user.username}</div>}
          {user.mfaEnabled !== undefined && (
            <div><strong>MFA Enabled:</strong> {user.mfaEnabled ? "Yes" : "No"}</div>
          )}
          {user.createdAt && (
            <div><strong>Created:</strong> {new Date(user.createdAt).toLocaleString()}</div>
          )}
        </div>
        <div style={{ marginTop: "0.75rem" }}>
          <button onClick={() => setProfileOpen((s) => !s)}>
            {profileOpen ? "Close" : "Update Profile"}
          </button>
        </div>

        {profileOpen && (
          <form onSubmit={onUpdateProfile} style={{ marginTop: "0.75rem", display: "grid", gap: "0.5rem" }}>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="New username"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
            />
            <button type="submit" disabled={loadingProfile}>
              {loadingProfile ? "Saving..." : "Save"}
            </button>
          </form>
        )}
      </motion.div>

      {/* Sessions */}
      <motion.div style={card} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        {sectionTitle("Sessions")}
        {sessionsLoading ? (
          <div>Loading sessions...</div>
        ) : sessionsError ? (
          <div style={{ color: "#fca5a5" }}>{sessionsError}</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: 6 }}>Device</th>
                  <th style={{ textAlign: "left", padding: 6 }}>IP</th>
                  <th style={{ textAlign: "left", padding: 6 }}>Created</th>
                  <th style={{ textAlign: "left", padding: 6 }}>Expires</th>
                  <th style={{ textAlign: "left", padding: 6 }}>Active</th>
                  <th style={{ textAlign: "left", padding: 6 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td style={{ padding: 6, borderTop: "1px solid rgba(255,255,255,0.08)" }}>{s.userAgent || "Unknown"}</td>
                    <td style={{ padding: 6, borderTop: "1px solid rgba(255,255,255,0.08)" }}>{s.ip || "-"}</td>
                    <td style={{ padding: 6, borderTop: "1px solid rgba(255,255,255,0.08)" }}>{s.createdAt ? new Date(s.createdAt).toLocaleString() : "-"}</td>
                    <td style={{ padding: 6, borderTop: "1px solid rgba(255,255,255,0.08)" }}>{s.expiresAt ? new Date(s.expiresAt).toLocaleString() : "-"}</td>
                    <td style={{ padding: 6, borderTop: "1px solid rgba(255,255,255,0.08)" }}>{s.active ? "Yes" : "No"}</td>
                    <td style={{ padding: 6, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                      <button onClick={() => revokeSession(s.id)} disabled={!s.active}>Revoke</button>
                    </td>
                  </tr>
                ))}
                {sessions.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ padding: 6, borderTop: "1px solid rgba(255,255,255,0.08)" }}>No sessions found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Audit Logs */}
      <motion.div style={card} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        {sectionTitle("Recent Audit Logs")}
        {auditsLoading ? (
          <div>Loading audit logs...</div>
        ) : auditsError ? (
          <div style={{ color: "#fca5a5" }}>{auditsError}</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: 6 }}>Time</th>
                  <th style={{ textAlign: "left", padding: 6 }}>Action</th>
                  <th style={{ textAlign: "left", padding: 6 }}>IP</th>
                  <th style={{ textAlign: "left", padding: 6 }}>Meta</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((a) => (
                  <tr key={a.id}>
                    <td style={{ padding: 6, borderTop: "1px solid rgba(255,255,255,0.08)" }}>{a.createdAt ? new Date(a.createdAt).toLocaleString() : "-"}</td>
                    <td style={{ padding: 6, borderTop: "1px solid rgba(255,255,255,0.08)" }}>{a.action}</td>
                    <td style={{ padding: 6, borderTop: "1px solid rgba(255,255,255,0.08)" }}>{a.ip || "-"}</td>
                    <td style={{ padding: 6, borderTop: "1px solid rgba(255,255,255,0.08)", fontFamily: "monospace", fontSize: 12 }}>
                      {a.meta ? JSON.stringify(a.meta) : "{}"}
                    </td>
                  </tr>
                ))}
                {audits.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ padding: 6, borderTop: "1px solid rgba(255,255,255,0.08)" }}>No logs found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Admin */}
      {isAdmin && (
        <motion.div style={card} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {sectionTitle("Admin: Users & Roles")}
          {adminLoading ? (
            <div>Loading users...</div>
          ) : adminError ? (
            <div style={{ color: "#fca5a5" }}>{adminError}</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: 6 }}>User</th>
                    <th style={{ textAlign: "left", padding: 6 }}>Email</th>
                    <th style={{ textAlign: "left", padding: 6 }}>Roles</th>
                    <th style={{ textAlign: "left", padding: 6 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.map((u) => (
                    <tr key={u.id}>
                      <td style={{ padding: 6, borderTop: "1px solid rgba(255,255,255,0.08)" }}>{u.username || u.id}</td>
                      <td style={{ padding: 6, borderTop: "1px solid rgba(255,255,255,0.08)" }}>{u.email}</td>
                      <td style={{ padding: 6, borderTop: "1px solid rgba(255,255,255,0.08)" }}>{Array.isArray(u.roles) ? u.roles.join(", ") : "-"}</td>
                      <td style={{ padding: 6, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                        <button onClick={() => alert("Role change (placeholder)")}>Change Role</button>
                      </td>
                    </tr>
                  ))}
                  {adminUsers.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ padding: 6, borderTop: "1px solid rgba(255,255,255,0.08)" }}>No users</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* Logout */}
      <div style={{ textAlign: "right", marginTop: "1rem" }}>
        <button onClick={logout}>Log out</button>
      </div>
    </motion.div>
  );
};

export default Dashboard;

