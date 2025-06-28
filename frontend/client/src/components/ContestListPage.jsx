import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import bgImage from "../assets/bg.png";

const statusColors = {
  Upcoming: "text-cyan-400 border-cyan-400",
  Ongoing: "text-pink-400 border-pink-400",
  Finished: "text-yellow-300 border-yellow-300",
};

const ContestListPage = () => {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const listRef = useRef();

  useEffect(() => {
    const fetchContests = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/contests");
        if (!res.ok) throw new Error("Failed to fetch contests");
        const data = await res.json();
        // Add status field based on time
        const now = new Date();
        const contestsWithStatus = data.map((c) => {
          const start = new Date(c.start_time);
          const end = new Date(c.end_time);
          let status = "Upcoming";
          if (now >= start && now <= end) status = "Ongoing";
          else if (now > end) status = "Finished";
          return { ...c, status };
        });
        setContests(contestsWithStatus);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchContests();
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.8 }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [contests]);

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
  }, [contests]);

  return (
    <div
      ref={listRef}
      className="min-h-screen bg-gray-950 text-gray-100 font-['Orbitron',_sans-serif] antialiased"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
      }}
    >
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
          className="max-w-3xl mx-auto bg-gray-900/80 backdrop-blur-md rounded-xl shadow-2xl border border-cyan-700/50 shadow-cyan-500/20 p-10"
        >
          <div className="flex items-center justify-between mb-10">
            <h1
              className="text-4xl md:text-5xl font-extrabold text-cyan-400 tracking-wide"
              style={{
                textShadow: "0 0 12px #00fff7, 0 0 20pxrgb(89, 204, 200)",
              }}
            >
              Virtual Contests
            </h1>
            <button
              className="bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-white font-bold py-2.5 px-7 rounded-lg shadow-lg transform transition duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(56,189,248,0.7)] focus:outline-none focus:ring-4 focus:ring-cyan-500/50"
              onClick={() => navigate("/contests/create")}
            >
              + Create Contest
            </button>
          </div>
          {loading ? (
            <div className="text-center text-cyan-400 text-xl mt-16">
              Loading contests...
            </div>
          ) : error ? (
            <div className="text-center text-red-400 text-xl mt-16">
              {error}
            </div>
          ) : (
            <ul className="space-y-7 mt-8">
              {contests.map((contest) => (
                <li
                  key={contest.contest_id}
                  className="relative bg-gray-800/80 border border-cyan-700/40 rounded-xl p-7 shadow-lg hover:shadow-cyan-500/30 hover:border-cyan-400 transition cursor-pointer group"
                  onClick={() => navigate(`/contests/${contest.contest_id}`)}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2
                        className="text-2xl font-bold text-cyan-300 group-hover:text-cyan-400 transition tracking-wide"
                        style={{ textShadow: "0 0 8px #00fff7" }}
                      >
                        {contest.name}
                      </h2>
                      <div className="mt-2 text-sm text-gray-300">
                        <span className="mr-4">
                          <span className="font-semibold text-cyan-400">
                            Start:
                          </span>{" "}
                          {new Date(contest.start_time).toLocaleString()}
                        </span>
                        <span>
                          <span className="font-semibold text-pink-400">
                            End:
                          </span>{" "}
                          {new Date(contest.end_time).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`mt-4 md:mt-0 md:ml-8 px-4 py-1 border-2 rounded-full font-semibold text-base tracking-wider ${
                        statusColors[contest.status] ||
                        "text-gray-400 border-gray-400"
                      }`}
                    >
                      {contest.status}
                    </div>
                  </div>
                  <div className="absolute right-6 top-6">
                    {contest.status === "Ongoing" && (
                      <span className="animate-pulse text-pink-400 font-bold text-xs">
                        LIVE
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {!loading && contests.length === 0 && !error && (
            <div className="text-center text-cyan-400 text-xl mt-16">
              No contests found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContestListPage;
