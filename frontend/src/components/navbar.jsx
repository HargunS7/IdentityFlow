// src/components/Navbar.jsx
import React, { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";

const linkBase =
  "px-3 py-2 rounded-lg text-sm font-medium transition-colors";
const linkActive =
  "bg-white/10 text-white";
const linkInactive =
  "text-white/70 hover:text-white hover:bg-white/10";

function LinkItem({ to, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `${linkBase} ${isActive ? linkActive : linkInactive}`
      }
    >
      {label}
    </NavLink>
  );
}

export default function Navbar() {
  const { user, roles, permissions, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const isAdmin = useMemo(() => {
    if (roles?.includes("admin")) return true;
    const combined = permissions?.combined || permissions || [];
    return combined.includes("USER_READ") || combined.includes("TEMP_GRANT");
  }, [roles, permissions]);

  const displayName = user?.username || user?.email || "User";

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="sticky top-0 z-50 w-full">
      <div className="mx-auto max-w-6xl px-4 pt-4">
        {/* Glass navbar */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition hover:bg-white/10">
          <div className="flex items-center justify-between px-4 py-2">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400/70 to-fuchsia-500/60" />
              <div className="leading-tight">
                <div className="text-sm font-semibold text-white">
                  IAM Playground
                </div>
                <div className="text-xs text-white/60">
                  Roles • Permissions • Audit
                </div>
              </div>
            </div>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-2">
              <LinkItem to="/dashboard" label="Dashboard" />
              <LinkItem to="/learn" label="Learn IAM" />
              <LinkItem to="/account" label="Account" />
              {isAdmin && <LinkItem to="/admin" label="Admin" />}
            </div>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm text-white">{displayName}</div>
                <div className="text-xs text-white/60">
                  {isAdmin ? "Admin access" : "Standard access"}
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-lg text-sm font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition"
              >
                Logout
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setOpen((v) => !v)}
              className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg bg-white/10 border border-white/10 text-white"
              aria-label="Toggle menu"
            >
              <span className="text-lg">{open ? "✕" : "☰"}</span>
            </button>
          </div>

          {/* Mobile dropdown */}
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="md:hidden overflow-hidden border-t border-white/10"
              >
                <div className="px-3 py-3 flex flex-col gap-2">
                  <div className="px-2 py-2 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-sm text-white">{displayName}</div>
                    <div className="text-xs text-white/60">
                      {isAdmin ? "Admin access" : "Standard access"}
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <LinkItem to="/dashboard" label="Dashboard" onClick={() => setOpen(false)} />
                    <LinkItem to="/learn" label="Learn IAM" onClick={() => setOpen(false)} />
                    <LinkItem to="/account" label="Account" onClick={() => setOpen(false)} />
                    {isAdmin && <LinkItem to="/admin" label="Admin" onClick={() => setOpen(false)} />}
                  </div>

                  <button
                    onClick={handleLogout}
                    className="mt-2 w-full px-3 py-2 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition"
                  >
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
