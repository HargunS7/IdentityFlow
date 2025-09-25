import { useState } from "react";
import { handleSignup } from "../controllers/authController";
import { useAuth } from "../context/AuthContext";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordHint, setPasswordHint] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await handleSignup({ username, email, password });
      alert("Signup successful!");
      if (res?.user) {
        login(res.user);
      }
      setUsername("");
      setEmail("");
      setPassword("");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Signup failed");
    }

    setLoading(false);
  };

  const validatePasswordClient = (pwd) => {
    if (pwd !== pwd.trim()) return "No spaces at start/end";
    if (pwd.length < 12) return "At least 12 characters";
    if (!/[a-z]/.test(pwd)) return "Add a lowercase letter";
    if (!/[A-Z]/.test(pwd)) return "Add an uppercase letter";
    if (!/[0-9]/.test(pwd)) return "Add a number";
    if (!/[~!@#$%^&*()_+\-={}\[\]|;:\"'`,.<>/?]/.test(pwd)) return "Add a special character";
    if (/(.)\1\1/.test(pwd)) return "Avoid 3+ repeating characters";
    return "";
  };

  return (
    <form onSubmit={handleSubmit} className="signup-form">
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        required
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => {
          const val = e.target.value;
          setPassword(val);
          setPasswordHint(validatePasswordClient(val));
        }}
        placeholder="Password"
        required
      />
      {password && passwordHint && <p className="error">{passwordHint}</p>}
      <button type="submit" disabled={loading}>
        {loading ? "Signing up..." : "Sign Up"}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
};

export default Signup;
