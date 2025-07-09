import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function GroupPage() {
  const { group_id } = useParams();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")); // Replace with your auth context if available

  useEffect(() => {
    fetchGroup();
    // eslint-disable-next-line
  }, [group_id]);

  async function fetchGroup() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/groups/${group_id}`);
      if (!res.ok) throw new Error(await res.text());
      setGroup(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
    </div>
  );
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!group) return <div className="p-8 text-gray-400">Group not found.</div>;

  return (
    <div className="relative min-h-screen bg-gray-950/90 pb-20">
      {/* Neon/gradient background */}
      <div className="absolute inset-0 -z-10 opacity-60 blur-2xl pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 1440 320">
          <defs>
            <linearGradient id="groupGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00c9ff" />
              <stop offset="100%" stopColor="#2c5364" />
            </linearGradient>
          </defs>
          <path fill="url(#groupGradient)" d="M0,160L60,154.7C120,149,240,139,360,154.7C480,171,600,213,720,218.7C840,224,960,192,1080,181.3C1200,171,1320,181,1380,186.7L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z" />
        </svg>
      </div>
      <div className="max-w-3xl mx-auto px-4 pt-12 relative z-10">
        <button className="mb-6 text-cyan-400 hover:text-cyan-200 underline text-lg font-mono transition" onClick={() => navigate(-1)}>
          <span className="mr-2">&larr;</span>Back to Groups
        </button>
        <div className="bg-gray-900/80 rounded-2xl shadow-2xl border-2 border-cyan-400/30 p-8 mb-8 relative overflow-hidden group-section-animate">
          {/* Neon border */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400/20 via-pink-400/10 to-sky-400/20 blur-lg opacity-60 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-4 mb-2">
              <span className="inline-block p-2 rounded-full bg-cyan-700/30 border border-cyan-400/40">
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#0ea5e9" /><path d="M7 17v-1a4 4 0 014-4h2a4 4 0 014 4v1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="9" r="3" fill="#fff" /></svg>
              </span>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-cyan-300 via-pink-400 to-sky-400 bg-clip-text text-transparent leading-tight animate-gradient-text drop-shadow-lg">
                {group.name}
              </h1>
              <span className={`ml-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${group.is_private ? "bg-pink-700/40 text-pink-200" : "bg-cyan-700/40 text-cyan-200"}`}>{group.is_private ? "Private" : "Public"}</span>
            </div>
            <div className="mb-4 text-cyan-100/90 text-lg font-light italic animate-fade-in">
              {group.description || <span className="text-gray-500">No description provided.</span>}
            </div>
            <div className="flex flex-wrap gap-6 mb-6 text-cyan-200 text-sm font-mono">
              <div>
                <span className="text-gray-400">Group ID:</span> {group.group_id}
              </div>
              <div>
                <span className="text-gray-400">Created:</span> {group.created_at ? new Date(group.created_at).toLocaleString() : "-"}
              </div>
              {group.members && group.members.length > 0 && (
                <div>
                  <span className="text-gray-400">Members:</span> {group.members.length}
                </div>
              )}
            </div>
            <h2 className="text-2xl font-bold text-cyan-300 mb-3 mt-8 flex items-center gap-2">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-3-3.87M7 21v-2a4 4 0 013-3.87M12 3a4 4 0 110 8 4 4 0 010-8z" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="9" r="3" fill="#0ea5e9" /></svg>
              Members
            </h2>
            <ul className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {group.members && group.members.length > 0 ? group.members.map(m => (
                <li key={m.group_member_id} className="flex items-center gap-3 bg-gray-800/70 rounded-lg px-4 py-2 border border-cyan-700/30 shadow">
                  <span className="inline-block w-8 h-8 rounded-full bg-cyan-700/40 flex items-center justify-center font-bold text-cyan-200 text-lg uppercase">
                    {m.username?.[0] || "U"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-cyan-100 truncate">{m.username}</div>
                    <div className="text-xs text-gray-400 truncate">{m.role}</div>
                  </div>
                  {user && user.user_id === m.user_id && (
                    <span className="ml-2 px-2 py-0.5 rounded bg-cyan-600/40 text-xs text-white font-bold">You</span>
                  )}
                </li>
              )) : <li className="text-gray-400">No members.</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
