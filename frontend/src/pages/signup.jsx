import { useState } from "react";
import api from "../api";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    try {
      await api.post("/auth/signup", { email, password });
      alert("Signup successful! Now login.");
    } catch (err) {
      alert("Signup failed: " + err.response?.data?.error || err.message);
    }
  };

  return (
    <div>
      <h2>Signup</h2>
      <input 
        type="email" placeholder="Email"
        value={email} onChange={(e) => setEmail(e.target.value)}
      /><br/>
      <input 
        type="password" placeholder="Password"
        value={password} onChange={(e) => setPassword(e.target.value)}
      /><br/>
      <button onClick={handleSignup}>Signup</button>
    </div>
  );
}

export default Signup;
