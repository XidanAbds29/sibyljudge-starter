import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { supabase } from "../lib/supabaseClient";
import { gsap } from "gsap";
import { motion, AnimatePresence } from "framer-motion";
import Standings from "./Standings";
import ContestTimer from "./ContestTimer";
import ContestStatus from "./ContestStatus";

const NeonGlowSVG = ({ className = "", style = {}, ...props }) => (
  <svg
    className={"absolute pointer-events-none z-0 " + className}
    style={style}
    width="100%"
    height="100%"
    viewBox="0 0 1440 400"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="none"
    {...props}
  >
    <defs>
      <radialGradient id="neon-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#00fff7" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#00fff7" stopOpacity="0" />
      </radialGradient>
    </defs>
    <ellipse cx="720" cy="200" rx="700" ry="120" fill="url(#neon-glow)" />
  </svg>
);

const ContestPage = () => {
  const { contestId } = useParams();
  const [activeTab, setActiveTab] = useState("Problems");
  const [contest, setContest] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissionsError, setSubmissionsError] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState(false);
  const [error, setError] = useState(null);
  const [joinError, setJoinError] = useState(null);
  const [joinPassword, setJoinPassword] = useState("");
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [userSelectedTab, setUserSelectedTab] = useState(false);
  const { user } = useAuth();
  const mainRef = useRef(null);

  // Fetch all submissions for this user in this contest
  const fetchContestSubmissions = async () => {
    if (!user?.id || !contestId || !contest?.problems) {
      setSubmissions([]);
      return;
    }

    setSubmissionsLoading(true);
    setSubmissionsError(null);
    
    try {
      // Fetch submissions for all problems in the contest
      const allSubmissions = [];
      
      for (const problem of contest.problems) {
        try {
          const response = await fetch(`/api/contest-submissions/${contestId}/problem/${problem.problem_id}/user/${user.id}`);
          
          if (response.ok) {
            const data = await response.json();
            if (data.submissions && data.submissions.length > 0) {
              // Add problem title to each submission
              const submissionsWithTitle = data.submissions.map(submission => ({
                ...submission,
                problem_title: problem.title || problem.alias || `Problem ${problem.problem_id}`,
                problem_id: problem.problem_id
              }));
              allSubmissions.push(...submissionsWithTitle);
            }
          }
        } catch (err) {
          console.error(`Error fetching submissions for problem ${problem.problem_id}:`, err);
          // Continue with other problems even if one fails
        }
      }
      
      // Sort all submissions by submission date (newest first)
      allSubmissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      
      setSubmissions(allSubmissions);
    } catch (err) {
      console.error("Error fetching contest submissions:", err);
      setSubmissionsError(err.message || "Failed to load submissions");
      setSubmissions([]);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "AC": return "text-green-400 bg-green-900/30 border-green-400/50";
      case "WA": return "text-pink-400 bg-pink-900/30 border-pink-400/50";
      case "CE": return "text-yellow-400 bg-yellow-900/30 border-yellow-400/50";
      case "TLE": return "text-orange-400 bg-orange-900/30 border-orange-400/50";
      case "MLE": return "text-purple-400 bg-purple-900/30 border-purple-400/50";
      case "RE": return "text-red-400 bg-red-900/30 border-red-400/50";
      default: return "text-gray-400 bg-gray-900/30 border-gray-400/50";
    }
  };

  // Get status name
  const getStatusName = (status) => {
    const statusNames = {
      "AC": "Accepted",
      "WA": "Wrong Answer", 
      "TLE": "Time Limit Exceeded",
      "MLE": "Memory Limit Exceeded",
      "RE": "Runtime Error",
      "CE": "Compilation Error"
    };
    return statusNames[status] || status;
  };

  // Handle viewing code
  const handleViewCode = (submission) => {
    setSelectedSubmission(submission);
    setShowCodeModal(true);
  };

  // Get contest state based on current time
  const getContestState = () => {
    if (!contest) return "unknown";
    
    const now = new Date();
    const startTime = new Date(contest.start_time);
    const endTime = new Date(contest.end_time);
    
    if (now < startTime) return "upcoming";
    if (now >= startTime && now <= endTime) return "ongoing";
    return "finished";
  };

  // Check if user can access restricted tabs (Problems, My submissions, All submissions, Standings)
  const canAccessRestrictedTabs = () => {
    const contestState = getContestState();
    return user && contest?.is_participant && (contestState === "ongoing" || contestState === "finished");
  };

  // Get available tabs based on user permissions
  const getAvailableTabs = () => {
    const baseTabs = ["Description"];
    
    if (canAccessRestrictedTabs()) {
      return ["Problems", "My submissions", "All submissions", "Standings", "Description"];
    }
    
    return baseTabs;
  };

  // Ensure active tab is available
  const availableTabs = getAvailableTabs();
  const contestState = getContestState();

  // Set default tab based on availability - prioritize Problems when available
  useEffect(() => {
    const availableTabs = getAvailableTabs();
    
    // If current tab is not available, switch to appropriate default
    if (!availableTabs.includes(activeTab)) {
      const defaultTab = availableTabs.includes("Problems") ? "Problems" : "Description";
      setActiveTab(defaultTab);
      setUserSelectedTab(false); // Reset user selection flag when auto-switching
    }
    // Only auto-switch to Problems if user hasn't manually selected a tab
    else if (!userSelectedTab && availableTabs.includes("Problems") && activeTab === "Description") {
      setActiveTab("Problems");
    }
  }, [user, contest, activeTab, userSelectedTab]);

  const handleJoinContest = async () => {
    if (!user) {
      setJoinError("You must be logged in to join a contest");
      return;
    }

    setJoinLoading(true);
    setJoinError(null);
    try {
      const res = await fetch(`/api/contests/${contestId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          password: contest.is_secured ? joinPassword : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to join contest");
      }

      setShowJoinDialog(false);
      setJoinPassword("");
      // Update contest state to reflect participation
      setContest(prev => ({ ...prev, is_participant: true }));
    } catch (err) {
      setJoinError(err.message);
    } finally {
      setJoinLoading(false);
    }
  };

  const handleLeaveContest = async () => {
    if (!user) return;

    setJoinLoading(true);
    setJoinError(null);
    try {
      const res = await fetch(`/api/contests/${contestId}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to leave contest");
      }

      // Update contest state to reflect leaving
      setContest(prev => ({ ...prev, is_participant: false }));
    } catch (err) {
      setJoinError(err.message);
    } finally {
      setJoinLoading(false);
    }
  };

  // Fetch contest submissions when switching to "My submissions" tab
  useEffect(() => {
    if (activeTab === "My submissions" && contest?.problems) {
      fetchContestSubmissions();
    }
  }, [activeTab, contestId, user?.id, contest?.problems]);

  // Reset active tab if current tab becomes unavailable
  useEffect(() => {
    const availableTabs = getAvailableTabs();
    if (!availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0] || "Description");
      setUserSelectedTab(false); // Reset user selection flag when auto-switching
    }
  }, [user, contest, activeTab]);

  useEffect(() => {
    const fetchContest = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = `/api/contests/${contestId}`;
        if (user) url += `?user_id=${user.id}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch contest");
        const data = await res.json();
        setContest(data);
      } catch (err) {
        setError(err.message);
        setContest(null);
      } finally {
        setLoading(false);
      }
    };
    fetchContest();
    // eslint-disable-next-line
  }, [contestId]);

  useEffect(() => {
    if (mainRef.current && contest) {
      const ctx = gsap.context(() => {
        if (typeof gsap !== "undefined") {
          gsap.fromTo(
            mainRef.current,
            { opacity: 0, y: 40, filter: "blur(10px)" },
            {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 1.1,
              ease: "power4.out",
            }
          );
          // Animate sections with stagger
          const sections = mainRef.current.querySelectorAll(".contest-section-animate");
          if (sections.length > 0) {
            gsap.fromTo(
              sections,
              {
                opacity: 0,
                y: 30,
                scale: 0.97,
              },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.7,
                stagger: 0.09,
                ease: "power3.out",
                delay: 0.2,
              }
            );
          }
        }
      }, mainRef);
      return () => ctx.revert();
    }
  }, [contest]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900/90 text-cyan-400">
        <span className="text-2xl animate-pulse">Loading…</span>
      </div>
    );

  if (!contest)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900/90 text-red-400">
        <span className="text-2xl">{error || "Contest not found."}</span>
      </div>
    );

  return (
    <div>
      {/* Animated gradient background */}
      <div className="fixed inset-0 z-0 animate-gradient-bg bg-gradient-to-br from-[#0f2027] via-[#2c5364] to-[#00c9ff] opacity-80 blur-2xl" />
      <div
        ref={mainRef}
        className="min-h-screen bg-gray-900/90 text-white pb-20 relative z-10"
      >
        {/* Neon glow effect for page header */}
        <div className="absolute inset-0 -z-10 opacity-30 blur-3xl">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-full w-full"
            viewBox="0 0 1440 320"
          >
            <path
              fill="url(#gradient1)"
              d="M0,128L30,133.3C60,139,120,149,180,160C240,171,300,181,360,186.7C420,192,480,192,540,186.7C600,181,660,171,720,160C780,149,840,139,900,133.3C960,128,1020,128,1080,133.3C1140,139,1200,149,1260,160C1320,171,1380,181,1410,186.7L1440,192L1440,320L1080,320C1140,320,1200,320,1260,320C1320,320,1380,320,1410,320L1440,320Z"
            />
            <defs>
              <linearGradient
                id="gradient1"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop
                  offset="0%"
                  style={{ stopColor: "#00c9ff", stopOpacity: 1 }}
                />
                <stop
                  offset="100%"
                  style={{ stopColor: "#2c5364", stopOpacity: 1 }}
                />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10">
          {/* Contest Title and Meta */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="bg-gray-800/40 rounded-2xl p-8 mb-8 backdrop-blur-md border-2 border-cyan-400/40 shadow-[0_0_40px_0_rgba(34,211,238,0.15)] contest-section-animate relative overflow-hidden"
          >
            {/* Animated gradient border */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400/30 via-sky-500/20 to-pink-400/20 blur-lg opacity-60 pointer-events-none" />
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-400/30 via-sky-500/20 to-pink-400/20 blur-lg opacity-60 pointer-events-none" />
            <div className="relative">
              <div className="flex flex-col gap-4 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-cyan-300 via-pink-400 to-sky-400 bg-clip-text text-transparent leading-tight animate-gradient-text drop-shadow-lg">
                    {contest.name}
                  </h1>
                </div>
                <div className="flex justify-center">
                  <ContestTimer contest={contest} />
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-base text-cyan-200 mb-4 font-mono">
                <p>
                  <strong>Contest ID:</strong> {contestId}
                </p>
                <p>
                  <strong>Difficulty:</strong>{" "}
                  <span
                    className={`font-semibold ${
                      contest.difficulty === "Easy"
                        ? "text-green-400"
                        : contest.difficulty === "Medium"
                        ? "text-yellow-400"
                        : "text-red-400"
                    }`}
                  >
                    {contest.difficulty || "N/A"}
                  </span>
                </p>
              </div>
              <div className="flex flex-wrap gap-4 text-base text-gray-300 mb-4">
                <span>Creator: <span className="text-yellow-300 font-semibold">{contest.creator || "Unknown"}</span></span>
                <span>Start: <span className="text-cyan-300 font-semibold">{new Date(contest.start_time).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })} at {new Date(contest.start_time).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}</span></span>
                <span>End: <span className="text-pink-300 font-semibold">{new Date(contest.end_time).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })} at {new Date(contest.end_time).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}</span></span>
                <span>Status: <span className={`font-semibold ${
                  contestState === "upcoming" ? "text-blue-400" : 
                  contestState === "ongoing" ? "text-green-400" : 
                  "text-gray-400"
                }`}>{contestState.charAt(0).toUpperCase() + contestState.slice(1)}</span></span>
              </div>
              
              {/* Access Status Information */}
              {user && (
                <div className="mb-4">
                  {contest.is_participant ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">You are registered for this contest</span>
                      {!canAccessRestrictedTabs() && contestState === "upcoming" && (
                        <span className="text-yellow-400 text-sm ml-2">• Problems will be available when contest starts</span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L5.18 17.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span className="font-medium">Join the contest to access problems and submissions</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Join/Leave Contest Button */}
              {user && (
                <div className="flex flex-wrap gap-4 items-center mt-6">
                  {contest.is_participant ? (
                    <button
                      onClick={handleLeaveContest}
                      disabled={joinLoading}
                      className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-red-500/30"
                    >
                      {joinLoading ? "Leaving…" : "Leave Contest"}
                    </button>
                  ) : (
                    <button
                      onClick={() => contest.is_secured ? setShowJoinDialog(true) : handleJoinContest()}
                      disabled={joinLoading}
                      className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-cyan-500/30"
                    >
                      {joinLoading ? "Joining…" : `Join Contest${contestState === "finished" ? " (Ended)" : ""}`}
                    </button>
                  )}
                  
                  {/* Success/Error Messages */}
                  {joinError && (
                    <span className="text-red-400 font-medium">{joinError}</span>
                  )}
                </div>
              )}
              
              {/* Guest user message */}
              {!user && (
                <div className="mt-6 p-4 bg-gray-800/60 border border-gray-600 rounded-lg">
                  <p className="text-gray-300">
                    <span className="font-medium">Login required:</span> You need to create an account and login to join contests and submit solutions.
                  </p>
                </div>
              )}
            </div>
          </motion.div>

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
                    <p className="text-gray-300 mb-2">"{contest.name}"</p>
                    <p className="text-gray-400 mb-6 text-sm">This contest requires a password to join.</p>
                    
                    <div className="mb-6">
                      <input
                        type="password"
                        value={joinPassword}
                        onChange={(e) => setJoinPassword(e.target.value)}
                        placeholder="Enter contest password"
                        className="w-full px-4 py-3 bg-gray-800/50 border border-green-400/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
                        onKeyPress={(e) => e.key === 'Enter' && handleJoinContest()}
                        disabled={joinLoading}
                      />
                    </div>
                    
                    {joinError && (
                      <div className="text-red-400 text-sm mb-4">{joinError}</div>
                    )}
                    
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => {
                          setShowJoinDialog(false);
                          setJoinPassword("");
                          setJoinError(null);
                        }}
                        disabled={joinLoading}
                        className="px-6 py-2 bg-gray-600/80 hover:bg-gray-500/80 text-white rounded-lg transition-all duration-300 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleJoinContest}
                        disabled={joinLoading || !joinPassword.trim()}
                        className="px-6 py-2 bg-green-600/80 hover:bg-green-500/80 text-white rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(34,197,94,0.5)]"
                      >
                        {joinLoading ? "Joining…" : "Join Contest"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Code Modal */}
          <AnimatePresence>
            {showCodeModal && selectedSubmission && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
                onClick={() => setShowCodeModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-gray-900 border border-cyan-700/50 rounded-lg p-6 max-w-4xl max-h-[80vh] w-full overflow-auto shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-cyan-200">Submission Code</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-green-300 font-semibold">
                          {selectedSubmission.problem_title || `Problem #${selectedSubmission.problem_id}`}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(selectedSubmission.status)}`}>
                          {getStatusName(selectedSubmission.status)}
                        </span>
                        <span className="text-cyan-300 font-mono bg-cyan-900/30 px-2 py-1 rounded">
                          {selectedSubmission.language}
                        </span>
                        <span className="text-gray-300">{formatDate(selectedSubmission.submittedAt || selectedSubmission.submitted_at)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowCodeModal(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap overflow-auto max-h-96">
                    {selectedSubmission.solutionCode || selectedSubmission.code || "Code not available"}
                  </div>
                  
                  {(selectedSubmission.output || selectedSubmission.errorMessage) && (
                    <div className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded-lg">
                      <h4 className="text-red-300 font-semibold mb-2">Output:</h4>
                      <pre className="text-red-200 text-sm whitespace-pre-wrap">{selectedSubmission.output || selectedSubmission.errorMessage}</pre>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Contest Tabs Section with neon effect */}
          <div className="overflow-hidden">
            <div className="relative mb-8 flex flex-wrap gap-2 bg-gray-900/60 rounded-xl p-2 shadow-lg border border-cyan-700/40 neon-tabs-bar">
              <div className="absolute inset-0 pointer-events-none rounded-xl bg-gradient-to-r from-cyan-400/10 via-pink-400/10 to-sky-400/10 blur-md opacity-60" />
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-400/30 via-pink-400/20 to-sky-400/20 blur-lg opacity-60 pointer-events-none" />
              {availableTabs.map((tab) => (
                <motion.button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setUserSelectedTab(true); // Mark that user manually selected a tab
                  }}
                  className={`px-5 py-2 text-base font-semibold rounded-lg transition-all duration-300 relative overflow-hidden group shadow-md border-2 ${
                    activeTab === tab
                      ? "bg-gradient-to-r from-cyan-500 via-pink-400 to-sky-400 text-white border-cyan-300 shadow-lg scale-105"
                      : "text-cyan-200 hover:text-cyan-100 hover:bg-gray-800/60 border-transparent"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="relative z-10">{tab}</span>
                  {activeTab === tab && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-cyan-500/80 via-pink-400/80 to-sky-400/80 rounded-lg"
                      layoutId="activeTab"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
            
            {/* Access restriction notice for non-participants */}
            {!canAccessRestrictedTabs() && (
              <div className="mb-6 p-4 bg-blue-900/30 border border-blue-400/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-blue-200 font-medium">
                      {!user ? "Login and join the contest to access problems and submissions" :
                       !contest?.is_participant ? "Join the contest to access problems and submissions" :
                       contestState === "upcoming" ? "Problems will be available when the contest starts" :
                       "Contest access restricted"}
                    </p>
                    {contestState === "upcoming" && (
                      <p className="text-blue-300/70 text-sm mt-1">
                        Contest starts {new Date(contest.start_time).toLocaleDateString()} at {new Date(contest.start_time).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="contest-section-animate"
            >
              {activeTab === "Problems" && (
                <div className="bg-gray-800/40 border-2 border-cyan-400/40 backdrop-blur-md rounded-2xl p-8 shadow-[0_0_40px_0_rgba(34,211,238,0.15)] relative overflow-hidden">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400/20 via-sky-500/10 to-pink-400/20 blur-lg opacity-60 pointer-events-none" />
                  <div className="relative">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-300 via-pink-400 to-sky-400 bg-clip-text text-transparent mb-6 text-center">
                      Problems in {contest.name}
                    </h2>
                    {canAccessRestrictedTabs() && contest.problems?.length > 0 ? (
                      <div className="divide-y divide-gray-700/70">
                        {contest.problems.map((p, i) => (
                          <div
                            key={i}
                            className="py-5 group problem-card-animate relative transition-all duration-300 hover:scale-[1.025] hover:z-10"
                          >
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-80 transition-all duration-300 z-0">
                              <div className="w-full h-full rounded-xl bg-gradient-to-r from-cyan-400/20 via-sky-500/10 to-pink-400/20 blur-lg" />
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between relative z-10">
                              <div className="flex-1 min-w-0 mb-3 sm:mb-0">
                                <a
                                  href={`/contests/${contestId}/problem/${p.problem_id}`}
                                  className="text-xl font-semibold text-cyan-400 hover:text-sky-300 transition-colors duration-300 block group-hover:tracking-wide"
                                  title={p.title || p.alias || `Problem ${i + 1}`}
                                >
                                  Problem {i + 1}: {p.title || p.alias || p.problem_id}
                                </a>
                                <div className="mt-2.5 flex flex-wrap gap-2 items-center">
                                  {p.source_name && (
                                    <span className="px-2.5 py-1 text-xs font-medium bg-gray-800 text-gray-300 rounded-full border border-gray-700">
                                      {p.source_name}
                                    </span>
                                  )}
                                  {p.difficulty && (
                                    <span className="px-2.5 py-1 text-xs font-medium bg-pink-700/30 text-pink-300 rounded-full border border-pink-600/50">
                                      Rating: {p.difficulty}
                                    </span>
                                  )}
                                  {p.time_limit && (
                                    <span className="px-2.5 py-1 text-xs font-medium bg-gray-800 text-gray-300 rounded-full border border-gray-700">
                                      Time: {p.time_limit / 1000}s
                                    </span>
                                  )}
                                  {p.mem_limit && (
                                    <span className="px-2.5 py-1 text-xs font-medium bg-gray-800 text-gray-300 rounded-full border border-gray-700">
                                      Memory: {p.mem_limit / 1024}MB
                                    </span>
                                  )}
                                </div>
                                {p.tags?.length > 0 && (
                                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                                    {p.tags.map((tag, tagIndex) => (
                                      <span
                                        key={tagIndex}
                                        className="px-2 py-0.5 text-xs bg-sky-800/40 text-sky-300 rounded-full border border-sky-700/60"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <a
                                href={`/contests/${contestId}/problem/${p.problem_id}`}
                                className="ml-0 sm:ml-4 flex-shrink-0 px-4 py-2 bg-cyan-600 text-gray-950 font-semibold rounded-lg hover:bg-cyan-500 transition-all duration-300 shadow hover:shadow-md hover:shadow-cyan-500/30 text-sm"
                              >
                                View Problem →
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <div className="text-gray-400 mb-4">
                          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          {!user ? "Login to access contest problems" :
                           !contest?.is_participant ? "Join the contest to view problems" :
                           contestState === "upcoming" ? "Problems will be available when the contest starts" :
                           "No problems available"}
                        </div>
                        <p className="text-gray-500 text-sm">
                          {contestState === "upcoming" && contest?.is_participant && 
                            `Contest starts ${new Date(contest.start_time).toLocaleDateString()} at ${new Date(contest.start_time).toLocaleTimeString()}`
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "Submit Code" && (
                <div className="bg-gray-800/40 border-2 border-cyan-400/40 backdrop-blur-md rounded-2xl p-8 shadow-[0_0_40px_0_rgba(34,211,238,0.15)] relative overflow-hidden">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400/20 via-sky-500/10 to-pink-400/20 blur-lg opacity-60 pointer-events-none" />
                  <div className="relative">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-300 via-pink-400 to-sky-400 bg-clip-text text-transparent mb-6 text-center">
                      Submit Code
                    </h2>
                    <div className="text-gray-400 text-lg text-center">
                      Submission functionality will be implemented here.
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "My submissions" && (
                <div className="bg-gray-800/40 border-2 border-green-400/40 backdrop-blur-md rounded-2xl p-8 shadow-[0_0_40px_0_rgba(34,197,94,0.15)] relative overflow-hidden">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-400/20 via-emerald-500/10 to-cyan-400/20 blur-lg opacity-60 pointer-events-none" />
                  <div className="relative">
                    {/* Loading state */}
                    {submissionsLoading && (
                      <div className="text-center py-10">
                        <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-400"></div>
                        <p className="mt-4 text-gray-400">Loading submissions...</p>
                      </div>
                    )}

                    {/* Error state */}
                    {submissionsError && (
                      <div className="my-4 p-4 bg-red-900/60 text-red-200 rounded-lg border border-red-700 shadow-lg">
                        <p>
                          <strong className="font-semibold">Error:</strong> {submissionsError}
                        </p>
                      </div>
                    )}

                    {/* Empty state */}
                    {!submissionsLoading && !submissionsError && submissions.length === 0 && (
                      <div className="text-center py-10 text-lg">
                        <div className="text-gray-400 mb-4">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-16 w-16 mx-auto mb-4 opacity-50"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          No submissions found for this contest.
                        </div>
                        <p className="text-gray-500 text-sm">Submit solutions to see your submission history here.</p>
                      </div>
                    )}

                    {/* Content with submissions */}
                    {!submissionsLoading && !submissionsError && submissions.length > 0 && (
                      <div>
                        {/* Header */}
                        <h2
                          className="text-2xl font-bold text-cyan-400 mb-6 pb-2 border-b-2 border-cyan-700/50"
                          style={{ textShadow: "0 0 8px rgba(0, 255, 255, 0.5)" }}
                        >
                          My Submissions ({submissions.length})
                        </h2>

                        {/* Submissions List */}
                        <div className="divide-y divide-gray-700/70">
                          {submissions.map((submission, index) => (
                            <motion.div
                              key={submission.submissionId || submission.submission_id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="py-5 group relative transition-all duration-300 hover:scale-[1.015] hover:z-10"
                            >
                              {/* Neon glow effect on hover */}
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-60 transition-all duration-300 z-0">
                                <ContestNeonGlowSVG
                                  className="w-full h-full"
                                  style={{ opacity: 0.3 }}
                                />
                              </div>

                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between relative z-10">
                                {/* Left side - Status and details */}
                                <div className="flex-1 min-w-0 mb-3 sm:mb-0">
                                  {/* Problem Title */}
                                  <div className="mb-2">
                                    <h3 className="text-lg font-semibold text-green-300">
                                      {submission.problem_title || `Problem #${submission.problem_id}`}
                                    </h3>
                                  </div>

                                  {/* Status and Language on top */}
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(submission.status)}`}>
                                      {getStatusName(submission.status)}
                                    </span>
                                    <span className="px-2.5 py-1 text-xs font-medium bg-cyan-700/30 text-cyan-300 rounded-full border border-cyan-600/50">
                                      {submission.language}
                                    </span>
                                  </div>

                                  {/* Metrics row */}
                                  <div className="flex flex-wrap gap-2 items-center text-xs">
                                    {submission.executionTime && submission.executionTime > 0 && submission.status !== "CE" && (
                                      <span className="px-2.5 py-1 font-medium bg-gray-800 text-gray-300 rounded-full border border-gray-700 flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {submission.executionTime}ms
                                      </span>
                                    )}
                                    
                                    {submission.execution_time && submission.execution_time > 0 && submission.status !== "CE" && (
                                      <span className="px-2.5 py-1 font-medium bg-gray-800 text-gray-300 rounded-full border border-gray-700 flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {submission.execution_time}ms
                                      </span>
                                    )}
                                    
                                    {submission.memoryUsed && submission.memoryUsed > 0 && submission.status !== "CE" && (
                                      <span className="px-2.5 py-1 font-medium bg-gray-800 text-gray-300 rounded-full border border-gray-700 flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                        </svg>
                                        {submission.memoryUsed}KB
                                      </span>
                                    )}

                                    {submission.memory_usage && submission.memory_usage > 0 && submission.status !== "CE" && (
                                      <span className="px-2.5 py-1 font-medium bg-gray-800 text-gray-300 rounded-full border border-gray-700 flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                        </svg>
                                        {submission.memory_usage}KB
                                      </span>
                                    )}
                                    
                                    <span className="px-2.5 py-1 font-medium bg-gray-800 text-gray-300 rounded-full border border-gray-700 flex items-center gap-1">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      {formatDate(submission.submittedAt || submission.submitted_at)}
                                    </span>
                                  </div>
                                </div>

                                {/* Right side - Action button */}
                                <button
                                  onClick={() => handleViewCode(submission)}
                                  className="ml-0 sm:ml-4 flex-shrink-0 px-4 py-2 bg-cyan-600 text-gray-950 font-semibold rounded-lg hover:bg-cyan-500 transition-all duration-300 shadow hover:shadow-md hover:shadow-cyan-500/30 text-sm"
                                >
                                  View Code →
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "All submissions" && (
                <div className="bg-gray-800/40 border-2 border-cyan-400/40 backdrop-blur-md rounded-2xl p-8 shadow-[0_0_40px_0_rgba(34,211,238,0.15)] relative overflow-hidden">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400/20 via-sky-500/10 to-pink-400/20 blur-lg opacity-60 pointer-events-none" />
                  <div className="relative">
                    <ContestStatus
                      contestId={contestId}
                      supabase={supabase}
                      currentUser={user}
                      contestState={getContestState()}
                    />
                  </div>
                </div>
              )}

              {activeTab === "Standings" && (
                <div className="bg-gray-800/40 border-2 border-pink-400/40 backdrop-blur-md rounded-2xl p-8 shadow-[0_0_40px_0_rgba(236,72,153,0.15)] relative overflow-hidden">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-400/20 via-purple-500/10 to-cyan-400/20 blur-lg opacity-60 pointer-events-none" />
                  <div className="relative">
                    <Standings contestId={contestId} />
                  </div>
                </div>
              )}

              {activeTab === "Description" && (
                <div className="bg-gray-800/40 border-2 border-cyan-400/40 backdrop-blur-md rounded-2xl p-8 shadow-[0_0_40px_0_rgba(34,211,238,0.15)] relative overflow-hidden">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400/20 via-sky-500/10 to-pink-400/20 blur-lg opacity-60 pointer-events-none" />
                  <div className="relative">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-300 via-pink-400 to-sky-400 bg-clip-text text-transparent mb-6 text-center">
                      Contest Description
                    </h2>
                    {contest.description ? (
                      <div className="prose prose-lg prose-invert max-w-none">
                        <p className="text-cyan-100/90 text-lg leading-relaxed whitespace-pre-wrap">
                          {contest.description}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-lg text-center">
                        No description provided for this contest.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// Neon SVG Glow Component for contest submissions
const ContestNeonGlowSVG = ({ className = "", style = {}, ...props }) => {
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
        <radialGradient id="neon-glow-contest-submissions" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00fff7" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#00fff7" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="720" cy="100" rx="700" ry="60" fill="url(#neon-glow-contest-submissions)" />
    </svg>
  );
};

export default ContestPage;
