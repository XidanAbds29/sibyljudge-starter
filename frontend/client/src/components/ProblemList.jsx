// frontend/client/src/components/ProblemList.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
// No longer create client here: import { createClient } from "@supabase/supabase-js";
// Ensure this path is correct based on where you saved AuthContext.jsx
import { useAuth } from "./AuthContext"; // Or ../contexts/AuthContext if you moved it

const JUDGES = [
  { id: "", name: "All" },
  { id: "1", name: "Codeforces" },
  { id: "2", name: "AtCoder" },
  { id: "3", name: "SPOJ" },
  { id: "4", name: "CodeChef" },
];

export default function ProblemList() {
  const { supabase } = useAuth(); // Get Supabase client from AuthContext

  const [problems, setProblems] = useState([]);
  const [total, setTotal] = useState(0);
  const [judgeId, setJudgeId] = useState("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchProblems = useCallback(async () => {
    if (!supabase) {
      setErrorMsg("Supabase client not available from AuthContext. Check console for details.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      // 1. Fetch the total count
      let countQuery = supabase
        .from("Problem")
        .select("*", { count: "exact", head: true });

      if (judgeId && judgeId !== "") {
        countQuery = countQuery.eq("source_oj_id", parseInt(judgeId, 10));
      }

      const { count, error: countError } = await countQuery;
      if (countError) throw countError;
      setTotal(count || 0);

      // 2. Fetch page data
      if (count > 0 || (page === 1 && count === 0) ) { // Fetch if count > 0, or if it's page 1 (to show "No problems found")
        let dataQuery = supabase
          .from("Problem")
          .select(
            `
            problem_id,
            external_id,
            title,
            difficulty,
            time_limit,
            mem_limit,
            statement_html,
            input_spec,
            output_spec,
            samples,
            url,
            source_oj_id,
            Online_judge(name),
            Problem_tag(Tag(name))
          `
          )
          .order("problem_id", { ascending: false })
          .range((page - 1) * limit, page * limit - 1);

        if (judgeId && judgeId !== "") {
          dataQuery = dataQuery.eq("source_oj_id", parseInt(judgeId, 10));
        }

        const { data, error: dataError } = await dataQuery;
        if (dataError) throw dataError;

        const formatted = (data || []).map((p) => ({
          ...p,
          source_name: p.Online_judge ? p.Online_judge.name : "N/A",
          tags: (p.Problem_tag || [])
            .map((pt) => pt.Tag && pt.Tag.name)
            .filter(Boolean), // filter(Boolean) removes any null/undefined tag names
        }));

        setProblems(formatted);
      } else {
        setProblems([]);
      }
    } catch (err) {
      console.error("ProblemList: Failed to fetch from Supabase:", err);
      setErrorMsg(
        `Failed to fetch problems: ${err.message}.` // Simplified error message
      );
      setProblems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [supabase, judgeId, limit, page]); // Added supabase to dependency array

  useEffect(() => {
    setPage(1); // Reset to page 1 when filters (judgeId or limit) change
  }, [judgeId, limit]);

  useEffect(() => {
    fetchProblems(); // Refetch when fetchProblems useCallback itself changes (due to page, judgeId, limit, supabase)
  }, [fetchProblems]);

  const lastPage = Math.ceil(total / limit) || 1;

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-gray-950 text-gray-200">
      <div className="max-w-4xl mx-auto mb-6 p-4 bg-gray-900/80 backdrop-blur-sm flex flex-wrap gap-4 items-end rounded-lg shadow-xl border border-cyan-700/40">
        {/* Filters and Refresh Button */}
        <div>
          <label
            htmlFor="judgeSelect"
            className="block mb-1 text-sm text-gray-400 font-medium"
          >
            Source Judge
          </label>
          <select
            id="judgeSelect"
            value={judgeId}
            onChange={(e) => setJudgeId(e.target.value)}
            className="p-2.5 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
          >
            {JUDGES.map((j) => (
              <option key={j.id} value={j.id}>
                {j.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="limitInput"
            className="block mb-1 text-sm text-gray-400 font-medium"
          >
            Problems/Page
          </label>
          <input
            id="limitInput"
            type="number"
            min={5}
            max={50}
            step={5}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="p-2.5 w-24 text-center bg-gray-800 text-gray-200 rounded-lg border border-gray-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
          />
        </div>
        <button
          onClick={() => {
            setPage(1); // Reset to page 1 before fetching
            fetchProblems(); // Explicitly call fetchProblems
          }}
          disabled={loading}
          className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-sky-600 text-white font-semibold rounded-lg hover:from-cyan-400 hover:to-sky-500 focus:ring-4 focus:ring-cyan-500/50 focus:outline-none transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-cyan-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Loading…" : "Refresh List"}
        </button>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="max-w-4xl mx-auto my-4 p-4 bg-red-900/60 text-red-200 rounded-lg border border-red-700 shadow-lg">
          <p><strong className="font-semibold">Error:</strong> {errorMsg}</p>
        </div>
      )}

      {/* Problem List */}
      <div className="max-w-4xl mx-auto bg-gray-900/80 backdrop-blur-sm rounded-lg p-6 shadow-xl border border-cyan-700/40">
        <h2 className="text-2xl font-bold text-cyan-400 mb-6 pb-2 border-b-2 border-cyan-700/50" style={{ textShadow: '0 0 8px rgba(0, 255, 255, 0.5)'}}>
          Problem Archive <span className="text-gray-400 text-lg">({total} problems)</span>
        </h2>
        {loading ? (
          <div className="text-center py-10"><div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-400"></div><p className="mt-4 text-gray-400">Loading problems...</p></div>
        ) : !problems.length ? (
          <p className="text-center text-gray-400 py-10 text-lg">
            {total > 0 && page > 1
              ? "No problems on this page."
              : "No problems found matching your criteria."}
          </p>
        ) : (
          <div className="divide-y divide-gray-700/70">
            {problems.map((p) => (
              <div key={p.external_id || p.problem_id} className="py-5 group">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                  <div className="flex-1 min-w-0 mb-3 sm:mb-0">
                    <Link
                      to={`/problem/${p.external_id}`}
                      className="text-xl font-semibold text-cyan-400 hover:text-sky-300 transition-colors duration-300 block group-hover:tracking-wide" 
                      title={p.title}
                    >
                      {p.title}
                    </Link>
                    <div className="mt-2.5 flex flex-wrap gap-2 items-center">
                      <span className="px-2.5 py-1 text-xs font-medium bg-gray-800 text-gray-300 rounded-full border border-gray-700">{p.source_name}</span>
                      {p.difficulty && (
                        <span className="px-2.5 py-1 text-xs font-medium bg-pink-700/30 text-pink-300 rounded-full border border-pink-600/50">
                          Rating: {p.difficulty}
                        </span>
                      )}
                      <span className="px-2.5 py-1 text-xs font-medium bg-gray-800 text-gray-300 rounded-full border border-gray-700">Time: {p.time_limit / 1000}s</span>
                      <span className="px-2.5 py-1 text-xs font-medium bg-gray-800 text-gray-300 rounded-full border border-gray-700">Memory: {p.mem_limit / 1024}MB</span>
                    </div>
                    {p.tags?.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {p.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-xs bg-sky-800/40 text-sky-300 rounded-full border border-sky-700/60"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Link
                    to={`/problem/${p.external_id}`}
                    className="ml-0 sm:ml-4 flex-shrink-0 px-4 py-2 bg-cyan-600 text-gray-950 font-semibold rounded-lg hover:bg-cyan-500 transition-all duration-300 shadow hover:shadow-md hover:shadow-cyan-500/30 text-sm"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        { total > 0 && ( 
            <div className="mt-8 flex justify-between items-center pt-4 border-t border-gray-700/70">
                <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1 || loading}
                    className="px-4 py-2 bg-gray-800 text-cyan-400 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                    ← Previous
                </button>
                <span className="text-gray-400 font-medium">
                    Page {page} of {lastPage}
                </span>
                <button
                    onClick={() => setPage(Math.min(lastPage, page + 1))}
                    disabled={page === lastPage || loading}
                    className="px-4 py-2 bg-gray-800 text-cyan-400 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                    Next →
                </button>
            </div>
        )}
      </div>
    </div>
  );
}
