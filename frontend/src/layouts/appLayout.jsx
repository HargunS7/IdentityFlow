import React from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Navbar from "../components/navbar.jsx";
import AuroraBackground from "../components/auroraBackground.jsx";
import AnimatedWrapper from "../components/animatedWrapper.jsx";

export default function AppLayout() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <AuroraBackground>
        <div className="min-h-screen flex items-center justify-center text-white/80">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-6 py-4">
            Loading...
          </div>
        </div>
      </AuroraBackground>
    );
  }

  return (
    <AuroraBackground>
      <div className="min-h-screen w-full text-white">
        <Navbar />

        <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
          {/* Content surface to avoid “text floating on background” */}
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.35)] p-5 sm:p-7">
            <AnimatedWrapper>
              <Outlet />
            </AnimatedWrapper>
          </div>
        </main>
      </div>
    </AuroraBackground>
  );
}
