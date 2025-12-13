import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";


export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login({ identifier, password });
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || "Invalid credentials");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.35)] p-7">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
            <p className="mt-1 text-sm text-white/60">
              Log in to explore roles, permissions, audit logs, and temp access.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-white/70">Email or Username</label>
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoComplete="username"
                placeholder="e.g. admin@demo.com or admin"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-white/20 focus:bg-white/10 transition"

              />
            </div>

            <div>
              <label className="text-sm text-white/70">Password</label>
              <div className="mt-2 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-white/20 focus-within:bg-white/10 transition">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  type={showPass ? "text" : "password"}
                  placeholder="Your password"
                  className="w-full bg-transparent text-white placeholder:text-white/40 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="text-xs font-semibold text-white/60 hover:text-white transition"
                >
                  {showPass ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            <button
              disabled={submitting}
              type="submit"
              className="w-full rounded-2xl px-4 py-3 text-sm font-semibold text-black bg-white hover:bg-white/90 transition shadow disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="mt-6 text-sm text-white/60">
            Don’t have an account?{" "}
            <Link to="/signup" className="text-white hover:underline">
              Create one
            </Link>
          </div>

          <div className="mt-4 text-xs text-white/50">
            Tip: Use your login to check your permissions on the dashboard.
          </div>
        </div>
      </motion.div>
    
  );
}
