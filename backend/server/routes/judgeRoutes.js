
const express = require("express");
const pool = require("../db");
const router = express.Router();

router.get("/", async (req, res) => {
  const { rows } = await pool.query("SELECT judge_id, name FROM online_judge");
  res.json(rows);
});

module.exports = router;
