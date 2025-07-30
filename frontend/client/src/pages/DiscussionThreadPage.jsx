import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../components/AuthContext";
import { format } from "date-fns";
import MDEditor from "@uiw/react-md-editor";
import { motion } from "framer-motion";

export default function DiscussionThreadPage() {
  const { id } = useParams(); // This is the dissthread_id
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
      // First fetch the discussion thread entry
            const { data: threadData, error: threadError } = await supabase
        .from("discussion_thread")
        .select(`
          dissthread_id,
          created_by,
          title,
          thread_type,
          created_at,
          problem_id,
          contest_id,
          group_id,
          author:created_by(
            id,
            username,
            institution
          )
        `)
        .eq("dissthread_id", id)
        .single(); // Since we're getting a single thread

      if (threadError) {
        console.error("Thread fetch error:", threadError);
        throw threadError;
      }

      if (!threadData) {
        throw new Error("Thread not found");
      }

      // Then fetch all discussion posts for this thread
      const { data: postsData, error: postsError } = await supabase
        .from("discussion_post")
        .select(`
          disspost_id,
          dissthread_id,
          user_id,
          content,
          posted_at,
          author:user_id(
            id,
            username,
            institution
          )
        `)
        .eq("dissthread_id", id)
        .order("posted_at", { ascending: true });

      if (postsError) {
        console.error("Posts fetch error:", postsError);
        throw postsError;
      }

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
      // Create a new discussion_post entry
      const { data, error } = await supabase
        .from("discussion_post")
        .insert([{
            dissthread_id: id,
            user_id: user.id,
            content: replyContent.trim()
        }]);

      if (error) {
        console.error("Reply error:", error);
        throw error;
      }

      setReplyContent("");
      setError(null);
      await fetchThreadData(); // Refresh the posts
    } catch (err) {
      console.error("Error posting reply:", err);
      setError(err.message || "Failed to post reply. Please try again.");
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
      // Update the discussion_post entry
      const { error } = await supabase
        .from("discussion_post")
        .update({ 
          content: editContent.trim()
        })
        .eq("disspost_id", postId)
        .eq("user_id", user.id); // Only the post author can edit

      if (error) {
        console.error("Edit error:", error);
        throw error;
      }

      setEditMode(null);
      setEditContent("");
      setError(null);
      await fetchThreadData(); // Refresh the posts
    } catch (err) {
      console.error("Error updating post:", err);
      setError(err.message || "Failed to update post. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      // Delete the discussion_post entry
      const { error } = await supabase
        .from("discussion_post")
        .delete()
        .eq("disspost_id", postId)
        .eq("user_id", user.id); // Only the post author can delete

      if (error) {
        console.error("Delete error:", error);
        throw error;
      }

      await fetchThreadData(); // Refresh the posts
    } catch (err) {
      console.error("Error deleting post:", err);
      setError(err.message || "Failed to delete post. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d111b] flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-2 border-cyan-500/20 border-t-cyan-500"></div>
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
    <div className="min-h-screen bg-[#0d111b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Thread Header */}
        <div className="relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-gray-900 to-gray-800/50 rounded-xl border border-cyan-500/10 shadow-[0_0_40px_-15px_rgba(0,238,255,0.25)] mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-transparent"></div>
          <div className="relative p-8">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-cyan-300 mb-6">
              {thread.title}
            </h1>
            <div className="flex flex-wrap items-center gap-8 text-sm">
              <div className="flex items-center gap-3">
                <span className="text-cyan-300/70">Created by</span>
                <span className="font-bold text-cyan-100">{thread.author?.username || "Unknown"}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-cyan-300/70">Created at</span>
                <span className="font-bold text-cyan-100">
                  {format(new Date(thread.created_at), "MMM d, yyyy, HH:mm")}
                </span>
              </div>
            </div>

            {/* Thread Type */}
            <div className="mt-4">
              <span className="text-cyan-300/70">Type: </span>
              <span className="font-bold text-cyan-100">{thread.thread_type || 'general'}</span>
            </div>
          </div>
        </div>

        {/* Discussion Posts */}
        <div className="space-y-6 mb-8">
          {posts.map((post) => (
            <motion.div
              key={post.disspost_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-gray-900 to-gray-800/50 rounded-xl border border-cyan-500/10 shadow-lg"
            >
              <div className="relative p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-cyan-300/70">Posted by</span>
                      <span className="font-bold text-cyan-100">
                        {post.author?.username || "Unknown"}
                      </span>
                    </div>
                    <div className="text-sm text-cyan-300/50 mt-2">
                      {format(new Date(post.posted_at), "MMM d, yyyy, HH:mm")}
                    </div>
                  </div>
                  
                  {/* Edit/Delete buttons - only shown to post author */}
                  {user?.id === post.user_id && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setEditMode(post.disspost_id);
                          setEditContent(post.content);
                        }}
                        className="text-sm px-3 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(post.disspost_id)}
                        className="text-sm px-3 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Post Content - Edit Mode or Display Mode */}
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
                        className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded"
                      >
                        {submitting ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        onClick={() => {
                          setEditMode(null);
                          setEditContent("");
                        }}
                        className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 prose prose-invert max-w-none">
                    <MDEditor.Markdown source={post.content} />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Reply Form */}
        {user ? (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleReply}
            className="relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-gray-900 to-gray-800/50 rounded-xl border border-cyan-500/10 p-6"
          >
            <h3 className="text-xl font-bold text-cyan-100 mb-6">Post a Reply</h3>
            <div className="mb-6">
              <MDEditor
                value={replyContent}
                onChange={setReplyContent}
                preview="edit"
              />
            </div>
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded text-red-300">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded"
            >
              {submitting ? "Posting..." : "Post Reply"}
            </button>
          </motion.form>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-6 bg-gray-800/50 rounded-xl"
          >
            <p className="text-lg">
              Please{" "}
              <Link to="/login" className="text-cyan-400 hover:text-cyan-300">
                sign in
              </Link>{" "}
              to join the discussion.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
