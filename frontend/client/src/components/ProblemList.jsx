// frontend/client/src/components/ProblemList.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const JUDGES = [
  { id: "",  name: "All" },
  { id: "1", name: "Codeforces" },
  { id: "2", name: "AtCoder"   },
  { id: "3", name: "SPOJ"      },
];

export default function ProblemList() {
  const [problems, setProblems] = useState([]);
  const [total, setTotal]       = useState(0);
  const [judgeId, setJudgeId]   = useState("");
  const [limit, setLimit]       = useState(10);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(false);

  const fetchProblems = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (judgeId) params.append("judgeId", judgeId);
    if (limit)   params.append("limit", limit);
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
    <div className="p-6 font-sans bg-sybil-bg min-h-screen">
      {/* Controls */}
      <div className="max-w-4xl mx-auto mb-6 p-4 bg-sybil-panel text-sybil-text flex gap-4 items-end rounded-lg shadow-sybil-glow">
        {/* Source */}
        <div>
          <label className="block mb-1 text-sm text-sybil-text/70">Source</label>
          <select
            value={judgeId}
            onChange={(e) => setJudgeId(e.target.value)}
            className="p-2 border-2 border-sybil-accent bg-sybil-bg text-sybil-text rounded-lg focus:ring-2 focus:ring-sybil-accent transition-shadow shadow-inner"
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
          <label className="block mb-1 text-sm text-sybil-text/70">Limit</label>
          <input
            type="number"
            min={1}
            max={100}
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            className="p-2 w-20 text-center border-2 border-sybil-accent bg-sybil-bg text-sybil-text rounded-lg focus:ring-2 focus:ring-sybil-accent transition-shadow shadow-inner"
          />
        </div>

        {/* Fetch */}
        <button
          onClick={() => setPage(1)}
          disabled={loading}
          className="px-4 py-2 bg-sybil-accent text-sybil-panel rounded-lg hover:bg-sybil-accent-dark transition-shadow shadow-sybil-glow disabled:opacity-50"
        >
          {loading ? "Loading…" : "Fetch"}
        </button>
      </div>

      {/* Problem List */}
      <div className="max-w-4xl mx-auto bg-sybil-panel text-sybil-text rounded-2xl p-6 shadow-sybil-glow">
        <h2 className="text-2xl font-bold text-sybil-accent mb-4">
          Problem Archive
        </h2>

        {loading ? (
          <p className="text-center text-sybil-text/70">Loading…</p>
        ) : problems.length === 0 ? (
          <p className="text-center text-sybil-text/70">No problems found.</p>
        ) : (
          <ul className="space-y-4">
            {problems.map((p) => (
              <li key={p.problem_id}>
                <Link
                  to={`/problem/${p.external_id}`}
                  className="block p-4 border-2 border-sybil-accent rounded-xl hover:bg-sybil-accent hover:text-sybil-panel transition"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">{p.title}</span>
                    <span className="text-sm italic text-gray-400">
                      {p.source_name}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-sybil-text/80">
                    Difficulty: {p.difficulty || "Unrated"}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Pagination */}
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-sybil-accent text-sybil-panel rounded disabled:opacity-50"
          >
            ← Previous
          </button>

          <span className="text-sm text-sybil-text/70">
            Page {page} of {lastPage}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
            disabled={page >= lastPage}
            className="px-4 py-2 bg-sybil-accent text-sybil-panel rounded disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
