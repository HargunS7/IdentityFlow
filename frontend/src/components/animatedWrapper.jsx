import React from "react";
import { motion } from "framer-motion";

export default function AnimatedWrapper({ children, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: "linear" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
