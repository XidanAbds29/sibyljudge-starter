import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { discussionService } from "../services/discussionService";
import { format } from "date-fns";

export default function DiscussionListPage() {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    type: "",
    search: "",
    sort: "latest",
  });

  // Fetch discussions
  const fetchDiscussions = async () => {
    try {
      setLoading(true);
      const response = await discussionService.getThreads({
        page,
        limit: 10,
        ...filters,
      });
      setDiscussions(response.threads);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError(err.message || "Failed to load discussions");
    } finally {
      setLoading(false);
    }
  };

  // Fetch when page or filters change
  useEffect(() => {
    fetchDiscussions();
  }, [page, filters]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filters change
  };

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Discussions</h1>
        <Link
          to="/discussions/new"
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded"
        >
          New Discussion
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={filters.type}
          onChange={(e) => handleFilterChange("type", e.target.value)}
          className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-2"
        >
          <option value="">All Types</option>
          <option value="general">General</option>
          <option value="problem">Problem</option>
          <option value="contest">Contest</option>
          <option value="group">Group</option>
        </select>

        <select
          value={filters.sort}
          onChange={(e) => handleFilterChange("sort", e.target.value)}
          className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-2"
        >
          <option value="latest">Latest</option>
          <option value="most_viewed">Most Viewed</option>
          <option value="most_active">Most Active</option>
        </select>

        <input
          type="text"
          value={filters.search}
          onChange={(e) => handleFilterChange("search", e.target.value)}
          placeholder="Search discussions..."
          className="flex-1 bg-gray-700 text-white border border-gray-600 rounded px-3 py-2"
        />
      </div>

      {/* Discussion List */}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="space-y-4">
          {discussions.map((discussion) => (
            <Link
              key={discussion.dissthread_id}
              to={`/discussions/${discussion.dissthread_id}`}
              className="block bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl text-white font-semibold mb-2">
                    {discussion.title}
                  </h3>
                  <div className="text-gray-400 text-sm">
                    Started by {discussion.creator.username} ·{" "}
                    {format(new Date(discussion.created_at), "MMM d, yyyy")}
                  </div>
                </div>
                <div className="text-right text-sm text-gray-400">
                  <div>{discussion.post_count} posts</div>
                  <div>{discussion.view_count} views</div>
                </div>
              </div>

              {discussion.latest_post && (
                <div className="mt-4 pt-4 border-t border-gray-700 text-sm text-gray-400">
                  Latest by {discussion.latest_post.author.username} ·{" "}
                  {format(
                    new Date(discussion.latest_post.posted_at),
                    "MMM d, yyyy"
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-white">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
