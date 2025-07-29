require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// ─── Supabase Client ────────────────────────────
const { createClient } = require("@supabase/supabase-js");
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.PUBLIC_SUPABASE_ANON_KEY ||
  ""
).trim();
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Supabase URL or Service Key missing in environment variables"
  );
}

// Debug: Log key info to help diagnose 403 errors
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
console.log("[DEBUG] supabaseUrl:", supabaseUrl);
console.log("[DEBUG] supabaseServiceKey length:", supabaseServiceKey.length);
console.log(
  "[DEBUG] supabaseServiceKey starts with:",
  supabaseServiceKey.substring(0, 10)
);
console.log(
  "[DEBUG] supabaseServiceKey ends with:",
  supabaseServiceKey.slice(-10)
);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test Supabase connection at startup
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
const groupRoutes = require("./routes/groupRoutes");
const discussionRoutes = require("./routes/DiscussionRoutes");

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
app.use(
  "/api/contest-submissions",
  (req, res, next) => {
    req.supabase = supabase;
    next();
  },
  contestSubmissionRoutes
);
app.use(
  "/api/standings",
  (req, res, next) => {
    req.supabase = supabase;
    next();
  },
  standingsRoutes
);
app.use(
  "/api/groups",
  (req, res, next) => {
    req.supabase = supabase;
    next();
  },
  groupRoutes
);
app.use(
  "/api/discussions",
  (req, res, next) => {
    req.supabase = supabase;
    next();
  },
  discussionRoutes
);

// ─── Error Handling ──────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// ─── Start Server ────────────────────────────────
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
