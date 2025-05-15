// server/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('🟢 Server is up');
});

// Example: list users
app.get('/api/users', async (req, res) => {
  const result = await pool.query('SELECT * FROM "User"');
  res.json(result.rows);
});

app.listen(process.env.PORT, () =>
  console.log(`🚀 Server listening on port ${process.env.PORT}`)
);
