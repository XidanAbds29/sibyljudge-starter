import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";

export default function Tracks() {
  const [tracks, setTracks] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trackDetailLoading, setTrackDetailLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const listRef = useRef(null);

  // Fetch all tracks on mount
  useEffect(() => {
    const fetchTracks = async () => {
      setLoading(true);
      setError(null);
      try {
        const headers = {};
        const token = localStorage.getItem("authToken");
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch("/api/tracks", { headers });
        if (!res.ok) throw new Error("Failed to fetch tracks");
        const data = await res.json();
        setTracks(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTracks();
  }, [user]);

  // Animate tracks list when loaded
  useEffect(() => {
    if (listRef.current && tracks.length > 0) {
      gsap.fromTo(
        listRef.current.querySelectorAll(".track-card"),
        { opacity: 0, y: 30, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out",
        }
      );
    }
  }, [tracks]);

  // Fetch single track details
  const handleSelectTrack = async (trackId) => {
    setTrackDetailLoading(true);
    setError(null);
    try {
      const headers = {};
      const token = localStorage.getItem("authToken");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/tracks/${trackId}`, { headers });
      if (!res.ok) throw new Error("Failed to fetch track details");
      const data = await res.json();
      setSelectedTrack(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setTrackDetailLoading(false);
    }
  };

  const getProgressPercentage = (track) => {
    if (!track.problems || track.problems.length === 0) return 0;
    const solved = track.problems.filter((p) => p.is_solved).length;
    return Math.round((solved / track.problems.length) * 100);
  };

  const getTrackDifficultyDistribution = (problems) => {
    if (!problems || problems.length === 0) return "General";
    const difficulties = problems.map((p) => parseInt(p.difficulty)).filter(Boolean);
    if (difficulties.length === 0) return "General";
    const avg = difficulties.reduce((sum, d) => sum + d, 0) / difficulties.length;
    if (avg < 1200) return "Beginner";
    if (avg < 1600) return "Intermediate";
    return "Advanced";
  };

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-gray-950 text-gray-200 font-['Orbitron',_sans-serif] antialiased">
      <div className="max-w-5xl mx-auto mb-10 text-center">
        <h1 
          className="text-3xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 mb-4 tracking-wider"
          style={{ textShadow: "0 0 15px rgba(6,182,212,0.3)" }}
        >
          COGNITIVE TRAINING TRACKS
        </h1>
        <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto">
          Enhance your competitive programming mastery through our custom-tailored, automatic curriculum tracks mapped straight from popular tags.
        </p>
      </div>

      {error && (
        <div className="max-w-4xl mx-auto mb-6 p-4 bg-red-950/80 border border-red-500/50 rounded-lg text-red-300">
          ⚠️ Error: {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {!selectedTrack ? (
          // --- List View ---
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
                <p className="mt-4 text-gray-400">Decrypting training tracks...</p>
              </div>
            ) : tracks.length === 0 ? (
              <div className="text-center py-16 bg-gray-900/40 rounded-2xl border border-gray-800 p-8 max-w-lg mx-auto">
                <p className="text-gray-400 text-lg mb-4">No active tracks found.</p>
                <p className="text-sm text-gray-500">
                  Register/sign up a user first, then run `node scripts/seed-tracks.js` on the server command-line to generate training tracks!
                </p>
              </div>
            ) : (
              <div 
                ref={listRef} 
                className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto"
              >
                {tracks.map((track) => {
                  const statusColors = {
                    completed: "border-green-500 text-green-400 bg-green-500/10",
                    in_progress: "border-yellow-500 text-yellow-400 bg-yellow-500/10",
                    not_started: "border-gray-700 text-gray-400 bg-gray-800/40",
                  };
                  const statusLabels = {
                    completed: "Completed",
                    in_progress: "In Progress",
                    not_started: "Not Started",
                  };

                  return (
                    <div
                      key={track.track_id}
                      onClick={() => handleSelectTrack(track.track_id)}
                      className="track-card group cursor-pointer bg-gray-900/80 backdrop-blur-sm p-6 rounded-xl border border-cyan-700/30 hover:border-cyan-400/50 shadow-xl transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_25px_rgba(34,211,238,0.15)] flex flex-col justify-between min-h-[180px]"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-4 mb-3">
                          <h3 className="text-xl font-bold text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300">
                            {track.name}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[track.progress]}`}>
                            {statusLabels[track.progress]}
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs line-clamp-3 leading-relaxed mb-6 font-sans">
                          {track.description}
                        </p>
                      </div>

                      <div className="flex justify-between items-center text-xs mt-auto pt-4 border-t border-gray-800/60">
                        <span className="text-gray-500">
                          {track.problem_count} Problems
                        </span>
                        <span className="text-cyan-400 group-hover:translate-x-1.5 transition-transform duration-300">
                          Launch Module →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          // --- Detail View ---
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-4xl mx-auto"
          >
            {/* Header info */}
            <div className="bg-gray-900/90 backdrop-blur-sm p-6 rounded-2xl border border-cyan-700/40 shadow-2xl mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 font-bold text-7xl select-none uppercase tracking-widest text-cyan-500">
                MODULE
              </div>
              <button
                onClick={() => setSelectedTrack(null)}
                className="mb-6 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-cyan-400 hover:text-cyan-300 font-semibold rounded-lg transition-colors flex items-center gap-2 text-xs"
              >
                ← Return to Directory
              </button>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-cyan-400">
                  {selectedTrack.name}
                </h2>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-gray-800 text-yellow-300 text-xs font-semibold rounded-full border border-gray-700">
                    Difficulty: {getTrackDifficultyDistribution(selectedTrack.problems)}
                  </span>
                  <span className="px-3 py-1 bg-gray-800 text-cyan-300 text-xs font-semibold rounded-full border border-gray-700">
                    {selectedTrack.problems ? selectedTrack.problems.length : 0} Problems
                  </span>
                </div>
              </div>

              <p className="text-gray-400 text-sm font-sans mb-8 leading-relaxed max-w-3xl">
                {selectedTrack.description}
              </p>

              {/* Progress bar */}
              {user && (
                <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="text-gray-400 font-semibold uppercase tracking-wider">Synchronization Progress</span>
                    <span className="text-green-400 font-bold">{getProgressPercentage(selectedTrack)}%</span>
                  </div>
                  <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${getProgressPercentage(selectedTrack)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-cyan-400 to-green-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Problems list */}
            <div className="bg-gray-900/90 backdrop-blur-sm p-6 rounded-2xl border border-cyan-700/40 shadow-2xl">
              <h3 className="text-xl font-bold text-cyan-400 mb-6 pb-2 border-b border-gray-800">
                Problems Directory
              </h3>

              {selectedTrack.problems.length === 0 ? (
                <p className="text-center text-gray-500 py-6">No problems assigned to this track yet.</p>
              ) : (
                <div className="space-y-4">
                  {selectedTrack.problems.map((problem, idx) => (
                    <div
                      key={problem.problem_id}
                      onClick={() => navigate(`/problem/${problem.problem_id}`)}
                      className={`group cursor-pointer p-4 rounded-xl border transition-all duration-300 hover:scale-[1.01] flex items-center justify-between gap-4 ${
                        problem.is_solved
                          ? "bg-green-500/5 border-green-500/30 hover:border-green-400"
                          : "bg-gray-950/60 border-gray-800 hover:border-cyan-500/50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-bold text-gray-600 group-hover:text-cyan-400 transition-colors">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <h4 className="font-bold text-gray-200 group-hover:text-cyan-300 transition-colors">
                            {problem.title}
                          </h4>
                          <div className="flex gap-2 text-[10px] text-gray-500 mt-1 font-sans">
                            <span>Limit: {problem.time_limit}ms</span>
                            <span>•</span>
                            <span>Memory: {Math.round(problem.mem_limit / 1024)}MB</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs bg-gray-800 text-cyan-400 px-2.5 py-1 rounded border border-gray-700 font-bold">
                          {problem.difficulty ? `Rating: ${problem.difficulty}` : "Unrated"}
                        </span>
                        {problem.is_solved ? (
                          <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center text-green-400 font-bold text-sm">
                            ✓
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-500 text-xs">
                            —
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
