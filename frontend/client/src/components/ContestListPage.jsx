import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

// Neon SVG Glow Component (matching ProblemList)
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
        <radialGradient id="neon-glow-contests" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00fff7" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#00fff7" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="720" cy="100" rx="700" ry="60" fill="url(#neon-glow-contests)" />
    </svg>
  );
}

const statusColors = {
  "Upcoming": "text-cyan-400 border-cyan-400",
  "Ongoing": "text-pink-400 border-pink-400",
  "Finished": "text-yellow-300 border-yellow-300",
};

const DIFFICULTIES = ["", "Easy", "Medium", "Hard"];
const STATUSES = ["", "Ongoing", "Upcoming", "Finished"];

const ContestListPage = () => {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [difficulty, setDifficulty] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();
  const listRef = useRef(null);

  // Fetch contests
  useEffect(() => {
    const fetchContests = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/contests");
        if (!res.ok) throw new Error("Failed to fetch contests");
        const data = await res.json();
        // Add status field based on time
        const now = new Date();
        const contestsWithStatus = data.map((c) => {
          const start = new Date(c.start_time);
          const end = new Date(c.end_time);
          let status = "Upcoming";
          if (now >= start && now <= end) status = "Ongoing";
          else if (now > end) status = "Finished";
          // Difficulty mapping (example: you may want to adjust this logic)
          let diff = "";
          if (c.difficulty) diff = c.difficulty;
          else if (c.level) diff = c.level;
          else if (c.name?.toLowerCase().includes("easy")) diff = "Easy";
          else if (c.name?.toLowerCase().includes("medium")) diff = "Medium";
          else if (c.name?.toLowerCase().includes("hard")) diff = "Hard";
          return { ...c, status, difficulty: diff };
        });
        setContests(contestsWithStatus);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchContests();
    // eslint-disable-next-line
  }, [refreshKey]);

  useEffect(() => {
    setPage(1);
  }, [difficulty, status, search]);

  useEffect(() => {
    if (listRef.current && contests.length > 0) {
      // Check if gsap is loaded via CDN before using it
      if (typeof window.gsap !== "undefined") {
        const ctx = window.gsap.context(() => {
          window.gsap.fromTo(
            listRef.current,
            { opacity: 0, y: 40, filter: "blur(10px)" },
            {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 1.1,
              ease: "power4.out",
            }
          );
        });
        return () => ctx.revert();
      }
    }
  }, [contests]);

  // Filter contests by difficulty, status, and search
  const filteredContests = contests.filter((c) => {
    const matchesDifficulty = !difficulty || (c.difficulty && c.difficulty.toLowerCase() === difficulty.toLowerCase());
    const matchesStatus = !status || c.status === status;
    const matchesSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
    return matchesDifficulty && matchesStatus && matchesSearch;
  });

  const lastPage = Math.max(1, Math.ceil(filteredContests.length / limit));
  const paginatedContests = filteredContests.slice((page - 1) * limit, page * limit);

  return (
    <div
      ref={listRef}
      className="p-4 sm:p-6 min-h-screen bg-gray-950 text-gray-200"
    >
      {/* Filters Section */}
      <div className="max-w-4xl mx-auto mb-6 p-4 bg-gray-900/80 backdrop-blur-sm rounded-lg shadow-xl border border-cyan-700/40 space-y-4">
        {/* Top row with filters and buttons */}
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block mb-1 text-sm text-gray-400 font-medium">Status</label>
            <select
              value={status}
              onChange={e => { setStatus(e.target.value); setPage(1); }}
              className="p-2.5 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s || "All"}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm text-gray-400 font-medium">Difficulty</label>
            <select
              value={difficulty}
              onChange={e => { setDifficulty(e.target.value); setPage(1); }}
              className="p-2.5 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>{d || "All"}</option>
              ))}
            </select>
          </div>
          <button
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-sky-600 text-white font-semibold rounded-lg hover:from-cyan-400 hover:to-sky-500 focus:ring-4 focus:ring-cyan-500/50 focus:outline-none transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-cyan-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={() => setRefreshKey(k => k + 1)}
            disabled={loading}
          >
            {loading ? "Loading…" : "Refresh List"}
          </button>
          <button
            className="ml-auto px-4 py-2 bg-cyan-600 text-gray-950 font-semibold rounded-lg hover:bg-cyan-500 transition-all duration-300 shadow hover:shadow-md hover:shadow-cyan-500/30 text-sm"
            onClick={() => navigate("/contests/create")}
          >
            Create Contest
          </button>
        </div>
        
        {/* Bottom row with search */}
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block mb-1 text-sm text-gray-400 font-medium">Search Contests</label>
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by contest name..."
              className="w-full p-2.5 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-4xl mx-auto mb-6 p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
          <p className="text-red-400 text-center">
            {error}
          </p>
        </div>
      )}

      {/* Contest List */}
      <div className="max-w-4xl mx-auto bg-gray-900/80 backdrop-blur-sm rounded-lg p-6 shadow-xl border border-cyan-700/40">
        <h2
          className="text-2xl font-bold text-cyan-400 mb-6 pb-2 border-b-2 border-cyan-700/50"
          style={{ textShadow: "0 0 8px rgba(0, 255, 255, 0.5)" }}
        >
          Contest Archive
        </h2>
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-400"></div>
            <p className="mt-4 text-gray-400">Loading contests...</p>
          </div>
        ) : !paginatedContests.length ? (
          <p className="text-center text-gray-400 py-10 text-lg">
            {filteredContests.length > 0 && page > 1
              ? "No contests on this page."
              : "No contests found matching your criteria."}
          </p>
        ) : (
          <div className="divide-y divide-gray-700/70">
            {paginatedContests.map((contest) => (
              <div
                key={contest.contest_id}
                className="py-5 group relative transition-all duration-300 hover:scale-[1.025] hover:z-10"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-80 transition-all duration-300 z-0">
                  <NeonGlowSVG
                    className="w-full h-full"
                    style={{ opacity: 0.5 }}
                  />
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between relative z-10">
                  <div className="flex-1 min-w-0 mb-3 sm:mb-0">
                    <div
                      className="text-xl font-semibold text-cyan-400 hover:text-sky-300 transition-colors duration-300 block group-hover:tracking-wide cursor-pointer"
                      title={contest.name}
                      onClick={() => navigate(`/contests/${contest.contest_id}`)}
                    >
                      {contest.name}
                    </div>
                    {contest.description && (
                      <p className="text-gray-400 mt-1 mb-2">{contest.description}</p>
                    )}
                    <div className="mt-2.5 flex flex-wrap gap-2 items-center">
                      <span className="px-2.5 py-1 text-xs font-medium bg-gray-800 text-gray-300 rounded-full border border-gray-700">
                        ID: {contest.contest_id}
                      </span>
                      <span className="px-2.5 py-1 text-xs font-medium bg-gray-800 text-cyan-300 rounded-full border border-gray-700">
                        Start: {new Date(contest.start_time).toLocaleDateString()}
                      </span>
                      <span className="px-2.5 py-1 text-xs font-medium bg-gray-800 text-pink-300 rounded-full border border-gray-700">
                        End: {new Date(contest.end_time).toLocaleDateString()}
                      </span>
                      {contest.difficulty && (
                        <span className="px-2.5 py-1 text-xs font-medium bg-yellow-700/30 text-yellow-300 rounded-full border border-yellow-600/50">
                          Difficulty: {contest.difficulty}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`ml-0 sm:ml-4 flex-shrink-0 px-4 py-2 border-2 rounded-full font-semibold text-sm tracking-wider transition-all duration-300 ${statusColors[contest.status] || "text-gray-400 border-gray-400"}`}>
                    {contest.status}
                    {contest.status === "Ongoing" && (
                      <span className="ml-2 animate-pulse">🔴</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {filteredContests.length > 0 && (
          <div className="mt-8 flex justify-between items-center pt-4 border-t border-gray-700/70">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1 || loading}
              className="px-4 py-2 bg-gray-800 text-cyan-400 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              ← Previous
            </button>
            <span className="text-gray-400 font-medium">
              Page {page} of {lastPage}
            </span>
            <button
              onClick={() => setPage(Math.min(lastPage, page + 1))}
              disabled={page === lastPage || loading}
              className="px-4 py-2 bg-gray-800 text-cyan-400 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContestListPage;
