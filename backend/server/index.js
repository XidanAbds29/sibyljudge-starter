require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL connection setup
const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
});

// Test route
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ message: 'Backend is working!', time: result.rows[0].now });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// ✅ Get latest problems
app.get('/api/problems', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM problem WHERE source_oj_id = 1 ORDER BY fetched_at DESC LIMIT 10`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching problems:', err);
    res.status(500).json({ error: 'Failed to fetch problems' });
  }
});

// ✅ Get a single problem by external_id
app.get('/api/problems/:external_id', async (req, res) => {
  const { external_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM problem WHERE external_id = $1 AND source_oj_id = 1`,
      [external_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error fetching single problem:', err);
    res.status(500).json({ error: 'Failed to fetch problem' });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
