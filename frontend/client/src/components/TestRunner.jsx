import React, { useState } from "react";
import { motion } from "framer-motion";

export default function TestRunner({ language, code }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const runTest = async () => {
    setIsRunning(true);
    setOutput(
      "Initializing test runner...\nThis feature currently requires a custom backend API for code execution (/api/submissions/test)."
    );
    try {
      const res = await fetch("/api/submissions/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code, input }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(
          `API Error: ${res.status} - ${errText || "Failed to run test"}`
        );
      }
      const result = await res.json();
      setOutput(result.output || "No output received from test run.");
    } catch (err) {
      setOutput("Error running test: " + err.message);
    } finally {
      setIsRunning(false);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-600 to-sky-500 opacity-10 group-hover:opacity-20 transition duration-300 rounded-lg blur-sm" />
          <div className="relative">
            <h3 className="text-cyan-400 mb-2 flex items-center gap-2 font-semibold">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Input
            </h3>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isRunning}
              className="w-full h-40 p-3 bg-gray-800/70 border border-cyan-700/60 rounded-lg font-mono resize-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-gray-300 placeholder-gray-500"
              placeholder="Enter test input here..."
            />
          </div>
        </div>
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-600 to-sky-500 opacity-10 group-hover:opacity-20 transition duration-300 rounded-lg blur-sm" />
          <div className="relative">
            <h3 className="text-cyan-400 mb-2 flex items-center gap-2 font-semibold">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Output
            </h3>
            <pre
              className={`w-full h-40 p-3 bg-gray-800/70 border border-cyan-700/60 rounded-lg font-mono overflow-auto whitespace-pre-wrap ${
                isRunning ? "animate-pulse opacity-60" : ""
              } transition-all duration-300 text-gray-300`}
            >
              {output || "Output will appear here..."}
            </pre>
          </div>
        </div>
      </div>
      <motion.button
        onClick={runTest}
        disabled={isRunning}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 ${
          isRunning
            ? "bg-cyan-700/50 cursor-not-allowed"
            : "bg-cyan-600 hover:bg-cyan-500 hover:shadow-[0_0_15px_rgba(56,189,248,0.6)]"
        } text-white transition-all duration-300`}
      >
        {isRunning ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Running Test...
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clipRule="evenodd"
              />
            </svg>
            Run Test
          </>
        )}
      </motion.button>
    </motion.div>
  );
}
