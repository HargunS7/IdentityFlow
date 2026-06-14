import React, { useMemo, useState, useEffect, useRef } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";
import { PERMISSIONS, ROLES } from "../utils/permissions.js";
import { BrandMark } from "./ui.jsx";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

const navItemBase =
  "px-3 py-2 rounded-xl text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-white/15";

export default function Navbar() {
  const { user, roles, permissions, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [openMobile, setOpenMobile] = useState(false);
  const [openConsole, setOpenConsole] = useState(false);
  const consoleRef = useRef(null);

  useEffect(() => {
    setOpenMobile(false);
    setOpenConsole(false);
  }, [location.pathname]);

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
  const isAdmin = roles?.includes(ROLES.ADMIN);

  const consoleLinks = useMemo(() => {
    const canUsers =
      hasPerm(PERMISSIONS.ROLE_ASSIGN) ||
      hasPerm(PERMISSIONS.USER_UPDATE) ||
      hasPerm(PERMISSIONS.USER_CREATE) ||
      hasPerm(PERMISSIONS.USER_DELETE);

    const canSessions =
      hasPerm(PERMISSIONS.SESSION_READ) || hasPerm(PERMISSIONS.SESSION_REVOKE);
    const canAudit = hasPerm(PERMISSIONS.AUDIT_READ);
    const canTemp = hasPerm(PERMISSIONS.TEMP_GRANT);

    const items = [];
    if (canUsers || canSessions || canAudit || canTemp) {
      items.push({ to: "/admin", label: "Overview" });
    }
    if (canUsers) items.push({ to: "/admin/users", label: "Users & Roles" });
    if (canSessions) items.push({ to: "/admin/sessions", label: "Sessions" });
    if (canAudit) items.push({ to: "/admin/audit-logs", label: "Audit Logs" });
    if (canTemp) items.push({ to: "/admin/temp-access", label: "Temp Access" });
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combined]);

  const showConsole = consoleLinks.length > 0;

  return (
    <div className="sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-4 pt-5">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-3xl border border-white/10 bg-[#0b0f19]/55 backdrop-blur-xl shadow-[0_10px_36px_rgba(0,0,0,0.35)] px-3 py-2.5"
        >
          <div className="flex items-center justify-between gap-3">
            {/* Brand */}
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <BrandMark className="h-9 w-9" />
              <div className="leading-tight">
                <div className="text-white font-semibold tracking-tight">
                  IdentityFlow
                </div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-white/45 group-hover:text-white/60 transition">
                  IAM Console
                </div>
              </div>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              <NavItem to="/dashboard">Dashboard</NavItem>
              <NavItem to="/learn">Learn IAM</NavItem>
              <NavItem to="/concepts">Concepts</NavItem>
              <NavItem to="/account">Account</NavItem>

              {showConsole && (
                <div className="relative" ref={consoleRef}>
                  <button
                    onClick={() => setOpenConsole((v) => !v)}
                    className={cx(
                      navItemBase,
                      "flex items-center gap-1.5",
                      location.pathname.startsWith("/admin")
                        ? "bg-white/10 text-white"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    )}
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={openConsole}
                  >
                    Console
                    <span
                      className={cx(
                        "text-white/50 transition-transform",
                        openConsole ? "rotate-180" : ""
                      )}
                    >
                      ▾
                    </span>
                  </button>

                  <AnimatePresence>
                    {openConsole && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-60 rounded-2xl border border-white/10 bg-[#0b0f19]/95 backdrop-blur-xl shadow-[0_24px_70px_rgba(0,0,0,0.55)] p-1.5"
                        role="menu"
                      >
                        {consoleLinks.map((it) => (
                          <NavLink
                            key={it.to}
                            to={it.to}
                            end={it.to === "/admin"}
                            className={({ isActive }) =>
                              cx(
                                "block rounded-xl px-3 py-2 text-sm transition",
                                isActive
                                  ? "bg-white/10 text-white"
                                  : "text-white/70 hover:bg-white/5 hover:text-white"
                              )
                            }
                            role="menuitem"
                          >
                            {it.label}
                          </NavLink>
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
                <div className="text-white text-sm font-semibold truncate max-w-[160px]">
                  {user?.username || user?.email || "user"}
                </div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">
                  {isAdmin ? "Admin" : "Signed in"}
                </div>
              </div>
              <button
                onClick={async () => {
                  await logout();
                  navigate("/login");
                }}
                className="rounded-2xl px-4 py-2 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition"
              >
                Logout
              </button>
            </div>

            {/* Mobile toggle */}
            <button
              type="button"
              className="md:hidden rounded-2xl px-3 py-2 text-sm font-semibold text-white bg-white/10 border border-white/10"
              onClick={() => setOpenMobile((v) => !v)}
              aria-expanded={openMobile}
              aria-label="Toggle menu"
            >
              {openMobile ? "Close" : "Menu"}
            </button>
          </div>

          {/* Mobile menu */}
          <AnimatePresence>
            {openMobile && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="md:hidden overflow-hidden"
              >
                <div className="mt-3 border-t border-white/10 pt-3 flex flex-col gap-1.5">
                  <MobileItem to="/dashboard">Dashboard</MobileItem>
                  <MobileItem to="/learn">Learn IAM</MobileItem>
                  <MobileItem to="/concepts">Concepts</MobileItem>
                  <MobileItem to="/account">Account</MobileItem>

                  {showConsole && (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-2">
                      <div className="px-2 py-2 text-[11px] uppercase tracking-[0.14em] text-white/45">
                        Console
                      </div>
                      {consoleLinks.map((it) => (
                        <MobileItem key={it.to} to={it.to} end={it.to === "/admin"}>
                          {it.label}
                        </MobileItem>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={async () => {
                      await logout();
                      navigate("/login");
                    }}
                    className="rounded-2xl px-4 py-2 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition"
                  >
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

function NavItem({ to, end, children }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cx(
          navItemBase,
          isActive
            ? "bg-white/10 text-white"
            : "text-white/70 hover:text-white hover:bg-white/5"
        )
      }
    >
      {children}
    </NavLink>
  );
}

function MobileItem({ to, end, children }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cx(
          "block rounded-xl px-3 py-2 text-sm transition",
          isActive
            ? "bg-white/10 text-white"
            : "text-white/70 hover:bg-white/5 hover:text-white"
        )
      }
    >
      {children}
    </NavLink>
  );
}
