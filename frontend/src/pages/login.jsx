import { useState } from "react";
import { handleLogin } from "../controllers/authController";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await handleLogin({ identifier, password });
      login(data.user);
      alert("Login successful!");
      setIdentifier("");
      setPassword("");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Login failed");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <input
        type="text"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        placeholder="Email or Username"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
};

export default Login;
