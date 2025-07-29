import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ContestStatus({
  contestId,
  supabase,
  currentUser,
  contestState,
}) {
  console.log("ContestStatus mounted:", { contestId, currentUser: currentUser?.id, contestState });
  
  // Quick test - let's see if this renders at all
  if (!contestId) {
    return (
      <div className="text-center py-10 text-red-400">
        <h3 className="text-xl font-bold">Debug: No Contest ID provided</h3>
        <p>Contest ID: {String(contestId)}</p>
      </div>
    );
  }
  
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [filterUser, setFilterUser] = useState("");
  const [filterProblem, setFilterProblem] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const limit = 20;

  // Fetch submissions when component mounts or filters change
  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!contestId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        
        // Use contest status endpoint
        const url = `/api/status/${contestId}?page=${page}&limit=${limit}`;
        
        console.log("Fetching from URL:", url);
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch contest submissions: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Status API response:", data);
        setSubmissions(data.submissions || []);
        setTotalSubmissions(data.total || 0);
      } catch (err) {
        console.error("Error fetching contest submissions:", err);
        setError(err.message || "Failed to load contest submissions");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [contestId, page]);

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

  // Handle viewing code (own submissions always, others only when contest is finished)
  const handleViewCode = async (submission) => {
    const isOwnSubmission = submission.userId === currentUser?.id;
    const canViewOthersCode = contestState === "finished";
    
    if (!isOwnSubmission && !canViewOthersCode) {
      alert("You can only view others' code after the contest has finished.");
      return;
    }

    try {
      // Fetch the full submission details including code
      const response = await fetch(`/api/contest-submissions/${contestId}/problem/${submission.problemId}/user/${submission.userId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch submission details");
      }
      
      const data = await response.json();
      const fullSubmission = data.submissions?.find(s => s.submissionId === submission.submissionId);
      
      if (fullSubmission) {
        setSelectedSubmission({
          ...submission,
          solutionCode: fullSubmission.solutionCode
        });
        setShowCodeModal(true);
      }
    } catch (err) {
      console.error("Error fetching submission code:", err);
      alert("Failed to load submission code");
    }
  };

  // Filter submissions based on current filters
  const filteredSubmissions = submissions.filter(submission => {
    const matchesUser = !filterUser || submission.username.toLowerCase().includes(filterUser.toLowerCase());
    const matchesProblem = !filterProblem || submission.problemTitle.toLowerCase().includes(filterProblem.toLowerCase());
    const matchesStatus = !filterStatus || submission.status === filterStatus;
    
    return matchesUser && matchesProblem && matchesStatus;
  });

  // Handle pagination
  const totalPages = Math.ceil(totalSubmissions / limit);
  const canGoNext = page < totalPages;
  const canGoPrev = page > 1;

  // Loading state
  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-400"></div>
        <p className="mt-4 text-gray-400">Loading submissions...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="my-4 p-4 bg-red-900/60 text-red-200 rounded-lg border border-red-700 shadow-lg">
        <p>
          <strong className="font-semibold">Error:</strong> {error}
        </p>
        <p className="text-sm mt-2">Contest ID: {contestId}</p>
      </div>
    );
  }

  // Empty state
  if (submissions.length === 0) {
    return (
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
        <p className="text-gray-500 text-sm">Submissions will appear here once participants start submitting solutions.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header with filters */}
      <div className="mb-6">
                <h2
          className="relative text-2xl font-bold mb-6 pb-4 border-b border-cyan-400/40 bg-gradient-to-r from-cyan-400 via-sky-300 to-pink-400 bg-clip-text text-transparent animate-pulse"
          style={{ animationDuration: '3s' }}
        >
          All Submissions ({totalSubmissions})
        </h2>
        
        {/* Contest State Info */}
        <div className="mb-6 p-4 rounded-lg bg-gray-800/60 border border-cyan-400/30">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              contestState === "finished" ? "bg-green-400" :
              contestState === "ongoing" ? "bg-yellow-400 animate-pulse" :
              "bg-gray-400"
            }`} />
            <span className="text-sm text-gray-300">
              Contest is <strong className={
                contestState === "finished" ? "text-green-400" :
                contestState === "ongoing" ? "text-yellow-400" :
                "text-gray-400"
              }>{contestState}</strong>
              {contestState === "finished" 
                ? " - You can view everyone's code" 
                : " - You can only view your own code"}
            </span>
          </div>
        </div>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="Filter by username..."
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:border-cyan-400 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Filter by problem..."
            value={filterProblem}
            onChange={(e) => setFilterProblem(e.target.value)}
            className="px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:border-cyan-400 focus:outline-none"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-gray-200 focus:border-cyan-400 focus:outline-none"
          >
            <option value="">All statuses</option>
            <option value="AC">Accepted</option>
            <option value="WA">Wrong Answer</option>
            <option value="TLE">Time Limit Exceeded</option>
            <option value="MLE">Memory Limit Exceeded</option>
            <option value="RE">Runtime Error</option>
            <option value="CE">Compilation Error</option>
          </select>
        </div>
      </div>

      {/* Submissions List */}
      <div className="divide-y divide-gray-700/70">
        {filteredSubmissions.map((submission, index) => (
          <motion.div
            key={submission.submissionId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="py-5 group relative transition-all duration-300 hover:scale-[1.015] hover:z-10"
          >
            {/* Neon glow effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-60 transition-all duration-300 z-0">
              <NeonGlowSVG
                className="w-full h-full"
                style={{ opacity: 0.3 }}
              />
            </div>

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between relative z-10">
              {/* Left side - User and Problem info */}
              <div className="flex-1 min-w-0 mb-3 lg:mb-0">
                {/* User and Problem on top */}
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="font-semibold text-cyan-300 bg-cyan-900/30 px-2.5 py-1 rounded-full border border-cyan-600/50">
                    {submission.username}
                  </span>
                  <span className="text-gray-300 bg-gray-800/50 px-2.5 py-1 rounded-full border border-gray-600/50">
                    {submission.problemTitle}
                  </span>
                  {submission.problemExternalId && (
                    <span className="text-xs text-gray-400 bg-gray-900/50 px-2 py-1 rounded border border-gray-700/50">
                      {submission.problemExternalId}
                    </span>
                  )}
                </div>

                {/* Status and Language */}
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
                  
                  {submission.memoryUsed && submission.memoryUsed > 0 && submission.status !== "CE" && (
                    <span className="px-2.5 py-1 font-medium bg-gray-800 text-gray-300 rounded-full border border-gray-700 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                      </svg>
                      {submission.memoryUsed}KB
                    </span>
                  )}
                  
                  <span className="px-2.5 py-1 font-medium bg-gray-800 text-gray-300 rounded-full border border-gray-700 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(submission.submittedAt)}
                  </span>
                </div>
              </div>

              {/* Right side - Action button */}
              <button
                onClick={() => handleViewCode(submission)}
                className={`ml-0 lg:ml-4 flex-shrink-0 px-4 py-2 font-semibold rounded-lg transition-all duration-300 shadow hover:shadow-md text-sm ${
                  submission.userId === currentUser?.id
                    ? "bg-cyan-600 text-gray-950 hover:bg-cyan-500 hover:shadow-cyan-500/30"
                    : contestState === "finished"
                    ? "bg-purple-600 text-white hover:bg-purple-500 hover:shadow-purple-500/30"
                    : "bg-gray-600 text-gray-300 cursor-not-allowed"
                }`}
                disabled={submission.userId !== currentUser?.id && contestState !== "finished"}
              >
                {submission.userId === currentUser?.id
                  ? "View Code →"
                  : contestState === "finished"
                  ? "View Code →"
                  : "Code Hidden"}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => setPage(page - 1)}
            disabled={!canGoPrev}
            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
              canGoPrev
                ? "bg-cyan-600 text-gray-950 hover:bg-cyan-500 shadow hover:shadow-md hover:shadow-cyan-500/30"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            }`}
          >
            ← Previous
          </button>
          
          <span className="text-gray-400 font-medium">
            Page {page} of {totalPages}
          </span>
          
          <button
            onClick={() => setPage(page + 1)}
            disabled={!canGoNext}
            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
              canGoNext
                ? "bg-cyan-600 text-gray-950 hover:bg-cyan-500 shadow hover:shadow-md hover:shadow-cyan-500/30"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            }`}
          >
            Next →
          </button>
        </div>
      )}

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
                    <span className={`px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(selectedSubmission.status)}`}>
                      {getStatusName(selectedSubmission.status)}
                    </span>
                    <span className="text-cyan-300 font-mono bg-cyan-900/30 px-2 py-1 rounded">
                      {selectedSubmission.language}
                    </span>
                    <span className="text-gray-300">{formatDate(selectedSubmission.submittedAt)}</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowCodeModal(false)}
                  className="text-gray-400 hover:text-gray-200 p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 font-mono text-sm overflow-auto max-h-96 relative">
                <button
                  onClick={() => navigator.clipboard.writeText(selectedSubmission.solutionCode)}
                  className="absolute top-2 right-2 px-2 py-1 text-xs bg-cyan-700/80 hover:bg-cyan-500/80 text-white rounded focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                  title="Copy source code"
                >
                  Copy
                </button>
                <pre className="text-gray-200 whitespace-pre-wrap pr-16">{selectedSubmission.solutionCode}</pre>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Neon SVG Glow Component (matching SubmissionHistory)
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
        <radialGradient id="neon-glow-status" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00fff7" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#00fff7" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="720" cy="100" rx="700" ry="60" fill="url(#neon-glow-status)" />
    </svg>
  );
}
