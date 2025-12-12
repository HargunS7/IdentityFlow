// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PublicLayout from "./layouts/publicLayout.jsx";
import AuthLayout from "./layouts/authLayout.jsx";
import AppLayout from "./layouts/appLayout.jsx";
// import ProtectedRoute from "./components/ProtectedRoute.jsx";

// import Landing from "./pages/Landing.jsx";
// import LearnIAM from "./pages/LearnIAM.jsx";
import Login from "./pages/login.jsx";
import Signup from "./pages/signup.jsx";
import Dashboard from "./pages/dashboard.jsx";

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

        {/* PROTECTED */}
        <Route
          element={
            // <ProtectedRoute>
              <AppLayout />
            // </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<div className="text-white p-10">404 Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}
