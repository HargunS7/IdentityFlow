import React, { useMemo, useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Navbar() {
  const { user, roles, permissions, logout } = useAuth();
  const location = useLocation();

  const [openMobile, setOpenMobile] = useState(false);
  const [openConsole, setOpenConsole] = useState(false);
  const consoleRef = useRef(null);

  useEffect(() => {
    setOpenMobile(false);
    setOpenConsole(false);
  }, [location.pathname]);

  // close console dropdown on outside click
  useEffect(() => {
    function onDocClick(e) {
      if (!consoleRef.current) return;
      if (!consoleRef.current.contains(e.target)) setOpenConsole(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const combined = Array.isArray(permissions?.combined) ? permissions.combined : [];
  const hasPerm = (p) => combined.includes(p);

  // Decide what this user can see
  const consoleLinks = useMemo(() => {
    // Console should only show for "privileged console permissions"
    // IMPORTANT: DO NOT include plain USER_READ here (regular users have it)
    const canUsers =
      hasPerm("ADMIN") ||
      hasPerm("ROLE_ASSIGN") ||
      hasPerm("USER_UPDATE") ||
      hasPerm("USER_CREATE") ||
      hasPerm("USER_DELETE");

    const canSessions = hasPerm("ADMIN") || hasPerm("SESSION_READ") || hasPerm("SESSION_REVOKE");
    const canAudit = hasPerm("ADMIN") || hasPerm("AUDIT_READ");
    const canTemp = hasPerm("ADMIN") || hasPerm("TEMP_GRANT");

    const items = [];

    // only show console if user has ANY privileged console permission
    const hasAnyConsole = canUsers || canSessions || canAudit || canTemp;
    if (!hasAnyConsole) return [];

    // Overview always first if console exists
    items.push({ to: "/admin", label: "Console Home" });

    if (canUsers) items.push({ to: "/admin/users", label: "Users & Roles" });
    if (canSessions) items.push({ to: "/admin/sessions", label: "Sessions" });
    if (canAudit) items.push({ to: "/admin/audit-logs", label: "Audit Logs" });
    if (canTemp) items.push({ to: "/admin/temp-access", label: "Temp Access" });

    return items;
  }, [combined]);

  const showConsole = consoleLinks.length > 0;

  const navLinkClass = (active) =>
    cx(
      "px-3 py-2 rounded-xl text-sm font-semibold transition",
      active ? "bg-white/10 text-white" : "text-white/70 hover:text-white hover:bg-white/5"
    );

  const isActive = (path) => location.pathname === path;

  return (
    <div className="sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.35)] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Brand */}
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-400/70 to-fuchsia-400/70 border border-white/10" />
              <div className="leading-tight">
                <div className="text-white font-semibold">IdentityFlow</div>
                <div className="text-xs text-white/60">Roles • Permissions • Audit</div>
              </div>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-2">
              <Link className={navLinkClass(isActive("/dashboard"))} to="/dashboard">
                Dashboard
              </Link>

              <Link className={navLinkClass(isActive("/learn"))} to="/learn">
                Learn IAM
              </Link>

              <Link className={navLinkClass(isActive("/account"))} to="/account">
                Account
              </Link>

              {/* Console dropdown (only if user has perms) */}
              {showConsole && (
                <div className="relative" ref={consoleRef}>
                  <button
                    onClick={() => setOpenConsole((v) => !v)}
                    className={cx(
                      "px-3 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2",
                      location.pathname.startsWith("/admin")
                        ? "bg-white/10 text-white"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    )}
                    type="button"
                  >
                    Console
                    <span className={cx("text-white/50 transition", openConsole ? "rotate-180" : "")}>
                      ▾
                    </span>
                  </button>

                  <AnimatePresence>
                    {openConsole && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/10 bg-[#0b0f19]/80 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.45)] p-2"
                      >
                        {consoleLinks.map((it) => (
                          <Link
                            key={it.to}
                            to={it.to}
                            className={cx(
                              "block rounded-xl px-3 py-2 text-sm transition",
                              location.pathname === it.to
                                ? "bg-white/10 text-white"
                                : "text-white/70 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            {it.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right leading-tight">
                <div className="text-white text-sm font-semibold">
                  {user?.username || user?.email || "user"}
                </div>
                <div className="text-xs text-white/60">
                  {roles?.includes("admin") ? "Admin access" : "Signed in"}
                </div>
              </div>
              <button
                onClick={logout}
                className="rounded-2xl px-4 py-2 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition"
              >
                Logout
              </button>
            </div>

            {/* Mobile */}
            <button
              type="button"
              className="md:hidden rounded-2xl px-3 py-2 text-sm font-semibold text-white bg-white/10 border border-white/10"
              onClick={() => setOpenMobile((v) => !v)}
            >
              Menu
            </button>
          </div>

          {/* Mobile menu */}
          <AnimatePresence>
            {openMobile && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden overflow-hidden"
              >
                <div className="mt-3 border-t border-white/10 pt-3 flex flex-col gap-2">
                  <Link className={navLinkClass(isActive("/dashboard"))} to="/dashboard">
                    Dashboard
                  </Link>
                  <Link className={navLinkClass(isActive("/learn"))} to="/learn">
                    Learn IAM
                  </Link>
                  <Link className={navLinkClass(isActive("/account"))} to="/account">
                    Account
                  </Link>

                  {showConsole && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-2">
                      <div className="px-2 py-2 text-xs uppercase tracking-wider text-white/50">
                        Console
                      </div>
                      {consoleLinks.map((it) => (
                        <Link
                          key={it.to}
                          to={it.to}
                          className={cx(
                            "block rounded-xl px-3 py-2 text-sm transition",
                            location.pathname === it.to
                              ? "bg-white/10 text-white"
                              : "text-white/70 hover:bg-white/5 hover:text-white"
                          )}
                        >
                          {it.label}
                        </Link>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={logout}
                    className="rounded-2xl px-4 py-2 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition"
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
