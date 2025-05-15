const express = require("express");
const pool = require("../db");
const router = express.Router();

// GET /api/problems — List latest problems
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT problem_id, external_id, title, url, difficulty, time_limit, mem_limit 
      FROM problem
      ORDER BY fetched_at DESC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching problems:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/problems/:external_id — Single problem by external_id
router.get("/:external_id", async (req, res) => {
  const { external_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM problem WHERE external_id = $1`,
      [external_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Problem not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching problem:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
