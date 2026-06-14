import React, { useEffect, useState, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * AnimatedFlow — a self-playing, step-by-step diagram used to teach an IAM
 * process (login, authorization, RBAC, JIT, session revoke).
 *
 * It walks through each step in sequence, highlighting the "current" one, then
 * marks finished steps as done. A Replay button restarts it. With reduced
 * motion, every step is shown active at once (no animation).
 *
 * Props:
 *   title    string
 *   subtitle string
 *   steps    [{ label, detail }]
 *   note     string  — the "what to notice" takeaway
 *   tone     "ok" | "deny" — colors the final step (e.g. access granted vs revoked)
 */
export function AnimatedFlow({ title, subtitle, steps = [], note, tone = "ok" }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(reduce ? steps.length : 0);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    if (reduce) {
      setActive(steps.length);
      return;
    }
    setActive(0);
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setActive(i);
      if (i >= steps.length) clearInterval(timer);
    }, 700);
    return () => clearInterval(timer);
  }, [steps.length, reduce, runId]);

  const replay = useCallback(() => setRunId((r) => r + 1), []);
  const finalTone = tone === "deny" ? "deny" : "ok";

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-7">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {subtitle && (
            <p className="mt-1 text-sm text-white/60 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {!reduce && (
          <button
            onClick={replay}
            className="shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold text-white/80 bg-white/10 hover:bg-white/15 border border-white/10 transition"
          >
            ↻ Replay
          </button>
        )}
      </div>

      {/* Steps */}
      <div className="mt-5 flex flex-col md:flex-row md:items-stretch gap-2.5">
        {steps.map((s, i) => {
          const state = i < active ? "done" : i === active ? "current" : "idle";
          const isFinal = i === steps.length - 1;
          return (
            <React.Fragment key={s.label}>
              <FlowStep step={s} index={i} state={state} isFinal={isFinal} finalTone={finalTone} />
              {i < steps.length - 1 && <Connector />}
            </React.Fragment>
          );
        })}
      </div>

      {note && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-3.5">
          <span className="text-[11px] uppercase tracking-[0.14em] text-white/40">
            What to notice
          </span>
          <p className="mt-1 text-sm text-white/70 leading-relaxed">{note}</p>
        </div>
      )}
    </div>
  );
}

function toneClasses(state, isFinal, finalTone) {
  if (state === "idle") return "border-white/10 bg-white/[0.03] text-white/40";
  if (state === "current")
    return "border-white/30 bg-white/[0.10] text-white shadow-[0_0_0_3px_rgba(255,255,255,0.06)]";
  // done
  if (isFinal && finalTone === "deny")
    return "border-red-500/30 bg-red-500/[0.10] text-red-100";
  if (isFinal) return "border-emerald-500/30 bg-emerald-500/[0.10] text-emerald-100";
  return "border-white/15 bg-white/[0.06] text-white/85";
}

function FlowStep({ step, index, state, isFinal, finalTone }) {
  return (
    <motion.div
      className={[
        "flex-1 rounded-2xl border p-3.5 transition-colors min-w-0",
        toneClasses(state, isFinal, finalTone),
      ].join(" ")}
      animate={{ scale: state === "current" ? 1.03 : 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="flex items-center gap-2">
        <span
          className={[
            "h-5 w-5 rounded-full text-[10px] font-mono flex items-center justify-center border",
            state === "idle" ? "border-white/15 text-white/40" : "border-white/25 text-white/80",
          ].join(" ")}
        >
          {state === "done" ? "✓" : index + 1}
        </span>
        <span className="text-sm font-semibold truncate">{step.label}</span>
      </div>
      {step.detail && (
        <p className="mt-1.5 text-xs leading-relaxed opacity-80">{step.detail}</p>
      )}
    </motion.div>
  );
}

function Connector() {
  return (
    <div className="flex items-center justify-center md:px-0.5 text-white/25">
      <span className="md:hidden">↓</span>
      <span className="hidden md:inline">→</span>
    </div>
  );
}
