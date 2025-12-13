// src/layouts/AppLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Navbar from "../components/navbar.jsx";
import AnimatedWrapper from "../components/animatedWrapper.jsx";

export default function AppLayout() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0b0f19] text-white">
      <Navbar />

      <main className="p-6 max-w-6xl mx-auto">
        <AnimatedWrapper>
          <Outlet />
        </AnimatedWrapper>
      </main>
    </div>
  );
}
