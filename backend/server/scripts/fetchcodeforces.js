// backend/server/scripts/fetchCodeforces.js
require('dotenv').config();
const axios = require('axios');
const pool = require('../db');

async function fetchAndStore() {
  try {
    console.log('⏳ Fetching problems from Codeforces...');
    const { data } = await axios.get('https://codeforces.com/api/problemset.problems');
    let problems = data.result.problems;

    // Only keep the first 10
    problems = problems.slice(0, 10);

    console.log(`⚙️  Upserting ${problems.length} problems...`);
    for (let p of problems) {
      await pool.query(
        `
        INSERT INTO Problem 
          (source_oj_id, external_id, title, url, difficulty, time_limit, mem_limit)
        VALUES 
          ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (source_oj_id, external_id) DO UPDATE
          SET title       = EXCLUDED.title,
              url         = EXCLUDED.url,
              difficulty  = EXCLUDED.difficulty,
              time_limit  = EXCLUDED.time_limit,
              mem_limit   = EXCLUDED.mem_limit,
              fetched_at  = CURRENT_TIMESTAMP
        `,
        [
          1,  // assuming judge_id = 1 for Codeforces
          `${p.contestId}${p.index}`,
          p.name,
          `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`,
          p.rating?.toString() || null,
          (p.timeLimitSeconds || 1) * 1000,
          512 * 1024  // example mem limit
        ]
      );
    }
    console.log('✅ Done upserting 10 problems.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

fetchAndStore();
