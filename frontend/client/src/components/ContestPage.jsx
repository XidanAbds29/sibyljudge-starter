import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import bgImage from "../assets/bg.png";
import { useAuth } from "./AuthContext";
import { gsap } from "gsap";

const TABS = ["Problems", "Standings", "Participants"];

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
  const contestRef = useRef();

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

  const fetchParticipants = async () => {
    try {
      const res = await fetch(`/api/contests/${contestId}/participants`);
      if (!res.ok) throw new Error("Failed to fetch participants");
      const data = await res.json();
      setParticipants(data);
    } catch {
      setParticipants([]);
    }
  };

  useEffect(() => {
    fetchContest();
    fetchParticipants();
    // eslint-disable-next-line
  }, [contestId]);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6 }
      );
    }
  }, [contest]);

  // Animate main contest card and tab transitions
  useEffect(() => {
    if (contestRef.current) {
      gsap.fromTo(
        contestRef.current,
        { opacity: 0, y: 40, filter: "blur(10px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1.1,
          ease: "power4.out",
        }
      );
      // Animate tab content
      const tabSections = contestRef.current.querySelectorAll(
        ".contest-tab-animate"
      );
      gsap.fromTo(
        tabSections,
        { opacity: 0, y: 30, scale: 0.97 },
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
  }, [activeTab, contest]);

  const alreadyJoined = user && participants.some((p) => p.user_id === user.id);

  const handleJoin = async () => {
    if (!user) {
      setJoinError("You must be logged in to join.");
      return;
    }
    setJoinLoading(true);
    setJoinError(null);
    setJoinSuccess(null);
    try {
      const res = await fetch(`/api/contests/${contestId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, password: joinPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join");
      setJoinSuccess("Joined contest!");
      fetchParticipants();
      setJoinPassword("");
    } catch (err) {
      setJoinError(err.message);
    } finally {
      setJoinLoading(false);
    }
  };

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
    <div
      ref={contestRef}
      className="min-h-screen bg-gray-950 text-gray-100 font-['Orbitron',_sans-serif] antialiased relative"
    >
      <NeonGlowSVG
        className="top-0 left-0 w-full h-40"
        style={{ opacity: 0.18 }}
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-pink-400/10 w-full h-full"></div>
          <div className="absolute inset-0 w-full h-full opacity-20 bg-[radial-gradient(circle_at_30%_30%,rgba(0,255,255,0.18)_0,transparent_70%)] animate-pulse"></div>
          <div className="absolute inset-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_70%_80%,rgba(255,0,234,0.12)_0,transparent_70%)]"></div>
        </div>
      </div>
      <div className="relative z-10 container mx-auto px-4 py-24">
        <div
          ref={containerRef}
          className="max-w-2xl mx-auto bg-gray-900/80 backdrop-blur-md rounded-xl shadow-2xl border border-cyan-700/50 shadow-cyan-500/20 p-10 contest-tab-animate relative"
        >
          <div className="flex items-center gap-6 mb-10">
            <div className="flex-shrink-0 flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-pink-500 shadow-lg border-4 border-cyan-400 animate-pulse">
              <svg
                className="w-12 h-12 text-gray-900"
                viewBox="0 0 64 32"
                fill="none"
              >
                <rect
                  x="2"
                  y="12"
                  width="60"
                  height="8"
                  rx="4"
                  fill="#00fff7"
                  opacity="0.18"
                />
                <rect
                  x="8"
                  y="14"
                  width="48"
                  height="4"
                  rx="2"
                  fill="#00fff7"
                />
                <rect
                  x="54"
                  y="10"
                  width="6"
                  height="12"
                  rx="3"
                  fill="#ff00ea"
                />
                <circle cx="12" cy="16" r="3" fill="#fffb00" />
                <rect
                  x="18"
                  y="15"
                  width="6"
                  height="2"
                  rx="1"
                  fill="#fffb00"
                />
              </svg>
            </div>
            <div>
              <h1
                className="text-3xl md:text-4xl font-extrabold text-cyan-400 tracking-wide mb-1"
                style={{ textShadow: "0 0 12px #00fff7, 0 0 20px #00fff7" }}
              >
                {contest.name}
              </h1>
              <div
                className="text-xs text-yellow-300 font-mono tracking-widest bg-yellow-900/30 px-3 py-1 rounded-lg border border-yellow-400/30 inline-block shadow"
                style={{ textShadow: "0 0 8px #fffb00" }}
              >
                Contest ID: {contestId}
              </div>
              <div className="mt-2 text-sm text-gray-300">
                <span className="mr-4">
                  <span className="font-semibold text-cyan-400">Start:</span>{" "}
                  {new Date(contest.start_time).toLocaleString()}
                </span>
                <span>
                  <span className="font-semibold text-pink-400">End:</span>{" "}
                  {new Date(contest.end_time).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          {joinError && (
            <div className="mb-2 text-red-400 font-bold">{joinError}</div>
          )}
          {joinSuccess && (
            <div className="mb-2 text-green-400 font-bold">{joinSuccess}</div>
          )}
          {user && !alreadyJoined && (
            <div className="mb-6">
              {contest.is_secured && (
                <input
                  type="password"
                  className="mb-2 block w-full bg-gray-800/80 border-2 border-pink-400 rounded-lg text-lg text-pink-200 px-5 py-3 focus:outline-none focus:border-cyan-400 shadow transition"
                  placeholder="Contest Password"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                />
              )}
              <button
                className="bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-400 hover:to-pink-400 text-white font-bold py-2.5 px-8 rounded-lg shadow-lg transition hover:scale-105"
                disabled={joinLoading}
                onClick={handleJoin}
              >
                {joinLoading ? "Joining..." : "Join Contest"}
              </button>
            </div>
          )}
          {user && alreadyJoined && (
            <div className="mb-6 text-green-400 font-bold">
              You have joined this contest.
            </div>
          )}
          <div className="flex space-x-4 mb-8">
            {TABS.map((tab) => (
              <button
                key={tab}
                className={`px-6 py-2 rounded-lg font-bold text-lg transition-all border-2
                  ${
                    activeTab === tab
                      ? "bg-gradient-to-r from-cyan-500 to-pink-500 text-white border-pink-400 shadow-lg"
                      : "bg-gray-800/80 text-cyan-300 border-cyan-700 hover:bg-gray-700/80 hover:border-cyan-400"
                  }
                `}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 mb-6">
            <div className="text-lg text-cyan-300 font-bold">
              {contest.name}
            </div>
            <div className="text-sm text-gray-300">
              By:{" "}
              <span className="text-yellow-300 font-semibold">
                {contest.creator || "Unknown"}
              </span>
            </div>
            <div className="text-sm text-gray-300">
              Difficulty:{" "}
              <span className="text-pink-300 font-semibold">
                {contest.difficulty || "-"}
              </span>
            </div>
            <div className="text-sm text-gray-300">
              Protected:{" "}
              <span className="text-pink-400 font-semibold">
                {contest.is_secured ? "Yes" : "No"}
              </span>
            </div>
            <div className="text-sm text-gray-300">
              Start: {new Date(contest.start_time).toLocaleString()}
            </div>
            <div className="text-sm text-gray-300">
              End: {new Date(contest.end_time).toLocaleString()}
            </div>
            {contest.description && (
              <div className="text-sm text-gray-400 mt-2">
                {contest.description}
              </div>
            )}
          </div>
          <div className="min-h-[180px]">
            {activeTab === "Problems" && (
              <section>
                <h2 className="text-xl font-bold text-cyan-400 mb-4">
                  Problems
                </h2>
                {contest.is_participant && contest.problems?.length > 0 ? (
                  <ul className="space-y-3">
                    {contest.problems.map((p, i) => (
                      <li
                        key={i}
                        className="bg-gray-800/70 rounded-lg px-5 py-3 text-cyan-200 border border-cyan-700/40"
                      >
                        <a
                          href={`/contests/${contestId}/problem/${p.external_id}`}
                          className="font-semibold text-cyan-300 hover:underline hover:text-pink-400 transition"
                        >
                          {p.title || p.alias || p.problem_id}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-400">
                    Problems will be visible when the contest starts and you
                    have joined.
                  </div>
                )}
              </section>
            )}
            {activeTab === "Standings" && (
              <section>
                <h2 className="text-xl font-bold text-pink-400 mb-4">
                  Standings
                </h2>
                <div className="text-gray-400">
                  Standings will be displayed here.
                </div>
              </section>
            )}
            {activeTab === "Participants" && (
              <section>
                <h2 className="text-xl font-bold text-yellow-300 mb-4">
                  Participants
                </h2>
                <ul className="space-y-2">
                  {participants.map((p, i) => (
                    <li
                      key={i}
                      className="bg-gray-800/70 rounded px-4 py-2 text-yellow-200 border border-yellow-700/40"
                    >
                      {p.username || p.user_id}
                    </li>
                  ))}
                  {!participants.length && (
                    <li className="text-gray-400">No participants listed.</li>
                  )}
                </ul>
              </section>
            )}
          </div>
        </div>
      </div>
      {/* Neon SVG Glow Background */}
      <NeonGlowSVG className="top-0 left-0 -z-10" />
    </div>
  );
};

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
        <radialGradient id="neon-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00fff7" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#00fff7" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="720" cy="100" rx="700" ry="60" fill="url(#neon-glow)" />
    </svg>
  );
}

export default ContestPage;
