import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DiscussionThread from "../components/DiscussionThread";
// import { supabase } from "../lib/supabaseClient";

export default function DiscussionThreadPage() {
  const { threadId } = useParams();
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchThread = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/discussions/${threadId}`);
        if (!res.ok) throw new Error("Failed to fetch thread");
        const { thread } = await res.json();
        setThread(thread);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchThread();
  }, [threadId]);

  if (loading) return <div className="text-neon">Loading thread...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!thread) return <div className="text-neon">Thread not found.</div>;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <DiscussionThread thread={thread} onClose={null} />
    </div>
  );
}