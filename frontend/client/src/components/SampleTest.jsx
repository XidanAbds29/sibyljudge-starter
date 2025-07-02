import React from "react";
import { motion } from "framer-motion";

export default function SampleTest({ input, output }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-gray-900/80 border-2 border-cyan-700/40 shadow-lg p-5 flex flex-col gap-3 hover:border-cyan-400/80 transition-all duration-300 relative group"
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
          Sample Input
        </span>
      </div>
      <pre className="bg-gray-800/80 border border-cyan-700/30 rounded-md p-2 text-xs text-cyan-100 whitespace-pre-wrap overflow-x-auto">
        {input || <span className="italic text-gray-500">(none)</span>}
      </pre>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold uppercase tracking-wider text-pink-300">
          Sample Output
        </span>
      </div>
      <pre className="bg-gray-800/80 border border-pink-700/30 rounded-md p-2 text-xs text-pink-100 whitespace-pre-wrap overflow-x-auto">
        {output || <span className="italic text-gray-500">(none)</span>}
      </pre>
    </motion.div>
  );
}
