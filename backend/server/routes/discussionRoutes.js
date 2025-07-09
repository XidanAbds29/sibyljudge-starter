const express = require("express");
const router = express.Router();
const db = require("../db"); // Assumes you have a db.js for querying Postgres

// Get all discussion threads (global, not problem-specific)
router.get("/", async (req, res) => {
  try {
    const threads = await db.query(
      `SELECT t.*, u.username FROM discussion_thread t JOIN "User" u ON t.created_by = u.user_id ORDER BY t.created_at DESC`
    );
    res.json({ threads: threads.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch threads" });
  }
});

// Create a new thread (global, not problem-specific)
router.post("/", async (req, res) => {
  const { user_id, title, content } = req.body;
  if (!user_id || !title || !content)
    return res.status(400).json({ error: "Missing fields" });
  try {
    // Insert thread
    const threadResult = await db.query(
      `INSERT INTO discussion_thread (created_by, title, created_at) VALUES ($1, $2, NOW()) RETURNING *`,
      [user_id, title]
    );
    const thread = threadResult.rows[0];
    // Insert first post as the thread content
    const postResult = await db.query(
      `INSERT INTO discussion_post (dissthread_id, user_id, content, posted_at) VALUES ($1, $2, $3, NOW()) RETURNING *`,
      [thread.dissthread_id, user_id, content]
    );
    res.json({ thread, post: postResult.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to create thread" });
  }
});

// Get all posts in a thread
router.get("/thread/:thread_id", async (req, res) => {
  const { thread_id } = req.params;
  try {
    const posts = await db.query(
      `SELECT p.*, u.username FROM DiscussionPost p JOIN "User" u ON p.user_id = u.user_id WHERE p.thread_id = $1 ORDER BY p.created_at ASC`,
      [thread_id]
    );
    res.json({ posts: posts.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// Add a post to a thread
router.post("/thread/:thread_id", async (req, res) => {
  const { thread_id } = req.params;
  const { user_id, content } = req.body;
  if (!user_id || !content)
    return res.status(400).json({ error: "Missing fields" });
  try {
    const post = await db.query(
      `INSERT INTO DiscussionPost (thread_id, user_id, content) VALUES ($1, $2, $3) RETURNING *`,
      [thread_id, user_id, content]
    );
    res.json({ post: post.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to add post" });
  }
});

// Get a single thread by id (for thread view page)
router.get("/:thread_id", async (req, res) => {
  const { thread_id } = req.params;
  try {
    const threadResult = await db.query(
      `SELECT t.*, u.username FROM discussion_thread t JOIN "User" u ON t.created_by = u.user_id WHERE t.dissthread_id = $1`,
      [thread_id]
    );
    if (threadResult.rows.length === 0)
      return res.status(404).json({ error: "Thread not found" });
    res.json({ thread: threadResult.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch thread" });
  }
});

module.exports = router;