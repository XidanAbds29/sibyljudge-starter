import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function ProblemList() {
  const [problems, setProblems] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/problems")
      .then((res) => res.json())
      .then((data) => setProblems(data))
      .catch((err) => console.error("Failed to fetch problems:", err));
  }, []);

  return (
    <div className="p-6 font-sans">
      <div className="bg-sybil-panel text-sybil-text rounded-2xl shadow-lg p-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-sybil-accent mb-4 tracking-wide">
          Problem Archive
        </h2>
        <ul className="space-y-3">
          {problems.map((p) => (
            <li key={p.external_id}>
              <Link
                to={`/problem/${p.external_id}`} // ✅ Use Link, not <a>
                className="block cursor-pointer p-3 border border-sybil-accent rounded-xl transition-all duration-200 hover:bg-sybil-accent hover:text-sybil-panel hover:shadow-sybil-glow"
              >
                <span className="block text-lg font-medium">{p.title}</span>
                <span className="text-sm opacity-75">
                  {p.difficulty || "Unrated"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default ProblemList;
