import React, { useEffect, useState } from "react";
import DiscussionThread from "./DiscussionThread";
import NewThreadForm from "./NewThreadForm";
// import { supabase } from "../lib/supabaseClient";
import { Link } from "react-router-dom";

const DiscussionThreadList = () => {
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Refetch threads after a new thread is created
  const fetchThreads = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/discussions");
      if (!res.ok) throw new Error("Failed to fetch threads");
      const { threads } = await res.json();
      setThreads(threads);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  if (loading) return <div className="text-neon">Loading threads...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="discussion-list bg-cyber-dark p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-neon">Discussion Threads</h2>
      <NewThreadForm onThreadCreated={fetchThreads} />
      <ul className="divide-y divide-cyber">
        {threads.map((thread) => (
          <li
            key={thread.dissthread_id}
            className="py-2 cursor-pointer hover:bg-cyber-light"
          >
            <Link
              to={`/discussions/${thread.dissthread_id}`}
              className="block w-full h-full no-underline hover:underline text-cyber"
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-cyber">{thread.title}</span>
                <span className="text-xs text-cyber-muted">
                  by {thread.profiles?.username || "User"} on{" "}
                  {new Date(thread.created_at).toLocaleString()}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {selectedThread && (
        <DiscussionThread
          thread={selectedThread}
          onClose={() => setSelectedThread(null)}
        />
      )}
    </div>
  );
};

export default DiscussionThreadList;