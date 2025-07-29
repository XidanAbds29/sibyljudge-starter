import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { format } from "date-fns";
import { discussionService } from "../services/discussionService";

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
      const { threads, total, page, totalPages } =
        await discussionService.getThreads({
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          type: filters.type,
          tab: activeTab,
          userId: activeTab === "my" ? user?.id : undefined,
          sort: "latest",
        });

      setThreads(threads || []);
      setTotalPages(totalPages);
      setError(null);
    } catch (err) {
      console.error("Error fetching threads:", err);
      setError(
        err.cause?.details || err.message || "Failed to load discussions"
      );
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, filters, user?.id, ITEMS_PER_PAGE]);

  // Effect for fetching threads and setting up polling
  useEffect(() => {
    // Initial fetch
    fetchThreads();

    // Set up polling interval (every 10 seconds)
    const interval = setInterval(() => {
      fetchThreads();
    }, 10000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
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

  return (
    <div className="min-h-screen">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-white">Discussions</h1>
          <Link
            to="/discussions/new"
            className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-md transition duration-300"
          >
            New Discussion
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-4">
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange("type", e.target.value)}
            className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-1"
          >
            {threadTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 border-b border-gray-700">
          <button
            onClick={() => handleTabChange("all")}
            className={`py-2 px-4 ${
              activeTab === "all"
                ? "text-cyan-400 border-b-2 border-cyan-400"
                : "text-gray-400 hover:text-cyan-400"
            }`}
          >
            All
          </button>
          {user && (
            <>
              <button
                onClick={() => handleTabChange("my")}
                className={`py-2 px-4 ${
                  activeTab === "my"
                    ? "text-cyan-400 border-b-2 border-cyan-400"
                    : "text-gray-400 hover:text-cyan-400"
                }`}
              >
                My Threads
              </button>
              <button
                onClick={() => handleTabChange("participated")}
                className={`py-2 px-4 ${
                  activeTab === "participated"
                    ? "text-cyan-400 border-b-2 border-cyan-400"
                    : "text-gray-400 hover:text-cyan-400"
                }`}
              >
                Participated
              </button>
            </>
          )}
          <button
            onClick={() => handleTabChange("unanswered")}
            className={`py-2 px-4 ${
              activeTab === "unanswered"
                ? "text-cyan-400 border-b-2 border-cyan-400"
                : "text-gray-400 hover:text-cyan-400"
            }`}
          >
            Unanswered
          </button>
        </div>
      </div>

      {/* Discussion list */}
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
            <div
              key={thread.dissthread_id}
              className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition duration-300 cursor-pointer"
              onClick={() => navigate("/discussions/" + thread.dissthread_id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {thread.title}
                  </h3>
                  <div className="text-sm text-gray-400">
                    Started by {thread.profiles?.username || "Unknown"} •{" "}
                    {format(new Date(thread.created_at), "MMM d, yyyy")} •{" "}
                    {thread.posts?.length || 0} replies
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-gray-400">
                    {thread.thread_type || "General"}
                  </div>
                  {thread.reference_id && (
                    <span className="px-2 py-1 text-xs bg-cyan-900/50 text-cyan-300 rounded-full">
                      Ref #{thread.reference_id}
                    </span>
                  )}
                </div>
              </div>
            </div>
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
              className={`px-3 py-1 rounded ${
                currentPage === i + 1
                  ? "bg-cyan-500 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
