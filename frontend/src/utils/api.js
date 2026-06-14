import axios from "axios";

// We rely on the httpOnly access_token cookie set by the backend.
// `withCredentials: true` makes the browser send + accept cookies on
// cross-origin XHR requests. Combined with the backend's CORS
// `credentials: true` + explicit origin allow-list, this is safe.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true,
  // 30s: a free-tier backend (e.g. Render) can take ~50s to wake from a cold
  // start. An uptime pinger on /health keeps it warm; this just stops the
  // first request from failing while it boots. Tune with VITE_API_TIMEOUT.
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
});

// AuthContext registers a callback so we can clear in-memory user state
// when the backend says the session is gone.
let logoutCallback = null;
export function registerLogoutHandler(callback) {
  logoutCallback = callback;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && logoutCallback) {
      logoutCallback();
    }
    return Promise.reject(error);
  }
);

export default api;
