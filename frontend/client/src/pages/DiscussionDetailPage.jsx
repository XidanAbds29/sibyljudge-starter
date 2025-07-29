import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { discussionService } from "../services/discussionService";
import MDEditor from "@uiw/react-md-editor";
import { format } from "date-fns";

export default function DiscussionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newReply, setNewReply] = useState("");
  const [replyError, setReplyError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState("");

  // Fetch thread data
  const fetchThread = async () => {
    try {
      setLoading(true);
      const data = await discussionService.getThread(id);
      setThread(data);
    } catch (err) {
      setError(err.message || "Failed to load discussion");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThread();
  }, [id]);

  // Handle new reply
  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!user) {
      setReplyError("You must be logged in to reply");
      return;
    }

    if (!newReply.trim()) {
      setReplyError("Reply content is required");
      return;
    }

    setReplyError(null);
    setSubmitting(true);

    try {
      await discussionService.createPost(id, {
        content: newReply.trim(),
      });

      setNewReply("");
      fetchThread();
    } catch (err) {
      setReplyError(err.message || "Failed to post reply");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle post edit
  const handleEditPost = async (postId) => {
    if (!editContent.trim()) {
      return;
    }

    try {
      await discussionService.updatePost(postId, {
        content: editContent.trim(),
      });

      setEditingPost(null);
      fetchThread();
    } catch (err) {
      setError(err.message || "Failed to edit post");
    }
  };

  // Handle post delete
  const handleDeletePost = async (postId) => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      await discussionService.deletePost(postId);
      await fetchThread();
    } catch (err) {
      if (err.message.includes("Thread deleted")) {
        navigate("/discussions");
      } else {
        setError(err.message || "Failed to delete post");
      }
    }
  };

  // Handle post like
  const handleLikePost = async (postId) => {
    if (!user) return;

    try {
      await discussionService.togglePostLike(postId);
      fetchThread();
    } catch (err) {
      setError(err.message || "Failed to like post");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  if (!thread) {
    return <div className="text-center py-8">Discussion not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Thread Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">{thread.title}</h1>
        <div className="text-gray-400 text-sm">
          Started by {thread.creator.username} ·{" "}
          {format(new Date(thread.created_at), "MMM d, yyyy")}
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-6">
        {thread.posts.map((post) => (
          <div key={post.disspost_id} className="bg-gray-800 rounded-lg p-6">
            {/* Post Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="text-sm text-gray-400">
                <span className="text-cyan-500">{post.author.username}</span>
                {" · "}
                {format(new Date(post.posted_at), "MMM d, yyyy h:mm a")}
              </div>
              {user?.id === post.user_id && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingPost(post.disspost_id);
                      setEditContent(post.content);
                    }}
                    className="text-sm text-gray-400 hover:text-white"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeletePost(post.disspost_id)}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            {/* Post Content */}
            {editingPost === post.disspost_id ? (
              <div className="space-y-4">
                <MDEditor
                  value={editContent}
                  onChange={setEditContent}
                  preview="edit"
                  height={200}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditPost(post.disspost_id)}
                    className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingPost(null)}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <MDEditor.Markdown
                source={post.content}
                className="text-white prose prose-invert max-w-none"
              />
            )}

            {/* Post Footer */}
            <div className="mt-4 pt-4 border-t border-gray-700">
              <button
                onClick={() => handleLikePost(post.disspost_id)}
                className={`text-sm ${
                  post.is_liked ? "text-cyan-500" : "text-gray-400"
                } hover:text-cyan-500`}
              >
                ♥ {post.like_count} likes
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Reply Form */}
      {user && (
        <form onSubmit={handleSubmitReply} className="mt-8 space-y-4">
          <h3 className="text-lg font-semibold text-white">Post Reply</h3>

          {replyError && (
            <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-2 rounded">
              {replyError}
            </div>
          )}

          <MDEditor
            value={newReply}
            onChange={setNewReply}
            preview="edit"
            height={200}
          />

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded disabled:opacity-50"
            >
              {submitting ? "Posting..." : "Post Reply"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
