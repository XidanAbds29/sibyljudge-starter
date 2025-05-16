// backend/server/fetchers/spoj.js
const axios = require("axios");
const cheerio = require("cheerio");

async function fetchSPOJ(limit = 10) {
  const { data: html } = await axios.get(
    "https://www.spoj.com/problems/classical/"
  );
  const $ = cheerio.load(html);

  return $("table.problems tr")
    .slice(1, limit + 1)
    .map((_, tr) => {
      const tds = $(tr).find("td");
      const code = tds.eq(0).text().trim();
      const link = tds.eq(0).find("a").attr("href"); // '/problems/ABC/'
      const title = tds.eq(1).text().trim();
      return {
        source_oj_id: 3,
        external_id: code,
        title,
        url: `https://www.spoj.com${link}`,
        difficulty: null,
        time_limit: 1000,
        mem_limit: 1536 * 1024,
        statement_html: null,
      };
    })
    .get();
}

module.exports = { fetchSPOJ };
