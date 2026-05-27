import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";
import { Button, Input, Field } from "../components/ui.jsx";

const PASSWORD_HINTS = [
  "8–128 characters",
  "lowercase + uppercase + digit + special",
  "no part of your email or username",
];

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signup({ email, username: username || undefined, password });
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.error || "Signup failed");
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
          Get started
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-white">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-white/60">
          Try a real RBAC dashboard — roles, permissions, and audit logs.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email">
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            type="email"
            placeholder="you@example.com"
          />
        </Field>

        <Field label="Username (optional)" hint="3–32 chars: letters, numbers, _ . -">
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            placeholder="oneshot"
          />
        </Field>

        <Field label="Password">
          <div className="relative">
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              type={showPass ? "text" : "password"}
              placeholder="Create a strong password"
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
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PASSWORD_HINTS.map((h) => (
              <span
                key={h}
                className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/55"
              >
                {h}
              </span>
            ))}
          </div>
        </Field>

        <Button
          type="submit"
          loading={submitting}
          className="w-full"
          size="lg"
        >
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <div className="mt-6 text-sm text-white/60">
        Already have an account?{" "}
        <Link to="/login" className="text-white hover:underline">
          Sign in
        </Link>
      </div>

      <div className="mt-4 text-[11px] text-white/45">
        New users are created with the baseline <span className="font-mono">user</span> role. Admins can promote you later.
      </div>
    </motion.div>
  );
}
