// src/utils/api.js
import axios from "axios";

// This module manages *only* axios logic.
// AuthContext will inject the token using setAuthToken().

// ---------------------------------------------
// 1. Create axios instance
// ---------------------------------------------
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: false, // We use Bearer token instead of cookies
  timeout: 15000,
});

// ---------------------------------------------
// 2. Token stored in memory (not read directly from localStorage here)
// ---------------------------------------------
let authToken = null;

// Helper so AuthContext can update the token:
export function setAuthToken(token) {
  authToken = token;

  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

// ---------------------------------------------
// 3. Request interceptor – attaches token if present
// ---------------------------------------------
api.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers["Authorization"] = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------
// 4. Response interceptor – auto-logout on 401
// ---------------------------------------------
//
// We cannot access AuthContext directly here, so we expose a callback.
// AuthContext will register logoutHandler() when it initializes.
// ---------------------------------------------
let logoutCallback = null;

export function registerLogoutHandler(callback) {
  logoutCallback = callback;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      console.warn("API: received 401, triggering logout…");
      if (logoutCallback) logoutCallback();
    }
    return Promise.reject(error);
  }
);

export default api;
