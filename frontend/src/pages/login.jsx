import { useState } from "react";
import api from "../api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await api.post("/auth/login", { email, password });
      alert("Login successful! Token: " + res.data.access);
    } catch (err) {
      alert("Login failed: " + err.response?.data?.error || err.message);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <input 
        type="email" placeholder="Email"
        value={email} onChange={(e) => setEmail(e.target.value)}
      /><br/>
      <input 
        type="password" placeholder="Password"
        value={password} onChange={(e) => setPassword(e.target.value)}
      /><br/>
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default Login;
