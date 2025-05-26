// frontend/client/src/components/ProblemList.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const JUDGES = [
  { id: "", name: "All" },
  { id: "1", name: "Codeforces" },
  { id: "2", name: "AtCoder" },
  { id: "3", name: "SPOJ" },
  { id: 4, name: "CodeChef" },
];

export default function ProblemList() {
  const [problems, setProblems] = useState([]);
  const [total, setTotal] = useState(0);
  const [judgeId, setJudgeId] = useState("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchProblems = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (judgeId) params.append("judgeId", judgeId);
    if (limit) params.append("limit", limit);
    params.append("page", page);

    fetch(`/api/problems?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(({ problems, total }) => {
        setProblems(problems);
        setTotal(total);
      })
      .catch((err) => console.error("Failed to fetch problems:", err))
      .finally(() => setLoading(false));
  };

  // reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [judgeId, limit]);

  // refetch on filter/page change
  useEffect(fetchProblems, [judgeId, limit, page]);

  const lastPage = Math.ceil(total / limit) || 1;

  return (
    <div className="p-6 min-h-screen bg-gray-950">
      {/* Controls */}
      <div className="max-w-4xl mx-auto mb-6 p-4 bg-gray-900 flex gap-4 items-end rounded-lg shadow-lg border border-cyan-800">
        {/* Source */}
        <div>
          <label className="block mb-1 text-sm text-gray-400">Source</label>
          <select
            value={judgeId}
            onChange={(e) => setJudgeId(e.target.value)}
            className="p-2 bg-gray-800 text-gray-200 rounded-lg border border-cyan-700 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
          >
            {JUDGES.map((j) => (
              <option key={j.id} value={j.id}>
                {j.name}
              </option>
            ))}
          </select>
        </div>

        {/* Limit */}
        <div>
          <label className="block mb-1 text-sm text-gray-400">Limit</label>
          <input
            type="number"
            min={1}
            max={100}
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            className="p-2 w-20 text-center bg-gray-800 text-gray-200 rounded-lg border border-cyan-700 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Fetch */}
        <button
          onClick={() => setPage(1)}
          disabled={loading}
          className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,245,255,0.5)] disabled:opacity-50 disabled:hover:shadow-none"
        >
          {loading ? "Loading…" : "Fetch"}
        </button>
      </div>

      {/* Problem List */}
      <div className="max-w-4xl mx-auto bg-gray-900 rounded-lg p-6 shadow-lg border border-cyan-800">
        <h2 className="text-2xl font-bold text-cyan-400 mb-4 drop-shadow-[0_0_10px_rgba(0,245,255,0.3)]">
          Problem Archive ({total} problems)
        </h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
            <p className="mt-4 text-gray-400">Loading problems...</p>
          </div>
        ) : !problems.length ? (
          <p className="text-center text-gray-400 py-8">No problems found.</p>
        ) : (
          <div className="divide-y divide-cyan-800/30">
            {problems.map((p) => (
              <div key={p.external_id} className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Link
                      to={`/problem/${p.external_id}`}
                      className="text-xl font-semibold text-cyan-400 hover:text-cyan-300 transition-colors duration-300"
                    >
                      {p.title}
                    </Link>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="px-2 py-1 text-sm bg-gray-800 text-gray-300 rounded border border-cyan-900">
                        {p.source_name}
                      </span>
                      {p.difficulty && (
                        <span className="px-2 py-1 text-sm bg-gray-800 text-gray-300 rounded border border-cyan-900">
                          Rating: {p.difficulty}
                        </span>
                      )}
                      <span className="px-2 py-1 text-sm bg-gray-800 text-gray-300 rounded border border-cyan-900">
                        Time: {p.time_limit / 1000}s
                      </span>
                      <span className="px-2 py-1 text-sm bg-gray-800 text-gray-300 rounded border border-cyan-900">
                        Memory: {p.mem_limit / 1024}MB
                      </span>
                    </div>

                    {p.tags && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {p.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-xs bg-cyan-900/20 text-cyan-400 rounded-full border border-cyan-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/problem/${p.external_id}`}
                    className="ml-4 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,245,255,0.5)]"
                  >
                    Solve →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1 || loading}
            className="px-4 py-2 bg-gray-800 text-cyan-400 rounded-lg hover:bg-gray-700 transition-all duration-300 disabled:opacity-50 disabled:hover:bg-gray-800"
          >
            ← Previous
          </button>

          <span className="text-gray-300">
            Page {page} of {lastPage}
          </span>

          <button
            onClick={() => setPage(Math.min(lastPage, page + 1))}
            disabled={page === lastPage || loading}
            className="px-4 py-2 bg-gray-800 text-cyan-400 rounded-lg hover:bg-gray-700 transition-all duration-300 disabled:opacity-50 disabled:hover:bg-gray-800"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
