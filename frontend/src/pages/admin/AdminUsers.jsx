import React from "react";
import AnimatedWrapper from "../../components/animatedWrapper.jsx";

export default function AdminUsers() {
  return (
    <AnimatedWrapper>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-white">Users</h1>
        <p className="text-white/60">Search users and manage roles.</p>
      </div>
    </AnimatedWrapper>
  );
}
