import React from "react";
import AnimatedWrapper from "../../components/animatedWrapper.jsx";

export default function AdminTempAccess() {
  return (
    <AnimatedWrapper>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-white">Temporary Access</h1>
        <p className="text-white/60">Grant permissions for 5–30 minutes and auto-expire.</p>
      </div>
    </AnimatedWrapper>
  );
}
