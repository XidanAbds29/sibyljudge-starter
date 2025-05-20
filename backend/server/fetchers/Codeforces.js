// backend/server/fetchers/codeforces.js
// Fetcher module for Codeforces problems and statements
require("dotenv").config();
const axiosBase = require("axios");
const { wrapper } = require("axios-cookiejar-support");
const { CookieJar } = require("tough-cookie");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const { scrapeProblem } = require("./shared/scraper");

// Wrap axios to support cookies
const axios = wrapper(axiosBase);

// Delay helper to avoid being blocked
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch problem sections from Codeforces
 */
async function fetchSections(contestId, index) {
  const url = `https://codeforces.com/contest/${contestId}/problem/${index}`;

  try {
    console.log(`Fetching problem sections from ${url}`);
    const sections = await scrapeProblem(url, {
      selectors: {
        main: ".problem-statement",
        statement: [
          ".problem-statement > div:nth-child(2)",
          ".problem-statement > .tex-font-style-normal:not(.title,.time-limit,.memory-limit,.input-file,.output-file)",
        ].join(","),
        input: [
          ".input-specification > div:not(.section-title)",
          ".input-specification .tex-font-style-normal",
          '.problem-statement > div:contains("Input")',
        ].join(","),
        output: [
          ".output-specification > div:not(.section-title)",
          ".output-specification .tex-font-style-normal",
          '.problem-statement > div:contains("Output")',
        ].join(","),
        sampleSelectors: {
          input: ".sample-test .input pre",
          output: ".sample-test .output pre",
        },
      },
    });

    if (!sections) {
      throw new Error("No sections found");
    }

    return sections;
  } catch (err) {
    console.error(`Error fetching problem ${contestId}${index}:`, err.message);
    return null;
  }
}

/**
 * Fetch a batch of Codeforces problems
 */
async function fetchCodeforces(limit = 10) {
  try {
    console.log("Fetching problems from Codeforces API...");
    const { data } = await axios.get(
      "https://codeforces.com/api/problemset.problems"
    );

    if (!data?.result?.problems) {
      throw new Error("Invalid API response");
    }

    const problems = data.result.problems.slice(0, limit);
    const results = [];

    for (const problem of problems) {
      try {
        console.log(`Processing problem ${problem.contestId}${problem.index}`);

        const sections = await fetchSections(problem.contestId, problem.index);
        await delay(2000); // Be nice to CF servers

        if (sections) {
          results.push({
            source_oj_id: 1,
            external_id: `${problem.contestId}${problem.index}`,
            title: problem.name,
            url: `https://codeforces.com/contest/${problem.contestId}/problem/${problem.index}`,
            difficulty: problem.rating?.toString() || null,
            time_limit: (problem.timeLimit || 1) * 1000,
            mem_limit: (problem.memoryLimit || 256) * 1024,
            statement_html: sections.statement,
            input_spec: sections.input,
            output_spec: sections.output,
            samples: sections.samples || [],
            tags: problem.tags || [],
          });
          console.log(`✓ Added problem: ${problem.name}`);
        }
      } catch (err) {
        console.error(
          `Error processing problem ${problem.contestId}${problem.index}:`,
          err.message
        );
      }
    }

    console.log(`Fetched ${results.length} problems from Codeforces`);
    return results;
  } catch (err) {
    console.error("Error fetching from Codeforces:", err);
    return [];
  }
}

module.exports = { fetchCodeforces };
