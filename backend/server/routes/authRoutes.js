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


// Session check: returns user profile (username, institution, bio, etc. from profiles + email from auth.users) if logged in
router.get("/session", async (req, res) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.replace("Bearer ", "");
    } else if (req.cookies && req.cookies["sb-access-token"]) {
      token = req.cookies["sb-access-token"];
    }
    if (!token) return res.status(401).json({ error: "Not authenticated" });
    // Get user from Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: "Invalid session" });
    console.log("[DEBUG] /session user.id:", user.id);
    // Fetch profile from 'profiles' table by id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, institution, bio, is_admin, created_at, updated_at")
      .eq("id", user.id)
      .single();
    console.log("[DEBUG] /session profile query result:", profile, profileError);
    if (profileError || !profile) return res.status(404).json({ error: "Profile not found for user id " + user.id });
    // Fetch email from auth.users
    const { data: authUser, error: authError } = await supabase
      .from("auth.users")
      .select("email")
      .eq("id", user.id)
      .single();
    console.log("[DEBUG] /session authUser query result:", authUser, authError);
    if (authError || !authUser) return res.status(404).json({ error: "User email not found for user id " + user.id });
    // Combine and return
    res.json({ user: { ...profile, email: authUser.email } });
  } catch (err) {
    console.error("[DEBUG] /session error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update profile info (username, institution, bio)
router.post("/profile", async (req, res) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.replace("Bearer ", "");
    } else if (req.cookies && req.cookies["sb-access-token"]) {
      token = req.cookies["sb-access-token"];
    }
    if (!token) return res.status(401).json({ error: "Not authenticated" });
    // Get user from Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: "Invalid session" });
    const { username, institution, bio } = req.body;
    // Basic validation
    if (!username || typeof username !== "string" || username.length < 2) {
      return res.status(400).json({ error: "Invalid username" });
    }
    // Update profile
    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update({ username, institution, bio })
      .eq("id", user.id)
      .select()
      .single();
    if (updateError || !updated) return res.status(500).json({ error: updateError?.message || "Failed to update profile" });
    // Fetch email from auth.users
    const { data: authUser, error: authError } = await supabase
      .from("auth.users")
      .select("email")
      .eq("id", user.id)
      .single();
    if (authError || !authUser) return res.status(404).json({ error: "User email not found" });
    res.json({ ...updated, email: authUser.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
