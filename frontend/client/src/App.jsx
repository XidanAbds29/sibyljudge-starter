// frontend/client/src/App.jsx
import React, { useState } from "react";
import { Link, Routes, Route, useNavigate, useLocation } from "react-router-dom";
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
import GroupListPage from "./pages/GroupList";
import GroupPage from "./pages/GroupPage";
import GroupCreate from "./pages/GroupCreate";
import Profile from "./pages/Profile";
import Community from "./pages/Community";
import DiscussionPage from "./pages/DiscussionPage";
import DiscussionThreadPage from "./pages/DiscussionThreadPage";
import { AuthProvider, useAuth } from "./components/AuthContext";

// Navbar component that uses AuthContext

function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    // For root, match exactly
    if (path === "/") return location.pathname === "/";
    // For other paths, match if location starts with path (for nested routes)
    return location.pathname.startsWith(path);
  };

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
            className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition duration-300 ${isActive("/") ? "text-cyan-400" : "text-gray-300 hover:text-cyan-400"}`}
          >
            Home
          </Link>
          <Link
            to="/problems"
            className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition duration-300 ${isActive("/problems") ? "text-cyan-400" : "text-gray-300 hover:text-cyan-400"}`}
          >
            Problems
          </Link>
          <Link
            to="/contests"
            className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition duration-300 ${isActive("/contests") ? "text-cyan-400" : "text-gray-300 hover:text-cyan-400"}`}
          >
            Contests
          </Link>
          <Link
            to="/groups"
            className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition duration-300 ${isActive("/groups") ? "text-cyan-400" : "text-gray-300 hover:text-cyan-400"}`}
          >
            Groups
          </Link>
          <Link
            to="/community"
            className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition duration-300 ${isActive("/community") ? "text-cyan-400" : "text-white hover:text-cyan-400"}`}
          >
            Community
          </Link>
          <Link
            to="/faq"
            className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition duration-300 ${isActive("/faq") ? "text-cyan-400" : "text-gray-300 hover:text-cyan-400"}`}
          >
            FAQ
          </Link>
          <Link
            to="/discussions"
            className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition duration-300 ${isActive("/discussions") ? "text-cyan-400" : "text-gray-300 hover:text-cyan-400"}`}
          >
            Discussion
          </Link>

          {user ? (
            <>
              <Link
                to="/profile"
                className={`flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-cyan-700/30 rounded-full border border-cyan-700/40 shadow transition duration-300 focus:outline-none ${isActive("/profile") ? "text-cyan-400" : "text-cyan-300"}`}
              >
                <span className="inline-block w-7 h-7">
                  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <circle cx="16" cy="16" r="16" fill="#0ea5e9" />
                    <circle cx="16" cy="13" r="6" fill="#fff" />
                    <ellipse cx="16" cy="24" rx="8" ry="5" fill="#fff" />
                  </svg>
                </span>
                <span className="hidden sm:inline font-semibold text-sm">
                  {profile?.username || user?.email?.split("@")?.[0] || "User"}
                </span>
              </Link>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white font-semibold rounded-md transition duration-300 shadow hover:shadow-md ml-2"
              >
                Logout
              </button>
            </>
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
          <Route path="/problem/:problem_id" element={<ProblemPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/community" element={<Community />} />
          <Route path="/discussions" element={<DiscussionPage />} />
          <Route path="/discussions/:threadId" element={<DiscussionThreadPage />} />
          <Route path="/contests" element={<ContestListPage />} />
          <Route path="/contests/create" element={<ContestCreatePage />} />
          <Route path="/contests/:contestId" element={<ContestPage />} />
          <Route path="/contests/:contestId/problem/:problemId" element={<ContestProblemPage />} />
          <Route path="/groups" element={<GroupListPage />} />
          <Route path="/groups/create" element={<GroupCreate />} />
          <Route path="/group/:group_id" element={<GroupPage />} />
          <Route path="/profile" element={<Profile />} />
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
