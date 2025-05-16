require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
});

// Test route
app.get("/", async (req, res) => {
  const { rows } = await pool.query("SELECT NOW()");
  res.json({ message: "OK", time: rows[0].now });
});

const judgeRoutes   = require("./routes/judgeRoutes");
// Sync   (POST /api/sync)
const syncRoutes    = require("./routes/syncRoutes");
// Problems (GET /api/problems, GET /api/problems/:external_id)
const problemRoutes = require("./routes/problemRoutes");

app.use("/api/judges",   judgeRoutes);
app.use("/api/sync",      syncRoutes);
app.use("/api/problems",  problemRoutes);
// Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
