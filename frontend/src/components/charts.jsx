import React, { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Tiny, dependency-free chart primitives (pure SVG + Tailwind).
 * They are intentionally simple and self-explanatory: every chart shows its
 * own values as labels, so a learner never has to guess what a bar means.
 */

const PALETTE = [
  "#818cf8", // indigo
  "#22d3ee", // cyan
  "#34d399", // emerald
  "#f472b6", // pink
  "#fbbf24", // amber
  "#a78bfa", // violet
  "#f87171", // red
  "#60a5fa", // blue
];

function maxValue(values) {
  return Math.max(1, ...values);
}

/* -------------------------------------------------------------------------- */
/*  BarChart — horizontal bars. Best for category → count (e.g. users/role)   */
/* -------------------------------------------------------------------------- */

export function BarChart({ data = [], emptyLabel = "No data yet" }) {
  const reduce = useReducedMotion();
  if (!data.length) {
    return <div className="text-sm text-white/45 py-6 text-center">{emptyLabel}</div>;
  }
  const max = maxValue(data.map((d) => d.value));

  return (
    <ul className="space-y-3">
      {data.map((d, i) => {
        const pct = Math.round((d.value / max) * 100);
        return (
          <li key={d.label}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-white/75 font-medium truncate">{d.label}</span>
              <span className="text-white/55 tabular-nums">{d.value}</span>
            </div>
            <div
              className="h-2.5 w-full rounded-full bg-white/[0.06] overflow-hidden"
              role="img"
              aria-label={`${d.label}: ${d.value}`}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                initial={reduce ? false : { width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: "easeOut" }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* -------------------------------------------------------------------------- */
/*  ColumnChart — vertical columns. Best for a value over time (e.g. logins)  */
/* -------------------------------------------------------------------------- */

export function ColumnChart({ data = [], emptyLabel = "No data yet" }) {
  const reduce = useReducedMotion();
  if (!data.length) {
    return <div className="text-sm text-white/45 py-6 text-center">{emptyLabel}</div>;
  }
  const max = maxValue(data.map((d) => d.value));

  return (
    <div className="flex items-end justify-between gap-2 h-40">
      {data.map((d, i) => {
        const pct = Math.round((d.value / max) * 100);
        return (
          <div key={d.label + i} className="flex-1 flex flex-col items-center gap-2 min-w-0">
            <div className="relative flex-1 w-full flex items-end justify-center">
              <span className="absolute -top-0 text-[10px] text-white/55 tabular-nums">
                {d.value > 0 ? d.value : ""}
              </span>
              <motion.div
                className="w-full max-w-[34px] rounded-t-lg bg-gradient-to-t from-indigo-500/40 to-cyan-400/70"
                initial={reduce ? false : { height: 0 }}
                animate={{ height: `${Math.max(pct, d.value > 0 ? 6 : 2)}%` }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: "easeOut" }}
                role="img"
                aria-label={`${d.label}: ${d.value}`}
              />
            </div>
            <span className="text-[10px] text-white/50 truncate w-full text-center">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  DonutChart — proportion of a whole (e.g. active vs revoked sessions)      */
/* -------------------------------------------------------------------------- */

export function DonutChart({ segments = [], centerLabel, emptyLabel = "No data yet" }) {
  const reduce = useReducedMotion();
  const gradId = useId();
  const total = segments.reduce((s, x) => s + x.value, 0);

  if (!total) {
    return <div className="text-sm text-white/45 py-6 text-center">{emptyLabel}</div>;
  }

  const radius = 42;
  const circ = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <svg width="120" height="120" viewBox="0 0 120 120" className="shrink-0">
        <circle
          cx="60" cy="60" r={radius}
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="14"
        />
        {segments.map((seg, i) => {
          const frac = seg.value / total;
          const dash = frac * circ;
          const el = (
            <motion.circle
              key={seg.label + gradId}
              cx="60" cy="60" r={radius}
              fill="none"
              stroke={seg.color || PALETTE[i % PALETTE.length]}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 60 60)"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            />
          );
          offset += dash;
          return el;
        })}
        <text x="60" y="56" textAnchor="middle" className="fill-white" fontSize="20" fontWeight="600">
          {total}
        </text>
        <text x="60" y="74" textAnchor="middle" className="fill-white/50" fontSize="9">
          {centerLabel || "total"}
        </text>
      </svg>

      <ul className="space-y-2 text-sm">
        {segments.map((seg, i) => (
          <li key={seg.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: seg.color || PALETTE[i % PALETTE.length] }}
            />
            <span className="text-white/70">{seg.label}</span>
            <span className="text-white/45 tabular-nums">
              {seg.value} · {Math.round((seg.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
