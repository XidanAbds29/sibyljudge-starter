import React from "react";
import { motion } from "framer-motion";

const baseColors = {
  Accepted: "#22c55e",
  "Wrong Answer": "#ef4444",
  "Time Limit Exceeded": "#f97316",
  "Runtime Error": "#ec4899",
  "Compilation Error": "#f97316",
  Queued: "#eab308",
  "Submitting...": "#3b82f6",
  Error: "#ef4444",
};

export default function StatusAnimation({ status, message }) {
  const color = baseColors[status] || "#06b6d4";
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, y: -20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.8, opacity: 0, y: -20 }}
      className="fixed top-6 right-6 p-4 rounded-lg z-[100] backdrop-blur-md shadow-2xl"
      style={{
        backgroundColor: "rgba(17, 24, 39, 0.9)",
        border: `2px solid ${color}`,
        boxShadow: `0 0 25px -5px ${color}, 0 0 15px ${color} inset`,
      }}
    >
      <div className="flex items-center gap-3">
        {status === "Accepted" ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke={color}
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke={color}
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )}
        <div className="text-lg font-semibold" style={{ color }}>
          {status}
        </div>
      </div>
      {message && (
        <p
          className="text-sm text-gray-300 mt-1 max-w-xs truncate"
          title={message}
        >
          {message}
        </p>
      )}
      <motion.div
        className="absolute inset-0 rounded-lg pointer-events-none"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.3, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ border: `1px solid ${color}`, boxShadow: `0 0 10px ${color}` }}
      />
    </motion.div>
  );
}
