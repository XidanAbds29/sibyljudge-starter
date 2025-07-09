import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";

function NeonGlowSVG({ className = "", style = {}, ...props }) {
  return (
    <svg
      className={"absolute pointer-events-none z-0 " + className}
      style={style}
      width="100%"
      height="100%"
      viewBox="0 0 1440 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      {...props}
    >
      <defs>
        <radialGradient id="neon-glow-create" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ec4899" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="720" cy="100" rx="700" ry="60" fill="url(#neon-glow-create)" />
    </svg>
  );
}

const ContestCreatePage = () => {
  const [step, setStep] = useState(1);
  const [contestInfo, setContestInfo] = useState({
    name: "",
    openness: "Public",
    password: "",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    description: "",
    difficulty: "",
  });
  const [selectedProblems, setSelectedProblems] = useState([]);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  useEffect(() => {
    // Fetch real problems from backend
    const fetchProblems = async () => {
      try {
        const res = await fetch("/api/problems?limit=100"); // Adjust limit as needed
        if (!res.ok) throw new Error("Failed to fetch problems");
        const data = await res.json();
        setProblems(
          (data.problems || []).map((p) => ({
            problem_id: p.problem_id,
            title: p.title,
            source_name: p.source_name,
            difficulty: p.difficulty,
            tags:
              (p.Problem_tag || []).map((pt) => pt.Tag?.name).filter(Boolean) ||
              [],
            time_limit: p.time_limit,
            mem_limit: p.mem_limit,
          })) || []
        );
      } catch (err) {
        setError("Could not load problems for selection.");
        setProblems([]);
      }
    };
    fetchProblems();
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 40, filter: "blur(10px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1.1,
          ease: "power4.out",
        }
      );
    }
  }, [step]);

  const toggleProblem = (pid) => {
    setSelectedProblems((prev) =>
      prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid]
    );
  };

  const getCombinedDateTime = (date, time) => {
    if (!date || !time) return "";
    return `${date}T${time}`;
  };

  const handleCreateContest = async () => {
    if (!user) {
      setError("You must be logged in to create a contest.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/contests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contestInfo.name,
          start_time: getCombinedDateTime(contestInfo.start_date, contestInfo.start_time),
          end_time: getCombinedDateTime(contestInfo.end_date, contestInfo.end_time),
          description: contestInfo.description,
          difficulty: contestInfo.difficulty,
          password: contestInfo.openness === "Private" ? contestInfo.password : "",
          problems: selectedProblems,
          created_by: user.id,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Failed to create contest");
      }
      const { contest } = await res.json();
      setSuccess("Contest created successfully!");
      setTimeout(() => navigate(`/contests/${contest.contest_id}`), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    if (step === 1) {
      return (
        <section>
          <h2 className="text-2xl font-bold text-pink-400 mb-6 pb-2 border-b-2 border-pink-700/50" style={{ textShadow: "0 0 8px rgba(236, 72, 153, 0.5)" }}>
            Contest Details
          </h2>
          <form className="space-y-4">
            <div>
              <label className="block mb-1 text-sm text-gray-400 font-medium">Contest Name <span className="text-pink-400">*</span></label>
              <input
                className="block w-full p-2.5 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                type="text"
                placeholder="Enter a cool name..."
                value={contestInfo.name}
                onChange={e => setContestInfo({ ...contestInfo, name: e.target.value })}
              />
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block mb-1 text-sm text-gray-400 font-medium">Openness <span className="text-pink-400">*</span></label>
                <select
                  className="block w-full p-2.5 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                  value={contestInfo.openness}
                  onChange={e => setContestInfo({ ...contestInfo, openness: e.target.value, password: "" })}
                >
                  <option value="Public">Public</option>
                  <option value="Private">Private</option>
                </select>
              </div>
            </div>
            {contestInfo.openness === "Private" && (
              <div>
                <label className="block mb-1 text-sm text-gray-400 font-medium">Password <span className="text-pink-400">*</span></label>
                <input
                  className="block w-full p-2.5 bg-gray-800 text-gray-200 rounded-lg border border-pink-700 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
                  type="password"
                  placeholder="Required for private contests"
                  value={contestInfo.password}
                  onChange={e => setContestInfo({ ...contestInfo, password: e.target.value })}
                  required
                />
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm text-gray-400 font-medium">Start Date <span className="text-pink-400">*</span></label>
                <input
                  className="block w-full p-2.5 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                  type="date"
                  value={contestInfo.start_date}
                  onChange={e => setContestInfo({ ...contestInfo, start_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm text-gray-400 font-medium">Start Time <span className="text-pink-400">*</span></label>
                <input
                  className="block w-full p-2.5 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                  type="time"
                  value={contestInfo.start_time}
                  onChange={e => setContestInfo({ ...contestInfo, start_time: e.target.value })}
                  step="60"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm text-gray-400 font-medium">End Date <span className="text-pink-400">*</span></label>
                <input
                  className="block w-full p-2.5 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                  type="date"
                  value={contestInfo.end_date}
                  onChange={e => setContestInfo({ ...contestInfo, end_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm text-gray-400 font-medium">End Time <span className="text-pink-400">*</span></label>
                <input
                  className="block w-full p-2.5 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                  type="time"
                  value={contestInfo.end_time}
                  onChange={e => setContestInfo({ ...contestInfo, end_time: e.target.value })}
                  step="60"
                />
              </div>
            </div>
            <div>
              <label className="block mb-1 text-sm text-gray-400 font-medium">Difficulty</label>
              <select
                className="block w-full p-2.5 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                value={contestInfo.difficulty}
                onChange={e => setContestInfo({ ...contestInfo, difficulty: e.target.value })}
              >
                <option value="">Select Difficulty</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-sm text-gray-400 font-medium">Description</label>
              <textarea
                className="block w-full p-2.5 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                placeholder="A brief, exciting description..."
                rows="3"
                value={contestInfo.description}
                onChange={e => setContestInfo({ ...contestInfo, description: e.target.value })}
              />
            </div>
          </form>
          {/* Removed the Next: Select Problems button here as requested */}
        </section>
      );
    }
    if (step === 2) {
      return (
        <section>
          <h2 className="text-2xl font-bold text-pink-400 mb-6 pb-2 border-b-2 border-pink-700/50" style={{ textShadow: "0 0 8px rgba(236, 72, 153, 0.5)" }}>
            Select Problems
          </h2>
          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-2">
            {problems.length > 0 ? problems.map((p) => (
              <label
                key={p.problem_id}
                className={`group relative flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${
                    selectedProblems.includes(p.problem_id)
                      ? "border-pink-400 bg-gray-800/80 shadow-lg"
                      : "border-cyan-700/40 bg-gray-900/60 hover:border-cyan-400"
                  }
                `}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-80 transition-all duration-300 z-0">
                  <NeonGlowSVG className="w-full h-full" style={{ opacity: 0.5 }} />
                </div>
                <div className="relative z-10 flex items-start gap-4 w-full">
                  <input
                    type="checkbox"
                    checked={selectedProblems.includes(p.problem_id)}
                    onChange={() => toggleProblem(p.problem_id)}
                    className="accent-pink-500 w-5 h-5 mt-1 flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="text-cyan-300 font-semibold text-lg">
                      {p.title}
                    </div>
                    <div className="flex flex-wrap gap-2 items-center mt-1.5">
                      <span className="px-2.5 py-1 text-xs font-medium bg-gray-800 text-gray-300 rounded-full border border-gray-700">
                        {p.source_name}
                      </span>
                      {p.difficulty && (
                        <span className="px-2.5 py-1 text-xs font-medium bg-pink-700/30 text-pink-300 rounded-full border border-pink-600/50">
                          Rating: {p.difficulty}
                        </span>
                      )}
                    </div>
                    {p.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {p.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-xs bg-sky-800/40 text-sky-300 rounded-full border border-sky-700/60"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </label>
            )) : <p className="text-gray-400">No problems available to select.</p>}
          </div>
          {selectedProblems.length > 0 && (
            <div className="mt-4 text-cyan-300 text-sm">
              <span className="font-semibold">Selected:</span> {selectedProblems.length} problem(s)
            </div>
          )}
        </section>
      );
    }
  };

  const validateStep1 = () => {
    const { name, openness, password, start_date, start_time, end_date, end_time, description, difficulty } = contestInfo;
    if (!name || !openness || !start_date || !start_time || !end_date || !end_time) {
      setError("Please fill in all required fields.");
      return false;
    }
    if (openness === "Private" && !password) {
      setError("Password is required for private contests.");
      return false;
    }
    if (new Date(`${start_date}T${start_time}`) >= new Date(`${end_date}T${end_time}`)) {
      setError("End time must be after start time.");
      return false;
    }
    setError(null);
    return true;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-0 relative overflow-hidden">
      <div className="fixed inset-0 w-screen h-screen z-0 left-0 top-0">
        <div className="absolute inset-0 pointer-events-none z-10">
          <svg width="100vw" height="100vh" viewBox="0 0 1920 1080" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full block">
            <defs>
              <radialGradient id="cyanglow" cx="50%" cy="50%" r="80%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.38" />
                <stop offset="60%" stopColor="#22d3ee" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="1920" height="1080" fill="url(#cyanglow)" />
          </svg>
        </div>
      </div>
      <div
        ref={containerRef}
        className="max-w-4xl mx-auto bg-gray-900/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-lg border border-cyan-500/20 relative z-10 min-h-screen flex flex-col justify-center"
      >
        <div className="relative">
          <NeonGlowSVG style={{ top: "-50px" }} />
          <h1 className="text-4xl font-bold text-center mb-2 text-cyan-300" style={{ textShadow: "0 0 12px rgba(56, 189, 248, 0.5)" }}>
            Create New Contest
          </h1>
          <p className="text-center text-gray-400 mb-8">
            Forge a new challenge for the world to face.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/60 text-red-200 rounded-lg border border-red-700 relative z-10">{error}</div>
        )}
        {success && (
          <div className="bg-green-500/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg relative mb-4 animate-pulse">
            {success}
          </div>
        )}

        <div className="relative p-6 bg-gray-800/50 rounded-xl border border-gray-700/50">
          {renderStep()}
        </div>

        <div className="flex justify-between items-center mt-8">
          {step === 1 && (
            <button
              onClick={() => navigate('/contests')}
              className="px-6 py-2 font-semibold text-white bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-200"
            >
              Cancel
            </button>
          )}
          {step === 2 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-2 font-semibold text-white bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-200"
            >
              Back
            </button>
          )}
          <div className="flex-grow"></div>
          {step < 2 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-6 py-2 font-semibold text-black bg-cyan-400 rounded-lg hover:bg-cyan-300 shadow-[0_0_15px_rgba(56,189,248,0.5)] transition-all duration-200"
            >
              Next: Select Problems
            </button>
          ) : (
            <button
              onClick={handleCreateContest}
              disabled={loading}
              className="px-6 py-2 font-semibold text-black bg-pink-500 rounded-lg hover:bg-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.6)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Contest"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContestCreatePage;
