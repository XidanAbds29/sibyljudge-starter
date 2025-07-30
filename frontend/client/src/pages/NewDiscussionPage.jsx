import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../components/AuthContext";
import MDEditor from "@uiw/react-md-editor";

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
      <div className="text-center py-8 text-gray-400">
        Please sign in to create a discussion.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <h1 className="text-2xl font-bold text-white mb-6">New Discussion</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-2 rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Title
          </label>
          <input
            type="text"
            value={discussion.title}
            onChange={(e) =>
              setDiscussion((prev) => ({ ...prev, title: e.target.value }))
            }
            className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2"
            placeholder="Enter discussion title"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Type
          </label>
          <select
            value={discussion.type}
            onChange={(e) =>
              setDiscussion((prev) => ({ ...prev, type: e.target.value }))
            }
            className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2"
          >
            {threadTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Content
          </label>
          <MDEditor
            value={discussion.content}
            onChange={(value) =>
              setDiscussion((prev) => ({ ...prev, content: value || "" }))
            }
            preview="edit"
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-md disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Discussion"}
          </button>
        </div>
      </form>
    </div>
  );
}
