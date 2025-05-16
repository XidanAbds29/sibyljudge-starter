// backend/server/fetchers/codeforces.js
// Fetcher module for Codeforces problems and statements
require("dotenv").config();
const axiosBase = require("axios");
const { wrapper } = require("axios-cookiejar-support");
const { CookieJar } = require("tough-cookie");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");

// Wrap axios to support cookies
const axios = wrapper(axiosBase);

// Delay helper to avoid being blocked
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch the HTML statement of a Codeforces problem.
 * Falls back to Puppeteer if blocked or not found via HTTP.
 *
 * @param {number} contestId
 * @param {string} index
 * @returns {string|null} HTML content of the .problem-statement
 */
async function fetchStatement(contestId, index) {
  const url = `https://codeforces.com/contest/${contestId}/problem/${index}`;
  const jar = new CookieJar();
  // Set a dummy cookie to reduce blocking
  jar.setCookieSync("RCPC=1; Domain=codeforces.com; Path=/", url);

  try {
    const { data: html } = await axios.get(url, {
      jar,
      withCredentials: true,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Connection: "keep-alive",
        Referer: "https://codeforces.com/",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(html);
    const stmt = $(".problem-statement").html();
    if (stmt) return stmt;
    throw new Error("No .problem-statement found");
  } catch (err) {
    const status = err.response?.status;
    // Fallback to Puppeteer on 403 or missing statement
    if (status === 403 || /No \.problem-statement/.test(err.message)) {
      console.log(`🔄 Puppeteer fallback for ${contestId}${index}`);
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
      );
      await page.goto(url, { waitUntil: "networkidle2" });
      const statementHtml = await page.$eval(
        ".problem-statement",
        (el) => el.innerHTML
      );
      await browser.close();
      return statementHtml;
    }
    console.error(
      `❌ fetchStatement failed for ${contestId}${index}:`,
      err.message
    );
    return null;
  }
}

/**
 * Fetch a batch of Codeforces problems (metadata + statements).
 *
 * @param {number} limit Number of problems to fetch (default 10)
 * @returns {Promise<Array>} Array of problem objects matching DB schema
 */
async function fetchCodeforces(limit = 10) {
  // 1) Get metadata from API
  const { data } = await axiosBase.get(
    "https://codeforces.com/api/problemset.problems"
  );
  const problems = data.result.problems.slice(0, limit);
  const results = [];

  for (let p of problems) {
    const { contestId, index, name, rating, timeLimitSeconds } = p;
    // 2) Scrape statement HTML
    const statementHtml = await fetchStatement(contestId, index);
    await delay(2000);

    results.push({
      source_oj_id: 1, // Codeforces judge_id
      external_id: `${contestId}${index}`,
      title: name,
      url: `https://codeforces.com/contest/${contestId}/problem/${index}`,
      difficulty: rating?.toString() || null,
      time_limit: (timeLimitSeconds || 1) * 1000,
      mem_limit: 512 * 1024,
      statement_html: statementHtml,
    });
  }

  return results;
}

module.exports = { fetchCodeforces };
