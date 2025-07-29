import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./AuthContext";

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
  "Upcoming": "bg-cyan-700/30 text-cyan-300 border-cyan-600/50",
  "Ongoing": "bg-pink-700/30 text-pink-300 border-pink-600/50",
  "Finished": "bg-yellow-700/30 text-yellow-300 border-yellow-600/50",
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
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [refreshKey, setRefreshKey] = useState(0);
  const [joinPassword, setJoinPassword] = useState("");
  const [joiningContest, setJoiningContest] = useState(null);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [isJoiningContest, setIsJoiningContest] = useState(false);
  const [myContests, setMyContests] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();
  const listRef = useRef(null);

  // Fetch contests
  useEffect(() => {
    const fetchContests = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        
        if (difficulty) {
          params.append('difficulty', difficulty);
        }
        if (status) {
          params.append('status', status);
        }
        if (search) {
          params.append('search', search);
        }
        
        const res = await fetch(`/api/contests?${params}`);
        if (!res.ok) throw new Error("Failed to fetch contests");
        const data = await res.json();
        setContests(data.contests);
        setTotal(data.total);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchContests();
    // eslint-disable-next-line
  }, [refreshKey, page, difficulty, status, search]);

  useEffect(() => {
    setPage(1);
  }, [difficulty, status, search]);

  useEffect(() => {
    if (user) {
      const fetchMyContests = async () => {
        try {
          const response = await fetch(`/api/contests/user/${user.id}`);
          if (response.ok) {
            const data = await response.json();
            setMyContests(data);
          }
        } catch (err) {
          // Ignore errors for my contests
          console.error('Error fetching my contests:', err);
        }
      };
      fetchMyContests();
    }
  }, [user, refreshKey]);

  useEffect(() => {
    if (listRef.current && contests.length > 0) {
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
      const items = listRef.current.querySelectorAll(".contest-card-animate");
      gsap.fromTo(
        items,
        { opacity: 0, y: 30, scale: 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          stagger: 0.08,
          ease: "power3.out",
          delay: 0.2,
        }
      );
    }
  }, [contests]);

  // No need for client-side filtering since server handles it
  const lastPage = Math.max(1, Math.ceil(total / limit));

  const handleJoin = async (contest) => {
    if (!user) {
      return;
    }

    // Check if password is required
    if (contest.is_secured) {
      setJoinPassword('');
      setJoiningContest(contest);
      setShowJoinDialog(true);
      return;
    }

    // Join without password
    try {
      const response = await fetch(`/api/contests/${contest.contest_id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: user.id,
          password: contest.is_secured ? joinPassword : undefined,
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to join contest');
      }

      // Refresh the contests list to show updated participation status
      setRefreshKey(k => k + 1);
    } catch (error) {
      console.error('Error joining contest:', error);
    }
  };

  const handleLeave = async (contest) => {
    if (!user) {
      return;
    }

    try {
      const response = await fetch(`/api/contests/${contest.contest_id}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: user.id })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to leave contest');
      }

      // Refresh the contests list to show updated participation status
      setRefreshKey(k => k + 1);
    } catch (error) {
      console.error('Error leaving contest:', error);
    }
  };

  const handleJoinWithPassword = async () => {
    if (!joiningContest) return;

    try {
      const response = await fetch(`/api/contests/${joiningContest.contest_id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          user_id: user.id,
          password: joinPassword 
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to join contest');
      }

      // Close dialog and refresh list
      setShowJoinDialog(false);
      setJoiningContest(null);
      setJoinPassword('');
      setRefreshKey(k => k + 1);
    } catch (error) {
      console.error('Error joining contest:', error);
    }
  };

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
            className="bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-white font-bold py-2.5 px-7 rounded-lg shadow-lg transform transition duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(56,189,248,0.7)] focus:outline-none focus:ring-4 focus:ring-cyan-500/50 ml-auto"
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
        ) : !contests.length ? (
          <p className="text-center text-gray-400 py-10 text-lg">
            No contests found matching your criteria.
          </p>
        ) : (
          <div className="divide-y divide-gray-700/70">
            {contests.map((contest) => (
              <div
                key={contest.contest_id}
                className="py-5 group contest-card-animate relative transition-all duration-300 hover:scale-[1.025] hover:z-10"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-80 transition-all duration-300 z-0">
                  <NeonGlowSVG
                    className="w-full h-full"
                    style={{ opacity: 0.5 }}
                  />
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between relative z-10">
                  <div className="flex-1 min-w-0 mb-3 sm:mb-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="text-xl font-semibold text-cyan-400 hover:text-sky-300 transition-colors duration-300 group-hover:tracking-wide cursor-pointer"
                        title={contest.name}
                        onClick={() => navigate(`/contests/${contest.contest_id}`)}
                      >
                        {contest.name}
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${statusColors[contest.status] || "bg-gray-800 text-gray-300 border-gray-700"}`}>
                        {contest.status}
                      </span>
                      {contest.difficulty && (
                        <span className="px-2.5 py-1 text-xs font-medium bg-yellow-700/30 text-yellow-300 rounded-full border border-yellow-600/50">
                          {contest.difficulty}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 items-center text-xs">
                      <span className="px-2.5 py-1 font-medium bg-gray-800 text-gray-300 rounded-full border border-gray-700">
                        ID: {contest.contest_id}
                      </span>
                      <span className="px-2.5 py-1 font-medium bg-gray-800 text-cyan-300 rounded-full border border-gray-700">
                        Start: {new Date(contest.start_time).toLocaleDateString()}
                      </span>
                      <span className="px-2.5 py-1 font-medium bg-gray-800 text-pink-300 rounded-full border border-gray-700">
                        End: {new Date(contest.end_time).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-0 sm:ml-4 flex-shrink-0">
                    {/* Join/Leave Button */}
                    {myContests.includes(contest.contest_id) ? (
                      <button
                        onClick={() => handleLeave(contest)}
                        className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-400 hover:to-pink-500 text-white font-semibold rounded-lg transition-all duration-300 text-sm"
                      >
                        Leave
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoin(contest)}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-white font-semibold rounded-lg transition-all duration-300 text-sm"
                      >
                        {contest.status === "Finished" ? "Join (Practice)" : "Join"}
                      </button>
                    )}
                    {/* View Details Button */}
                    <button
                      onClick={() => navigate(`/contests/${contest.contest_id}`)}
                      className="px-4 py-2 bg-cyan-600 text-gray-950 font-semibold rounded-lg hover:bg-cyan-500 transition-all duration-300 shadow hover:shadow-md hover:shadow-cyan-500/30 text-sm"
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {total > 0 && (
          <div className="mt-8 flex justify-between items-center pt-4 border-t border-gray-700/70">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-800 text-cyan-400 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              ← Previous
            </button>
            <span className="text-gray-400 font-medium">
              Page {page} of {lastPage}
            </span>
            <button
              onClick={() => setPage(p => Math.min(lastPage, p + 1))}
              disabled={page === lastPage}
              className="px-4 py-2 bg-gray-800 text-cyan-400 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Join Contest Password Modal */}
      <AnimatePresence>
        {showJoinDialog && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-gray-900/90 backdrop-blur-md border border-green-400/30 rounded-2xl p-8 max-w-md w-full"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                
                <h3 className="text-xl font-bold text-green-400 mb-2">Join Protected Contest</h3>
                <p className="text-gray-300 mb-2">"{joiningContest?.name}"</p>
                <p className="text-gray-400 mb-6 text-sm">This contest requires a password to join.</p>
                
                <div className="mb-6">
                  <input
                    type="password"
                    value={joinPassword}
                    onChange={(e) => setJoinPassword(e.target.value)}
                    placeholder="Enter contest password"
                    className="w-full px-4 py-3 bg-gray-800/50 border border-green-400/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
                    onKeyPress={(e) => e.key === 'Enter' && handleJoinWithPassword()}
                    disabled={isJoiningContest}
                  />
                </div>
                
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => {
                      setShowJoinDialog(false);
                      setJoiningContest(null);
                      setJoinPassword('');
                    }}
                    disabled={isJoiningContest}
                    className="px-6 py-2 bg-gray-600/80 hover:bg-gray-500/80 text-white rounded-lg transition-all duration-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleJoinWithPassword}
                    disabled={isJoiningContest || !joinPassword.trim()}
                    className="px-6 py-2 bg-green-600/80 hover:bg-green-500/80 text-white rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(34,197,94,0.5)]"
                  >
                    {isJoiningContest ? "Joining..." : "Join Contest"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContestListPage;
