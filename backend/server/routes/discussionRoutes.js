const express = require("express");
const router = express.Router();
const db = require("../db"); // Assumes you have a db.js for querying Postgres

// Get all threads for a problem
router.get("/:problem_id", async (req, res) => {
  const { problem_id } = req.params;
  try {
    const threads = await db.query(
      `SELECT t.*, u.username FROM DiscussionThread t JOIN "User" u ON t.user_id = u.user_id WHERE t.problem_id = $1 ORDER BY t.created_at DESC`,
      [problem_id]
    );
    res.json({ threads: threads.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch threads" });
  }
});

// Create a new thread for a problem
router.post("/:problem_id", async (req, res) => {
  const { problem_id } = req.params;
  const { user_id, title } = req.body;
  if (!user_id || !title)
    return res.status(400).json({ error: "Missing fields" });
  try {
    const thread = await db.query(
      `INSERT INTO DiscussionThread (problem_id, user_id, title) VALUES ($1, $2, $3) RETURNING *`,
      [problem_id, user_id, title]
    );
    res.json({ thread: thread.rows[0] });
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

module.exports = router;
