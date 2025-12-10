// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";

import LoginPage from "./pages/login.jsx";
import SignupPage from "./pages/signup.jsx";
import DashboardPage from "./pages/dashboard.jsx";

// Temporary placeholder
function LandingPage() {
  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h1>IAM Educational Project</h1>
      <p>This is the landing page. More content will come later.</p>
      <a href="/login">Go to Login →</a>
    </div>
  );
}

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* 404 fallback */}
        <Route
          path="*"
          element={
            <div style={{ padding: "40px" }}>
              <h2>404 - Page Not Found</h2>
              <a href="/">Go Home</a>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
