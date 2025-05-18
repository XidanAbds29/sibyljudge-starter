// frontend/client/src/components/ProblemList.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const JUDGES = [
  { id: "", name: "All" },
  { id: 1,  name: "Codeforces" },
  { id: 2,  name: "AtCoder"   },
  { id: 3,  name: "SPOJ"      },
];

export default function ProblemList() {
  const [problems, setProblems] = useState([]);
  const [judgeId, setJudgeId]     = useState("");
  const [limit, setLimit]         = useState(10);
  const [loading, setLoading]     = useState(false);

  const fetchProblems = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (judgeId) params.append("judgeId", judgeId);
    if (limit)   params.append("limit", limit);

    fetch(`/api/problems?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log("Fetched problems:", data);
        setProblems(data);
      })
      .catch((err) => console.error("Failed to fetch problems:", err))
      .finally(() => setLoading(false));
  };

  useEffect(fetchProblems, []);

  return (
    <div className="p-6 font-sans">
      {/* Controls */}
      <div className="max-w-4xl mx-auto mb-6 p-4 bg-sybil-panel text-sybil-text flex gap-4 items-end rounded-lg">
        <div>
          <label className="block mb-1 text-sm">Source</label>
          <select
            value={judgeId}
            onChange={(e) => setJudgeId(e.target.value)}
            className="p-2 border rounded bg-sybil-bg text-sybil-text"
          >
            {JUDGES.map((j) => (
              <option key={j.id} value={j.id}>
                {j.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 text-sm">Limit</label>
          <input
            type="number"
            min={1}
            max={100}
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            className="p-2 w-24 border rounded bg-sybil-bg text-sybil-text"
          />
        </div>

        <button
          onClick={fetchProblems}
          disabled={loading}
          className="px-4 py-2 bg-sybil-accent text-sybil-panel rounded hover:bg-sybil-accent-dark transition"
        >
          {loading ? "Loading…" : "Fetch"}
        </button>
      </div>

      {/* Problem List */}
      <div className="bg-sybil-panel text-sybil-text rounded-2xl shadow-lg p-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-sybil-accent mb-4 tracking-wide">
          Problem Archive
        </h2>

        {problems.length === 0 ? (
          <p className="text-center opacity-75">No problems found.</p>
        ) : (
          <ul className="space-y-3">
            {problems.map((p) => (
              <li key={`${p.source_name}-${p.external_id}`}>
                <Link
                  to={`/problem/${p.external_id}`}
                  className="block p-4 border border-sybil-accent rounded-xl transition hover:bg-sybil-accent hover:text-sybil-panel hover:shadow-sybil-glow"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">{p.title}</span>
                    <span className="text-sm italic text-gray-400">
                      {p.source_name}
                    </span>
                  </div>
                  <div className="mt-2 text-sm opacity-75">
                    Difficulty: {p.difficulty || "Unrated"}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
