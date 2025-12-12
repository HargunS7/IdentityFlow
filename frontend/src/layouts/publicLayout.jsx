// src/layouts/PublicLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import AuroraBackground from "../components/auroraBackground.jsx";
import AnimatedWrapper from "../components/animatedWrapper.jsx";

export default function PublicLayout() {
  return (
    <AuroraBackground>
      <div className="min-h-screen w-full flex flex-col">
        <AnimatedWrapper>
          <Outlet />
        </AnimatedWrapper>
      </div>
    </AuroraBackground>
  );
}
