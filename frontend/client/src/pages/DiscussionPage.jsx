import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../components/AuthContext";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { gsap } from "gsap";

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
        <radialGradient id="neon-glow-discussions" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00fff7" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#00fff7" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="720" cy="100" rx="700" ry="60" fill="url(#neon-glow-discussions)" />
    </svg>
  );
}

export default function DiscussionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    type: searchParams.get("type") || "all",
    problem: searchParams.get("problem") || "",
    contest: searchParams.get("contest") || "",
    group: searchParams.get("group") || "",
  });
  const listRef = React.useRef(null);

  const ITEMS_PER_PAGE = 20;

  // Thread types matching VJudge style
  const threadTypes = [
    { value: "all", label: "All Discussions" },
    { value: "problem", label: "Problem Discussions" },
    { value: "contest", label: "Contest Discussions" },
    { value: "group", label: "Group Discussions" },
    { value: "announcement", label: "Announcements" },
    { value: "general", label: "General" },
  ];

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("discussion_thread")
        .select(
          `
          *,
          creator:created_by(
            id,
            username
          ),
          posts:discussion_post(count)
        `,
          { count: "exact" }
        )
        .order("created_at", { ascending: false });

      // Apply basic filters
      if (filters.type !== "all") {
        query = query.eq("thread_type", filters.type);
      }

      // Handle tabs
      if (activeTab === "my" && user?.id) {
        query = query.eq("created_by", user.id);
      }

      // Add pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      setThreads(data || []);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
      setError(null);
    } catch (err) {
      console.error("Error fetching threads:", err);
      setError("Failed to load discussions");
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, filters, user?.id, ITEMS_PER_PAGE]);

  // Effect for fetching threads when filters/page change
  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  // Effect for polling discussions
  useEffect(() => {
    // Set up polling for discussions
    const pollInterval = setInterval(() => {
      fetchThreads();
    }, 15000); // Poll every 15 seconds

    return () => clearInterval(pollInterval);
  }, [fetchThreads]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchParams({ ...Object.fromEntries(searchParams), tab });
  };

  const handleFilterChange = (type, value) => {
    setFilters((prev) => ({ ...prev, [type]: value }));
    setCurrentPage(1);
    setSearchParams({ ...Object.fromEntries(searchParams), [type]: value });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    if (listRef.current && threads.length > 0) {
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
      const items = listRef.current.querySelectorAll(".discussion-card-animate");
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
  }, [threads]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="relative z-10">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-cyan-300">
              Discussions
            </h1>
            <Link
              to="/discussions/new"
              className="relative overflow-hidden px-6 py-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-cyan-500/0 hover:from-cyan-500/40 hover:to-cyan-500/10 border border-cyan-500/50 text-cyan-300 transition-all duration-300 group"
            >
              <span className="relative z-10">New Discussion</span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          </div>
          <NeonGlowSVG className="top-0 left-0" />

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-4">
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange("type", e.target.value)}
            className="bg-gray-800/50 text-cyan-300 border border-cyan-500/30 rounded-lg px-4 py-2 backdrop-blur-xl hover:border-cyan-500/50 transition-colors duration-300"
          >
            {threadTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 border-b border-cyan-500/20">
          <button
            onClick={() => handleTabChange("all")}
            className={`py-2 px-4 transition-all duration-300 ${
              activeTab === "all"
                ? "text-cyan-300 border-b-2 border-cyan-500"
                : "text-cyan-300/50 hover:text-cyan-300 hover:border-b-2 hover:border-cyan-500/50"
            }`}
          >
            All
          </button>
          {user && (
            <>
              <button
                onClick={() => handleTabChange("my")}
                className={`py-2 px-4 transition-all duration-300 ${
                  activeTab === "my"
                    ? "text-cyan-300 border-b-2 border-cyan-500"
                    : "text-cyan-300/50 hover:text-cyan-300 hover:border-b-2 hover:border-cyan-500/50"
                }`}
              >
                My Threads
              </button>
              <button
                onClick={() => handleTabChange("participated")}
                className={`py-2 px-4 transition-all duration-300 ${
                  activeTab === "participated"
                    ? "text-cyan-300 border-b-2 border-cyan-500"
                    : "text-cyan-300/50 hover:text-cyan-300 hover:border-b-2 hover:border-cyan-500/50"
                }`}
              >
                Participated
              </button>
            </>
          )}
          {/* Unanswered tab removed */}
        </div>
      </div>

      {/* Discussion list */}
      <div ref={listRef} className="relative">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">{error}</div>
        ) : threads.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            No discussions found. Start a new discussion!
          </div>
        ) : (
          <div className="space-y-4">
            {threads.map((thread) => (
              <motion.div
                key={thread.dissthread_id}
                className="discussion-card-animate relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-gray-900 to-gray-800/50 rounded-xl border border-cyan-500/10 p-4 cursor-pointer hover:border-cyan-500/30 transition-all duration-300 group"
                onClick={() => navigate("/discussions/" + thread.dissthread_id)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-white mb-2">
                      {thread.title}
                    </h3>
                    <div className="text-sm text-cyan-300/70">
                      Started by{" "}
                      <span className="text-cyan-300">{thread.creator?.username || "Unknown"}</span> •{" "}
                      {format(new Date(thread.created_at), "MMM d, yyyy")} •{" "}
                      <span className="text-cyan-300">{thread.posts.count}</span> replies
                    </div>
                  </div>
                  <div className="text-sm px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    {thread.thread_type}
                  </div>
                </div>
              </motion.div>
            ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-6">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              onClick={() => handlePageChange(i + 1)}
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                currentPage === i + 1
                  ? "bg-gradient-to-r from-cyan-500/20 to-cyan-500/0 text-cyan-300 border border-cyan-500/50"
                  : "bg-gray-800/50 text-cyan-300/70 border border-cyan-500/20 hover:border-cyan-500/40 hover:text-cyan-300"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
