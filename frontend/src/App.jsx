// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import PublicLayout from "./layouts/PublicLayout.jsx";
import AuthLayout from "./layouts/AuthLayout.jsx";
import AppLayout from "./layouts/AppLayout.jsx";

import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Landing from "./pages/Landing.jsx";
import LearnIAM from "./pages/LearnIAM.jsx";
import Login from "./pages/login.jsx";
import Signup from "./pages/signup.jsx";
import Dashboard from "./pages/dashboard.jsx";

// Temporary placeholders (we’ll build these next)
const Account = () => (
  <div className="text-white">
    <h1 className="text-3xl font-bold mb-2">Account</h1>
    <p className="text-white/70">Coming soon…</p>
  </div>
);
const AdminHome = () => (
  <div className="text-white">
    <h1 className="text-3xl font-bold mb-2">Admin</h1>
    <p className="text-white/70">Coming soon…</p>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/learn" element={<LearnIAM />} />
        </Route>

        {/* AUTH */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        {/* PROTECTED APP */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/account" element={<Account />} />

          {/* ADMIN AREA (placeholder for now) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireRoles={["admin"]}>
                <AdminHome />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center">
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-6 py-4">
                <h2 className="text-lg font-semibold">404</h2>
                <p className="text-white/70 text-sm">Page not found</p>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
