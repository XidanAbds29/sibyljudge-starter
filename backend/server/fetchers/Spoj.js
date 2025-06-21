// backend/server/fetchers/spoj.js
const axios = require("axios");
const cheerio = require("cheerio");
const { scrapeProblem } = require("./shared/scraper");

// Delay helper with random jitter
const delay = async (ms) => {
  const jitter = Math.random() * 500;
  await new Promise((r) => setTimeout(r, ms + jitter));
};

/**
 * Fetch problem sections from SPOJ with retries
 */
async function fetchProblemWithRetry(code, maxRetries = 3) {
  const url = `https://www.spoj.com/problems/${code}/`;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `🔍 Fetching SPOJ problem ${code} (attempt ${attempt}/${maxRetries})`
      );
      const sections = await scrapeProblem(url, {
        selectors: {
          main: "#problem-body",
          statement: "#problem-body .prob p",
          input:
            '#problem-body p:contains("Input"), #problem-body h3:contains("Input") ~ p',
          output:
            '#problem-body p:contains("Output"), #problem-body h3:contains("Output") ~ p',
          sampleSelectors: {
            input:
              '#problem-body pre:contains("SAMPLE INPUT"), #problem-body pre:contains("Example Input")',
            output:
              '#problem-body pre:contains("SAMPLE OUTPUT"), #problem-body pre:contains("Example Output")',
          },
        },
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      if (!sections?.statement && !sections?.full) {
        throw new Error("No content found");
      }

      console.log(`✓ Successfully fetched ${code}`);
      return sections;
    } catch (err) {
      lastError = err;
      console.error(
        `❌ Error fetching ${code} (attempt ${attempt}):`,
        err.message
      );
      if (attempt < maxRetries) {
        const backoff = Math.min(2000 * Math.pow(2, attempt), 15000);
        console.log(`⏳ Waiting ${backoff}ms before retry...`);
        await delay(backoff);
      }
    }
  }

  throw lastError;
}

async function fetchSPOJ(limit = 10) {
  const results = [];
  console.log(`🔍 Fetching problem list from SPOJ/classical, limit=${limit}`);

  try {
    // First try to get the problem list
    const response = await axios.get(
      "https://www.spoj.com/problems/classical/",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
        timeout: 30000,
      }
    );

    const $ = cheerio.load(response.data);
    const problems = $("table.problems tbody tr")
      .slice(0, limit)
      .map((_, tr) => {
        const tds = $(tr).find("td");
        const href = tds.eq(1).find("a").attr("href") || "";
        const code = href.split("/")[2];
        const title = tds.eq(2).text().trim();
        return { code, title };
      })
      .get()
      .filter((p) => p.code);

    console.log(`Found ${problems.length} problems to fetch`);

    // Now fetch each problem with a delay between requests
    for (const problem of problems) {
      try {
        const sections = await fetchProblemWithRetry(problem.code);
        await delay(3000); // Increased delay between problems

        if (sections) {
          results.push({
            source_oj_id: 3,
            external_id: problem.code,
            title: problem.title,
            url: `https://www.spoj.com/problems/${problem.code}/`,
            difficulty: null,
            time_limit: 1000,
            mem_limit: 1536 * 1024,
            sections,
          });
          console.log(`✓ Added problem: ${problem.title}`);
        }
      } catch (err) {
        console.error(`Failed to fetch problem ${problem.code}:`, err.message);
      }
    }
  } catch (err) {
    console.error("❌ Error fetching SPOJ problem list:", err.message);
  }

  console.log(`✅ fetchSPOJ returning ${results.length} problems`);
  return results;
}

module.exports = { fetchSPOJ };
