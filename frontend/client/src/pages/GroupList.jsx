
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import bgImage from "../assets/bg.png";
import { gsap } from "gsap";
import { motion, AnimatePresence } from "framer-motion";

// Neon SVG Glow Component
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
        <radialGradient id="neon-glow-groups" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00fff7" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#00fff7" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="720" cy="100" rx="700" ry="60" fill="url(#neon-glow-groups)" />
    </svg>
  );
}

// GroupListPage style constants
const GROUP_PRIVACY = ["", "Public", "Private"];
const GROUP_STATUS = ["", "Member", "Not Member"];
const statusColors = {
  "Member": "text-green-400 border-green-400",
  "Not Member": "text-cyan-400 border-cyan-400",
};

export default function GroupListPage() {
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [privacy, setPrivacy] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [joinPassword, setJoinPassword] = useState("");
  const [joiningGroup, setJoiningGroup] = useState(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [leaveWarning, setLeaveWarning] = useState(null);
  const [leavingGroup, setLeavingGroup] = useState(null);
  const [isLeavingGroup, setIsLeavingGroup] = useState(false);
  const [isJoiningGroup, setIsJoiningGroup] = useState(false);
  const limit = 10;
  const navigate = useNavigate();
  const { user } = useAuth();
  const containerRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        
        if (privacy) {
          params.append('privacy', privacy);
        }
        if (search) {
          params.append('search', search);
        }
        
        const res = await fetch(`/api/groups?${params}`);
        if (!res.ok) throw new Error("Failed to fetch groups");
        const data = await res.json();
        setGroups(data.groups);
        setTotal(data.total);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
    // eslint-disable-next-line
  }, [refreshKey, page, privacy, search]);

  useEffect(() => {
    if (user) {
      const fetchMyGroups = async () => {
        try {
          const res = await fetch(`/api/groups/user/${user.id}`);
          if (!res.ok) throw new Error("Failed to fetch my groups");
          setMyGroups(await res.json());
        } catch (err) {
          // ignore
        }
      };
      fetchMyGroups();
    }
  }, [user, refreshKey]);

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
      const items = listRef.current.querySelectorAll(".group-card-animate");
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
  }, [groups]);

  async function handleJoin(group) {
    if (!user) return alert("Login required");
    
    setIsJoiningGroup(true);
    try {
      const res = await fetch(`/api/groups/${group.group_id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          user_id: user.id, 
          password: group.is_private ? joinPassword : undefined
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to join group');
      }
      
      // Close dialog and refresh
      setJoiningGroup(null);
      setJoinPassword("");
      setRefreshKey(k => k + 1);
    } catch (e) {
      alert("Join failed: " + e.message);
    } finally {
      setIsJoiningGroup(false);
    }
  }

  async function handleLeave(group) {
    if (!user) return alert("Login required");
    
    try {
      // First check if leaving will require confirmation (admin check)
      const checkRes = await fetch(`/api/groups/${group.group_id}/check-leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      });
      
      if (!checkRes.ok) throw new Error(await checkRes.text());
      
      const checkData = await checkRes.json();
      
      // Only show warning dialog if user is admin and will delete group
      if (checkData.will_delete_group) {
        setLeaveWarning(checkData);
        setLeavingGroup(group);
        setShowLeaveDialog(true);
      } else {
        // Regular member - leave immediately without confirmation
        await performLeave(group, false);
      }
    } catch (e) {
      alert("Leave failed: " + e.message);
    }
  }

  async function performLeave(group, confirmDeletion = false) {
    setIsLeavingGroup(true);
    try {
      const res = await fetch(`/api/groups/${group.group_id}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          user_id: user.id,
          confirm_deletion: confirmDeletion
        }),
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      const data = await res.json();
      
      // Close dialog
      setShowLeaveDialog(false);
      setLeaveWarning(null);
      setLeavingGroup(null);
      
      // Just refresh the list - no need for alerts for a smooth UX
      setRefreshKey(k => k + 1);
    } catch (e) {
      // Only show error alerts since those are important
      alert("Leave failed: " + e.message);
    } finally {
      setIsLeavingGroup(false);
    }
  }

  // Filter by status (membership) on client-side since we need myGroups data
  // Only apply status filter if myGroups has been loaded (to avoid showing empty state while loading)
  const filteredGroups = groups.filter((g) => {
    if (!status || myGroups.length === 0) return true; // Show all if no status filter or myGroups not loaded yet
    
    if (status === "Member") {
      return myGroups.some(mg => mg.group_id === g.group_id);
    } else if (status === "Not Member") {
      return !myGroups.some(mg => mg.group_id === g.group_id);
    }
    return true; // No status filter
  });
  
  const lastPage = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-gray-950 text-gray-200 font-['Orbitron',_sans-serif] antialiased">
      <div className="max-w-4xl mx-auto mb-6 p-4 bg-gray-900/80 backdrop-blur-sm rounded-lg shadow-xl border border-cyan-700/40 space-y-4">
        {/* Top row with filters and buttons */}
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block mb-1 text-sm text-gray-400 font-medium">Privacy</label>
            <select
              value={privacy}
              onChange={e => { setPrivacy(e.target.value); setPage(1); }}
              className="p-2.5 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
            >
              {GROUP_PRIVACY.map((p) => (
                <option key={p} value={p}>{p || "All"}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm text-gray-400 font-medium">Status</label>
            <select
              value={status}
              onChange={e => { setStatus(e.target.value); setPage(1); }}
              className="p-2.5 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
            >
              {GROUP_STATUS.map((s) => (
                <option key={s} value={s}>{s || "All"}</option>
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
            onClick={() => navigate('/groups/create')}
          >
            Create Group
          </button>
        </div>
        
        {/* Bottom row with search */}
        <div>
          <label className="block mb-1 text-sm text-gray-400 font-medium">Search Groups</label>
          <input
            type="text"
            placeholder="Search by group name..."
            className="w-full p-2.5 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {error && (
        <div className="max-w-4xl mx-auto mb-6 p-4 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200">
          {error}
          </div>
      )}

      <div ref={listRef} className="max-w-4xl mx-auto bg-gray-900/80 backdrop-blur-sm rounded-lg p-6 shadow-xl border border-cyan-700/40">
        <h2
          className="text-2xl font-bold text-cyan-400 mb-6 pb-2 border-b-2 border-cyan-700/50"
          style={{ textShadow: "0 0 8px rgba(0, 255, 255, 0.5)" }}
        >
          Group Directory
        </h2>
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-400"></div>
            <p className="mt-4 text-gray-400">Loading groups...</p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <p className="text-center text-gray-400 py-10 text-lg">
            No groups found matching your criteria.
          </p>
        ) : (
          <div className="divide-y divide-gray-700/70">
            {filteredGroups.map((group) => {
              const isMember = myGroups.some(mg => mg.group_id === group.group_id);
              return (
                <div
                  key={group.group_id}
                  className="py-5 group group-card-animate relative transition-all duration-300 hover:scale-[1.025] hover:z-10"
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
                        <h3 
                          className="text-xl font-semibold text-cyan-400 hover:text-sky-300 transition-colors duration-300 group-hover:tracking-wide cursor-pointer"
                          onClick={() => navigate(`/group/${group.group_id}`)}
                          title={group.name}
                        >
                          {group.name}
                        </h3>
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${group.is_private ? "bg-pink-700/30 text-pink-300 border border-pink-600/50" : "bg-gray-800 text-gray-300 border border-gray-700"}`}>
                          {group.is_private ? "Private" : "Public"}
                        </span>
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${statusColors[isMember ? "Member" : "Not Member"]}`}>
                          {isMember ? "Member" : "Not Member"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center text-xs">
                        <span className="px-2.5 py-1 font-medium bg-gray-800 text-gray-300 rounded-full border border-gray-700">
                          ID: {group.group_id}
                        </span>
                        <span className="px-2.5 py-1 font-medium bg-gray-800 text-yellow-300 rounded-full border border-gray-700">
                          Creator: {group.creator || "Unknown"}
                        </span>
                        <span className="px-2.5 py-1 font-medium bg-gray-800 text-gray-300 rounded-full border border-gray-700">
                          Created: {group.created_at ? new Date(group.created_at).toLocaleDateString() : "-"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-0 sm:ml-4 flex-shrink-0">
                      {isMember ? (
                        <button
                          onClick={() => handleLeave(group)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-all duration-300 text-sm"
                        >
                          Leave
                        </button>
                      ) : (
                        <button
                          onClick={() => group.is_private ? setJoiningGroup(group) : handleJoin(group)}
                          disabled={isJoiningGroup}
                          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          {isJoiningGroup ? "Joining..." : "Join"}
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/group/${group.group_id}`)}
                        className="px-4 py-2 bg-cyan-600 text-gray-950 font-semibold rounded-lg hover:bg-cyan-500 transition-all duration-300 shadow hover:shadow-md hover:shadow-cyan-500/30 text-sm"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

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

      {/* Join Group Password Dialog */}
      <AnimatePresence>
        {joiningGroup && joiningGroup.is_private && (
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
                
                <h3 className="text-xl font-bold text-green-400 mb-2">Join Private Group</h3>
                <p className="text-gray-300 mb-2">"{joiningGroup.name}"</p>
                <p className="text-gray-400 mb-6 text-sm">This group requires a password to join.</p>
                
                <div className="mb-6">
                  <input
                    type="password"
                    value={joinPassword}
                    onChange={(e) => setJoinPassword(e.target.value)}
                    placeholder="Enter group password"
                    className="w-full px-4 py-3 bg-gray-800/50 border border-green-400/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
                    onKeyPress={(e) => e.key === 'Enter' && handleJoin(joiningGroup)}
                    disabled={isJoiningGroup}
                  />
                </div>
                
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => {
                      setJoiningGroup(null);
                      setJoinPassword("");
                    }}
                    disabled={isJoiningGroup}
                    className="px-6 py-2 bg-gray-600/80 hover:bg-gray-500/80 text-white rounded-lg transition-all duration-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleJoin(joiningGroup)}
                    disabled={isJoiningGroup || !joinPassword.trim()}
                    className="px-6 py-2 bg-green-600/80 hover:bg-green-500/80 text-white rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(34,197,94,0.5)]"
                  >
                    {isJoiningGroup ? "Joining..." : "Join Group"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Leave Group Warning Dialog */}
      <AnimatePresence>
        {showLeaveDialog && leaveWarning && leavingGroup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-800/95 backdrop-blur-md border-2 border-red-400/40 rounded-2xl p-8 max-w-md w-full shadow-[0_0_40px_rgba(239,68,68,0.3)]"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-600/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                
                <h3 className="text-2xl font-bold text-red-400 mb-4">
                  {leaveWarning.will_delete_group ? "Delete Group Warning" : "Leave Group"}
                </h3>
                
                <div className="text-gray-300 mb-6 space-y-2">
                  {leaveWarning.will_delete_group ? (
                    <>
                      <p className="text-red-300 font-semibold">
                        ⚠️ This action cannot be undone!
                      </p>
                      <p>{leaveWarning.warning_message}</p>
                      <div className="bg-red-900/20 border border-red-400/30 rounded-lg p-3 mt-4">
                        <p className="text-sm text-red-200">
                          <strong>What will happen:</strong><br/>
                          • The entire group "{leavingGroup.name}" will be permanently deleted<br/>
                          • All members will be removed<br/>
                          • All group data will be lost<br/>
                          • This action cannot be reversed
                        </p>
                      </div>
                    </>
                  ) : (
                    <p>Are you sure you want to leave the group "{leavingGroup.name}"?</p>
                  )}
                </div>
                
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => {
                      setShowLeaveDialog(false);
                      setLeaveWarning(null);
                      setLeavingGroup(null);
                    }}
                    disabled={isLeavingGroup}
                    className="px-6 py-2 bg-gray-600/80 hover:bg-gray-500/80 text-white rounded-lg transition-all duration-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => performLeave(leavingGroup, leaveWarning.will_delete_group)}
                    disabled={isLeavingGroup}
                    className={`px-6 py-2 text-white rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                      leaveWarning.will_delete_group
                        ? "bg-red-600/80 hover:bg-red-500/80 hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                        : "bg-orange-600/80 hover:bg-orange-500/80"
                    }`}
                  >
                    {isLeavingGroup 
                      ? "Processing..." 
                      : leaveWarning.will_delete_group 
                        ? "Delete Group & Leave" 
                        : "Leave Group"
                    }
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Neon SVG Glow Component */}
      <NeonGlowSVG
        className="top-0 left-0 w-full h-40"
        style={{ opacity: 0.18 }}
      />
    </div>
  );
}
