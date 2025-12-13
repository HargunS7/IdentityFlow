import React from "react";
import AnimatedWrapper from "../../components/animatedWrapper.jsx";

export default function AdminHome() {
  return (
    <AnimatedWrapper>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-white">Admin Console</h1>
        <p className="text-white/60">
          Manage users, roles, sessions, audit logs, and temporary access.
        </p>
      </div>
    </AnimatedWrapper>
  );
}
