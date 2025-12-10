// src/pages/dashboard.jsx
import React from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function DashboardPage() {
  const { user, roles, permissions, tempGrants, logout } = useAuth();

  return (
    <div style={{ padding: "40px" }}>
      <h1>Dashboard</h1>

      <p>
        Logged in as: <strong>{user?.email}</strong>
      </p>

      <h3>Your roles:</h3>
      <pre>{JSON.stringify(roles, null, 2)}</pre>

      <h3>Your permissions:</h3>
      <pre>{JSON.stringify(permissions, null, 2)}</pre>

      <h3>Your temporary grants:</h3>
      <pre>{JSON.stringify(tempGrants, null, 2)}</pre>

      <button onClick={logout}>Logout</button>
    </div>
  );
}
