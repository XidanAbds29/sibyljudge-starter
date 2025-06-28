// backend/server/fetchers/submitters/codeforces.js
const puppeteer = require("puppeteer");
const { loadSessionPool, getAvailableSession } = require("../cfSessionPool");

const LANGUAGE_IDS = {
  cpp: "54", // GNU G++17 7.3.0
  python: "31", // Python 3.8.10
  java: "36", // Java 11.0.6
};

async function submitToCodeforces(problemId, code, language) {
  // Extract contestId and index from problemId (e.g., "1234A" -> contestId=1234, index="A")
  const contestId = problemId.match(/\d+/)[0];
  const index = problemId.match(/[A-Z]+/)[0];

  // Use a session from the pool
  const pool = loadSessionPool();
  const session = getAvailableSession(pool);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"],
  });

  try {
    const page = await browser.newPage();
    // Set session cookies before navigating
    await page.setCookie(...session.cookies);

    // Go directly to the submission page
    const submitUrl = `https://codeforces.com/contest/${contestId}/submit/${index}`;
    await page.goto(submitUrl, { waitUntil: "networkidle0" });

    // Check if still logged in
    const isLoggedIn = await page.$('a[href="/logout"]');
    if (!isLoggedIn) {
      throw new Error(
        "Session expired or not logged in. Please refresh cookies for this account."
      );
    }

    // Fill submission form
    await page.select('select[name="programTypeId"]', LANGUAGE_IDS[language]);
    await page.type('textarea[name="sourceCode"]', code);

    // Submit the form
    await Promise.all([
      page.click('input[type="submit"]'),
      page.waitForNavigation({ waitUntil: "networkidle0" }),
    ]);

    // Get to the status page and wait for verdict
    const statusUrl = `https://codeforces.com/contest/${contestId}/my`;
    await page.goto(statusUrl);

    await page.waitForFunction(
      () => {
        const verdictCell = document.querySelector("td.status-cell");
        return verdictCell && !verdictCell.textContent.includes("Running");
      },
      { timeout: 30000 }
    );

    // Extract verdict details
    const verdict = await page.evaluate(() => {
      const row = document.querySelector("tr[data-submission-id]");
      const verdictCell = row.querySelector("td.status-cell");
      const timeCell = row.querySelector("td.time-consumed-cell");
      const memoryCell = row.querySelector("td.memory-consumed-cell");
      return {
        status: verdictCell.textContent.trim(),
        exec_time: parseFloat(timeCell.textContent) || 0,
        verdict_detail: `Memory: ${memoryCell.textContent.trim()}`,
      };
    });

    return {
      ...verdict,
      status: normalizeVerdict(verdict.status),
    };
  } finally {
    await browser.close();
  }
}

function normalizeVerdict(cfVerdict) {
  const verdictMap = {
    Accepted: "Accepted",
    "Wrong answer": "Wrong Answer",
    "Time limit exceeded": "Time Limit Exceeded",
    "Memory limit exceeded": "Memory Limit Exceeded",
    "Runtime error": "Runtime Error",
    "Compilation error": "Compilation Error",
  };
  for (const [cf, normalized] of Object.entries(verdictMap)) {
    if (cfVerdict.includes(cf)) return normalized;
  }
  return "Other";
}

module.exports = { submitToCodeforces };
