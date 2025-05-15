import React, { useEffect, useState } from "react";

const ProblemList = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/problems");
        const data = await res.json();
        setProblems(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching problems:", err);
        setLoading(false);
      }
    };

    fetchProblems();
  }, []);

  if (loading)
    return <div className="text-center mt-8">Loading problems...</div>;

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4 bg-white shadow-xl rounded-xl">
      <h2 className="text-2xl font-semibold mb-4 text-center">
        Codeforces Problems
      </h2>
      <table className="w-full border border-gray-300 text-sm text-left">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border-b">#</th>
            <th className="p-2 border-b">Title</th>
            <th className="p-2 border-b">Difficulty</th>
            <th className="p-2 border-b">Time Limit</th>
            <th className="p-2 border-b">Memory</th>
          </tr>
        </thead>
        <tbody>
          {problems.map((p, i) => (
            <tr key={p.external_id} className="hover:bg-gray-50">
              <td className="p-2 border-b">{i + 1}</td>
              <td className="p-2 border-b text-blue-600 underline">
                <a href={p.url} target="_blank" rel="noopener noreferrer">
                  {p.title}
                </a>
              </td>
              <td className="p-2 border-b">{p.difficulty || "N/A"}</td>
              <td className="p-2 border-b">{p.time_limit} ms</td>
              <td className="p-2 border-b">
                {Math.round(p.mem_limit / 1024)} KB
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProblemList;
