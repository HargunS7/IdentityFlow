import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Login from "./pages/login";
import Signup from "./pages/signup";
import Dashboard from "./pages/dashboard";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import "./App.css";

function AppContent() {
  const [showLogin, setShowLogin] = useState(true);
  const { user, loading } = useAuth();

  return (
    <>
      {/* Bubble container */}
      <div id="bubbles">
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
      </div>

      {/* Form container */}
      <motion.div className="form-wrapper" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {loading ? (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Loading...</motion.p>
        ) : user ? (
          <AnimatePresence mode="wait">
            <motion.div key="dash" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>
              <Dashboard />
            </motion.div>
          </AnimatePresence>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={showLogin ? "login" : "signup"} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>
              <h2 className="login-heading">
                {showLogin ? "Log In" : "Sign Up"}
              </h2>
              {showLogin ? <Login /> : <Signup />}
              <p className="signup-text">
                {showLogin ? "Don’t have an account?" : "Already have an account?"}{" "}
                <button
                  className="signup-btn"
                  onClick={() => setShowLogin(!showLogin)}
                >
                  {showLogin ? "Sign Up" : "Log In"}
                </button>
              </p>
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
