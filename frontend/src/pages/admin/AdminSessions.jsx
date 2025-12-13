import React from "react";
import AnimatedWrapper from "../../components/animatedWrapper.jsx";

export default function AdminSessions() {
  return (
    <AnimatedWrapper>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-white">Sessions</h1>
        <p className="text-white/60">Search sessions by username/email and revoke.</p>
      </div>
    </AnimatedWrapper>
  );
}
