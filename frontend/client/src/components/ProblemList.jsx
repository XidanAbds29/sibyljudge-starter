import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// For debugging - check if Vite is loading .env variables
console.log("VITE_SUPABASE_URL:", supabaseUrl);
console.log("VITE_SUPABASE_ANON_KEY:", supabaseKey ? "Loaded" : "NOT LOADED");

// Create Supabase client only if URL and Key are present
let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.error(
    "Supabase URL or Key is missing. Check your .env file and VITE_ prefix."
  );
}

const JUDGES = [
  { id: "", name: "All" },
  { id: "1", name: "Codeforces" },
  { id: "2", name: "AtCoder" },
  { id: "3", name: "SPOJ" },
  { id: "4", name: "CodeChef" },
];

export default function ProblemList() {
  const [problems, setProblems] = useState([]);
  const [total, setTotal] = useState(0);
  const [judgeId, setJudgeId] = useState("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchProblems = useCallback(async () => {
    if (!supabase) {
      setErrorMsg(
        "Supabase client not initialized. Check console for details."
      );
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

      if (judgeId) {
        countQuery = countQuery.eq("source_oj_id", parseInt(judgeId, 10));
      }

      const { count, error: countError } = await countQuery;
      if (countError) throw countError;
      setTotal(count || 0);

      // 2. Fetch page data
      if (count > 0 || (page === 1 && count === 0)) {
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

        if (judgeId) {
          dataQuery = dataQuery.eq("source_oj_id", parseInt(judgeId, 10));
        }

        const { data, error: dataError } = await dataQuery;
        if (dataError) throw dataError;

        const formatted = (data || []).map((p) => ({
          ...p,
          source_name: p.Online_judge ? p.Online_judge.name : "N/A",
          tags: (p.Problem_tag || [])
            .map((pt) => pt.Tag && pt.Tag.name)
            .filter(Boolean),
        }));

        setProblems(formatted);
      } else {
        setProblems([]);
      }
    } catch (err) {
      console.error("Failed to fetch from Supabase:", err);
      setErrorMsg(
        `Failed to fetch problems: ${err.message}. Check console for more details.`
      );
      setProblems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [judgeId, limit, page]);

  useEffect(() => {
    setPage(1);
  }, [judgeId, limit]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const lastPage = Math.ceil(total / limit) || 1;

  return (
    <div className="p-6 min-h-screen bg-gray-950 text-gray-200">
      <div className="max-w-4xl mx-auto mb-6 p-4 bg-gray-900 flex flex-wrap gap-4 items-end rounded-lg shadow-lg border border-cyan-800">
        {/* Filters and Refresh Button */}
        <div>
          <label
            htmlFor="judgeSelect"
            className="block mb-1 text-sm text-gray-400"
          >
            Source
          </label>
          <select
            id="judgeSelect"
            value={judgeId}
            onChange={(e) => setJudgeId(e.target.value)}
            className="p-2 bg-gray-800 text-gray-200 rounded-lg border border-cyan-700 focus:ring-2 focus:ring-cyan-500"
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
            className="block mb-1 text-sm text-gray-400"
          >
            Limit
          </label>
          <input
            id="limitInput"
            type="number"
            min={1}
            max={100}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="p-2 w-20 text-center bg-gray-800 text-gray-200 rounded-lg border border-cyan-700 focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        <button
          onClick={() => {
            setPage(1);
            fetchProblems();
          }}
          disabled={loading}
          className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-all duration-300 disabled:opacity-50"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="max-w-4xl mx-auto my-4 p-4 bg-red-900/50 text-red-300 rounded-lg border border-red-700">
          <p>Error: {errorMsg}</p>
        </div>
      )}

      {/* Problem List */}
      <div className="max-w-4xl mx-auto bg-gray-900 rounded-lg p-6 shadow-lg border border-cyan-800">
        <h2 className="text-2xl font-bold text-cyan-400 mb-4">
          Problem Archive ({total} problems)
        </h2>
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
            <p className="mt-4 text-gray-400">Loading problems...</p>
          </div>
        ) : !problems.length ? (
          <p className="text-center text-gray-400 py-8">
            {total > 0 && page > 1
              ? "No problems on this page."
              : "No problems found matching your criteria."}
          </p>
        ) : (
          <div className="divide-y divide-cyan-800/30">
            {problems.map((p) => (
              <div key={p.external_id || p.problem_id} className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/problem/${p.external_id}`}
                      className="text-xl font-semibold text-cyan-400 hover:text-cyan-300 truncate block"
                      title={p.title}
                      aria-label={`View ${p.title}`}
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
                    {p.tags?.length > 0 && (
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
    className="ml-4 flex-shrink-0 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-all duration-300"
>
  View Details →
</Link>

                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1 || loading}
            className="px-4 py-2 bg-gray-800 text-cyan-400 rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            ← Previous
          </button>
          <span className="text-gray-300">
            Page {page} of {lastPage}
          </span>
          <button
            onClick={() => setPage(Math.min(lastPage, page + 1))}
            disabled={page === lastPage || loading}
            className="px-4 py-2 bg-gray-800 text-cyan-400 rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
