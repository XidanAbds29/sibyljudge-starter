const express = require("express");
const router = express.Router();
const { supabase } = require("../supabaseClient");
const authMiddleware = require("../middleware/authMiddleware");

// Get all discussion threads
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("discussion_thread")
      .select("*, creator:profiles(username)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a specific discussion thread
router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("discussion_thread")
      .select("*, creator:profiles(username)")
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: "Discussion thread not found" });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new discussion thread
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, content, type } = req.body;
    const { data, error } = await supabase
      .from("discussion_thread")
      .insert([
        {
          title,
          content,
          type,
          created_by: req.user.id,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a discussion thread
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { title, content } = req.body;
    const { data: thread, error: threadError } = await supabase
      .from("discussion_thread")
      .select()
      .eq("id", req.params.id)
      .single();

    if (threadError) throw threadError;
    if (!thread) {
      return res.status(404).json({ error: "Discussion thread not found" });
    }
    if (thread.created_by !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this thread" });
    }

    const { data, error } = await supabase
      .from("discussion_thread")
      .update({ title, content })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a discussion thread
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { data: thread, error: threadError } = await supabase
      .from("discussion_thread")
      .select()
      .eq("id", req.params.id)
      .single();

    if (threadError) throw threadError;
    if (!thread) {
      return res.status(404).json({ error: "Discussion thread not found" });
    }
    if (thread.created_by !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this thread" });
    }

    const { error } = await supabase
      .from("discussion_thread")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all posts for a discussion thread
router.get("/:id/posts", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("discussion_post")
      .select("*, author:profiles(username)")
      .eq("thread_id", req.params.id)
      .order("created_at", { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new post in a discussion thread
router.post("/:id/posts", authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    const { data, error } = await supabase
      .from("discussion_post")
      .insert([
        {
          content,
          thread_id: req.params.id,
          user_id: req.user.id,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
