import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../components/AuthContext";
import MDEditor from "@uiw/react-md-editor";
import { motion } from "framer-motion";

export default function NewDiscussionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [discussion, setDiscussion] = useState({
    title: "",
    content: "",
    type: "general",
    referenceType: "",
    referenceId: "",
  });

  // Reset error when discussion changes
  useEffect(() => {
    setError(null);
  }, [discussion]);

  // Thread types matching VJudge style
  const threadTypes = [
    { value: "general", label: "General Discussion" },
    { value: "problem", label: "Problem Discussion" },
    { value: "contest", label: "Contest Discussion" },
    { value: "group", label: "Group Discussion" },
    { value: "announcement", label: "Announcement" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setError("You must be logged in to create a discussion.");
      return;
    }

    setLoading(true);
    try {
      // Basic validation
      if (!discussion.title.trim() || !discussion.content.trim()) {
        setError("Title and content are required.");
        return;
      }

      // Validate discussion type
      if (!threadTypes.some((type) => type.value === discussion.type)) {
        setError("Invalid discussion type selected.");
        return;
      }

      // Validate reference consistency
      if (discussion.referenceId && !discussion.referenceType) {
        setError("Reference type is required when a reference ID is provided.");
        return;
      }

      let threadData;

      // Create the discussion thread
      const { data: newThread, error: threadError } = await supabase
        .from("discussion_thread")
        .insert([
          {
            title: discussion.title.trim(),
            created_by: user.id,
            thread_type: discussion.type,
            problem_id: discussion.type === 'problem' ? parseInt(discussion.referenceId) : null,
            contest_id: discussion.type === 'contest' ? parseInt(discussion.referenceId) : null,
            group_id: discussion.type === 'group' ? parseInt(discussion.referenceId) : null,
          },
        ])
        .select(`
          *,
          related_problem:problem_id("Problem", title),
          related_contest:contest_id(name),
          related_group:group_id(name)
        `)
        .single();

      if (threadError) throw threadError;
      threadData = newThread;

      // Create the initial post with the content
      const { error: postError } = await supabase
        .from("discussion_post")
        .insert([
          {
            dissthread_id: threadData.dissthread_id,
            user_id: user.id,
            content: discussion.content.trim(),
          },
        ]);

      if (postError) throw postError;

      // Redirect to the new discussion thread
      navigate("/discussions/" + threadData.dissthread_id);
    } catch (err) {
      console.error("Error creating discussion:", err);
      setError(
        "Failed to create discussion. Please check your input and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-gray-900/80 rounded-xl p-8 shadow-lg border border-cyan-500/20">
          <h2 className="text-2xl font-bold text-cyan-300 mb-4">Sign In Required</h2>
          <p className="text-gray-400 mb-4">Please sign in to create a discussion.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800/80 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-32 pointer-events-none z-0">
        <svg width="100%" height="100%" viewBox="0 0 1440 200" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <ellipse cx="720" cy="100" rx="700" ry="60" fill="url(#neon-glow-discussions)" />
          <defs>
            <radialGradient id="neon-glow-discussions" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00fff7" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#00fff7" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>
      <div className="relative z-10 w-full max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="group-section-animate bg-gradient-to-br from-gray-900 to-gray-800/70 rounded-2xl border border-cyan-500/20 shadow-[0_0_40px_-15px_rgba(0,238,255,0.25)] p-8"
        >
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-cyan-300 mb-8 text-center">
            Create New Discussion
          </h1>
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-2 rounded text-center">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-cyan-300 mb-2">Title</label>
              <input
                type="text"
                value={discussion.title}
                onChange={(e) => setDiscussion((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full bg-gray-800/60 text-cyan-100 border border-cyan-500/30 rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-400 transition-all duration-200"
                placeholder="Enter discussion title"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-cyan-300 mb-2">Type</label>
              <select
                value={discussion.type}
                onChange={(e) => setDiscussion((prev) => ({ ...prev, type: e.target.value }))}
                className="w-full bg-gray-800/60 text-cyan-100 border border-cyan-500/30 rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-400 transition-all duration-200"
              >
                {threadTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-cyan-300 mb-2">Content</label>
              <div className="bg-gray-800/60 border border-cyan-500/20 rounded-lg p-2">
                <MDEditor
                  value={discussion.content}
                  onChange={(value) => setDiscussion((prev) => ({ ...prev, content: value || "" }))}
                  preview="edit"
                />
              </div>
            </div>
            <div className="pt-4 text-center">
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-cyan-500 to-cyan-400 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:from-cyan-400 hover:to-cyan-500 transition-all duration-200 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Discussion"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
