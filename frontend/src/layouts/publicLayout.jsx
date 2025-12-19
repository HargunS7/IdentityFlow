import React from "react";
import { Outlet } from "react-router-dom";
import AuroraBackground from "../components/auroraBackground.jsx";

export default function PublicLayout() {
  return (
    <AuroraBackground>
      <div className="min-h-screen w-full">
        {/* Public pages handle their own spacing (Landing already has it) */}
        <Outlet />
      </div>
    </AuroraBackground>
  );
}
