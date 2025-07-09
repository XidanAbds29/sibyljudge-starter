
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import bgImage from "../assets/bg.png";
import { gsap } from "gsap";

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", is_private: false, password: "" });
  const [joinPassword, setJoinPassword] = useState("");
  const [joiningGroup, setJoiningGroup] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const navigate = useNavigate();
  const { user } = useAuth ? useAuth() : { user: JSON.parse(localStorage.getItem("user")) };
  const listRef = useRef();
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [total, setTotal] = useState(0);

  // Animate list on mount and groups change
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
  }, [filteredGroups]);

  useEffect(() => {
    fetchGroups();
    if (user) fetchMyGroups();
  }, []);

  // Filter and paginate groups
  useEffect(() => {
    let filtered = groups.filter(g =>
      g.name.toLowerCase().includes(search.toLowerCase())
    );
    setTotal(filtered.length);
    setFilteredGroups(filtered.slice((page - 1) * limit, page * limit));
  }, [groups, search, page]);

  async function fetchGroups() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/groups");
      if (!res.ok) throw new Error(await res.text());
      setGroups(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMyGroups() {
    try {
      const res = await fetch(`/api/groups/user/${user.user_id}`);
      if (!res.ok) throw new Error(await res.text());
      setMyGroups(await res.json());
    } catch (e) {
      // ignore
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!user) return alert("Login required");
    const body = {
      ...form,
      created_by: user.user_id,
      password_hash: form.is_private && form.password ? form.password : null,
    };
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      setShowCreate(false);
      setForm({ name: "", description: "", is_private: false, password: "" });
      fetchGroups();
      fetchMyGroups();
    } catch (e) {
      alert("Create failed: " + e.message);
    }
  }

  async function handleJoin(group) {
    if (!user) return alert("Login required");
    let password_hash = group.is_private ? joinPassword : null;
    try {
      const res = await fetch(`/api/groups/${group.group_id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id, password_hash }),
      });
      if (!res.ok) throw new Error(await res.text());
      setJoiningGroup(null);
      setJoinPassword("");
      fetchGroups();
      fetchMyGroups();
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
        body: JSON.stringify({ user_id: user.user_id }),
      });
      if (!res.ok) throw new Error(await res.text());
      fetchGroups();
      fetchMyGroups();
    } catch (e) {
      alert("Leave failed: " + e.message);
    }
  }

  return (
    <div
      className="min-h-screen bg-gray-950 text-gray-100 font-['Orbitron',_sans-serif] antialiased"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-0"></div>
      <div className="relative z-10 max-w-4xl mx-auto py-12 px-4">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
          <h1 className="text-4xl md:text-5xl font-extrabold text-cyan-400 drop-shadow mb-2" style={{ textShadow: "0 0 12px rgba(0,255,255,0.7)" }}>Groups</h1>
          <div className="flex gap-2 items-end">
            <input
              type="text"
              placeholder="Search groups..."
              className="px-4 py-2 rounded-lg bg-gray-800 text-gray-200 border border-cyan-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 shadow"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ minWidth: 180 }}
            />
            <button
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-sky-600 text-white font-semibold rounded-lg hover:from-cyan-400 hover:to-sky-500 focus:ring-4 focus:ring-cyan-500/50 focus:outline-none transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-cyan-500/30"
              onClick={() => setShowCreate(v => !v)}
            >
              {showCreate ? "Cancel" : "Create Group"}
            </button>
          </div>
        </div>
        {showCreate && (
          <form className="mb-8 p-6 border border-cyan-700/50 rounded-xl bg-gray-900/80 backdrop-blur-md shadow-2xl max-w-2xl mx-auto" onSubmit={handleCreate}>
            <div className="mb-4">
              <label className="block mb-1 text-cyan-300 font-semibold">Name</label>
              <input className="w-full p-3 rounded bg-gray-800 text-white" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="mb-4">
              <label className="block mb-1 text-cyan-300 font-semibold">Description</label>
              <textarea className="w-full p-3 rounded bg-gray-800 text-white" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="mb-4 flex items-center gap-2">
              <input type="checkbox" checked={form.is_private} onChange={e => setForm(f => ({ ...f, is_private: e.target.checked }))} />
              <label className="text-cyan-200">Private group</label>
            </div>
            {form.is_private && (
              <div className="mb-4">
                <label className="block mb-1 text-cyan-300 font-semibold">Password</label>
                <input type="password" className="w-full p-3 rounded bg-gray-800 text-white" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
            )}
            <button className="px-6 py-2 bg-gradient-to-r from-cyan-700 to-cyan-500 text-white rounded-lg font-bold mt-2 shadow-lg hover:scale-105 transition">Create</button>
          </form>
        )}
        {error && (
          <div className="my-4 p-4 bg-red-900/60 text-red-200 rounded-lg border border-red-700 shadow-lg max-w-2xl mx-auto">
            <strong className="font-semibold">Error:</strong> {error}
          </div>
        )}
        {(loading || filteredGroups.length > 0 || error) && (
          <div ref={listRef} className="max-w-4xl mx-auto bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-cyan-700/40 mt-6">
            <h2 className="text-2xl font-bold text-cyan-400 mb-6 pb-2 border-b-2 border-cyan-700/50 text-center" style={{ textShadow: "0 0 8px rgba(0,255,255,0.5)" }}>
              All Groups <span className="text-gray-400 text-lg">({total})</span>
            </h2>
            {loading ? (
              <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-400"></div>
                <p className="mt-4 text-gray-400">Loading groups...</p>
              </div>
            ) : !filteredGroups.length ? (
              <div className="flex flex-col items-center justify-center py-12">
                <svg width="64" height="64" fill="none" viewBox="0 0 64 64" className="mb-4 opacity-60">
                  <circle cx="32" cy="32" r="30" stroke="#0ea5e9" strokeWidth="3" fill="#0ea5e9" fillOpacity="0.08" />
                  <path d="M20 44c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round"/>
                  <circle cx="32" cy="28" r="6" stroke="#0ea5e9" strokeWidth="2.5" />
                </svg>
                <p className="text-center text-cyan-300 text-lg font-semibold">No groups found.</p>
                <p className="text-center text-gray-400 mt-2">Try a different search or create a new group!</p>
              </div>
            ) : (
              <div className="divide-y divide-cyan-800/40">
                {filteredGroups.map(g => (
                  <div key={g.group_id} className="py-5 group group-card-animate relative transition-all duration-300 hover:scale-[1.025] hover:z-10 hover:bg-cyan-900/10 rounded-xl px-2">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between relative z-10">
                      <div className="flex-1 min-w-0 mb-3 sm:mb-0">
                        <div className="text-xl font-semibold text-cyan-400 group-hover:text-sky-300 transition-colors duration-300 block group-hover:tracking-wide">
                          {g.name}
                          <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full border border-cyan-700/40 bg-gray-800 text-gray-300 align-middle">{g.is_private ? "Private" : "Public"}</span>
                          {myGroups.some(mg => mg.group_id === g.group_id) && (
                            <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full border border-green-700/40 bg-green-900/30 text-green-300 align-middle">Member</span>
                          )}
                        </div>
                        {g.description && <div className="mt-2 text-gray-400 text-sm line-clamp-2">{g.description}</div>}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {myGroups.some(mg => mg.group_id === g.group_id) ? (
                          <button className="text-sm text-pink-400 underline hover:text-pink-300" onClick={() => handleLeave(g)}>Leave</button>
                        ) : g.is_private ? (
                          joiningGroup === g.group_id ? (
                            <>
                              <input type="password" className="p-1 rounded border bg-gray-800 text-white" placeholder="Password" value={joinPassword} onChange={e => setJoinPassword(e.target.value)} />
                              <button className="text-sm text-cyan-400 underline hover:text-cyan-300" onClick={() => handleJoin(g)}>Join</button>
                              <button className="text-sm text-gray-400 underline hover:text-gray-300" onClick={() => setJoiningGroup(null)}>Cancel</button>
                            </>
                          ) : (
                            <button className="text-sm text-cyan-400 underline hover:text-cyan-300" onClick={() => setJoiningGroup(g.group_id)}>Join</button>
                          )
                        ) : (
                          <button className="text-sm text-cyan-400 underline hover:text-cyan-300" onClick={() => handleJoin(g)}>Join</button>
                        )}
                        <button className="text-sm text-cyan-400 underline hover:text-cyan-300" onClick={() => navigate(`/group/${g.group_id}`)}>View</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {total > limit && (
              <div className="mt-8 flex justify-between items-center pt-4 border-t border-cyan-800/40">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1 || loading}
                  className="px-4 py-2 bg-gray-800 text-cyan-400 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  ← Previous
                </button>
                <span className="text-gray-400 font-medium">
                  Page {page} of {Math.ceil(total / limit)}
                </span>
                <button
                  onClick={() => setPage(Math.min(Math.ceil(total / limit), page + 1))}
                  disabled={page === Math.ceil(total / limit) || loading}
                  className="px-4 py-2 bg-gray-800 text-cyan-400 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
