require('dotenv').config();
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
const axios = wrapper(require('axios'));
const puppeteer = require('puppeteer');
const pool = require('../db');
const cheerio = require('cheerio');

// Delay helper (to avoid being blocked)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchStatement(contestId, index) {
  // Use contest endpoint; avoid non-resolvable mobile subdomain
  const url = `https://codeforces.com/contest/${contestId}/problem/${index}`;
  const jar = new CookieJar();

  try {
    const { data: html } = await axios.get(url, {
      jar,
      withCredentials: true,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Referer': 'https://codeforces.com/',
        'Sec-Ch-Ua': '"Chromium";v="123", "Google Chrome";v="123", ";Not A Brand";v="99"',
        'Sec-Ch-Ua-Mobile': '?0',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(html);
    const stmt = $('.problem-statement').html();
    if (stmt) return stmt;
    throw new Error('No .problem-statement found');
  } catch (err) {
    const status = err.response?.status;
    // Fallback to Puppeteer on 403 or missing statement
    if (status === 403 || /No \.problem-statement/.test(err.message)) {
      console.log(`🔄 Puppeteer fallback for ${contestId}${index}`);
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
      );
      await page.goto(url, { waitUntil: 'networkidle2' });
      const statementHtml = await page.$eval('.problem-statement', el => el.innerHTML);
      await browser.close();
      return statementHtml;
    }
    console.error(`❌ fetchStatement failed for ${contestId}${index}:`, err.message);
    return null;
  }
}

async function fetchAndStore() {
  try {
    console.log('⏳ Fetching problems from Codeforces...');
    const { data } = await axios.get('https://codeforces.com/api/problemset.problems');
    const problems = data.result.problems.slice(0, 10); // limit to first 10

    console.log(`⚙️  Upserting ${problems.length} problems with statements...`);
    for (let p of problems) {
        const { contestId, index, name, rating, timeLimitSeconds } = p;
        const url = `https://codeforces.com/contest/${contestId}/problem/${index}`; // <== Add this line
        const statementHtml = await fetchStatement(contestId, index);
        await delay(2000); // be polite
      
        await pool.query(
          `INSERT INTO problem
            (source_oj_id, external_id, title, url, difficulty, time_limit, mem_limit, statement_html, fetched_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
           ON CONFLICT (source_oj_id, external_id) DO UPDATE
             SET title          = EXCLUDED.title,
                 url            = EXCLUDED.url,
                 difficulty     = EXCLUDED.difficulty,
                 time_limit     = EXCLUDED.time_limit,
                 mem_limit      = EXCLUDED.mem_limit,
                 statement_html = EXCLUDED.statement_html,
                 fetched_at     = CURRENT_TIMESTAMP`,
          [
            1, // Codeforces judge_id
            `${contestId}${index}`,
            name,
            url,
            rating?.toString() || null,
            (timeLimitSeconds || 1) * 1000,
            512 * 1024,
            statementHtml,
          ]
        );
      }
      

    console.log('✅ Done upserting problems.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message || err);
    process.exit(1);
  }
}

fetchAndStore();
