// src/layouts/AuthLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import AuroraBackground from "../components/auroraBackground.jsx";
import AnimatedWrapper from "../components/animatedWrapper.jsx";

export default function AuthLayout() {
  return (
    <AuroraBackground>
      <div className="min-h-screen flex items-center justify-center px-4">
        <AnimatedWrapper>
          <Outlet />
        </AnimatedWrapper>
      </div>
    </AuroraBackground>
  );
}
