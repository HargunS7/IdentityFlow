// src/components/AuroraBackground.jsx
import React from "react";
import { motion } from "framer-motion";
import "./css/aurora.css"; // We'll create this next

export default function AuroraBackground({ children }) {
  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-black">
      {/* Animated aurora layers */}
      <motion.div
        className="aurora-layer"
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%"],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      <motion.div
        className="aurora-layer aurora-layer2"
        animate={{
          backgroundPosition: ["100% 0%", "0% 100%"],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Foreground content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
