import React from "react";
import AnimatedWrapper from "../../components/animatedWrapper.jsx";

export default function AdminAuditLogs() {
  return (
    <AnimatedWrapper>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-white">Audit Logs</h1>
        <p className="text-white/60">Search and review security events.</p>
      </div>
    </AnimatedWrapper>
  );
}
