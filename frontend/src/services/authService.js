// src/services/authService.js
import api from "../utils/api.js";

/**
 * Signup a new user
 * payload: { email, password, username? }
 */
export async function signup(payload) {
  const res = await api.post("/api/auth/signup", payload);
  return res.data;
}

/**
 * Login with email/identifier + password
 * payload: { identifier, password }
 *
 * The backend returns: { user: {...}, token: "JWT" }
 */
export async function login(payload) {
  const res = await api.post("/api/auth/login", payload);
  return res.data;
}

/**
 * Logout
 * (optional on backend, but we’ll call it for clean audit logging)
 */
export async function logout() {
  try {
    const res = await api.post("/api/auth/logout");
    return res.data;
  } catch (err) {
    console.warn("Logout request failed. Ignoring.");
    return null;
  }
}
