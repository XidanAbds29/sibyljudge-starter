// backend/server/routes/submissionRoutes.js
const express = require("express");
const pool = require("../db");
const router = express.Router();
const { runCode } = require("../runners/testRunner");

// Map language IDs to judge-specific language codes
const LANGUAGE_CODES = {
  codeforces: {
    cpp: "54", // GNU G++17 7.3.0
    python: "31", // Python 3.8.10
    java: "36", // Java 11.0.6
  },
  atcoder: {
    cpp: "4003", // C++ (GCC 9.2.1)
    python: "4006", // Python (3.8.2)
    java: "4005", // Java (OpenJDK 11.0.6)
  },
  spoj: {
    cpp: "44", // C++17 (gcc 8.3)
    python: "116", // Python 3.8
    java: "10", // Java
  },
  codechef: {
    cpp: "63", // GNU G++17
    python: "116", // Python 3.9
    java: "10", // Java
  },
};

const { submitToCodeforces } = require("../fetchers/submitters/codeforces");

/**
 * Submit solution to the appropriate online judge
 */
async function submitToJudge(problem, code, language) {
  switch (problem.source_oj_id) {
    case 1: // Codeforces
      return await submitToCodeforces(problem.external_id, code, language);
    case 2: // AtCoder
      throw new Error("AtCoder submission not implemented yet");
    case 3: // SPOJ
      throw new Error("SPOJ submission not implemented yet");
    case 4: // CodeChef
      throw new Error("CodeChef submission not implemented yet");
    default:
      throw new Error(`Unknown judge ID: ${problem.source_oj_id}`);
  }
}

router.post("/", async (req, res) => {
  const { problem_id, language, code } = req.body;
  // TODO: Get actual user_id from session/auth
  const user_id = 1; // Mock user for now

  try {
    // 1. Get problem details to know which judge to submit to
    const problem = await pool.query(
      `SELECT p.*, o.name as judge_name 
       FROM problem p
       JOIN online_judge o ON o.judge_id = p.source_oj_id
       WHERE p.problem_id = $1`,
      [problem_id]
    );

    if (!problem.rows.length) {
      return res.status(404).json({ error: "Problem not found" });
    }

    // 2. Submit to judge and get verdict
    const verdict = await submitToJudge(problem.rows[0], code, language);

    // 3. Save submission to database
    const result = await pool.query(
      `INSERT INTO submission
         (user_id, problem_id, language, status, exec_time, verdict_detail)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        user_id,
        problem_id,
        language,
        verdict.status,
        verdict.exec_time,
        verdict.verdict_detail,
      ]
    );

    // 4. Update user's personal record
    await pool.query(
      `INSERT INTO personal_record
         (user_id, problem_id, status, attempts_count, 
          first_attempted, last_attempted, solved_at)
       VALUES ($1, $2, $3, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
               CASE WHEN $3 = 'solved' THEN CURRENT_TIMESTAMP END)
       ON CONFLICT (user_id, problem_id) DO UPDATE
       SET attempts_count = personal_record.attempts_count + 1,
           last_attempted = CURRENT_TIMESTAMP,
           status = CASE 
             WHEN $3 = 'solved' THEN 'solved'
             ELSE personal_record.status
           END,
           solved_at = CASE
             WHEN $3 = 'solved' AND personal_record.solved_at IS NULL 
             THEN CURRENT_TIMESTAMP
             ELSE personal_record.solved_at
           END`,
      [
        user_id,
        problem_id,
        verdict.status === "Accepted" ? "solved" : "attempted",
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Submission error:", err);
    res.status(500).json({ error: "Submission failed" });
  }
});

// Test runner endpoint
router.post("/test", async (req, res) => {
  const { language, code, input } = req.body;

  if (!code) {
    return res.status(400).json({ error: "No code provided" });
  }

  try {
    const output = await runCode(language, code, input);
    res.json({ output });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get submissions for a problem
router.get("/problem/:problem_id", async (req, res) => {
  const { problem_id } = req.params;
  // TODO: Add pagination
  try {
    const result = await pool.query(
      `SELECT s.*, u.username
       FROM submission s
       JOIN "User" u ON u.user_id = s.user_id
       WHERE s.problem_id = $1
       ORDER BY s.submitted_at DESC
       LIMIT 50`,
      [problem_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching submissions:", err);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

// Get submissions for a user
router.get("/user/:user_id", async (req, res) => {
  const { user_id } = req.params;
  // TODO: Add pagination
  try {
    const result = await pool.query(
      `SELECT s.*, p.title as problem_title, p.url as problem_url
       FROM submission s
       JOIN problem p ON p.problem_id = s.problem_id
       WHERE s.user_id = $1
       ORDER BY s.submitted_at DESC
       LIMIT 50`,
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching submissions:", err);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

module.exports = router;
