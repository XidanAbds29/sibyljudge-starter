// backend/server/fetchers/atcoder.js
const axios = require("axios");
const cheerio = require("cheerio");
const { scrapeProblem } = require("./shared/scraper");

// Delay helper
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch problem sections from AtCoder with retries
 */
async function fetchProblemWithRetry(contestId, problemId, maxRetries = 3) {
  const url = `https://atcoder.jp/contests/${contestId}/tasks/${problemId}`;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `Fetching AtCoder problem ${problemId} (attempt ${attempt}/${maxRetries})`
      );
      const sections = await scrapeProblem(url, {
        selectors: {
          main: ".lang-en .part",
          statement: ".lang-en .part:first-child",
          input:
            '.lang-en .part:contains("Constraints"), .lang-en .part:contains("Input")',
          output: '.lang-en .part:contains("Output")',
          sampleSelectors: {
            input: ".lang-en .part pre:nth-child(odd)",
            output: ".lang-en .part pre:nth-child(even)",
          },
        },
        headers: {
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      if (sections) {
        console.log(`✓ Successfully fetched ${problemId}`);
        return sections;
      }

      throw new Error("No sections found");
    } catch (err) {
      lastError = err;
      console.error(
        `Error fetching ${problemId} (attempt ${attempt}):`,
        err.message
      );
      if (attempt < maxRetries) {
        const backoff = Math.min(1000 * Math.pow(2, attempt), 10000);
        console.log(`Waiting ${backoff}ms before retry...`);
        await delay(backoff);
      }
    }
  }

  throw lastError;
}

async function fetchAtCoder(limit = 10) {
  try {
    // Fetch recent contests first
    console.log("Fetching AtCoder contests...");
    const { data: contestsHtml } = await axios.get(
      "https://atcoder.jp/contests?lang=en",
      {
        headers: { "Accept-Language": "en" },
      }
    );

    const $ = cheerio.load(contestsHtml);
    const contests = $(".table-default tbody tr")
      .map((_, tr) => {
        const link = $(tr).find("td:eq(1) a").attr("href");
        const id = link?.split("/")[2];
        return id;
      })
      .get()
      .filter(Boolean)
      .slice(0, 3); // Get last 3 contests for problems

    console.log(`Found contests: ${contests.join(", ")}`);
    const results = [];

    // Fetch problems from each contest
    for (const contestId of contests) {
      try {
        console.log(`\nFetching problems from contest ${contestId}...`);
        const { data: tasksHtml } = await axios.get(
          `https://atcoder.jp/contests/${contestId}/tasks?lang=en`,
          {
            headers: { "Accept-Language": "en" },
          }
        );

        const $tasks = cheerio.load(tasksHtml);
        const problems = $tasks(".table-default tbody tr")
          .map((_, tr) => {
            const link = $tasks(tr).find("td:eq(0) a");
            return {
              id: link.attr("href")?.split("/").pop(),
              title: link.text().trim(),
            };
          })
          .get()
          .filter((p) => p.id)
          .slice(0, Math.ceil(limit / contests.length));

        // Fetch each problem's details
        for (const problem of problems) {
          try {
            const sections = await fetchProblemWithRetry(contestId, problem.id);
            await delay(2000); // Be nice to AtCoder servers

            if (sections) {
              results.push({
                source_oj_id: 2,
                external_id: problem.id,
                title: problem.title,
                url: `https://atcoder.jp/contests/${contestId}/tasks/${problem.id}`,
                difficulty: null,
                time_limit: 2000,
                mem_limit: 1024 * 1024,
                sections,
              });
              console.log(`✓ Added problem: ${problem.title}`);
            }
          } catch (err) {
            console.error(
              `Failed to fetch problem ${problem.id}:`,
              err.message
            );
          }
        }
      } catch (err) {
        console.error(`Error fetching contest ${contestId}:`, err.message);
      }
    }

    console.log(`\nFetched ${results.length} problems from AtCoder`);
    return results;
  } catch (err) {
    console.error("Error in fetchAtCoder:", err);
    return [];
  }
}

module.exports = { fetchAtCoder };
