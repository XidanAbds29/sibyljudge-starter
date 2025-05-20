require("dotenv").config();
const pool = require("../db");

async function verifyDatabase() {
  try {
    console.log("Verifying database connection and tables...");

    // Test database connection
    const testConn = await pool.query("SELECT NOW()");
    console.log("✅ Database connection successful");

    // Verify tables exist
    const tables = [
      "online_judge",
      "problem",
      "problem_tag",
      "tag",
      "submission",
    ];
    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(
          `✅ Table ${table} exists and has ${result.rows[0].count} rows`
        );
      } catch (err) {
        console.error(`❌ Table ${table} check failed:`, err.message);
      }
    }

    // Check if judges are set up
    const { rows: judges } = await pool.query(
      "SELECT * FROM online_judge ORDER BY judge_id"
    );
    if (judges.length === 0) {
      console.log("❌ No judges found in online_judge table");
    } else {
      console.log("✅ Found judges:", judges.map((j) => j.name).join(", "));
    }

    console.log("\nDatabase verification complete!");
  } catch (err) {
    console.error("Database verification failed:", err);
  } finally {
    await pool.end();
  }
}

verifyDatabase();
