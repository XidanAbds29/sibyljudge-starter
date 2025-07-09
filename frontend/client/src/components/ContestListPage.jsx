import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
// import bgImage from "../assets/bg.png";

const statusColors = {
  Upcoming: "text-cyan-400 border-cyan-400",
  Ongoing: "text-pink-400 border-pink-400",
  Finished: "text-yellow-300 border-yellow-300",
};


const DIFFICULTIES = ["", "Easy", "Medium", "Hard"];
const STATUSES = ["", "Ongoing", "Upcoming", "Finished"];

const ContestListPage = () => {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [difficulty, setDifficulty] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const listRef = useRef();

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
  }, [difficulty, status]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.8 }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [contests, page, difficulty, status]);

  useEffect(() => {
    if (listRef.current) {
      gsap.fromTo(
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
    }
  }, [contests, page, difficulty, status]);

  // Filter contests by difficulty, status
  const filteredContests = contests.filter((c) => {
    const matchesDifficulty = !difficulty || (c.difficulty && c.difficulty.toLowerCase() === difficulty.toLowerCase());
    const matchesStatus = !status || c.status === status;
    return matchesDifficulty && matchesStatus;
  });

  const lastPage = Math.max(1, Math.ceil(filteredContests.length / limit));
  const paginatedContests = filteredContests.slice((page - 1) * limit, page * limit);

  return (
    <div
      ref={listRef}
      className="p-4 sm:p-6 min-h-screen bg-gray-950 text-gray-200 font-['Orbitron',_sans-serif] antialiased"
    >
      <div className="max-w-4xl mx-auto mb-6 p-4 bg-gray-900/80 backdrop-blur-sm flex flex-wrap gap-4 items-end rounded-lg shadow-xl border border-cyan-700/40">
        <div>
          <label className="block mb-1 text-sm text-gray-400 font-medium">Status</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
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
            onChange={e => setDifficulty(e.target.value)}
            className="p-2.5 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>{d || "All"}</option>
            ))}
          </select>
        </div>
        <button
          className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-sky-600 text-white font-semibold rounded-lg hover:from-cyan-400 hover:to-sky-500 focus:ring-4 focus:ring-cyan-500/50 focus:outline-none transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-cyan-500/30"
          onClick={() => setRefreshKey(k => k + 1)}
          disabled={loading}
        >
          {loading ? "Loading…" : "Refresh List"}
        </button>
        <button
          className="bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-white font-bold py-2.5 px-7 rounded-lg shadow-lg transform transition duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(56,189,248,0.7)] focus:outline-none focus:ring-4 focus:ring-cyan-500/50 ml-auto"
          onClick={() => navigate("/contests/create")}
        >
          + Create Contest
        </button>
      </div>
      {loading && (
        <div className="text-center text-cyan-400 text-xl mt-16">
          Loading contests...
        </div>
      )}
      {error && (
        <div className="text-center text-red-400 text-xl mt-16">
          {error}
        </div>
      )}
      {!loading && !error && (
        <div className="max-w-4xl mx-auto bg-gray-900/80 backdrop-blur-sm rounded-lg p-6 shadow-xl border border-cyan-700/40">
          <h2 className="text-2xl font-bold text-cyan-400 mb-6 pb-2 border-b-2 border-cyan-700/50" style={{ textShadow: '0 0 8px rgba(0,255,255,0.5)' }}>
            Contest Archive
          </h2>
          {paginatedContests.length === 0 ? (
            <p className="text-center text-gray-400 py-10 text-lg">No contests found.</p>
          ) : (
            <div className="divide-y divide-gray-700/70">
              {paginatedContests.map((contest) => (
                <div
                  key={contest.contest_id}
                  className="py-5 group relative transition-all duration-300 hover:scale-[1.025] hover:z-10 hover:bg-cyan-900/10 rounded-xl px-2 cursor-pointer"
                  onClick={() => navigate(`/contests/${contest.contest_id}`)}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between relative z-10">
                    <div className="flex-1 min-w-0 mb-3 sm:mb-0">
                      <div className="text-xl font-semibold text-cyan-400 group-hover:text-sky-300 transition-colors duration-300 block group-hover:tracking-wide">
                        {contest.name}
                      </div>
                      <div className="mt-2 text-sm text-gray-300">
                        <span className="mr-4">
                          <span className="font-semibold text-cyan-400">Start:</span> {new Date(contest.start_time).toLocaleString()}
                        </span>
                        <span>
                          <span className="font-semibold text-pink-400">End:</span> {new Date(contest.end_time).toLocaleString()}
                        </span>
                      </div>
                      {contest.difficulty && (
                        <div className="mt-2 text-xs text-cyan-200">
                          <span className="font-semibold">Difficulty:</span> {contest.difficulty}
                        </div>
                      )}
                    </div>
                    <div className={`mt-4 sm:mt-0 sm:ml-8 px-4 py-1 border-2 rounded-full font-semibold text-base tracking-wider ${statusColors[contest.status] || "text-gray-400 border-gray-400"}`}>
                      {contest.status}
                    </div>
                  </div>
                  <div className="absolute right-6 top-6">
                    {contest.status === "Ongoing" && (
                      <span className="animate-pulse text-pink-400 font-bold text-xs">LIVE</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
      )}
    </div>
  );
};

export default ContestListPage;
