// src/pages/Landing.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import AnimatedWrapper from "../components/animatedWrapper.jsx";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function Landing() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  // Optional: enables native smooth anchor scrolling (doesn't affect wheel smoothness)
  useEffect(() => {
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = prev;
    };
  }, []);

  return (
    <AnimatedWrapper>
      <div className="min-h-screen w-full">
        <div className="mx-auto max-w-6xl px-4 pt-14 pb-10">
          {/* Hero */}
          <motion.div
            initial={reduceMotion ? false : "hidden"}
            animate={reduceMotion ? undefined : "show"}
            transition={{ staggerChildren: reduceMotion ? 0 : 0.05 }}
            className={[
              "rounded-3xl border border-white/10 bg-white/5 p-8 md:p-12",
              // IMPORTANT: remove blur on large scrolling containers (major jank source)
              // Keep it crisp and rely on opacity + border for the glass look.
              "shadow-[0_12px_40px_rgba(0,0,0,0.30)]",
              // Performance isolation
              "transform-gpu will-change-transform",
              // Contain paints/layout to reduce scroll repaint cost
              "[contain:layout_paint]",
            ].join(" ")}
          >
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
              Interactive IAM Playground • Roles • Permissions • Audit Logs
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="mt-5 text-4xl md:text-6xl font-semibold tracking-tight text-white"
            >
              Learn IAM by using it —
              <span className="text-white/80"> like a real security console</span>.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-4 max-w-2xl text-base md:text-lg text-white/70"
            >
              This project is an educational + practical IAM system. Explore core concepts like Roles,
              Permissions, Sessions, Audit Logging, and Temporary Access — then see them live in the dashboard.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-7 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate("/dashboard")}
                className="rounded-2xl px-5 py-3 text-sm font-semibold text-black bg-white hover:bg-white/90 transition shadow"
              >
                Try the Dashboard
              </button>

              <button
                onClick={() => navigate("/learn")}
                className="rounded-2xl px-5 py-3 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition"
              >
                Learn IAM Concepts
              </button>
            </motion.div>

            {/* Quick highlights */}
            <motion.div
              variants={fadeUp}
              className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <FeatureCard
                title="Role-Based Access Control"
                desc="Assign roles, map permissions, and verify access checks like a real production system."
                tag="RBAC"
              />
              <FeatureCard
                title="Audit Logs & Security Visibility"
                desc="Every sensitive action generates an audit trail so activity can be traced and reviewed."
                tag="Audit"
              />
              <FeatureCard
                title="Temporary Access (JIT)"
                desc="Grant a permission for 5–30 minutes for a task, then let it expire automatically."
                tag="JIT"
              />
            </motion.div>
          </motion.div>

          {/* Sections */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoBlock
              title="What you can do as a user"
              points={[
                "View your roles and permissions",
                "See temporary grants with expiration",
                "Review your security activity",
                "Enable MFA (coming next)",
              ]}
            />

            <InfoBlock
              title="What you can do as an admin"
              points={[
                "Search users by email/username",
                "Assign/remove roles",
                "Review sessions and audit logs",
                "Grant/revoke temporary permissions",
              ]}
            />
          </div>

          {/* Footer */}
          <div className="mt-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-white/60 text-sm">
            <p>Built as a modular IAM system + educational demo.</p>
            <div className="flex gap-3">
              <button onClick={() => navigate("/learn")} className="hover:text-white transition">
                Learn
              </button>
              <button onClick={() => navigate("/login")} className="hover:text-white transition">
                Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </AnimatedWrapper>
  );
}

function FeatureCard({ title, desc, tag }) {
  return (
    <div
      className={[
        "rounded-2xl border border-white/10 bg-white/5 p-5",
        // Blur only on small cards (cheap)
        "backdrop-blur-md",
        // Performance hints
        "transform-gpu will-change-transform",
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-white">{title}</div>
        <span className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10 text-white/70">
          {tag}
        </span>
      </div>
      <p className="mt-2 text-sm text-white/70">{desc}</p>
    </div>
  );
}

function InfoBlock({ title, points }) {
  return (
    <div
      className={[
        "rounded-3xl border border-white/10 bg-white/5 p-6",
        "backdrop-blur-md",
        "transform-gpu will-change-transform",
      ].join(" ")}
    >
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-white/70">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-white/40" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
