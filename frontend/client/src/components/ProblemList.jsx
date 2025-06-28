// frontend/client/src/components/ProblemList.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import ReactDOM from "react-dom";
import { gsap } from "gsap";

const JUDGES = [
  { id: "", name: "All" },
  { id: "1", name: "Codeforces" },
  { id: "2", name: "AtCoder" },
  { id: "3", name: "SPOJ" },
  { id: "4", name: "CodeChef" },
];

const DIFFICULTIES = [
  "",
  "800",
  "1000",
  "1200",
  "1400",
  "1600",
  "1800",
  "2000",
  "2200",
  "2400",
  "2600",
  "2800",
  "3000",
]; // Example

export default function ProblemList() {
  const [problems, setProblems] = useState([]);
  const [total, setTotal] = useState(0);
  const [judgeId, setJudgeId] = useState("");
  const [limit] = useState(10); // Fixed page size
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [difficulty, setDifficulty] = useState("");
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const tagDropdownRef = useRef();
  const listRef = useRef();

  // Fetch tags for filter dropdown
  useEffect(() => {
    fetch("/api/problems/tags")
      .then((res) => res.json())
      .then((data) => setTags(data || []));
  }, []);

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const params = new URLSearchParams({
        judgeId,
        limit,
        page,
        difficulty,
      });
      // Add all selected tags as tags[]
      selectedTags.forEach((tag) => params.append("tags", tag));
      const res = await fetch(`/api/problems?${params.toString()}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const { problems, total } = await res.json();
      setProblems(
        (problems || []).map((p) => ({
          ...p,
          tags:
            (p.Problem_tag || []).map((pt) => pt.Tag?.name).filter(Boolean) ||
            [],
        }))
      );
      setTotal(total || 0);
    } catch (err) {
      console.error("ProblemList: Failed to fetch from API:", err);
      setErrorMsg(`Failed to fetch problems: ${err.message}.`);
      setProblems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [judgeId, limit, page, selectedTags, difficulty]);

  useEffect(() => {
    setPage(1);
  }, [judgeId, limit, selectedTags, difficulty]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const lastPage = Math.ceil(total / limit) || 1;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      // If click is inside dropdown or button, do not close
      if (
        tagDropdownRef.current &&
        (tagDropdownRef.current.contains(e.target) ||
          document.getElementById("tag-dropdown-portal")?.contains(e.target))
      ) {
        return;
      }
      setTagDropdownOpen(false);
    }
    if (tagDropdownOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [tagDropdownOpen]);

  // Animate list on mount and problems change
  useEffect(() => {
    if (listRef.current) {
      gsap.fromTo(
        listRef.current,
        { opacity: 0, y: 40, filter: "blur(10px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1.1,
          ease: "power4.out",
        }
      );
      const items = listRef.current.querySelectorAll(".problem-card-animate");
      gsap.fromTo(
        items,
        { opacity: 0, y: 30, scale: 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          stagger: 0.08,
          ease: "power3.out",
          delay: 0.2,
        }
      );
    }
  }, [problems]);

  return (
    <div
      ref={listRef}
      className="p-4 sm:p-6 min-h-screen bg-gray-950 text-gray-200"
    >
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
        <div className="relative" ref={tagDropdownRef}>
          <label className="block mb-1 text-sm text-gray-400 font-medium">
            Tags
          </label>
          <button
            type="button"
            className={`w-full min-w-[160px] flex flex-wrap items-center gap-1 px-3 py-2 bg-gray-800 text-gray-200 rounded-lg border-2 border-cyan-600 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 shadow-md ${
              tagDropdownOpen ? "ring-2 ring-cyan-400 border-cyan-400" : ""
            }`}
            onClick={() => setTagDropdownOpen((v) => !v)}
            style={{ minHeight: "2.5rem" }}
          >
            {selectedTags.length === 0 ? (
              <span className="text-gray-400">
                {tags.length === 0 ? "No tags available" : "Select tags…"}
              </span>
            ) : (
              selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center bg-cyan-700/30 text-cyan-200 px-2 py-0.5 rounded-full text-xs font-medium mr-1 mb-1"
                >
                  {tag}
                  <button
                    type="button"
                    className="ml-1 text-cyan-300 hover:text-pink-400 focus:outline-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTags(selectedTags.filter((t) => t !== tag));
                    }}
                    aria-label={`Remove ${tag}`}
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </span>
              ))
            )}
            <svg
              className={`ml-auto w-4 h-4 text-cyan-400 transition-transform ${
                tagDropdownOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {tagDropdownOpen &&
            ReactDOM.createPortal(
              <div
                id="tag-dropdown-portal"
                className="fixed inset-0 z-[1200]"
                style={{ pointerEvents: "none" }}
              >
                <div
                  className="absolute z-[1201] bg-gray-900 border border-cyan-700/60 rounded-xl shadow-2xl p-3 flex flex-col gap-2"
                  style={{
                    left:
                      tagDropdownRef.current?.getBoundingClientRect().left +
                      window.scrollX,
                    top:
                      tagDropdownRef.current?.getBoundingClientRect().bottom +
                      window.scrollY +
                      4,
                    minWidth: 320,
                    maxWidth: 600,
                    pointerEvents: "auto", // allow interaction
                    backgroundColor: "#0f172a",
                    opacity: 1,
                  }}
                >
                  {tags.length === 0 ? (
                    <div className="text-gray-400 text-center py-4">
                      No tags available.
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="Search tags…"
                        value={tagSearch}
                        onChange={(e) => setTagSearch(e.target.value)}
                        className="w-full mb-2 px-2 py-1.5 bg-gray-800 text-gray-200 rounded border border-gray-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                      />
                      <div className="flex flex-row flex-wrap gap-2 max-h-32 overflow-y-auto w-full">
                        {tags.filter((tag) =>
                          tag.toLowerCase().includes(tagSearch.toLowerCase())
                        ).length === 0 ? (
                          <span className="text-gray-400 text-xs px-2 py-2">
                            No tags found.
                          </span>
                        ) : (
                          tags
                            .filter((tag) =>
                              tag
                                .toLowerCase()
                                .includes(tagSearch.toLowerCase())
                            )
                            .map((tag) => (
                              <label
                                key={tag}
                                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-cyan-800/20 cursor-pointer bg-gray-800/80 border border-cyan-700/30 text-cyan-200 text-xs font-medium mb-1"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedTags.includes(tag)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedTags([...selectedTags, tag]);
                                    } else {
                                      setSelectedTags(
                                        selectedTags.filter((t) => t !== tag)
                                      );
                                    }
                                  }}
                                  className="accent-cyan-500 w-4 h-4 rounded"
                                />
                                <span>{tag}</span>
                              </label>
                            ))
                        )}
                      </div>
                      {selectedTags.length > 0 && (
                        <button
                          type="button"
                          className="mt-3 w-full py-1.5 bg-pink-600 hover:bg-pink-500 text-white rounded font-semibold text-sm transition"
                          onClick={() => setSelectedTags([])}
                        >
                          Clear All
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>,
              document.body
            )}
        </div>
        <div>
          <label
            htmlFor="difficultySelect"
            className="block mb-1 text-sm text-gray-400 font-medium"
          >
            Difficulty
          </label>
          <select
            id="difficultySelect"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="p-2.5 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
          >
            <option value="">All</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d || "All"}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => {
            setPage(1);
            fetchProblems();
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
          <p>
            <strong className="font-semibold">Error:</strong> {errorMsg}
          </p>
        </div>
      )}

      {/* Problem List */}
      <div className="max-w-4xl mx-auto bg-gray-900/80 backdrop-blur-sm rounded-lg p-6 shadow-xl border border-cyan-700/40">
        <h2
          className="text-2xl font-bold text-cyan-400 mb-6 pb-2 border-b-2 border-cyan-700/50"
          style={{ textShadow: "0 0 8px rgba(0, 255, 255, 0.5)" }}
        >
          Problem Archive{" "}
          <span className="text-gray-400 text-lg">({total} problems)</span>
        </h2>
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-400"></div>
            <p className="mt-4 text-gray-400">Loading problems...</p>
          </div>
        ) : !problems.length ? (
          <p className="text-center text-gray-400 py-10 text-lg">
            {total > 0 && page > 1
              ? "No problems on this page."
              : "No problems found matching your criteria."}
          </p>
        ) : (
          <div className="divide-y divide-gray-700/70">
            {problems.map((p) => (
              <div
                key={p.external_id || p.problem_id}
                className="py-5 group problem-card-animate relative transition-all duration-300 hover:scale-[1.025] hover:z-10"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-80 transition-all duration-300 z-0">
                  <NeonGlowSVG
                    className="w-full h-full"
                    style={{ opacity: 0.5 }}
                  />
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between relative z-10">
                  <div className="flex-1 min-w-0 mb-3 sm:mb-0">
                    <Link
                      to={`/problem/${p.external_id}`}
                      className="text-xl font-semibold text-cyan-400 hover:text-sky-300 transition-colors duration-300 block group-hover:tracking-wide"
                      title={p.title}
                    >
                      {p.title}
                    </Link>
                    <div className="mt-2.5 flex flex-wrap gap-2 items-center">
                      <span className="px-2.5 py-1 text-xs font-medium bg-gray-800 text-gray-300 rounded-full border border-gray-700">
                        {p.source_name}
                      </span>
                      {p.difficulty && (
                        <span className="px-2.5 py-1 text-xs font-medium bg-pink-700/30 text-pink-300 rounded-full border border-pink-600/50">
                          Rating: {p.difficulty}
                        </span>
                      )}
                      <span className="px-2.5 py-1 text-xs font-medium bg-gray-800 text-gray-300 rounded-full border border-gray-700">
                        Time: {p.time_limit / 1000}s
                      </span>
                      <span className="px-2.5 py-1 text-xs font-medium bg-gray-800 text-gray-300 rounded-full border border-gray-700">
                        Memory: {p.mem_limit / 1024}MB
                      </span>
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
        {total > 0 && (
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

      {/* Neon SVG Glow Component */}
      <NeonGlowSVG
        className="top-0 left-0 w-full h-40"
        style={{ opacity: 0.18 }}
      />
    </div>
  );
}

// Neon SVG Glow Component
function NeonGlowSVG({ className = "", style = {}, ...props }) {
  return (
    <svg
      className={"absolute pointer-events-none z-0 " + className}
      style={style}
      width="100%"
      height="100%"
      viewBox="0 0 1440 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      {...props}
    >
      <defs>
        <radialGradient id="neon-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00fff7" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#00fff7" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="720" cy="100" rx="700" ry="60" fill="url(#neon-glow)" />
    </svg>
  );
}
