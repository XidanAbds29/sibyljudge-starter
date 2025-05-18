// backend/server/routes/syncRoutes.js
const express = require("express");
const pool = require("../db");
const { fetchCodeforces } = require("../fetchers/codeforces");
const { fetchAtCoder } = require("../fetchers/atcoder");
const { fetchSPOJ } = require("../fetchers/spoj");

const FETCHERS = {
  1: fetchCodeforces,
  2: fetchAtCoder,
  3: fetchSPOJ,
};

const router = express.Router();

router.post("/", async (req, res) => {
  console.log("📬 POST /api/sync", req.body);
  const { judgeId, limit } = req.body;
  const fetcher = FETCHERS[judgeId];
  if (!fetcher) {
    return res.status(400).json({ error: "Unknown judgeId" });
  }

  try {
    const items = await fetcher(limit);
    console.log(`   → upserting ${items.length} items…`);
    for (let p of items) {
      await pool.query(
        `INSERT INTO problem
           (source_oj_id, external_id, title, url, difficulty, time_limit,
            mem_limit, statement_html, fetched_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,CURRENT_TIMESTAMP)
         ON CONFLICT (source_oj_id,external_id) DO UPDATE
           SET title          = EXCLUDED.title,
               url            = EXCLUDED.url,
               difficulty     = EXCLUDED.difficulty,
               time_limit     = EXCLUDED.time_limit,
               mem_limit      = EXCLUDED.mem_limit,
               statement_html = EXCLUDED.statement_html,
               fetched_at     = CURRENT_TIMESTAMP`,
        [
          p.source_oj_id,
          p.external_id,
          p.title,
          p.url,
          p.difficulty,
          p.time_limit,
          p.mem_limit,
          p.statement_html,
        ]
      );
    }
    return res.json({ synced: items.length });
  } catch (err) {
    console.error("❌ Sync failed:", err);
    return res.status(500).json({ error: "Sync failed" });
  }
});

module.exports = router;
