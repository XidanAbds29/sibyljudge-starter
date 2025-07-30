import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../components/AuthContext";
import { format } from "date-fns";
import MDEditor from "@uiw/react-md-editor";

export default function DiscussionThreadPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [thread, setThread] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    let mounted = true;
    const pollingInterval = 5000; // Poll every 5 seconds

    // Initial fetch
    fetchThreadData();

    // Set up polling
    const pollTimer = setInterval(() => {
      if (mounted) {
        fetchThreadData();
      }
    }, pollingInterval);

    return () => {
      mounted = false;
      clearInterval(pollTimer);
    };
  }, [id]);

  const fetchThreadData = async () => {
    try {
      // Fetch thread details
      const { data: threadData, error: threadError } = await supabase
        .from("discussion_thread")
        .select(`
          *,
          creator:created_by(
            id,
            username,
            institution
          ),
          related_problem:problem_id(
            title,
            external_id
          ),
          related_contest:contest_id(
            name,
            start_time,
            end_time
          ),
          related_group:group_id(
            name
          )
        `)
        .eq("dissthread_id", id)
        .single();

      if (threadError) throw threadError;
      if (!threadData) throw new Error("Thread not found");

      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from("discussion_post")
        .select(
          `
          *,
          author:user_id(
            id,
            username,
            institution
          )
        `
        )
        .eq("dissthread_id", id)
        .order("posted_at", { ascending: true });

      if (postsError) throw postsError;

      setThread(threadData);
      setPosts(postsData || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching thread:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to reply");
      return;
    }
    if (!replyContent.trim()) {
      setError("Reply cannot be empty");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("discussion_post").insert([
        {
          dissthread_id: id,
          user_id: user.id,
          content: replyContent.trim(),
        },
      ]);

      if (error) throw error;

      setReplyContent("");
      setError(null);
      await fetchThreadData();
    } catch (err) {
      console.error("Error posting reply:", err);
      setError("Failed to post reply");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (postId) => {
    if (!editContent.trim()) {
      setError("Content cannot be empty");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("discussion_post")
        .update({ content: editContent.trim() })
        .eq("disspost_id", postId)
        .eq("user_id", user.id); // Ensure user owns the post

      if (error) throw error;

      setEditMode(null);
      setEditContent("");
      setError(null);
      await fetchThreadData();
    } catch (err) {
      console.error("Error updating post:", err);
      setError("Failed to update post");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      const { error } = await supabase
        .from("discussion_post")
        .delete()
        .eq("disspost_id", postId)
        .eq("user_id", user.id); // Ensure user owns the post

      if (error) throw error;

      await fetchThreadData();
    } catch (err) {
      console.error("Error deleting post:", err);
      setError("Failed to delete post");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-4">
        {error || "Discussion not found"}
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="text-gray-400 text-center py-8">Thread not found</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link to="/discussions" className="text-cyan-400 hover:text-cyan-300">
            ← Back to Discussions
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">{thread.title}</h1>
        <div className="text-sm text-gray-400">
          Started by {thread.creator?.username || "Unknown"} •{" "}
          {format(new Date(thread.created_at), "MMM d, yyyy, HH:mm")}
        </div>
        {/* Show reference based on thread type */}
        {thread.thread_type !== 'general' && (
          <div className="mt-2">
            <span className="text-sm text-gray-400">
              {thread.thread_type === 'problem' && thread.related_problem && (
                <>
                  Related to problem:{" "}
                  <Link
                    to={"/problem/" + thread.problem_id}
                    className="text-cyan-400 hover:text-cyan-300"
                  >
                    {thread.related_problem.title}
                  </Link>
                </>
              )}
              {thread.thread_type === 'contest' && thread.related_contest && (
                <>
                  Related to contest:{" "}
                  <Link
                    to={"/contest/" + thread.contest_id}
                    className="text-cyan-400 hover:text-cyan-300"
                  >
                    {thread.related_contest.name}
                  </Link>
                </>
              )}
              {thread.thread_type === 'group' && thread.related_group && (
                <>
                  Related to group:{" "}
                  <Link
                    to={"/group/" + thread.group_id}
                    className="text-cyan-400 hover:text-cyan-300"
                  >
                    {thread.related_group.name}
                  </Link>
                </>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Thread content */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="prose prose-invert max-w-none">
          <MDEditor.Markdown source={thread.content} />
        </div>
      </div>

      {/* Discussion Posts */}
      <div className="space-y-6">
        {posts.map((post) => (
          <div key={post.disspost_id} className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div>
                  <div className="font-medium text-white">
                    {post.author?.username || "Unknown"}
                  </div>
                  <div className="text-sm text-gray-400">
                    {format(new Date(post.posted_at), "MMM d, yyyy, HH:mm")}
                  </div>
                </div>
              </div>
              {user?.id === post.user_id && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditMode(post.disspost_id);
                      setEditContent(post.content);
                    }}
                    className="text-cyan-400 hover:text-cyan-300 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(post.disspost_id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
            {editMode === post.disspost_id ? (
              <div>
                <MDEditor
                  value={editContent}
                  onChange={setEditContent}
                  preview="edit"
                />
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleEdit(post.disspost_id)}
                    disabled={submitting}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
                  >
                    {submitting ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setEditMode(null);
                      setEditContent("");
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="prose prose-invert max-w-none">
                <MDEditor.Markdown source={post.content} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Reply form */}
      {user ? (
        <form onSubmit={handleReply} className="mt-8">
          <div className="mb-4">
            <MDEditor
              value={replyContent}
              onChange={setReplyContent}
              preview="edit"
            />
          </div>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <button
            type="submit"
            disabled={submitting}
            className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-md disabled:opacity-50"
          >
            {submitting ? "Posting..." : "Post Reply"}
          </button>
        </form>
      ) : (
        <div className="mt-8 text-center text-gray-400">
          Please{" "}
          <Link to="/login" className="text-cyan-400 hover:text-cyan-300">
            sign in
          </Link>{" "}
          to join the discussion.
        </div>
      )}
    </div>
  );
}
