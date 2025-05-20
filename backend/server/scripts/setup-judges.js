require("dotenv").config();
const pool = require("../db");

async function setupJudges() {
  try {
    // First clear any existing judges
    await pool.query("DELETE FROM online_judge");

    // Insert the supported judges
    const judges = [
      { name: "Codeforces", api_based_url: "https://codeforces.com" },
      { name: "AtCoder", api_based_url: "https://atcoder.jp" },
      { name: "SPOJ", api_based_url: "https://www.spoj.com" },
      { name: "CodeChef", api_based_url: "https://www.codechef.com" },
    ];

    for (const judge of judges) {
      await pool.query(
        "INSERT INTO online_judge (name, api_based_url) VALUES ($1, $2)",
        [judge.name, judge.api_based_url]
      );
      console.log(`Added judge: ${judge.name}`);
    }

    console.log("All judges added successfully!");
    const { rows } = await pool.query(
      "SELECT * FROM online_judge ORDER BY judge_id"
    );
    console.log("Current judges:", rows);
  } catch (err) {
    console.error("Error setting up judges:", err);
  } finally {
    pool.end();
  }
}

setupJudges();
