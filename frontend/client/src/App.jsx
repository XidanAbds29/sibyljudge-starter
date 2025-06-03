import React from "react";
import { Link, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ProblemList from "./components/ProblemList";
import ProblemPage from "./components/ProblemPage";

// Main App component for layout and routing
function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      {/* Navigation Bar */}
      <nav className="bg-gray-900 p-4 shadow-lg fixed w-full z-50">
        <div className="container mx-auto flex justify-between items-center">
          <Link
            to="/"
            className="text-2xl font-bold text-cyan-400 hover:text-cyan-300 transition duration-300 drop-shadow-[0_0_8px_rgba(0,245,255,0.5)]"
          >
            SibylJudge
          </Link>
          <div className="space-x-4">
            <Link
              to="/"
              className="text-gray-300 hover:text-cyan-400 transition duration-300"
            >
              Home
            </Link>
            <Link
              to="/problems"
              className="text-gray-300 hover:text-cyan-400 transition duration-300"
            >
              Problems
            </Link>
            <Link
              to="/contests"
              className="text-gray-300 hover:text-cyan-400 transition duration-300"
            >
              Contests
            </Link>
            <Link
              to="/community"
              className="text-gray-300 hover:text-cyan-400 transition duration-300"
            >
              Community
            </Link>
            <Link
              to="/about"
              className="text-gray-300 hover:text-cyan-400 transition duration-300"
            >
              About
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content with Routes */}
      <div className="pt-16">
        {" "}
        {/* Added padding-top to account for fixed navbar */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/problems" element={<ProblemList />} />
          <Route path="/problem/:external_id" element={<ProblemPage />} />
          {/* Add other routes as needed */}
        </Routes>
      </div>
    </div>
  );
}

export default App;
