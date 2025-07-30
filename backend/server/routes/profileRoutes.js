// backend/server/routes/profileRoutes.js
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const { supabase } = require("../middleware/authMiddleware");

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get user profile
router.get("/", async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (error) throw error;

    res.json({ profile });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put("/", async (req, res) => {
  try {
    const updates = {
      username: req.body.username,
      institution: req.body.institution,
      bio: req.body.bio,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ profile: data });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
