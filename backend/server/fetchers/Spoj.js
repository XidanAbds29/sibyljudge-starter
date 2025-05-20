// backend/server/fetchers/spoj.js
const axios   = require('axios');
const cheerio = require('cheerio');

// short delay to be polite
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch the raw HTML inside #problem-body from a SPOJ problem page.
 */
async function fetchStatement(code) {
  const url = `https://www.spoj.com/problems/${code}/`;
  console.log(`🔍 fetching statement for ${code} from ${url}`);
  try {
    const { data: html } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000,
    });

    // DEBUG: show a snippet of the returned HTML
    console.log(`   → received ${html.length} chars HTML`);
    const snippet = html.slice(0, 500).replace(/\n/g, '').replace(/\s+/g,' ');
    console.log(`   → snippet: ${snippet.substring(0,200)}…`);

    const $ = cheerio.load(html);
    const container = $('#problem-body');
    console.log(`   → cheerio found #problem-body?`, container.length);

    const stmt = container.html();
    if (stmt) {
      console.log(`   ✓ extracted ${stmt.length} chars of statement`);
      return stmt;
    }

    console.warn(`   ⚠️  no #problem-body.html() found`);
    return null;
  } catch (err) {
    console.error(`   ❌ error fetching ${code}:`, err.message);
    return null;
  }
}

async function fetchSPOJ(limit = 10) {
  const results = [];

  console.log(`🔍 fetching problem list from SPOJ/classical, limit=${limit}`);
  let listHtml;
  try {
    const resp = await axios.get('https://www.spoj.com/problems/classical/', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000,
    });
    listHtml = resp.data;
  } catch (err) {
    console.error('❌ error fetching problem list:', err.message);
    return results;
  }

  const $ = cheerio.load(listHtml);
  const rows = $('table.problems tbody tr').slice(0, limit).toArray();
  console.log(`   → found ${rows.length} rows`);

  for (let tr of rows) {
    const tds = $(tr).find('td');
    const href = tds.eq(1).find('a').attr('href') || '';
    const code = href.split('/')[2];
    const title = tds.eq(2).text().trim();

    const statement_html = await fetchStatement(code);
    await delay(1000);

    results.push({
      source_oj_id:   3,
      external_id:    code,
      title,
      url:            `https://www.spoj.com/problems/${code}/`,
      difficulty:     rating?.toString() || null,
      time_limit:     1000,
      mem_limit:      1536 * 1024,
      statement_html,
    });
  }

  console.log(`✅ fetchSPOJ returning ${results.length} items`);
  return results;
}

module.exports = { fetchSPOJ };
