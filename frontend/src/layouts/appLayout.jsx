import React from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Navbar from "../components/navbar.jsx";
import AuroraBackground from "../components/auroraBackground.jsx";
import { Spinner } from "../components/ui.jsx";

export default function AppLayout() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <AuroraBackground>
        <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-white/70">
          <Spinner size="lg" />
          <div className="text-sm">Loading your session…</div>
        </div>
      </AuroraBackground>
    );
  }

  return (
    <AuroraBackground>
      <div className="min-h-screen w-full text-white">
        <Navbar />

        <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 pb-16">
          <Outlet />
        </main>
      </div>
    </AuroraBackground>
  );
}
