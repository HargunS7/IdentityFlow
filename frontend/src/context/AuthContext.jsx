import React, { createContext, useContext, useEffect, useState } from "react";
import {
  login as loginService,
  signup as signupService,
  logout as logoutService,
} from "../services/authService.js";
import { getMe } from "../services/iamService.js";
import { registerLogoutHandler } from "../utils/api.js";

const AuthContext = createContext(null);

/**
 * Cookie-based auth.
 *  - No token is stored in JS/localStorage.
 *  - The backend sets an httpOnly `access_token` cookie on login/signup.
 *  - On mount we call /api/me to find out if the cookie is still valid.
 *  - On 401 from any API call we clear in-memory state and redirect.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState({
    permanent: [],
    temporary: [],
    combined: [],
  });
  const [tempGrants, setTempGrants] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  function clearAuthState() {
    setUser(null);
    setRoles([]);
    setPermissions({ permanent: [], temporary: [], combined: [] });
    setTempGrants([]);
  }

  function applyProfile(profile) {
    setUser(profile.user);
    setRoles(profile.roles || []);
    setPermissions(profile.permissions || {});
    setTempGrants(profile.tempGrants || []);
  }

  // Register 401 handler so axios can ask us to drop state.
  useEffect(() => {
    registerLogoutHandler(() => {
      clearAuthState();
    });
  }, []);

  // Bootstrap: ask /api/me whether the cookie is still good.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await getMe();
        if (!cancelled) applyProfile(profile);
      } catch {
        if (!cancelled) clearAuthState();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogin({ identifier, password }) {
    await loginService({ identifier, password });
    const profile = await getMe();
    applyProfile(profile);
    return profile.user;
  }

  async function handleSignup({ email, username, password }) {
    await signupService({ email, username, password });
    const profile = await getMe();
    applyProfile(profile);
    return profile.user;
  }

  async function handleLogout(callBackend = true) {
    try {
      if (callBackend) await logoutService();
    } catch {
      // Even if the backend logout fails, we still clear local state.
    }
    clearAuthState();
  }

  async function refreshProfile() {
    const profile = await getMe();
    applyProfile(profile);
    return profile;
  }

  return (
    <AuthContext.Provider
      value={{
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

export const useAuth = () => useContext(AuthContext);
