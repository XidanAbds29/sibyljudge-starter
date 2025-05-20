require("dotenv").config();
const pool = require("../db");

async function inspectProblems() {
  try {
    console.log("Inspecting problem sections...\n");

    const { rows: problems } = await pool.query(`
            SELECT p.*, oj.name as judge_name
            FROM problem p
            JOIN online_judge oj ON oj.judge_id = p.source_oj_id
            ORDER BY p.fetched_at DESC
            LIMIT 5
        `);

    for (const p of problems) {
      console.log(`\nProblem: ${p.title} (${p.judge_name})`);
      console.log("Input spec length:", p.input_spec?.length || 0);
      console.log("Output spec length:", p.output_spec?.length || 0);
      console.log("Statement length:", p.statement_html?.length || 0);
      if (p.input_spec) {
        console.log(
          "\nFirst 100 chars of input spec:",
          p.input_spec.substring(0, 100)
        );
      }
      if (p.output_spec) {
        console.log(
          "\nFirst 100 chars of output spec:",
          p.output_spec.substring(0, 100)
        );
      }
      console.log("\n---");
    }
  } catch (err) {
    console.error("Error inspecting problems:", err);
  } finally {
    await pool.end();
  }
}

inspectProblems();
