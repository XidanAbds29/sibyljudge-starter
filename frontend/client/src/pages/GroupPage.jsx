import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const TABS = ["Members", "Notifications", "Description"];

export default function GroupPage() {
  const { group_id } = useParams();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [leaveWarning, setLeaveWarning] = useState(null);
  const [isLeavingGroup, setIsLeavingGroup] = useState(false);
  const [isJoiningGroup, setIsJoiningGroup] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [joinPassword, setJoinPassword] = useState("");
  const navigate = useNavigate();
  const mainRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchGroup();
    // eslint-disable-next-line
  }, [group_id]);

  useEffect(() => {
    if (mainRef.current && group) {
      // Check if gsap is loaded via CDN before using it
      if (typeof window.gsap !== "undefined") {
        const ctx = window.gsap.context(() => {
          // Main container animation: fade in and slide up
          window.gsap.fromTo(
            mainRef.current,
            {
              opacity: 0,
              y: 40,
              filter: "blur(10px)",
            },
            {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 1.1,
              ease: "power4.out",
            }
          );
          
          // Animate section cards
          const cards = mainRef.current.querySelectorAll(".group-section-animate");
          if (cards.length > 0) {
            window.gsap.fromTo(
              cards,
              {
                opacity: 0,
                y: 30,
                scale: 0.95,
              },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.8,
                ease: "power3.out",
                stagger: 0.1,
              }
            );
          }
        });
        return () => ctx.revert();
      } else {
        // Fallback CSS animation if GSAP is not available
        if (mainRef.current) {
          mainRef.current.style.opacity = "0";
          mainRef.current.style.transform = "translateY(40px)";
          mainRef.current.style.filter = "blur(10px)";
          
          setTimeout(() => {
            if (mainRef.current) {
              mainRef.current.style.transition = "all 1.1s ease-out";
              mainRef.current.style.opacity = "1";
              mainRef.current.style.transform = "translateY(0)";
              mainRef.current.style.filter = "blur(0px)";
            }
          }, 100);
        }
      }
    }
  }, [group]);

  async function fetchGroup() {
    setLoading(true);
    setError("");
    try {
      const userParam = user ? `?user_id=${user.id}` : '';
      const res = await fetch(`/api/groups/${group_id}${userParam}`);
      if (!res.ok) throw new Error(await res.text());
      setGroup(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Check if leaving will trigger group deletion
  async function checkLeaveWarning() {
    if (!user) return;
    
    try {
      const res = await fetch(`/api/groups/${group_id}/check-leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      const data = await res.json();
      
      // Only show warning dialog if user is admin and will delete group
      if (data.will_delete_group) {
        setLeaveWarning(data);
        setShowLeaveDialog(true);
      } else {
        // Regular member - leave immediately without confirmation
        handleLeaveGroup(false);
      }
    } catch (e) {
      console.error('Error checking leave warning:', e);
      setError(e.message);
    }
  }

  // Handle leaving the group
  async function handleJoinGroup() {
    if (!user) {
      setError("You must be logged in to join a group");
      return;
    }

    setIsJoiningGroup(true);
    try {
      const response = await fetch(`/api/groups/${group_id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          user_id: user.id,
          password: group.is_private ? joinPassword : undefined
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to join group');
      }

      // Refresh the group data to update membership status
      await fetchGroup();
      setShowJoinDialog(false);
      setJoinPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsJoiningGroup(false);
    }
  }

  async function handleLeaveGroup(confirmDeletion = false) {
    if (!user) return;
    
    setIsLeavingGroup(true);
    try {
      const res = await fetch(`/api/groups/${group_id}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: user.id,
          confirm_deletion: confirmDeletion 
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.requires_confirmation) {
          // This shouldn't happen as we check first, but handle it just in case
          setLeaveWarning({ 
            warning_message: errorData.warning_message,
            will_delete_group: true 
          });
          setShowLeaveDialog(true);
          return;
        }
        throw new Error(errorData.error || 'Failed to leave group');
      }
      
      const data = await res.json();
      
      // Close dialog and navigate
      setShowLeaveDialog(false);
      
      if (data.group_deleted) {
        navigate('/groups', { 
          state: { 
            message: 'Group was automatically deleted after you left as the admin.' 
          } 
        });
      } else {
        navigate('/groups', { 
          state: { 
            message: 'You have successfully left the group.' 
          } 
        });
      }
    } catch (e) {
      console.error('Error leaving group:', e);
      setError(e.message);
    } finally {
      setIsLeavingGroup(false);
    }
  }

  // Render tab content based on active tab
  const renderTabContent = () => {
    if (!group)
      return (
        <div className="text-center text-gray-400 py-8">
          Group data is not available.
        </div>
      );

    switch (activeTab) {
      case "Members":
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {group.members && group.members.length > 0 ? (
              <div className="space-y-4">
                {group.members.map((member, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-6 bg-gray-900/60 rounded-xl border border-cyan-400/40 hover:border-cyan-400/60 transition-all duration-300 hover:bg-gray-800/60"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {(member.username || member.uuid).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-cyan-300 font-semibold text-lg">
                          {member.username || member.uuid}
                        </span>
                        <div className="text-sm text-gray-400">
                          Role: <span className="text-pink-400 font-medium">{member.role}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-2">No members found</div>
                <div className="text-sm text-gray-500">This group doesn't have any members yet.</div>
              </div>
            )}
          </motion.div>
        );

      case "Notifications":
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">No notifications yet</div>
              <div className="text-sm text-gray-500">Group notifications will appear here when available.</div>
            </div>
          </motion.div>
        );

      case "Description":
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {group.description ? (
              <div className="prose prose-invert max-w-none">
                <div className="bg-gray-900/60 rounded-xl p-8 border border-cyan-400/40 hover:border-cyan-400/60 transition-all duration-300">
                  <p className="text-cyan-100/90 text-lg font-light leading-relaxed">
                    {group.description}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-2">No description available</div>
                <div className="text-sm text-gray-500">This group doesn't have a description yet.</div>
              </div>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-cyan-400 font-['Orbitron',_sans-serif]">
        <span className="text-2xl animate-pulse">Loading...</span>
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-red-400 font-['Orbitron',_sans-serif]">
        <span className="text-2xl">{error || "Group not found."}</span>
      </div>
    );
  if (!group)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-400 font-['Orbitron',_sans-serif]">
        <span className="text-2xl">Group not found.</span>
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
          {/* Group Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="bg-gray-800/40 rounded-2xl p-8 mb-8 backdrop-blur-md border-2 border-cyan-400/40 shadow-[0_0_40px_0_rgba(34,211,238,0.15)] group-section-animate relative overflow-hidden"
          >
            {/* Animated gradient border */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400/30 via-sky-500/20 to-pink-400/20 blur-lg opacity-60 pointer-events-none" />
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-400/30 via-sky-500/20 to-pink-400/20 blur-lg opacity-60 pointer-events-none" />
            <div className="relative">
              <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-cyan-300 via-pink-400 to-sky-400 bg-clip-text text-transparent mb-2 leading-tight animate-gradient-text drop-shadow-lg">
                {group.name}
              </h1>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-base text-cyan-200 mb-4 font-mono">
                <p>
                  <strong>ID:</strong> {group.group_id}
                </p>
                <p>
                  <strong>Creator:</strong> <span className="text-yellow-300 font-semibold">{group.creator || "Unknown"}</span>
                </p>
                <p>
                  <strong>Created At:</strong> 
                  <span className="text-blue-300 font-semibold ml-1">
                    {group.created_at ? new Date(group.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : "Unknown"}
                  </span>
                </p>
                <p>
                  <strong>Privacy:</strong>
                  <span className={`font-semibold ml-1 ${group.is_private ? "text-pink-400" : "text-green-400"}`}>
                    {group.is_private ? "Private" : "Public"}
                  </span>
                </p>
                <p>
                  <strong>Members:</strong> 
                  <span className="text-pink-400 font-bold ml-1">{group.members?.length || 0}</span>
                </p>
              </div>
              
              {/* Leave Group Button */}
              {group.is_member && user && (
                <div className="mb-4">
                  <button
                    onClick={checkLeaveWarning}
                    disabled={isLeavingGroup}
                    className="px-4 py-2 bg-red-600/80 hover:bg-red-500/80 text-white rounded-lg border border-red-400/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(239,68,68,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLeavingGroup ? "Leaving..." : "Leave Group"}
                  </button>
                </div>
              )}

              {/* Join Group Button */}
              {!group.is_member && user && (
                <div className="mb-4">
                  <button
                    onClick={() => group.is_private ? setShowJoinDialog(true) : handleJoinGroup()}
                    disabled={isJoiningGroup}
                    className="px-4 py-2 bg-green-600/80 hover:bg-green-500/80 text-white rounded-lg border border-green-400/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,197,94,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isJoiningGroup ? "Joining..." : "Join Group"}
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Group Tabs Section with neon effect */}
          <div className="overflow-hidden">
            <div className="relative mb-8 flex flex-wrap gap-2 bg-gray-900/60 rounded-xl p-2 shadow-lg border border-cyan-700/40 neon-tabs-bar">
              <div className="absolute inset-0 pointer-events-none rounded-xl bg-gradient-to-r from-cyan-400/10 via-pink-400/10 to-sky-400/10 blur-md opacity-60" />
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-400/30 via-pink-400/20 to-sky-400/20 blur-lg opacity-60 pointer-events-none" />
              {TABS.map((tab) => (
                <motion.button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 text-base font-semibold rounded-lg transition-all duration-300 relative overflow-hidden group shadow-md border-2 ${
                    activeTab === tab
                      ? "bg-gradient-to-r from-cyan-500 via-pink-400 to-sky-400 text-white border-cyan-300 shadow-lg scale-105"
                      : "text-cyan-200 hover:text-cyan-100 hover:bg-gray-800/60 border-transparent"
                  }`}
                >
                  {activeTab === tab && (
                    <motion.span
                      layoutId="tab-underline"
                      className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-300 via-pink-400 to-sky-400 rounded-b-lg shadow-lg"
                    />
                  )}
                  {tab}
                </motion.button>
              ))}
            </div>

            {/* Tab Content Area */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-800/40 rounded-xl p-8 backdrop-blur-md border border-cyan-700/50 shadow-lg group-section-animate"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderTabContent()}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Leave Group Warning Dialog */}
      <AnimatePresence>
        {showLeaveDialog && leaveWarning && (
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
                          • The entire group will be permanently deleted<br/>
                          • All members will be removed<br/>
                          • All group data will be lost<br/>
                          • This action cannot be reversed
                        </p>
                      </div>
                    </>
                  ) : (
                    <p>Are you sure you want to leave this group?</p>
                  )}
                </div>
                
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowLeaveDialog(false)}
                    disabled={isLeavingGroup}
                    className="px-6 py-2 bg-gray-600/80 hover:bg-gray-500/80 text-white rounded-lg transition-all duration-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleLeaveGroup(leaveWarning.will_delete_group)}
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

      {/* Join Group Password Dialog */}
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
                
                <h3 className="text-xl font-bold text-green-400 mb-2">Join Private Group</h3>
                <p className="text-gray-300 mb-6">This group requires a password to join.</p>
                
                <div className="mb-6">
                  <input
                    type="password"
                    value={joinPassword}
                    onChange={(e) => setJoinPassword(e.target.value)}
                    placeholder="Enter group password"
                    className="w-full px-4 py-3 bg-gray-800/50 border border-green-400/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
                    onKeyPress={(e) => e.key === 'Enter' && handleJoinGroup()}
                    disabled={isJoiningGroup}
                  />
                </div>
                
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => {
                      setShowJoinDialog(false);
                      setJoinPassword("");
                    }}
                    disabled={isJoiningGroup}
                    className="px-6 py-2 bg-gray-600/80 hover:bg-gray-500/80 text-white rounded-lg transition-all duration-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleJoinGroup}
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
    </div>
  );
}
