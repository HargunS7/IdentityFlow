import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function AdminGate({ children }) {
  const { user, roles } = useAuth();
  const navigate = useNavigate();

  const isAdmin = roles?.includes("admin");

  if (isAdmin) {
    return children;
  }

  // 🚫 Non-admin view
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8">
        <div className="text-xs uppercase tracking-wider text-white/60">
          Access restricted
        </div>

        <h1 className="mt-2 text-2xl font-semibold text-white">
          Admin access required
        </h1>

        <p className="mt-3 text-sm text-white/70 leading-relaxed">
          This section is protected by <span className="text-white">role-based access control (RBAC)</span>.
          Only users with the <span className="text-white">admin</span> role can manage users, sessions,
          audit logs, and temporary access.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-2xl px-4 py-2 text-sm font-semibold bg-white text-black hover:bg-white/90 transition"
          >
            Back to Dashboard
          </button>

          <button
            onClick={() => navigate("/learn")}
            className="rounded-2xl px-4 py-2 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition"
          >
            Learn about IAM
          </button>
        </div>

        <div className="mt-4 text-xs text-white/50">
          Tip: Admin roles are assigned by system administrators.
        </div>
      </div>
    </div>
  );
}
