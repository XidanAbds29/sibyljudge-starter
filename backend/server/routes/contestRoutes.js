
const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();

// Get a specific problem for a contest (with access control)
router.get("/:contest_id/problem/:problem_id", async (req, res) => {
  const supabase = req.supabase;
  const { contest_id, problem_id } = req.params;
  const user_id = req.query.user_id;
  try {
    // Fetch contest and its problems
    const { data: contest, error: contestError } = await supabase
      .from("contest")
      .select("*, contest_problem(problem_id, alias)")
      .eq("contest_id", contest_id)
      .single();
    if (contestError || !contest) return res.status(404).json({ error: "Contest not found" });

    // Check if contest started
    const now = new Date();
    const started = now >= new Date(contest.start_time);
    let is_participant = false;
    if (user_id) {
      // Check if user is a participant
      const { data: part } = await supabase
        .from("user_participant")
        .select("*")
        .eq("contest_id", contest_id)
        .eq("user_id", user_id)
        .maybeSingle();
      is_participant = !!part;
    }

    // Only allow access if contest started and user is a participant
    if (!started || !is_participant) {
      return res.status(403).json({ error: "You do not have access to this problem." });
    }

    // Find the problem in the contest_problem list
    const cp = (contest.contest_problem || []).find((p) => p.problem_id == problem_id);
    if (!cp) return res.status(404).json({ error: "Problem not found in this contest." });

    // Fetch problem details
    const { data: problem, error: probErr } = await supabase
      .from("Problem")
      .select("*")
      .eq("problem_id", problem_id)
      .single();
    if (probErr || !problem) return res.status(404).json({ error: "Problem not found." });

    // Attach alias if present
    if (cp.alias) problem.alias = cp.alias;

    res.json(problem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List all contests
router.get("/", async (req, res) => {
  const supabase = req.supabase;
  try {
    const { data, error } = await supabase
      .from("contest")
      .select("*")
      .order("start_time", { ascending: false });
    if (error) {
      console.error("[ContestList] DB error:", error);
      return res.status(500).json({ error: error.message });
    }
    res.json(data);
  } catch (err) {
    console.error("[ContestList] Route error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Create a new contest with password and problems
router.post("/", async (req, res) => {
  const supabase = req.supabase;
  const { name, start_time, end_time, description, difficulty, password, problems, created_by } = req.body;
  if (!name || !start_time || !end_time || !created_by || !Array.isArray(problems) || problems.length === 0) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    let password_hash = null;
    let is_secured = false;
    if (password) {
      password_hash = await bcrypt.hash(password, 10);
      is_secured = true;
    }
    // 1. Create contest
    const { data: contest, error: contestError } = await supabase
      .from("contest")
      .insert([{ name, start_time, end_time, description, difficulty, password_hash, is_secured }])
      .select()
      .single();
    if (contestError) throw new Error(contestError.message);
    // 2. Add problems to contest_problem
    const contestProblems = problems.map(pid => ({ contest_id: contest.contest_id, problem_id: pid }));
    const { error: cpError } = await supabase.from("contest_problem").insert(contestProblems);
    if (cpError) throw new Error(cpError.message);
    // 3. Add contest creation record
    const { error: creationError } = await supabase.from("contest_creation").insert({ created_by, contest_id: contest.contest_id });
    if (creationError) throw new Error(creationError.message);
    res.json({ contest });
  } catch (err) {
    console.error("[ContestCreate] Route error:", err);
    res.status(500).json({ error: err.message });
  }
});

// User joins a contest (with password check if protected)
router.post("/:contest_id/join", async (req, res) => {
  const supabase = req.supabase;
  const { contest_id } = req.params;
  const { user_id, password } = req.body;
  if (!user_id) return res.status(400).json({ error: "Missing user_id" });
  try {
    // Fetch contest to check if protected
    const { data: contest, error: contestError } = await supabase
      .from("contest")
      .select("password_hash, is_secured")
      .eq("contest_id", contest_id)
      .single();
    if (contestError || !contest) return res.status(404).json({ error: "Contest not found" });
    if (contest.is_secured) {
      if (!password) return res.status(400).json({ error: "Password required" });
      const valid = await bcrypt.compare(password, contest.password_hash || "");
      if (!valid) return res.status(403).json({ error: "Incorrect password" });
    }
    // Check if already joined
    const { data: existing } = await supabase
      .from("user_participant")
      .select("*")
      .eq("contest_id", contest_id)
      .eq("user_id", user_id)
      .maybeSingle();
    if (existing) return res.status(200).json({ message: "Already joined" });
    // Insert participant
    const { error } = await supabase
      .from("user_participant")
      .insert({ contest_id, user_id });
    if (error) throw new Error(error.message);
    res.json({ message: "Joined contest" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Enhanced contest details: show creator, difficulty, description, is_secured, etc.
router.get("/:contest_id", async (req, res) => {
  const supabase = req.supabase;
  const { contest_id } = req.params;
  const user_id = req.query.user_id;
  try {
    // Fetch contest and creator
    const { data: contest, error } = await supabase
      .from("contest")
      .select("*, contest_creation(created_by), contest_problem(problem_id, alias)")
      .eq("contest_id", contest_id)
      .single();
    if (error || !contest) return res.status(404).json({ error: "Contest not found" });
    // Get creator username (if available)
    let creator = null;
    if (contest.contest_creation?.created_by) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", contest.contest_creation.created_by)
        .single();
      creator = profile?.username || null;
    }
    // Check if contest started
    const now = new Date();
    const started = now >= new Date(contest.start_time);
    let problems = [];
    let is_participant = false;
    if (user_id) {
      // Check if user is a participant
      const { data: part } = await supabase
        .from("user_participant")
        .select("*")
        .eq("contest_id", contest_id)
        .eq("user_id", user_id)
        .maybeSingle();
      is_participant = !!part;
    }
    if (started && is_participant) {
      // Fetch full problem details for each contest problem
      const problemIds = (contest.contest_problem || []).map((p) => p.problem_id);
      if (problemIds.length > 0) {
        const { data: problemDetails, error: probErr } = await supabase
          .from("Problem")
          .select("problem_id, external_id, title")
          .in("problem_id", problemIds);
        if (!probErr && problemDetails) {
          // Map alias if present
          problems = contest.contest_problem.map((cp) => {
            const details = problemDetails.find((pd) => pd.problem_id === cp.problem_id) || {};
            return {
              ...details,
              alias: cp.alias || null,
            };
          });
        }
      }
    }
    res.json({
      contest_id: contest.contest_id,
      name: contest.name,
      start_time: contest.start_time,
      end_time: contest.end_time,
      description: contest.description,
      difficulty: contest.difficulty,
      is_secured: contest.is_secured,
      creator,
      is_participant,
      problems
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
