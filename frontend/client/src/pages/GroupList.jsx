
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import bgImage from "../assets/bg.png";
import { gsap } from "gsap";

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
  const [refreshKey, setRefreshKey] = useState(0);
  const [joinPassword, setJoinPassword] = useState("");
  const [joiningGroup, setJoiningGroup] = useState(null);
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
        const res = await fetch("/api/groups");
        if (!res.ok) throw new Error("Failed to fetch groups");
        const data = await res.json();
        setGroups(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
    // eslint-disable-next-line
  }, [refreshKey]);

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
    }
  }, [groups, page, privacy, status, search]);

  async function handleJoin(group) {
    if (!user) return alert("Login required");
    let password = group.is_private ? joinPassword : "";
    try {
      const res = await fetch(`/api/groups/${group.group_id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, password }), // Use user.id (UUID)
      });
      if (!res.ok) throw new Error(await res.text());
      setJoiningGroup(null);
      setJoinPassword("");
      setRefreshKey(k => k + 1);
    } catch (e) {
      alert("Join failed: " + e.message);
    }
  }

  async function handleLeave(group) {
    if (!user) return alert("Login required");
    try {
      const res = await fetch(`/api/groups/${group.group_id}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }), // Use user.id (UUID)
      });
      if (!res.ok) throw new Error(await res.text());
      setRefreshKey(k => k + 1);
    } catch (e) {
      alert("Leave failed: " + e.message);
    }
  }

  // Filter and paginate groups
  const filteredGroups = groups.filter((g) => {
    const matchesPrivacy = !privacy || (privacy === "Public" && !g.is_private) || (privacy === "Private" && g.is_private);
    const matchesStatus = !status || (status === "Member" ? myGroups.some(mg => mg.group_id === g.group_id) : !myGroups.some(mg => mg.group_id === g.group_id));
    const matchesSearch = !search || g.name.toLowerCase().includes(search.toLowerCase());
    return matchesPrivacy && matchesStatus && matchesSearch;
  });
  const lastPage = Math.max(1, Math.ceil(filteredGroups.length / limit));
  const paginatedGroups = filteredGroups.slice((page - 1) * limit, page * limit);

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-gray-950 text-gray-200 font-['Orbitron',_sans-serif] antialiased">
      <div className="max-w-4xl mx-auto mb-6 p-4 bg-gray-900/80 backdrop-blur-sm flex flex-wrap gap-4 items-end rounded-lg shadow-xl border border-cyan-700/40">
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
        <div>
          <label className="block mb-1 text-sm text-gray-400 font-medium">Search</label>
          <input
            type="text"
            placeholder="Search groups..."
            className="p-2.5 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ minWidth: 180 }}
          />
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

      {error && (
        <div className="max-w-4xl mx-auto mb-6 p-4 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200">
          {error}
          </div>
      )}

      <div ref={listRef} className="max-w-4xl mx-auto">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
            <p className="mt-2 text-gray-400">Loading groups...</p>
          </div>
        ) : paginatedGroups.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No groups found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedGroups.map((group) => {
              const isMember = myGroups.some(mg => mg.group_id === group.group_id);
              return (
                <div
                  key={group.group_id}
                  className="p-6 bg-gray-900/80 backdrop-blur-sm rounded-lg shadow-xl border border-cyan-700/40 hover:border-cyan-600/60 transition-all duration-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-cyan-300">{group.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${group.is_private ? "bg-pink-700/40 text-pink-200" : "bg-cyan-700/40 text-cyan-200"}`}>
                          {group.is_private ? "Private" : "Public"}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${statusColors[isMember ? "Member" : "Not Member"]}`}>
                          {isMember ? "Member" : "Not Member"}
                        </span>
                      </div>
                      {group.description && (
                        <p className="text-gray-400 mb-3">{group.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>ID: {group.group_id}</span>
                        <span>Created: {group.created_at ? new Date(group.created_at).toLocaleDateString() : "-"}</span>
                    </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {isMember ? (
                        <button
                          onClick={() => handleLeave(group)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-all duration-300"
                        >
                          Leave
                        </button>
                      ) : (
                        <button
                          onClick={() => setJoiningGroup(group)}
                          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-white font-semibold rounded-lg transition-all duration-300"
                        >
                          Join
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/group/${group.group_id}`)}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-300"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          )}

        {lastPage > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-400">
                Page {page} of {lastPage}
              </span>
              <button
                onClick={() => setPage(p => Math.min(lastPage, p + 1))}
                disabled={page === lastPage}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {joiningGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg shadow-xl border border-cyan-700/40 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-cyan-300 mb-4">Join {joiningGroup.name}</h3>
            {joiningGroup.is_private && (
              <div className="mb-4">
                <label className="block mb-1 text-sm text-gray-400 font-medium">Password</label>
                <input
                  type="password"
                  required
                  className="w-full p-2.5 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                  value={joinPassword}
                  onChange={e => setJoinPassword(e.target.value)}
                />
            </div>
          )}
            <div className="flex gap-4">
              <button
                onClick={() => handleJoin(joiningGroup)}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-sky-600 text-white font-semibold rounded-lg hover:from-cyan-400 hover:to-sky-500 transition-all duration-300"
              >
                Join Group
              </button>
              <button
                onClick={() => setJoiningGroup(null)}
                className="flex-1 px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-all duration-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
