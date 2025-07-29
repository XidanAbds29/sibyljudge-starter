const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

// Function to check if user can modify a post
async function canModifyPost(supabase, userId, postId) {
  const { data } = await supabase
    .from("discussion_post")
    .select("user_id")
    .eq("disspost_id", postId)
    .single();

  return data && data.user_id === userId;
}

// Function to update thread's updated_at timestamp
async function updateThreadTimestamp(supabase, threadId) {
  await supabase
    .from("discussion_thread")
    .update({ updated_at: new Date().toISOString() })
    .eq("dissthread_id", threadId);
}

// Function to track thread view
async function trackThreadView(supabase, threadId, userId) {
  // Upsert view record
  await supabase.from("discussion_view").upsert(
    {
      thread_id: threadId,
      user_id: userId,
      last_viewed_at: new Date().toISOString(),
    },
    {
      onConflict: "thread_id,user_id",
    }
  );
}

// Create a new discussion thread
router.post("/", authMiddleware, async (req, res) => {
  console.log("Creating new discussion thread");
  const supabase = req.supabase;
  const { title, content, thread_type } = req.body;

  console.log("Request body:", {
    title,
    content: content ? "present" : "missing",
    thread_type,
  });
  console.log("User from token:", req.user);

  if (!title?.trim() || !content?.trim() || !thread_type) {
    return res
      .status(400)
      .json({ error: "Title, content and thread type are required" });
  }

  const userId = req.user.id;
  if (!userId) {
    return res.status(401).json({ error: "User ID not found in token" });
  }

  try {
    // Create thread
    console.log("Creating thread for user:", userId);
    const { data: thread, error: threadError } = await supabase
      .from("discussion_thread")
      .insert({
        title: title.trim(),
        thread_type,
        created_by: userId,
        updated_at: new Date().toISOString(),
        view_count: 0,
      })
      .select()
      .single();

    if (threadError) {
      console.error("Error creating thread:", threadError);
      throw new Error("Failed to create discussion thread");
    }

    // Create initial post
    const { error: postError } = await supabase.from("discussion_post").insert({
      content,
      dissthread_id: thread.dissthread_id, // Using correct column name
      user_id: userId,
      posted_at: new Date().toISOString(),
    });

    if (postError) {
      // Rollback by deleting the thread if post creation fails
      await supabase
        .from("discussion_thread")
        .delete()
        .eq("dissthread_id", thread.dissthread_id); // Using correct column name
      console.error("Error creating initial post:", postError);
      throw new Error("Failed to create initial post");
    }

    res.status(201).json(thread);
  } catch (err) {
    console.error("Error in discussion creation:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get posts for a specific thread
router.get("/thread/:threadId", async (req, res) => {
  const supabase = req.supabase;
  const { threadId } = req.params;

  try {
    const { data: posts, error } = await supabase
      .from("discussion_post")
      .select(
        `
        disspost_id,
        content,
        user_id,
        posted_at,
        users (
          username,
          avatar_url
        )
      `
      )
      .eq("dissthread_id", threadId)
      .order("posted_at", { ascending: true });

    if (error) throw error;

    res.json(posts);
  } catch (err) {
    console.error("Error fetching thread posts:", err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// Get discussion threads with pagination and filters
router.get("/", async (req, res) => {
  const supabase = req.supabase;
  const { page = 1, limit = 10, type, search, sort = "latest" } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    // Build base query
    let query = supabase.from("discussion_thread").select(
      `
      *,
      creator:profiles(username, id),
      posts:discussion_post!discussion_post_dissthread_id_fkey(count),
      latest_post:discussion_post!discussion_post_dissthread_id_fkey(
        content,
        posted_at,
        author:profiles(username)
      )
    `,
      { count: "exact" }
    );

    // Apply filters
    if (type && type !== "all") {
      query = query.eq("thread_type", type);
    }
    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    // Apply sorting
    switch (sort) {
      case "latest":
        query = query.order("updated_at", { ascending: false });
        break;
      case "most_viewed":
        query = query.order("view_count", { ascending: false });
        break;
      case "most_active":
        // Count posts using the correct foreign key relationship
        query = query.order("posts(count)", { ascending: false });
        break;
      default:
        query = query.order("updated_at", { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({
      threads: data,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single thread with its posts
router.get("/:threadId", async (req, res) => {
  const supabase = req.supabase;
  const { threadId } = req.params;
  const userId = req.user?.id; // Optional: user might not be logged in

  try {
    // Fetch thread with its posts and related data
    const { data: thread, error: threadError } = await supabase
      .from("discussion_thread")
      .select(
        `
        *,
        creator:profiles(username, id),
        posts:discussion_post!discussion_post_dissthread_id_fkey(
          *,
          author:profiles(username, id),
          likes:discussion_like(count)
          ${
            userId
              ? `, user_like:discussion_like!discussion_like_user_id_fkey(like_id).user_id.eq.${userId}`
              : ""
          }
        )
      `
      )
      .eq("dissthread_id", threadId)
      .single();

    if (threadError) throw threadError;
    if (!thread) {
      return res.status(404).json({ error: "Discussion thread not found" });
    }

    // Track view if user is logged in
    if (userId) {
      await trackThreadView(supabase, threadId, userId);
    }

    // Format posts data
    if (thread.posts) {
      thread.posts = thread.posts.map((post) => ({
        ...post,
        like_count: post.likes?.[0]?.count || 0,
        is_liked: post.user_like?.length > 0,
      }));
    }

    res.json(thread);
  } catch (err) {
    console.error("Error fetching thread:", err);
    res.status(500).json({ error: err.message });
  }
});

// Add a post to a thread
router.post("/threads/:threadId/posts", authMiddleware, async (req, res) => {
  console.log("Adding post to thread");
  const { threadId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  console.log("Request params:", {
    threadId,
    content: content ? "present" : "missing",
  });
  console.log("User from token:", req.user);

  if (!content?.trim()) {
    return res.status(400).json({ error: "Content is required" });
  }

  if (!userId) {
    return res.status(401).json({ error: "User ID not found in token" });
  }

  try {
    // First check if thread exists
    const { data: thread, error: threadError } = await supabase
      .from("discussion_thread")
      .select("dissthread_id")
      .eq("dissthread_id", threadId)
      .single();

    if (threadError || !thread) {
      return res.status(404).json({ error: "Thread not found" });
    }

    console.log("Creating post for user:", userId, "in thread:", threadId);
    const { data, error } = await supabase
      .from("discussion_post")
      .insert([
        {
          content: content.trim(),
          dissthread_id: threadId,
          user_id: userId,
          posted_at: new Date().toISOString(),
        },
      ])
      .select(
        `
        *,
        user:user_id (username)
      `
      )
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Like/unlike a post
router.post("/posts/:postId/like", authMiddleware, async (req, res) => {
  const supabase = req.supabase;
  const { postId } = req.params;
  const userId = req.user.id;

  try {
    // Check if post exists
    const { data: post, error: postError } = await supabase
      .from("discussion_post")
      .select("disspost_id")
      .eq("disspost_id", postId)
      .single();

    if (postError || !post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if user already liked the post
    const { data: existingLike } = await supabase
      .from("discussion_like")
      .select()
      .eq("post_id", postId)
      .eq("user_id", userId)
      .single();

    if (existingLike) {
      // Unlike the post
      const { error: unlikeError } = await supabase
        .from("discussion_like")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);

      if (unlikeError) throw unlikeError;

      // Update likes count in post
      await supabase.rpc("decrement_post_likes", { post_id: postId });

      res.json({ liked: false });
    } else {
      // Like the post
      const { error: likeError } = await supabase
        .from("discussion_like")
        .insert({
          post_id: postId,
          user_id: userId,
          created_at: new Date().toISOString(),
        });

      if (likeError) throw likeError;

      // Update likes count in post
      await supabase.rpc("increment_post_likes", { post_id: postId });

      res.json({ liked: true });
    }
  } catch (err) {
    console.error("Error in like/unlike operation:", err);
    res.status(500).json({ error: err.message });
  }
});

// Edit a post
router.put("/posts/:postId", authMiddleware, async (req, res) => {
  const supabase = req.supabase;
  const { postId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  if (!content) {
    return res.status(400).json({ error: "Content is required" });
  }

  try {
    // Check post ownership
    if (!(await canModifyPost(supabase, userId, postId))) {
      return res
        .status(403)
        .json({ error: "Not authorized to edit this post" });
    }

    // Update the post
    const { data: updatedPost, error: updateError } = await supabase
      .from("discussion_post")
      .update({
        content: content.trim(),
        posted_at: new Date().toISOString(), // Update timestamp to show edit time
      })
      .eq("disspost_id", postId)
      .select(
        `
        *,
        author:profiles!user_id(username, id),
        likes:discussion_like(count)
      `
      )
      .single();

    if (updateError) throw updateError;

    // Get thread ID to update timestamp
    const threadId = updatedPost.dissthread_id;
    await updateThreadTimestamp(supabase, threadId);

    res.json(updatedPost);
  } catch (err) {
    console.error("Error updating post:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a post
router.delete("/posts/:postId", authMiddleware, async (req, res) => {
  const supabase = req.supabase;
  const { postId } = req.params;
  const userId = req.user.id;

  try {
    // Check post ownership
    if (!(await canModifyPost(supabase, userId, postId))) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this post" });
    }

    // Get thread ID before deleting post
    const { data: post } = await supabase
      .from("discussion_post")
      .select("dissthread_id")
      .eq("disspost_id", postId)
      .single();

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Delete the post
    const { error: deleteError } = await supabase
      .from("discussion_post")
      .delete()
      .eq("disspost_id", postId);

    if (deleteError) throw deleteError;

    // Update thread timestamp
    await updateThreadTimestamp(supabase, post.dissthread_id);

    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get all discussion threads with pagination and filtering
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, type, search, sort = "latest" } = req.query;

    const offset = (page - 1) * limit;

    let query = supabase.from("discussion_thread").select(
      `
        *,
        creator:profiles!created_by(username, id),
        posts:discussion_post(count),
        latest_post:discussion_post(
          content,
          posted_at,
          author:profiles!user_id(username)
        )
      `,
      { count: "exact" }
    );

    // Apply filters
    if (type) {
      query = query.eq("thread_type", type);
    }
    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    // Apply sorting
    switch (sort) {
      case "latest":
        query = query.order("updated_at", { ascending: false });
        break;
      case "most_viewed":
        query = query.order("view_count", { ascending: false });
        break;
      case "most_active":
        query = query.order("posts.count", { ascending: false });
        break;
    }

    // Apply pagination
    const { data, error, count } = await query.range(
      offset,
      offset + limit - 1
    );

    if (error) throw error;

    // Format the response
    const threads = data.map((thread) => ({
      ...thread,
      post_count: thread.posts?.[0]?.count || 0,
      latest_post: thread.latest_post?.[0] || null,
    }));

    res.json({
      threads,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    console.error("Error fetching discussions:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get a specific discussion thread with its posts and track view
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    // Get thread details with posts
    const { data: thread, error: threadError } = await supabase
      .from("discussion_thread")
      .select(
        `
        *,
        creator:profiles!created_by(username, id),
        posts:discussion_post(
          *,
          author:profiles!user_id(username, id),
          likes:discussion_like(count),
          user_like:discussion_like!inner(like_id).user_id=eq.${req.user.id}
        )
      `
      )
      .eq("dissthread_id", req.params.id)
      .single();

    if (threadError) throw threadError;
    if (!thread) {
      return res.status(404).json({ error: "Discussion thread not found" });
    }

    // Track view
    await supabase.from("discussion_view").upsert({
      thread_id: thread.dissthread_id,
      user_id: req.user.id,
      last_viewed_at: new Date().toISOString(),
    });

    // Format posts data
    thread.posts = thread.posts.map((post) => ({
      ...post,
      like_count: post.likes[0]?.count || 0,
      is_liked: post.user_like?.length > 0,
    }));

    res.json(thread);
  } catch (err) {
    console.error("Error fetching thread:", err);
    res.status(500).json({ error: err.message });
  }
});

// Create a new discussion thread with initial post
router.post("/", authMiddleware, async (req, res) => {
  const supabase = req.supabase;
  const { title, content, thread_type } = req.body;
  const userId = req.user.id;

  if (!title || !content || !thread_type) {
    return res
      .status(400)
      .json({ error: "Title, content and thread type are required" });
  }

  try {
    // Create thread
    const { data: thread, error: threadError } = await supabase
      .from("discussion_thread")
      .insert({
        title: title.trim(),
        thread_type,
        created_by: userId,
        updated_at: new Date().toISOString(),
        view_count: 0,
      })
      .select()
      .single();

    if (threadError) {
      console.error("Error creating thread:", threadError);
      throw new Error("Failed to create discussion thread");
    }

    // Create initial post
    const { error: postError } = await supabase.from("discussion_post").insert({
      content: content.trim(),
      dissthread_id: thread.dissthread_id,
      user_id: userId,
      posted_at: new Date().toISOString(),
      likes: 0,
    });

    if (postError) {
      // Rollback by deleting the thread if post creation fails
      await supabase
        .from("discussion_thread")
        .delete()
        .eq("dissthread_id", thread.dissthread_id);
      console.error("Error creating initial post:", postError);
      throw new Error("Failed to create initial post");
    }

    res.status(201).json({
      message: "Discussion created successfully",
      thread: thread,
    });
  } catch (err) {
    console.error("Error in discussion creation:", err);
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
