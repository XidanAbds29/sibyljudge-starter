require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// ─── Supabase Client ────────────────────────────
const { createClient } = require("@supabase/supabase-js");
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.PUBLIC_SUPABASE_ANON_KEY
).trim();
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Supabase URL or Service Key missing in environment variables"
  );
}
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
const discussionRoutes = require("./routes/discussionRoutes");

// ─── Mount Routes ────────────────────────────────
app.use(
  "/api/problems",
  (req, res, next) => {
    req.supabase = supabase;
    next();
  },
  problemRoutes
);
app.use(
  "/api/submissions",
  (req, res, next) => {
    req.supabase = supabase;
    next();
  },
  submissionRoutes
);
app.use(
  "/api/judges",
  (req, res, next) => {
    req.supabase = supabase;
    next();
  },
  judgeRoutes
);
app.use(
  "/api/sync",
  (req, res, next) => {
    req.supabase = supabase;
    next();
  },
  syncRoutes
);
app.use("/api/auth", authRoutes);
app.use(
  "/api/contests",
  (req, res, next) => {
    req.supabase = supabase;
    next();
  },
  contestRoutes
);
app.use("/api/discussions", discussionRoutes);
console.log("✅ All routes mounted");

// ─── Start Server ────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
