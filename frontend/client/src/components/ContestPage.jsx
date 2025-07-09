import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { gsap } from "gsap";

const TABS = ["Problems", "Submit Code", "Status", "Standings"];

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
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [contest, setContest] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState(false);
  const [error, setError] = useState(null);
  const [joinError, setJoinError] = useState(null);
  const [joinSuccess, setJoinSuccess] = useState(null);
  const [joinPassword, setJoinPassword] = useState("");
  const { user } = useAuth();
  const containerRef = useRef(null);

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
    if (containerRef.current) {
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
    }
  }, [contest]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-cyan-400 font-['Orbitron',_sans-serif]">
        <span className="text-2xl animate-pulse">Loading...</span>
      </div>
    );

  if (!contest)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-red-400 font-['Orbitron',_sans-serif]">
        <span className="text-2xl">{error || "Contest not found."}</span>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-['Orbitron',_sans-serif] antialiased relative flex flex-col items-center justify-center py-12 px-2 overflow-x-hidden">
      {/* Neon Glow Background */}
      <NeonGlowSVG className="top-0 left-1/2 -translate-x-1/2 w-[120vw] h-[400px]" style={{ opacity: 0.22 }} />
      {/* Neon Glow Card for Contest Info */}
      <div
        ref={containerRef}
        className="w-full max-w-5xl mx-auto mb-10 p-10 rounded-2xl border-2 border-cyan-400/40 bg-gradient-to-br from-gray-900/80 to-gray-900/60 shadow-[0_0_40px_#22d3ee44,0_0_0_4px_#22d3ee22_inset] relative z-10"
        style={{ boxShadow: "0 0 32px 0 #22d3ee44, 0 0 0 4px #22d3ee22 inset" }}
      >
        <div className="mb-4">
          <span className="block text-4xl md:text-5xl font-bold text-pink-400 mb-2" style={{ textShadow: "0 0 16px #ec4899aa" }}>
            {contest.name}
          </span>
          <div className="flex flex-wrap gap-6 items-center text-lg text-cyan-200 font-mono mb-2">
            <span className="">ID: <span className="text-white font-bold">{contestId}</span></span>
            <span className="">Time Limit: <span className="text-white font-bold">2s</span></span>
            <span className="">Memory Limit: <span className="text-white font-bold">256 MB</span></span>
            <span className="">Difficulty: <span className="text-pink-400 font-bold">{contest.difficulty || "-"}</span></span>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-base text-gray-300 mb-2">
          <span>By: <span className="text-yellow-300 font-semibold">{contest.creator || "Unknown"}</span></span>
          <span>Protected: <span className="text-pink-400 font-semibold">{contest.is_secured ? "Yes" : "No"}</span></span>
          <span>Start: <span className="text-cyan-300 font-semibold">{new Date(contest.start_time).toLocaleString()}</span></span>
          <span>End: <span className="text-pink-300 font-semibold">{new Date(contest.end_time).toLocaleString()}</span></span>
        </div>
        {contest.description && (
          <div className="text-base text-gray-400 mt-2">
            {contest.description}
          </div>
        )}
      </div>

      {/* Large Neon Tab Bar */}
      <div className="w-full max-w-5xl mx-auto mb-10 z-10">
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
      <div className="w-full max-w-5xl mx-auto z-10">
        {activeTab === "Problems" && (
          <section className="bg-gray-900/70 rounded-2xl p-10 border-2 border-cyan-700/40 shadow-[0_0_24px_#22d3ee33]">
            <h2 className="text-3xl font-bold text-cyan-400 mb-6">Problems</h2>
            {contest.is_participant && contest.problems?.length > 0 ? (
              <ul className="space-y-4">
                {contest.problems.map((p, i) => (
                  <li
                    key={i}
                    className="bg-gray-800/70 rounded-xl px-7 py-5 text-cyan-200 border border-cyan-700/40"
                  >
                    <a
                      href={`/contests/${contestId}/problem/${p.problem_id}`}
                      className="font-semibold text-cyan-300 hover:underline hover:text-pink-400 transition text-xl"
                    >
                      {p.title || p.alias || p.problem_id}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-400 text-lg">
                Problems will be visible when the contest starts and you have joined.
              </div>
            )}
          </section>
        )}
        {activeTab === "Submit Code" && (
          <section className="bg-gray-900/70 rounded-2xl p-10 border-2 border-cyan-700/40 shadow-[0_0_24px_#22d3ee33]">
            <h2 className="text-3xl font-bold text-cyan-400 mb-6">Submit Code</h2>
            <div className="text-gray-400 text-lg">Submission functionality will be implemented here.</div>
          </section>
        )}
        {activeTab === "Status" && (
          <section className="bg-gray-900/70 rounded-2xl p-10 border-2 border-cyan-700/40 shadow-[0_0_24px_#22d3ee33]">
            <h2 className="text-3xl font-bold text-cyan-400 mb-6">Status</h2>
            <div className="text-gray-400 text-lg">Submission statuses will be displayed here.</div>
          </section>
        )}
        {activeTab === "Standings" && (
          <section className="bg-gray-900/70 rounded-2xl p-10 border-2 border-pink-700/40 shadow-[0_0_24px_#ec489933]">
            <h2 className="text-3xl font-bold text-pink-400 mb-6">Standings</h2>
            <div className="text-gray-400 text-lg">Standings will be displayed here.</div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ContestPage;
