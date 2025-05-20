require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// ─── PostgreSQL Connection ───────────────────────
console.log("⏳ Connecting to PostgreSQL...");
const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
});

pool
  .connect()
  .then(() => console.log("✅ PostgreSQL connected"))
  .catch((err) => console.error("❌ PostgreSQL connection error:", err));

// ─── Test Route ──────────────────────────────────
app.get("/", async (req, res) => {
  const { rows } = await pool.query("SELECT NOW()");
  res.json({ message: "OK", time: rows[0].now });
});

// ─── Route Imports ───────────────────────────────
console.log("🛣️ Loading routes...");
const judgeRoutes = require("./routes/judgeRoutes");
const syncRoutes = require("./routes/syncRoutes");
const problemRoutes = require("./routes/problemRoutes");
const submissionRoutes = require("./routes/submissionRoutes");

// ─── Mount Routes ────────────────────────────────
app.use("/api/judges", judgeRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/submissions", submissionRoutes);
console.log("✅ All routes mounted");

// ─── Start Server ────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
