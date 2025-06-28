const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

// Always use a single global supabase client
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.PUBLIC_SUPABASE_ANON_KEY
).trim();
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Signup
router.post("/signup", async (req, res) => {
  const { email, password, username } = req.body;
  if (!email || !password || !username)
    return res.status(400).json({ error: "Missing fields" });
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });
  if (error) return res.status(500).json({ error: error.message });
  // Return both user and session, so frontend can handle confirmation-required case
  res.json({ user: data.user, session: data.session });
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Missing fields" });
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return res.status(401).json({ error: error.message });
  res.json({ user: data.user });
});

// Logout (client should just clear local session)
router.post("/logout", (req, res) => {
  res.json({ message: "Logged out" });
});

// Session check (client should store session token)
router.get("/session", async (req, res) => {
  res.status(501).json({
    error:
      "Session check not implemented. Use Supabase client on frontend for session management.",
  });
});

module.exports = router;
