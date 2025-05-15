// backend/server/scripts/fetchProblemStatements.js
require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const pool = require('../db');

async function updateProblemStatements() {
  try {
    console.log('⏳ Fetching problems without statements...');
    const { rows: problems } = await pool.query(`
      SELECT external_id, url FROM problem
      WHERE source_oj_id = 1 AND statement_html IS NULL
      LIMIT 10;
    `);

    console.log(`🔍 Found ${problems.length} problems to update.`);

    for (const p of problems) {
      try {
        const { data: html } = await axios.get(p.url);
        const $ = cheerio.load(html);
        const statementHtml = $('.problem-statement').html();

        if (!statementHtml) {
          console.warn(`⚠️  Could not find statement for ${p.url}`);
          continue;
        }

        await pool.query(
          `UPDATE problem SET statement_html = $1, fetched_at = CURRENT_TIMESTAMP
           WHERE external_id = $2 AND source_oj_id = 1`,
          [statementHtml, p.external_id]
        );

        console.log(`✅ Updated: ${p.url}`);
      } catch (innerErr) {
        console.error(`❌ Error fetching ${p.url}:`, innerErr.message);
      }
    }

    console.log('🎉 All done.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Scraping failed:', err);
    process.exit(1);
  }
}

updateProblemStatements();
