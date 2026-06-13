require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// ─── Supabase Client ────────────────────────────
const supabase = require("./supabaseClient");
const { supabaseError } = require("./supabaseClient");

// Debug: Log key info to help diagnose 403 errors safely
console.log(
  "[DEBUG] SUPABASE_SERVICE_ROLE_KEY length:",
  process.env.SUPABASE_SERVICE_ROLE_KEY
    ? process.env.SUPABASE_SERVICE_ROLE_KEY.length
    : "undefined"
);
console.log(
  "[DEBUG] SUPABASE_SERVICE_ROLE_KEY starts with:",
  process.env.SUPABASE_SERVICE_ROLE_KEY
    ? process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10)
    : "undefined"
);
console.log(
  "[DEBUG] SUPABASE_SERVICE_ROLE_KEY ends with:",
  process.env.SUPABASE_SERVICE_ROLE_KEY
    ? process.env.SUPABASE_SERVICE_ROLE_KEY.slice(-10)
    : "undefined"
);
console.log("[DEBUG] supabaseUrl:", process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);

// Test Supabase connection at startup if initialized
if (supabase) {
  (async () => {
    try {
      const { data, error, status } = await supabase
        .from("Problem")
        .select("*")
        .limit(1);
      if (error) {
        console.error(
          "[DEBUG] Supabase test query error:",
          error,
          "Status:",
          status
        );
      } else {
        console.log(
          "[DEBUG] Supabase test query success. Data length:",
          data.length
        );
      }
    } catch (e) {
      console.error("[DEBUG] Supabase test query threw exception:", e);
    }
  })();
} else {
  console.warn("[WARN] Skipping Supabase startup test query as client is not initialized.");
}

// ─── Health & Diagnostics Route ──────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: supabaseError ? "ERROR" : "OK",
    env: {
      PUBLIC_SUPABASE_URL_exists: !!process.env.PUBLIC_SUPABASE_URL,
      SUPABASE_URL_exists: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY_exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_SERVICE_KEY_exists: !!process.env.SUPABASE_SERVICE_KEY,
      PUBLIC_SUPABASE_ANON_KEY_exists: !!process.env.PUBLIC_SUPABASE_ANON_KEY,
      NODE_ENV: process.env.NODE_ENV
    },
    supabaseError: supabaseError ? supabaseError.message : null
  });
});

// ─── Test Route ──────────────────────────────────
app.get("/", async (req, res) => {
  res.json({ message: "OK", time: new Date().toISOString() });
});

// ─── Route Imports ───────────────────────────────
console.log("🛣️ Loading routes...");
const judgeRoutes = require("./routes/judgeRoutes");
const syncRoutes = require("./routes/syncRoutes");
const problemRoutes = require("./routes/problemroutes");
const submissionRoutes = require("./routes/submissionRoutes");
const authRoutes = require("./routes/authRoutes");
const contestRoutes = require("./routes/contestRoutes");
const contestSubmissionRoutes = require("./routes/contestSubmissionRoutes");
const standingsRoutes = require("./routes/standingsRoutes");
const statusRoutes = require("./routes/statusRoutes");
const groupRoutes = require("./routes/groupRoutes");
const groupChatRoutes = require("./routes/groupChatRoutes");
const discussionRoutes = require("./routes/DiscussionRoutes");
const trackRoutes = require("./routes/trackRoutes");

const checkSupabase = (req, res, next) => {
  if (supabaseError || !supabase) {
    return res.status(500).json({
      error: "Supabase client not initialized.",
      details: supabaseError ? supabaseError.message : "Supabase client is null",
      hint: "Check if environment variables (PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY) are set in the Vercel project dashboard."
    });
  }
  req.supabase = supabase;
  next();
};

app.use("/api/problems", checkSupabase, problemRoutes);
app.use("/api/submissions", checkSupabase, submissionRoutes);
app.use("/api/judges", checkSupabase, judgeRoutes);
app.use("/api/sync", checkSupabase, syncRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/contests", checkSupabase, contestRoutes);
app.use("/api/contest-submissions", checkSupabase, contestSubmissionRoutes);
app.use("/api/standings", checkSupabase, standingsRoutes);
app.use("/api/status", checkSupabase, statusRoutes);
app.use("/api/groups", checkSupabase, groupRoutes);
app.use("/api/group-chat", checkSupabase, groupChatRoutes);
app.use("/api/discussions", checkSupabase, discussionRoutes);
app.use("/api/tracks", checkSupabase, trackRoutes);

// ─── Error Handling ──────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// ─── Start Server ────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5050;
  app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
}

module.exports = app;
