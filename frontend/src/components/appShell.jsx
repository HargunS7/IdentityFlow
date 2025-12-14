import React from "react";

export default function AppShell({ children, variant = "default" }) {
  return (
    <div className="min-h-screen w-full bg-[#06080f] relative overflow-hidden text-white">
      {/* Aurora */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute top-20 -right-40 h-[520px] w-[520px] rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-[520px] w-[520px] rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/40" />
      </div>

      <div
        className={`relative w-full ${
          variant === "auth" ? "min-h-screen flex items-center justify-center px-6" : ""
        }`}
      >
        {children}
      </div>
    </div>
  );
}
