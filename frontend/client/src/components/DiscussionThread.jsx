import React, { useEffect, useState } from "react";
import NewPostForm from "./NewPostForm";
import { supabase } from "../lib/supabaseClient";
import ParsedHtmlContent from "./ParsedHtmlContent";

const DiscussionThread = ({ thread, onClose }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("discussion_post")
        .select("disspost_id, content, created_at, user_id, profiles(username)")
        .eq("dissthread_id", thread.dissthread_id)
        .order("created_at", { ascending: true });
      if (error) setError(error.message);
      else setPosts(data);
      setLoading(false);
    };
    fetchPosts();
  }, [thread.dissthread_id]);

  return (
    <div className="discussion-thread bg-cyber-dark p-4 mt-4 rounded-lg shadow-lg">
      <button
        className="float-right text-cyber-muted hover:text-neon"
        onClick={onClose}
      >
        Close
      </button>
      <h3 className="text-lg font-bold text-neon mb-2">{thread.title}</h3>
      <div className="space-y-4">
        {loading ? (
          <div>Loading posts...</div>
        ) : error ? (
          <div className="text-red-500">Error: {error}</div>
        ) : posts.length === 0 ? (
          <div>No posts yet.</div>
        ) : (
          posts.map((post) => (
            <div key={post.disspost_id} className="bg-cyber-light p-2 rounded">
              <div className="text-xs text-cyber-muted mb-1">
                {post.profiles?.username || "User"} on{" "}
                {new Date(post.created_at).toLocaleString()}
              </div>
              <ParsedHtmlContent content={post.content} />
            </div>
          ))
        )}
      </div>
      <NewPostForm threadId={thread.dissthread_id} onPostCreated={() => {}} />
    </div>
  );
};

export default DiscussionThread;
