// frontend/client/src/pages/Home.jsx
import React, { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
// Assuming your AuthContext.jsx is in src/components/ or src/contexts/
// Adjust the path if necessary.
import { useAuth } from "../components/AuthContext"; // Or "../contexts/AuthContext"
import { gsap } from "gsap";

// Import your local background image
import bgImage from "../assets/bg.png";

export default function HomePage() {
  const { user } = useAuth(); // Get the current user state
  const sectionRef = useRef(null);
  const heroRef = useRef();
  useEffect(() => {
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current,
        { opacity: 0, y: 40, filter: "blur(10px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1.2,
          ease: "power4.out",
        }
      );
    }
  }, []);

  return (
    <div
      ref={heroRef}
      className="min-h-screen bg-gray-950 text-gray-100 font-['Orbitron',_sans-serif] antialiased"
    >
      {/* Hero Section */}
      <header
        className="relative flex items-center justify-center h-screen bg-cover bg-center"
        style={{
          backgroundImage: `url(${bgImage})`, // Use the imported bgImage variable
        }}
      >
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm"></div>
        <div className="relative z-10 text-center p-8 bg-gray-900/80 backdrop-blur-md rounded-xl shadow-2xl max-w-3xl mx-auto border border-cyan-700/50 shadow-cyan-500/20">
          <h1
            className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight"
            style={{
              textShadow:
                "0 0 12px rgba(0, 255, 255, 0.7), 0 0 20px rgba(0,255,255,0.5)",
            }}
          >
            Sharpen Your Coding Skills with{" "}
            <span className="text-cyan-400">SibylJudge</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-10 leading-relaxed">
            Your ultimate platform for competitive programming, problem-solving,
            and algorithmic challenges. Dive into the matrix of code.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            {!user ? (
              <Link to="/signup">
                <button className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-white font-bold py-3.5 px-10 rounded-lg shadow-lg transform transition duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(56,189,248,0.7)] focus:outline-none focus:ring-4 focus:ring-cyan-500/50">
                  Start Coding Now
                </button>
              </Link>
            ) : (
              <Link to="/problems">
                <button className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold py-3.5 px-10 rounded-lg shadow-lg transform transition duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(236,72,153,0.7)] focus:outline-none focus:ring-4 focus:ring-pink-500/50">
                  Go To Problems
                </button>
              </Link>
            )}
            <Link to="/problems">
              <button className="w-full sm:w-auto bg-gray-800/70 hover:bg-gray-700/90 text-gray-200 font-bold py-3.5 px-10 rounded-lg shadow-lg border border-cyan-700/50 hover:border-cyan-600 transform transition duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(0,245,255,0.3)] focus:outline-none focus:ring-4 focus:ring-gray-700/50">
                Explore Problems
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 bg-gray-950">
        <div className="container mx-auto px-6">
          <h2
            className="text-4xl font-bold text-center text-cyan-400 mb-16"
            style={{ textShadow: "0 0 10px rgba(0, 255, 255, 0.5)" }}
          >
            Features Designed for Success
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <div className="bg-gray-900/70 p-8 rounded-xl shadow-xl border border-cyan-800/60 transform transition duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,245,255,0.4)] hover:border-cyan-600 backdrop-blur-sm">
              <div className="text-cyan-400 mb-5 w-16 h-16 mx-auto flex items-center justify-center bg-cyan-900/30 rounded-full border-2 border-cyan-700">
                <svg
                  className="w-8 h-8"
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
              <h3 className="text-2xl font-semibold text-cyan-300 text-center mb-4 tracking-wide">
                Vast Problem Set
              </h3>
              <p className="text-gray-400 text-center leading-relaxed">
                Access a diverse collection of algorithmic problems from various
                online judges, curated for all skill levels.
              </p>
            </div>

            <div className="bg-gray-900/70 p-8 rounded-xl shadow-xl border border-cyan-800/60 transform transition duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,245,255,0.4)] hover:border-cyan-600 backdrop-blur-sm">
              <div className="text-cyan-400 mb-5 w-16 h-16 mx-auto flex items-center justify-center bg-cyan-900/30 rounded-full border-2 border-cyan-700">
                <svg
                  className="w-8 h-8"
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
              <h3 className="text-2xl font-semibold text-cyan-300 text-center mb-4 tracking-wide">
                Real-time Judging
              </h3>
              <p className="text-gray-400 text-center leading-relaxed">
                Get instant feedback with detailed test case results and
                performance metrics for your submissions.
              </p>
            </div>

            <div className="bg-gray-900/70 p-8 rounded-xl shadow-xl border border-cyan-800/60 transform transition duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,245,255,0.4)] hover:border-cyan-600 backdrop-blur-sm">
              <div className="text-cyan-400 mb-5 w-16 h-16 mx-auto flex items-center justify-center bg-cyan-900/30 rounded-full border-2 border-cyan-700">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H2m2-2a4 4 0 014-4h12a4 4 0 014 4v2"
                  ></path>
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-cyan-300 text-center mb-4 tracking-wide">
                Competitive Contests
              </h3>
              <p className="text-gray-400 text-center leading-relaxed">
                Participate in thrilling contests, compete with peers, and climb
                the dynamic leaderboards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section - Now Auth Aware */}
      <section className="py-20 bg-gradient-to-b from-gray-900 to-gray-950 text-white text-center">
        <div className="container mx-auto px-6">
          {!user ? (
            <>
              <h2
                className="text-4xl font-bold mb-6"
                style={{ textShadow: "0 0 10px rgba(0, 255, 255, 0.5)" }}
              >
                Ready to Begin Your Journey?
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Join SibylJudge today and become a master of algorithms!
              </p>
              <Link to="/signup">
                <button className="bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-white font-bold py-3.5 px-10 rounded-lg shadow-lg transform transition duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(56,189,248,0.7)] focus:outline-none focus:ring-4 focus:ring-cyan-500/50">
                  Sign Up for Free
                </button>
              </Link>
            </>
          ) : (
            <>
              <h2
                className="text-4xl font-bold mb-6 text-cyan-400"
                style={{ textShadow: "0 0 10px rgba(0, 255, 255, 0.5)" }}
              >
                Welcome Back, Coder!
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Continue honing your skills and conquer new challenges.
              </p>
              <div className="flex justify-center space-x-6">
                <Link to="/problems">
                  <button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold py-3.5 px-10 rounded-lg shadow-lg transform transition duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(236,72,153,0.7)] focus:outline-none focus:ring-4 focus:ring-pink-500/50">
                    Explore More Problems
                  </button>
                </Link>
                <Link to="/about">
                  <button className="bg-gradient-to-r from-cyan-400 to-teal-500 hover:from-cyan-500 hover:to-teal-600 text-gray-900 font-bold py-3.5 px-10 rounded-lg shadow-lg transform transition duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(22,255,255,0.8)] focus:outline-none focus:ring-4 focus:ring-cyan-400/50">
                    About Us
                  </button>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
