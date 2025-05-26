import React from "react";
import { Link } from "react-router-dom";
import bgImage from "../assets/bg.png";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      {/* Hero Section */}
      <header
        className="relative flex items-center justify-center h-screen bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://placehold.co/1920x1080/1a202c/e2e8f0?text=Coding+Background)",
        }}
      >
        <div className="absolute inset-0 bg-black opacity-70"></div>
        <div className="relative z-10 text-center p-8 bg-gray-900 bg-opacity-80 rounded-lg shadow-xl max-w-3xl mx-auto border border-cyan-800/30">
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4 leading-tight drop-shadow-[0_0_10px_rgba(0,245,255,0.5)]">
            Sharpen Your Coding Skills with{" "}
            <span className="text-cyan-400">SibylJudge</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8">
            Your ultimate platform for competitive programming, problem-solving,
            and algorithmic challenges.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link to="/signup">
              <button className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(0,245,255,0.7)]">
                Start Coding Now
              </button>
            </Link>
            <Link to="/problems">
              <button className="bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold py-3 px-8 rounded-full shadow-lg transform transition duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(0,245,255,0.3)]">
                Explore Problems
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 bg-gray-950">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-cyan-400 mb-12 drop-shadow-[0_0_10px_rgba(0,245,255,0.5)]">
            Features Designed for Success
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {/* Feature Cards */}
            <div className="bg-gray-900 p-8 rounded-lg shadow-lg border border-cyan-800 transform transition duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(0,245,255,0.5)]">
              <div className="text-cyan-400 mb-4">
                <svg
                  className="w-12 h-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  ></path>
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-cyan-400 text-center mb-4">
                Vast Problem Set
              </h3>
              <p className="text-gray-400 text-center">
                Access a diverse collection of algorithmic problems from various
                online judges.
              </p>
            </div>

            <div className="bg-gray-900 p-8 rounded-lg shadow-lg border border-cyan-800 transform transition duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(0,245,255,0.5)]">
              <div className="text-cyan-400 mb-4">
                <svg
                  className="w-12 h-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-cyan-400 text-center mb-4">
                Real-time Judging
              </h3>
              <p className="text-gray-400 text-center">
                Get instant feedback with detailed test case results and
                performance metrics.
              </p>
            </div>

            <div className="bg-gray-900 p-8 rounded-lg shadow-lg border border-cyan-800 transform transition duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(0,245,255,0.5)]">
              <div className="text-cyan-400 mb-4">
                <svg
                  className="w-12 h-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H2m2-2a4 4 0 014-4h12"
                  ></path>
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-cyan-400 text-center mb-4">
                Competitive Contests
              </h3>
              <p className="text-gray-400 text-center">
                Participate in thrilling contests, compete with peers, and climb
                the leaderboards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-gradient-to-b from-gray-900 to-gray-950 text-white text-center">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold mb-6 drop-shadow-[0_0_10px_rgba(0,245,255,0.5)]">
            Ready to Begin Your Journey?
          </h2>
          <p className="text-xl mb-8">
            Join SibylJudge today and become a master of algorithms!
          </p>
          <Link to="/signup">
            <button className="bg-cyan-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition duration-300 hover:scale-105 hover:bg-cyan-500 hover:shadow-[0_0_20px_rgba(0,245,255,0.7)]">
              Sign Up for Free
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
