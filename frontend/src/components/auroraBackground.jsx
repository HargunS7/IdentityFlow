import React from "react";

export default function AuroraBackground({ children }) {
  return (
    <div className="relative min-h-screen w-full bg-[#06080f] overflow-hidden text-white isolate">
      {/* Aurora layer (composited) */}
      <div className="pointer-events-none absolute inset-0 will-change-transform">
        <div className="absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute top-20 -right-40 h-[480px] w-[480px] rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-[480px] w-[480px] rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/40" />
      </div>

      {/* Foreground */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
