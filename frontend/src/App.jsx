import { useState } from "react";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

function App() {
  const [showLogin, setShowLogin] = useState(true);

  return (
    <div>
      <h1>IAM Frontend</h1>
      <button onClick={() => setShowLogin(!showLogin)}>
        {showLogin ? "Go to Signup" : "Go to Login"}
      </button>
      {showLogin ? <Login /> : <Signup />}
    </div>
  );
}

export default App;
