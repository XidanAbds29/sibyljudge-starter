import React from "react";

const Community = () => {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center font-['Orbitron',_sans-serif]">
      <div className="w-full max-w-3xl mx-auto bg-gradient-to-br from-cyan-900/80 to-pink-900/80 rounded-3xl shadow-2xl border border-cyan-700/40 p-10 relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-72 h-72 bg-cyan-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-pink-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold text-cyan-400 mb-8 tracking-wide" style={{ textShadow: "0 0 16px #00fff7, 0 0 32px #00fff7" }}>
            Community
          </h1>
          <div className="prose prose-invert max-w-none text-cyan-100">
            <p>
              Welcome to the <span className="text-pink-400 font-bold">SibylJudge Community</span>! 🚀
            </p>
            <p>
              This is your hub for connecting with other competitive programmers, sharing knowledge, and growing together. Here you can:
            </p>
            <ul>
              <li>Ask questions and get help from the community</li>
              <li>Share tips, tricks, and resources</li>
              <li>Find teammates for contests and group up</li>
              <li>Discuss problem-solving strategies and algorithms</li>
              <li>Stay updated on platform news and events</li>
            </ul>
            <p>
              <span className="text-yellow-300 font-semibold">Coming soon:</span> Community forums, chat, and more!
            </p>
            <p className="text-gray-400 mt-8 text-sm">
              Want to suggest a feature or report a bug? Reach out to us via the feedback form or join our Discord!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;
