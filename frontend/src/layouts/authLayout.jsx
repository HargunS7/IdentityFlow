import React from "react";
import { Navigate,Outlet } from "react-router-dom";
import AuroraBackground from "../components/auroraBackground.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import AnimatedWrapper from "../components/animatedWrapper.jsx";

export default function AuthLayout() {

  const { user, loading } = useAuth();

  if (loading) return null;

  // 🚫 If already logged in, NEVER show login/signup again
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AuroraBackground>
      <div className="min-h-screen w-full flex items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-md">
          <AnimatedWrapper>
            <Outlet />
          </AnimatedWrapper>
        </div>
      </div>
    </AuroraBackground>
  );
}
