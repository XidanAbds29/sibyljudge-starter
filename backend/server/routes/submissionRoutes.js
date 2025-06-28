// backend/server/routes/submissionRoutes.js
const express = require("express");
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
  const supabase = req.supabase;
  const { problem_id, language, code } = req.body;
  // TODO: Get actual user_id from session/auth
  const user_id = 1; // Mock user for now

  try {
    // 1. Get problem details to know which judge to submit to
    const { data: problem, error: problemError } = await supabase
      .from("Problem")
      .select("*")
      .eq("problem_id", problem_id)
      .single();
    if (problemError || !problem) throw new Error("Problem not found");

    // 2. Only handle Codeforces for now
    if (problem.source_oj_id !== 1) {
      return res
        .status(400)
        .json({ error: "Only Codeforces submission supported for now." });
    }

    // 3. Submit to Codeforces
    const verdict = await submitToCodeforces(
      problem.external_id,
      code,
      language
    );

    // 4. Store submission in DB
    const { data: submission, error: submError } = await supabase
      .from("Submission")
      .insert([
        {
          user_id,
          problem_id,
          language,
          status: verdict.status,
          exec_time: verdict.exec_time,
          verdict_detail: verdict.verdict_detail,
          solution_code: code,
        },
      ])
      .select()
      .single();
    if (submError) throw new Error(submError.message);

    res.json({ verdict: verdict.status, submission });
  } catch (err) {
    console.error("Submission error:", err);
    res.status(500).json({ error: err.message, stack: err.stack });
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
  const supabase = req.supabase;
  const { problem_id } = req.params;
  const { data, error } = await supabase
    .from("Submission")
    .select("*")
    .eq("problem_id", problem_id)
    .order("submitted_at", { ascending: false })
    .limit(50);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get submissions for a user
router.get("/user/:user_id", async (req, res) => {
  const supabase = req.supabase;
  const { user_id } = req.params;
  const { data, error } = await supabase
    .from("Submission")
    .select("*")
    .eq("user_id", user_id)
    .order("submitted_at", { ascending: false })
    .limit(50);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
