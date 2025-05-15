// backend/server/routes/problemRoutes.js
const express = require('express');
const pool = require('../db');
const router = express.Router();

// GET /api/problems
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT problem_id, title, url, difficulty, time_limit, mem_limit 
      FROM Problem
      ORDER BY fetched_at DESC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching problems:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
