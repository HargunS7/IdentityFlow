
import React, { createContext, useContext, useEffect, useState } from "react";
import { login as loginService, signup as signupService, logout as logoutService } from "../services/authService.js";
import { getMe } from "../services/iamService.js";
import { setAuthToken, registerLogoutHandler } from "../utils/api.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // -------------------------------------------------
  // Core auth state
  // -------------------------------------------------
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState({
    permanent: [],
    temporary: [],
    combined: [],
  });
  const [tempGrants, setTempGrants] = useState([]);
  const [loading, setLoading] = useState(true); // for initial bootstrap

  const isAuthenticated = !!token && !!user;

  // -------------------------------------------------
  // Initialize axios token + logout handler on mount
  // -------------------------------------------------
  useEffect(() => {
    if (token) {
      setAuthToken(token); // attach to axios
    }

    // Register a callback so axios can auto-logout on 401
    registerLogoutHandler(() => {
      console.log("AuthContext: received 401 from backend → logging out.");
      handleLogout();
    });
  }, []);

  // -------------------------------------------------
  // Bootstrap: if token exists, fetch /api/me
  // -------------------------------------------------
  useEffect(() => {
    async function bootstrap() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setAuthToken(token);
        const profile = await getMe();

        // Expecting: { user, roles, permissions, tempGrants }
        setUser(profile.user);
        setRoles(profile.roles || []);
        setPermissions(profile.permissions || {});
        setTempGrants(profile.tempGrants || []);
      } catch (err) {
        console.error("Bootstrap /api/me failed:", err);
        handleLogout(false); // quiet logout
      }

      setLoading(false);
    }

    bootstrap();
  }, [token]);

  // -------------------------------------------------
  // Auth actions
  // -------------------------------------------------

  // LOGIN
  async function handleLogin({ identifier, password }) {
    const data = await loginService({ identifier, password });

    // Expecting: { user: {...}, token: "JWT" }
    const newToken = data.user?.token || data.token;
    if (!newToken) throw new Error("No token received from backend.");

    localStorage.setItem("token", newToken);
    setToken(newToken);
    setAuthToken(newToken);

    // Fetch IAM profile to populate roles/perms/etc.
    const profile = await getMe();
    setUser(profile.user);
    setRoles(profile.roles || []);
    setPermissions(profile.permissions || {});
    setTempGrants(profile.tempGrants || []);

    return profile.user;
  }

  // SIGNUP
  async function handleSignup({ email, username, password }) {
    const data = await signupService({ email, username, password });

    // After signup, backend should return token
    const newToken = data.user?.token || data.token;
    if (!newToken) throw new Error("No token returned from signup.");

    localStorage.setItem("token", newToken);
    setToken(newToken);
    setAuthToken(newToken);

    const profile = await getMe();
    setUser(profile.user);
    setRoles(profile.roles || []);
    setPermissions(profile.permissions || {});
    setTempGrants(profile.tempGrants || []);

    return profile.user;
  }

  // LOGOUT
  async function handleLogout(callBackend = true) {
    try {
      if (callBackend) await logoutService();
    } catch (err) {
      console.warn("Logout backend failed, ignoring.");
    }

    localStorage.removeItem("token");
    setToken(null);
    setAuthToken(null);
    setUser(null);
    setRoles([]);
    setPermissions({
      permanent: [],
      temporary: [],
      combined: [],
    });
    setTempGrants([]);
  }

  // OPTIONAL: force-refresh /api/me
  async function refreshProfile() {
    const profile = await getMe();
    setUser(profile.user);
    setRoles(profile.roles || []);
    setPermissions(profile.permissions || {});
    setTempGrants(profile.tempGrants || []);
    return profile;
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        roles,
        permissions,
        tempGrants,
        loading,
        isAuthenticated,
        login: handleLogin,
        signup: handleSignup,
        logout: handleLogout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Simple hook for use in any component:
export const useAuth = () => useContext(AuthContext);
