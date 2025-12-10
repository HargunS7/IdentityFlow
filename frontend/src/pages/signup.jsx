// src/pages/signup.jsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function SignupPage() {
  const { signup } = useAuth();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSignup(e) {
    e.preventDefault();
    setError("");

    try {
      await signup({ email, username, password });
      window.location.href = "/dashboard";
    } catch (err) {
      console.error(err);
      setError("Signup failed");
       if (err.response) {
      console.log('Backend status:', err.response.status);
      console.log('Backend data:', err.response.data);
  }
    }
  }

  return (
    <div style={{ maxWidth: "420px", margin: "60px auto" }}>
      <h2>Signup</h2>

      <form onSubmit={handleSignup}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <br />

        <input
          type="text"
          placeholder="Username (optional)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <br />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <br />

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit">Signup</button>
      </form>
    </div>
  );
}
