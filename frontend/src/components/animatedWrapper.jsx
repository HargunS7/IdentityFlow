// src/components/AnimatedWrapper.jsx
import React from "react";
import { motion } from "framer-motion";

export default function AnimatedWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}   // start slightly below + invisible
      animate={{ opacity: 1, y: 0 }}    // fade in + slide up
      exit={{ opacity: 0, y: -20 }}     // fade out upwards
      transition={{
        duration: 0.35,
        ease: "easeOut",
      }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}
