import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";
import { Button, Input, Field } from "../components/ui.jsx";

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
      setError(err?.response?.data?.error || "Invalid credentials");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_30px_70px_rgba(0,0,0,0.45)] p-7"
    >
      <div className="mb-6">
        <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">
          Welcome back
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-white">
          Sign in to IdentityFlow
        </h1>
        <p className="mt-1 text-sm text-white/60">
          Explore roles, permissions, audit logs, and just-in-time access.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email or username">
          <Input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            autoComplete="username"
            placeholder="admin@example.com or admin"
          />
        </Field>

        <Field label="Password">
          <div className="relative">
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              type={showPass ? "text" : "password"}
              placeholder="Your password"
              className="pr-16"
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-2 py-1 text-[11px] font-semibold text-white/60 hover:text-white hover:bg-white/5 transition"
            >
              {showPass ? "HIDE" : "SHOW"}
            </button>
          </div>
        </Field>

        <Button
          type="submit"
          loading={submitting}
          className="w-full"
          size="lg"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="mt-6 text-sm text-white/60">
        Don't have an account?{" "}
        <Link to="/signup" className="text-white hover:underline">
          Create one
        </Link>
      </div>

      <div className="mt-4 text-[11px] text-white/45">
        Cookies are set httpOnly — no JWT touches the browser's localStorage.
      </div>
    </motion.div>
  );
}
