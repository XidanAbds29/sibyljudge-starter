require("dotenv").config();
const pool = require("../db");

async function verifyProblems() {
  try {
    console.log("Checking database state...\n");

    // Check judges
    const { rows: judges } = await pool.query(
      "SELECT * FROM online_judge ORDER BY judge_id"
    );
    console.log("Judges in database:", judges.length);
    for (const judge of judges) {
      console.log(`- ${judge.name} (ID: ${judge.judge_id})`);
    }
    console.log();

    // Check problems
    const { rows: problems } = await pool.query(`
            SELECT p.*, oj.name as judge_name,
                   (SELECT COUNT(*) FROM problem_tag pt WHERE pt.problem_id = p.problem_id) as tag_count
            FROM problem p
            JOIN online_judge oj ON oj.judge_id = p.source_oj_id
            ORDER BY p.fetched_at DESC
        `);

    console.log("Problems in database:", problems.length);
    console.log("\nLatest problems:");
    for (const p of problems.slice(0, 5)) {
      console.log(`\n${p.title} (${p.judge_name})`);
      console.log(`- ID: ${p.external_id}`);
      console.log(
        `- Sections: ${p.statement_html ? "✓" : "✗"} Statement, ${
          p.input_spec ? "✓" : "✗"
        } Input, ${p.output_spec ? "✓" : "✗"} Output, ${
          p.samples ? "✓" : "✗"
        } Samples`
      );
      console.log(`- Tags: ${p.tag_count}`);
    }

    // Check tags
    const { rows: tags } = await pool.query("SELECT * FROM tag");
    console.log(`\nTotal tags: ${tags.length}`);

    // Check submissions
    const { rows: submissions } = await pool.query(
      "SELECT COUNT(*) as count FROM submission"
    );
    console.log(`Total submissions: ${submissions[0].count}`);
  } catch (err) {
    console.error("Error verifying database:", err);
  } finally {
    await pool.end();
  }
}

verifyProblems();
