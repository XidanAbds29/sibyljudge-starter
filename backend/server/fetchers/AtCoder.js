// backend/server/fetchers/atcoder.js
const axios = require("axios");
const cheerio = require("cheerio");

async function fetchAtCoder(limit = 10) {
  const { data: html } = await axios.get("https://atcoder.jp/contests/archive");
  const $ = cheerio.load(html);

  const rows = $("table.archive-table tbody tr").slice(0, limit);
  return rows
    .map((_, tr) => {
      const tds = $(tr).find("td");
      const link = tds.eq(1).find("a");
      const title = link.text().trim();
      const path = link.attr("href");
      const external_id = path.split("/").pop(); // e.g. 'abc123_a'
      const url = `https://atcoder.jp${path}`;

      return {
        source_oj_id: 2,
        external_id,
        title,
        url,
        difficulty: null,
        time_limit: 2000,
        mem_limit: 1024 * 1024,
        statement_html: null,
      };
    })
    .get();
}

module.exports = { fetchAtCoder };
