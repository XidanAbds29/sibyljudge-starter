// frontend/client/src/App.jsx
import React, { useState } from "react";
import { Link, Routes, Route, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import ProblemList from "./components/ProblemList";
import ProblemPage from "./components/ProblemPage";
import AuthPage from "./pages/AuthPage";
import FAQ from "./pages/FAQ";
import ScrollToTop from "./components/ScrollToTop";
import ContestListPage from "./components/ContestListPage";
import ContestCreatePage from "./components/ContestCreatePage";
import ContestPage from "./components/ContestPage";
import ContestProblemPage from "./pages/ContestProblemPage";
import DiscussionPage from "./pages/DiscussionPage"; // Importing DiscussionPage
import DiscussionThreadPage from "./pages/DiscussionThreadPage"; // Importing DiscussionThreadPage
// Corrected import path assuming AuthContext.jsx is in src/components/
import { AuthProvider, useAuth } from "./components/AuthContext";

// User dropdown component
function UserDropdown({ user, profile, signOut }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative ml-2">
      <button
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-cyan-700/30 text-cyan-300 rounded-full border border-cyan-700/40 shadow transition duration-300 focus:outline-none"
        onClick={() => setOpen((v) => !v)}
        aria-label="User menu"
      >
        {/* Modern SVG user icon */}
        <span className="inline-block w-7 h-7">
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <circle cx="16" cy="16" r="16" fill="#0ea5e9" />
            <circle cx="16" cy="13" r="6" fill="#fff" />
            <ellipse cx="16" cy="24" rx="8" ry="5" fill="#fff" />
          </svg>
        </span>
        <span className="hidden sm:inline font-semibold text-sm">
          {profile?.username || user?.email?.split("@")[0] || "User"}
        </span>
        <svg
          className={`ml-1 w-4 h-4 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-cyan-700/40 rounded-lg shadow-xl z-50 animate-fade-in">
          <div className="px-5 py-4 border-b border-cyan-700/20">
            <div className="font-bold text-cyan-300 text-lg mb-1">
              {profile?.username || user?.email?.split("@")[0]}
            </div>
            <div className="text-gray-400 text-xs break-all">{user?.email}</div>
          </div>
          <div className="px-5 py-3">
            <div className="text-gray-400 text-xs mb-2">Institute:</div>
            <div className="text-cyan-200 text-xs mb-3 min-h-[1.2em]">
              {profile?.institution || (
                <span className="text-gray-500">Not set</span>
              )}
            </div>
            <div className="text-gray-400 text-xs mb-2">Bio:</div>
            <div className="text-cyan-200 text-xs mb-3 min-h-[1.2em]">
              {profile?.bio || <span className="text-gray-500">Not set</span>}
            </div>
            <button
              onClick={signOut}
              className="w-full px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white font-semibold rounded-md transition duration-300 shadow hover:shadow-md mt-2"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Navbar component that uses AuthContext
function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    if (!signOut) {
      console.error("SignOut function not available from AuthContext");
      return;
    }
    const { error } = await signOut();
    if (error) {
      console.error("Error signing out:", error.message);
      // Optionally show an error message to the user via a toast or state update
    } else {
      navigate("/"); // Redirect to home or login page after sign out
    }
  };

  return (
    <nav className="bg-gray-900/80 backdrop-blur-md p-4 shadow-lg fixed w-full z-50 border-b border-cyan-700/30">
      <div className="container mx-auto flex justify-between items-center">
        <Link
          to="/"
          className="text-2xl font-bold text-cyan-400 hover:text-cyan-300 transition duration-300"
          style={{ textShadow: "0 0 10px rgba(0, 255, 255, 0.7)" }}
        >
          SibylJudge
        </Link>
        <div className="space-x-2 sm:space-x-4 flex items-center">
          <Link
            to="/"
            className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-300 hover:text-cyan-400 rounded-md transition duration-300"
          >
            Home
          </Link>
          <Link
            to="/problems"
            className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-300 hover:text-cyan-400 rounded-md transition duration-300"
          >
            Problems
          </Link>
          <Link
            to="/contests"
            className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-300 hover:text-cyan-400 rounded-md transition duration-300"
          >
            Contests
          </Link>
          <Link
            to="/groups"
            className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-300 hover:text-cyan-400 rounded-md transition duration-300"
          >
            Groups
          </Link>
          <Link
            to="/faq"
            className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-300 hover:text-cyan-400 rounded-md transition duration-300"
          >
            FAQ
          </Link>
          <Link
            to="/discussion"
            className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-300 hover:text-cyan-400 rounded-md transition duration-300"
          >
            Discussion
          </Link>

          {user ? (
            <UserDropdown user={user} profile={profile} signOut={signOut} />
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-300 hover:text-cyan-400 rounded-md transition duration-300"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-white font-semibold rounded-md transition duration-300 shadow-md hover:shadow-lg"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

// This component will render the main layout and routes
function AppLayoutAndRoutes() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-['Orbitron',_sans-serif] antialiased">
      {" "}
      {/* Using Orbitron font */}
      <ScrollToTop /> {/* ScrollToTop component to handle scroll restoration */}
      {/* Navbar is placed at the top of the layout */}
      <Navbar />
      {/* Increased padding-top to ensure content is below the navbar */}
      <main className="pt-20 sm:pt-24 container mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/problems" element={<ProblemList />} />
          <Route path="/problem/:external_id" element={<ProblemPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contests" element={<ContestListPage />} />
          <Route path="/contests/create" element={<ContestCreatePage />} />
          <Route path="/contests/:contestId" element={<ContestPage />} />
          <Route path="/contests/:contestId/problem/:problemId" element={<ContestProblemPage />} />
          <Route path="/discussion" element={<DiscussionPage />} />
          <Route path="/discussions" element={<DiscussionPage />} />
          <Route path="/discussions/:threadId" element={<DiscussionThreadPage />} />
          <Route
            path="/groups"
            element={
              <div className="text-center py-10 text-2xl text-cyan-400">
                Groups - Coming Soon!
              </div>
            }
          />
          <Route
            path="*"
            element={
              <div className="min-h-[calc(100vh-10rem)] flex flex-col items-center justify-center text-center py-10">
                <h1 className="text-6xl font-bold text-red-500">404</h1>
                <p className="text-2xl text-red-400 mt-4">Page Not Found</p>
                <p className="text-gray-300 mt-2">
                  The page you are looking for does not exist or has been moved.
                </p>
                <Link
                  to="/"
                  className="mt-8 px-6 py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-500 transition"
                >
                  Go Home
                </Link>
              </div>
            }
          />
        </Routes>
      </main>
      <footer className="bg-gray-950 text-center p-6 mt-12 border-t border-cyan-700/30">
        <p className="text-sm text-gray-400">
          &copy; {new Date().getFullYear()} SibylJudge. All rights reserved.
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Crafted with futuristic ambition.
        </p>
      </footer>
    </div>
  );
}

// Main App component that provides AuthContext
export default function App() {
  return (
    <AuthProvider>
      {" "}
      {/* AuthProvider wraps the content that needs auth context */}
      <AppLayoutAndRoutes />
    </AuthProvider>
  );
}
