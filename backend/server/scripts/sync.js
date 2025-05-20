require("dotenv").config();
const pool = require("../db");
const fs = require("fs").promises;
const path = require("path");
const { fetchCodeforces } = require("../fetchers/codeforces");
const { fetchAtCoder } = require("../fetchers/atcoder");
const { fetchSPOJ } = require("../fetchers/spoj");
const { fetchCodeChef } = require("../fetchers/codechef");

async function runMigrations() {
  console.log("Running migrations...");
  const migrationsDir = path.join(__dirname, "..", "psql", "migrations");
  const files = await fs.readdir(migrationsDir);

  for (const file of files.sort()) {
    if (!file.endsWith(".sql")) continue;
    console.log(`Running migration: ${file}`);
    const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
    await pool.query(sql);
  }
}

async function setupJudges() {
  console.log("Setting up judges...");

  // Reset sequences and clean tables
  await pool.query("TRUNCATE online_judge RESTART IDENTITY CASCADE");

  // Insert judges with specific IDs
  const judges = [
    { id: 1, name: "Codeforces", api_based_url: "https://codeforces.com" },
    { id: 2, name: "AtCoder", api_based_url: "https://atcoder.jp" },
    { id: 3, name: "SPOJ", api_based_url: "https://www.spoj.com" },
    { id: 4, name: "CodeChef", api_based_url: "https://www.codechef.com" },
  ];

  for (const judge of judges) {
    await pool.query(
      "INSERT INTO online_judge (judge_id, name, api_based_url) VALUES ($1, $2, $3)",
      [judge.id, judge.name, judge.api_based_url]
    );
    console.log(`Added judge: ${judge.name} with ID ${judge.id}`);
  }

  // Verify judges were added
  const { rows } = await pool.query(
    "SELECT * FROM online_judge ORDER BY judge_id"
  );
  console.log("Current judges in database:", rows);
}

async function fetchProblems() {
  const fetchers = {
    1: fetchCodeforces,
    2: fetchAtCoder,
    3: fetchSPOJ,
    4: fetchCodeChef,
  };

  for (const [judgeId, fetcher] of Object.entries(fetchers)) {
    console.log(`\nFetching from judge ${judgeId}...`);
    try {
      const problems = await fetcher(10);
      console.log(`Got ${problems?.length || 0} problems`);

      if (!problems?.length) {
        console.log("No problems returned, skipping...");
        continue;
      }

      for (const p of problems) {
        try {
          const result = await pool.query(
            `INSERT INTO problem (
              source_oj_id, external_id, title, url,
              difficulty, time_limit, mem_limit,
              statement_html, input_spec, output_spec, samples
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            RETURNING problem_id`,
            [
              parseInt(judgeId),
              p.external_id,
              p.title,
              p.url,
              p.difficulty?.toString(),
              p.time_limit,
              p.mem_limit,
              p.sections?.statement || p.statement_html,
              p.sections?.input,
              p.sections?.output,
              JSON.stringify(p.sections?.samples || []),
            ]
          );
          console.log(`✓ Inserted problem: ${p.title}`);

          // Insert tags if any
          if (p.tags?.length) {
            for (const tagName of p.tags) {
              const { rows } = await pool.query(
                `INSERT INTO tag (name)
                VALUES ($1)
                ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
                RETURNING tag_id`,
                [tagName]
              );

              await pool.query(
                `INSERT INTO problem_tag (problem_id, tag_id)
                VALUES ($1, $2)
                ON CONFLICT DO NOTHING`,
                [result.rows[0].problem_id, rows[0].tag_id]
              );
            }
            console.log(`  Added ${p.tags.length} tags`);
          }
        } catch (err) {
          console.error(`Error inserting problem ${p.title}:`, err.message);
        }
      }
    } catch (err) {
      console.error(`Error fetching from judge ${judgeId}:`, err);
    }
  }
}

async function main() {
  try {
    await runMigrations();
    await setupJudges();
    await fetchProblems();
    console.log("\nDone! Syncing completed successfully.");
  } catch (err) {
    console.error("\nSync failed:", err);
  } finally {
    await pool.end();
  }
}

main();
