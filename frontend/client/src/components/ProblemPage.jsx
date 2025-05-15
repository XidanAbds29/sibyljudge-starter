import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function ProblemPage() {
  const { external_id } = useParams();
  const [problem, setProblem] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/problems/${external_id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Problem not found");
        return res.json();
      })
      .then((data) => {
        setProblem(data);
        setError(null);
      })
      .catch((err) => {
        console.error("❌ Failed to fetch problem:", err);
        setError("Problem not found.");
        setProblem(null);
      });
  }, [external_id]);

  if (error) {
    return <div className="text-center text-red-500 p-10 text-xl">{error}</div>;
  }

  if (!problem) {
    return (
      <div className="text-center text-sybil-text p-10">Loading problem...</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-sybil-panel text-sybil-text rounded-2xl shadow-lg p-8 mt-10">
      <h1 className="text-3xl font-bold text-sybil-accent mb-4">
        {problem.title}
      </h1>
      <p className="mb-6 text-sm text-gray-400">
        Difficulty: {problem.difficulty || "Unrated"} <br />
        Time Limit: {problem.time_limit || "N/A"} ms | Memory Limit:{" "}
        {problem.mem_limit || "N/A"} KB
      </p>

      {/* Render HTML from statement_html */}
      <div
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{
          __html: problem.statement_html || "<p>No statement available.</p>",
        }}
      />
    </div>
  );
}

export default ProblemPage;
