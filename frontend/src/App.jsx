import { useState } from "react";
import Login from "./pages/login";
import Signup from "./pages/signup";
import "./App.css";

function App() {
  const [showLogin, setShowLogin] = useState(true);

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
      <div className="form-wrapper">
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
      </div>
    </>
  );
}

export default App;
