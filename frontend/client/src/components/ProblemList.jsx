// frontend/client/src/components/ProblemList.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const JUDGES = [
  { id: "",  name: "All" },
  { id: "1", name: "Codeforces" },
  { id: "2", name: "AtCoder"   },
  { id: "3", name: "SPOJ"      },
  { id: 4,  name: "CodeChef"  },
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

      {/* Problem List */}      <div className="max-w-4xl mx-auto bg-sybil-panel text-sybil-text rounded-2xl p-6 shadow-sybil-glow">
        <h2 className="text-2xl font-bold text-sybil-accent mb-4">
          Problem Archive ({total} problems)
        </h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sybil-accent"></div>
            <p className="mt-4 text-sybil-text/70">Loading problems...</p>
          </div>
        ) : !problems.length ? (
          <p className="text-center text-sybil-text/70 py-8">No problems found.</p>
        ) : (
          <div className="divide-y divide-sybil-accent/30">
            {problems.map((p) => (
              <div key={p.external_id} className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Link
                      to={`/problem/${p.external_id}`}
                      className="text-xl font-semibold text-sybil-accent hover:underline"
                    >
                      {p.title}
                    </Link>
                    
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="px-2 py-1 text-sm bg-sybil-bg text-sybil-text rounded">
                        {p.source_name}
                      </span>
                      {p.difficulty && (
                        <span className="px-2 py-1 text-sm bg-sybil-bg text-sybil-text rounded">
                          Rating: {p.difficulty}
                        </span>
                      )}
                      <span className="px-2 py-1 text-sm bg-sybil-bg text-sybil-text rounded">
                        Time: {p.time_limit / 1000}s
                      </span>
                      <span className="px-2 py-1 text-sm bg-sybil-bg text-sybil-text rounded">
                        Memory: {p.mem_limit / 1024}MB
                      </span>
                    </div>

                    {p.tags && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {p.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-xs bg-sybil-accent/10 text-sybil-accent rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/problem/${p.external_id}`}
                    className="ml-4 px-4 py-2 bg-sybil-accent text-sybil-panel rounded-lg hover:shadow-sybil-glow transition"
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
            className="px-4 py-2 bg-sybil-panel text-sybil-accent rounded-lg hover:bg-sybil-accent/10 transition disabled:opacity-50"
          >
            ← Previous
          </button>
          
          <span className="text-sybil-text">
            Page {page} of {lastPage}
          </span>
          
          <button
            onClick={() => setPage(Math.min(lastPage, page + 1))}
            disabled={page === lastPage || loading}
            className="px-4 py-2 bg-sybil-panel text-sybil-accent rounded-lg hover:bg-sybil-accent/10 transition disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
