import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

const TABS = ["Members", "Notifications"];

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
        <radialGradient id="neon-glow-group" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="720" cy="100" rx="700" ry="60" fill="url(#neon-glow-group)" />
    </svg>
  );
}

export default function GroupPage() {
  const { group_id } = useParams();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchGroup();
    // eslint-disable-next-line
  }, [group_id]);

  useEffect(() => {
    if (containerRef.current) {
      import("gsap").then(({ gsap }) => {
        gsap.fromTo(
          containerRef.current,
          { opacity: 0, y: 40, filter: "blur(10px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 1.1,
            ease: "power4.out",
          }
        );
      });
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
    <div className="min-h-screen bg-gray-950 text-gray-100 font-['Orbitron',_sans-serif] antialiased relative flex flex-col items-center justify-center py-12 px-2 overflow-x-hidden">
      <NeonGlowSVG className="top-0 left-1/2 -translate-x-1/2 w-[120vw] h-[200px]" style={{ opacity: 0.22 }} />
      <div className="max-w-4xl mx-auto px-4 pt-12 relative z-10 w-full">
        <button className="mb-6 text-cyan-400 hover:text-cyan-200 underline text-lg font-mono transition" onClick={() => navigate(-1)}>
          <span className="mr-2">&larr;</span>Back to Groups
        </button>
        <div
          ref={containerRef}
          className="w-full mb-10 p-10 rounded-2xl border-2 border-cyan-400/40 bg-gradient-to-br from-gray-900/80 to-gray-900/60 shadow-[0_0_40px_#22d3ee44,0_0_0_4px_#22d3ee22_inset] relative z-10"
          style={{ boxShadow: "0 0 32px 0 #22d3ee44, 0 0 0 4px #22d3ee22 inset" }}
        >
          <div className="mb-4">
            <span className="block text-4xl md:text-5xl font-bold text-pink-400 mb-2" style={{ textShadow: "0 0 16px #ec4899aa" }}>
              {group.name}
            </span>
            <span className={`ml-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${group.is_private ? "bg-pink-700/40 text-pink-200" : "bg-cyan-700/40 text-cyan-200"}`}>{group.is_private ? "Private" : "Public"}</span>
          </div>
          <div className="flex flex-wrap gap-6 items-center text-lg text-cyan-200 font-mono mb-2">
            <span className="">ID: <span className="text-white font-bold">{group.group_id}</span></span>
            <span className="">Created: <span className="text-white font-bold">{group.created_at ? new Date(group.created_at).toLocaleString() : "-"}</span></span>
            <span className="">Members: <span className="text-pink-400 font-bold">{group.members?.length || 0}</span></span>
          </div>
          <div className="flex flex-wrap gap-4 text-base text-gray-300 mb-2">
            <span>By: <span className="text-yellow-300 font-semibold">{group.creator || "Unknown"}</span></span>
            <span>Protected: <span className="text-pink-400 font-semibold">{group.is_private ? "Yes" : "No"}</span></span>
            <span>Member: <span className={`font-semibold ${group.is_member ? "text-green-400" : "text-red-400"}`}>{group.is_member ? "Yes" : "No"}</span></span>
          </div>
          {group.description && (
            <div className="text-base text-gray-400 mt-2">
              {group.description}
            </div>
          )}
        </div>

        {/* Tab Bar */}
        <div className="w-full mb-10 z-10">
          <div className="flex rounded-2xl overflow-hidden border-2 border-cyan-700/40 bg-gray-900/80 shadow-[0_0_24px_#22d3ee55]">
            {TABS.map((tab) => (
              <button
                key={tab}
                className={`flex-1 py-5 px-8 text-2xl font-bold transition-all duration-200 border-r last:border-r-0 border-cyan-700/30
                ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-cyan-500/80 to-pink-500/80 text-white shadow-[0_0_24px_#22d3ee88]"
                    : "bg-gray-900/80 text-cyan-300 hover:bg-cyan-900/30 hover:text-pink-300"
                }
                `}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="w-full z-10">
          {activeTab === "Members" && (
            <section className="bg-gray-900/70 rounded-2xl p-10 border-2 border-cyan-700/40 shadow-[0_0_24px_#22d3ee33]">
              <h2 className="text-3xl font-bold text-cyan-400 mb-6">Group Members</h2>
              {group.members && group.members.length > 0 ? (
                <div className="space-y-4">
                  {group.members.map((member, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                      <div>
                        <span className="text-cyan-300 font-semibold">{member.username || member.uuid}</span>
                        <span className="ml-2 text-sm text-gray-400">({member.role})</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-lg">No members found.</div>
              )}
            </section>
          )}
          {activeTab === "Notifications" && (
            <section className="bg-gray-900/70 rounded-2xl p-10 border-2 border-pink-700/40 shadow-[0_0_24px_#ec489933]">
              <h2 className="text-3xl font-bold text-pink-400 mb-6">Notifications</h2>
              <div className="text-gray-400 text-lg">No notifications yet.</div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
