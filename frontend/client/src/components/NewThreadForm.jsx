import React, { useState } from "react";
// import { supabase } from "../lib/supabaseClient";

const NewThreadForm = ({ onThreadCreated }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // TODO: Replace with actual user id from auth context
    const user_id = window.localStorage.getItem("user_id") || "1";
    if (!user_id) {
      setError("You must be logged in to post.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/discussions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, title, content }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create thread");
      }
      setTitle("");
      setContent("");
      setError(null);
      if (onThreadCreated) onThreadCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gradient-to-br from-cyber-dark via-cyber-light to-cyan-900 p-6 rounded-xl shadow-2xl border-2 border-cyan-500/40 max-w-2xl mx-auto mt-6">
      <div className="mb-4">
        <input
          className="w-full p-3 rounded-lg bg-black text-cyan-300 placeholder-cyan-400 border-2 border-cyan-400 focus:outline-none focus:ring-2 focus:ring-pink-400 font-bold text-lg shadow-inner transition-all duration-200 hover:border-pink-400 hover:bg-cyber-light/80 focus:bg-black focus:text-cyan-300"
          type="text"
          placeholder="Thread Title (e.g. 'Why is this problem hard?')"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ color: '#22d3ee', background: '#000', caretColor: '#fff' }}
        />
      </div>
      <div className="mb-4">
        <textarea
          className="w-full p-3 rounded-lg bg-black text-cyan-300 placeholder-cyan-400 border-2 border-cyan-400 focus:outline-none focus:ring-2 focus:ring-pink-400 font-mono text-base shadow-inner min-h-[120px] transition-all duration-200 hover:border-pink-400 hover:bg-cyber-light/80 focus:bg-black focus:text-cyan-300"
          placeholder="Thread content (supports markdown and LaTeX)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          style={{ color: '#22d3ee', background: '#000', caretColor: '#fff' }}
        />
      </div>
      {error && <div className="text-red-400 mb-3 font-semibold animate-pulse">{error}</div>}
      <button
        type="submit"
        className="px-8 py-3 rounded-lg font-extrabold text-lg bg-gradient-to-r from-cyan-500 via-pink-400 to-sky-400 text-white shadow-lg hover:from-pink-400 hover:to-cyan-400 hover:scale-105 transition-all duration-300 flex items-center gap-2 mx-auto"
        disabled={loading}
      >
        {loading ? (
          <span className="animate-pulse flex items-center gap-2">
            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path d="M4 12a8 8 0 018-8" stroke="#fff" strokeWidth="4" strokeLinecap="round" /></svg>
            Posting...
          </span>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Create Thread
          </>
        )}
      </button>
    </form>
  );
};

export default NewThreadForm;