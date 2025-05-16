import React from "react";
import bgImage from "../assets/bg.png"; // Make sure bg.png is in src/assets

export default function HomePage() {
  return (
    <div
      className="relative min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Overlay for darkness and readability */}
      <div className="absolute inset-0 bg-black bg-opacity-70" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center text-white">
        <h1 className="text-6xl md:text-7xl font-extrabold text-sybil-accent drop-shadow-[0_0_20px_#00f5ff] mb-6">
          Welcome to SibylJudge
        </h1>
        <p className="text-2xl md:text-3xl font-light text-gray-300 mb-10 italic">
          “Judgement Begins Now…”
        </p>
        <button className="px-8 py-4 bg-cyan-400 text-black font-bold rounded-md shadow-lg hover:bg-cyan-300 hover:shadow-[0_0_15px_#00f5ff] transition duration-300">
          Explore Problems
        </button>
      </div>
    </div>
  );
}
