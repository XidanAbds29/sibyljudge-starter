
const express = require("express");
const bcrypt = require("bcryptjs");
const authenticateToken = require("../middleware/authMiddleware");
const { runCode } = require("../runners/testRunner");
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

    // Check contest timing and participant status
    const now = new Date();
    const start = new Date(contest.start_time);
    const end = new Date(contest.end_time);
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

    // Access control logic
    if (now < start || (now >= start && now <= end && !is_participant)) {
      // Before contest: no one; During contest: only participants
      return res.status(403).json({ error: "You do not have access to this problem." });
    }
    // After contest: anyone can view

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
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const search = req.query.search;
  const difficulty = req.query.difficulty; // "Easy", "Medium", "Hard"
  const status = req.query.status; // "Upcoming", "Ongoing", "Finished"
  
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  try {
    let query = supabase.from('contest').select('*', { count: 'exact' }).order('start_time', { ascending: false }).range(from, to);
    
    // Apply difficulty filter
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }
    
    // Apply search filter
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    
    const { data: contests, error, count } = await query;
    if (error) {
      console.error("[ContestList] DB error:", error);
      return res.status(500).json({ error: error.message });
    }

    // Add computed status and filter by status if needed
    const now = new Date();
    let contestsWithStatus = contests.map((c) => {
      const start = new Date(c.start_time);
      const end = new Date(c.end_time);
      let computedStatus = "Upcoming";
      if (now >= start && now <= end) computedStatus = "Ongoing";
      else if (now > end) computedStatus = "Finished";
      return { ...c, status: computedStatus };
    });
    
    // Apply status filter on computed status (client-side since it's computed)
    if (status) {
      contestsWithStatus = contestsWithStatus.filter(c => c.status === status);
    }

    res.json({ contests: contestsWithStatus, total: status ? contestsWithStatus.length : count });
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
    // Fetch contest 
    const { data: contest, error } = await supabase
      .from("contest")
      .select("*, contest_problem(problem_id, alias)")
      .eq("contest_id", contest_id)
      .single();
    if (error || !contest) return res.status(404).json({ error: "Contest not found" });
    
    // Get creator information from contest_creation table
    let creator = null;
    try {
      const { data: contestCreation, error: creationError } = await supabase
        .from("contest_creation")
        .select("created_by")
        .eq("contest_id", contest_id)
        .single();
      
      if (!creationError && contestCreation?.created_by) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", contestCreation.created_by)
          .single();
        
        if (!profileError && profile?.username) {
          creator = profile.username;
        }
      }
    } catch (error) {
      console.error('Error fetching creator:', error);
      creator = null;
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
    
    // Always fetch basic problem information for the contest
    const problemIds = (contest.contest_problem || []).map((p) => p.problem_id);
    if (problemIds.length > 0) {
      const { data: problemDetails, error: probErr } = await supabase
        .from("Problem")
        .select("problem_id, external_id, title, difficulty, time_limit, mem_limit")
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

// User leaves a contest
router.post("/:contest_id/leave", async (req, res) => {
  const supabase = req.supabase;
  const { contest_id } = req.params;
  const { user_id } = req.body;
  
  if (!user_id) return res.status(400).json({ error: "Missing user_id" });
  
  try {
    // Check if user is actually a participant
    const { data: existing } = await supabase
      .from("user_participant")
      .select("*")
      .eq("contest_id", contest_id)
      .eq("user_id", user_id)
      .maybeSingle();
    
    if (!existing) {
      return res.status(400).json({ error: "You are not a participant in this contest" });
    }
    
    // Remove participant
    const { error } = await supabase
      .from("user_participant")
      .delete()
      .eq("contest_id", contest_id)
      .eq("user_id", user_id);
    
    if (error) throw new Error(error.message);
    
    res.json({ message: "Left contest successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get contests that a user has joined
router.get("/user/:user_id", async (req, res) => {
  const supabase = req.supabase;
  const { user_id } = req.params;
  
  try {
    const { data: participations, error } = await supabase
      .from("user_participant")
      .select("contest_id")
      .eq("user_id", user_id);
    
    if (error) throw new Error(error.message);
    
    // Return array of contest IDs that user has joined
    const contestIds = participations.map(p => p.contest_id);
    res.json(contestIds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/contests/:contest_id/submissions - Submit solution for contest problem
router.post("/:contest_id/submissions", async (req, res) => {
  console.log("=== CONTEST SUBMISSION REQUEST START ===");
  console.log("Request body:", req.body);
  
  const supabase = req.supabase;
  const { contest_id } = req.params;
  const { 
    source_code, 
    language, 
    problem_id, 
    user_id, 
    time_limit, 
    memory_limit, 
    sample_input, 
    sample_output,
    all_samples 
  } = req.body;
  
  console.log("Extracted values:", {
    contest_id,
    source_code: source_code ? `${source_code.length} characters` : 'undefined',
    language,
    problem_id,
    user_id,
    time_limit,
    memory_limit,
    samples_count: all_samples ? all_samples.length : 0
  });
  
  if (!source_code || !language || !problem_id || !user_id || !contest_id) {
    console.log("Missing required fields validation failed");
    return res.status(400).json({ error: "Missing required fields." });
  }

  // Reject guest submissions
  if (user_id === "guest" || !user_id) {
    console.log("Authentication check failed - guest user");
    return res.status(401).json({ error: "Authentication required. Please log in to submit." });
  }

  try {
    // Verify user is participant of the contest
    const { data: participation, error: participationError } = await supabase
      .from("user_participant")
      .select("*")
      .eq("contest_id", contest_id)
      .eq("user_id", user_id)
      .maybeSingle();
    
    if (participationError || !participation) {
      return res.status(403).json({ error: "You must be a participant of this contest to submit." });
    }

    // Verify the problem is part of this contest
    const { data: contestProblem, error: contestProblemError } = await supabase
      .from("contest_problem")
      .select("*")
      .eq("contest_id", contest_id)
      .eq("problem_id", problem_id)
      .maybeSingle();
    
    if (contestProblemError || !contestProblem) {
      return res.status(404).json({ error: "Problem not found in this contest." });
    }

    // Use samples provided by frontend
    let samples = [];
    if (all_samples && Array.isArray(all_samples) && all_samples.length > 0) {
      samples = all_samples;
      console.log("Using all_samples:", samples.length, "samples");
    } else if (sample_input !== undefined || sample_output !== undefined) {
      samples = [{ input: sample_input || "", output: sample_output || "" }];
      console.log("Using single sample");
    }

    if (samples.length === 0) {
      console.log("No samples provided - returning error");
      return res.status(400).json({ error: "No sample test cases provided." });
    }

    console.log("Starting test execution with", samples.length, "samples");

    // Test the solution against all sample cases
    const testResults = [];
    let allPassed = true;
    let verdict = "AC"; // Accepted
    let totalExecTime = 0;
    let maxMemoryUsed = 0;
    let actualOutput = "";

    for (let i = 0; i < samples.length; i++) {
      console.log(`Testing sample ${i + 1}/${samples.length}`);
      const sample = samples[i];
      const input = sample.input || "";
      const expectedOutput = (sample.output || "").trim();

      const result = await runCode(language, source_code, input, {
        timeLimitMs: time_limit || 2000,
        memoryLimitKb: memory_limit || 262144
      });
      
      console.log("runCode result:", result);

      if (result.error) {
        verdict = result.error.includes("Time") ? "TLE" : 
                 result.error.includes("Memory") ? "MLE" : 
                 result.error.includes("compilation") ? "CE" : "RE";
        allPassed = false;
        testResults.push({
          input,
          expected: expectedOutput,
          actual: result.output || "",
          passed: false,
          error: result.error,
          execution_time: result.executionTime || 0,
          memory_used: result.memoryUsed || 0
        });
        break;
      }

      const actualOutputTrimmed = (result.output || "").trim();
      actualOutput = actualOutputTrimmed;
      const passed = actualOutputTrimmed === expectedOutput;
      
      if (!passed) {
        verdict = "WA";
        allPassed = false;
      }

      testResults.push({
        input,
        expected: expectedOutput,
        actual: actualOutputTrimmed,
        passed,
        execution_time: result.executionTime || 0,
        memory_used: result.memoryUsed || 0
      });

      totalExecTime += result.executionTime || 0;
      maxMemoryUsed = Math.max(maxMemoryUsed, result.memoryUsed || 0);
    }

    console.log("Test execution completed. Verdict:", verdict);

    // Insert into submission table
    const { data: submissionData, error: submissionError } = await supabase
      .from("submission")
      .insert({
        user_id,
        problem_id,
        language,
        status: verdict === "AC" ? "Accepted" : 
               verdict === "WA" ? "Wrong Answer" :
               verdict === "TLE" ? "Time Limit Exceeded" :
               verdict === "MLE" ? "Memory Limit Exceeded" :
               verdict === "CE" ? "Compilation Error" : "Runtime Error",
        exec_time: totalExecTime,
        submitted_at: new Date().toISOString(),
        verdict_detail: JSON.stringify({
          verdict,
          testResults,
          message: allPassed ? "All test cases passed!" : 
                  verdict === "CE" ? "Compilation failed" :
                  verdict === "TLE" ? "Time limit exceeded" :
                  verdict === "MLE" ? "Memory limit exceeded" :
                  verdict === "RE" ? "Runtime error occurred" :
                  "Some test cases failed",
          totalTests: samples.length,
          passedTests: testResults.filter(t => t.passed).length
        }),
        solution_code: source_code
      })
      .select()
      .single();

    if (submissionError) {
      console.error("Submission insert error:", submissionError);
      return res.status(500).json({ error: "Failed to save submission." });
    }

    console.log("Submission saved:", submissionData.submission_id);

    // Insert into contest_submission table
    const { data: contestSubmissionData, error: contestSubmissionError } = await supabase
      .from("contest_submission")
      .insert({
        contest_id: parseInt(contest_id),
        submission_id: submissionData.submission_id,
        problem_id: parseInt(problem_id)
      })
      .select()
      .single();

    if (contestSubmissionError) {
      console.error("Contest submission insert error:", contestSubmissionError);
      console.error("Contest submission data:", {
        contest_id: parseInt(contest_id),
        submission_id: submissionData.submission_id,
        problem_id: parseInt(problem_id)
      });
      return res.status(500).json({ error: "Failed to save contest submission." });
    } else {
      console.log("Contest submission saved:", contestSubmissionData.con_sub_id);
    }

    const response = {
      verdict,
      message: allPassed ? "All test cases passed!" : 
               verdict === "CE" ? "Compilation failed" :
               verdict === "TLE" ? "Time limit exceeded" :
               verdict === "MLE" ? "Memory limit exceeded" :
               verdict === "RE" ? "Runtime error occurred" :
               "Some test cases failed",
      testResults,
      submissionId: submissionData.submission_id,
      totalTests: samples.length,
      passedTests: testResults.filter(t => t.passed).length,
      executionTime: totalExecTime,
      memoryUsed: maxMemoryUsed
    };

    console.log("=== CONTEST SUBMISSION REQUEST END ===");
    res.json(response);

  } catch (err) {
    console.error("Contest submission error:", err);
    res.status(500).json({ error: err.message || "Internal server error during submission." });
  }
});

// GET /api/contests/:contest_id/submissions/user/:user_id/problem/:problem_id - Get user's submissions for a specific problem in a contest
router.get("/:contest_id/submissions/user/:user_id/problem/:problem_id", async (req, res) => {
  const supabase = req.supabase;
  const { contest_id, user_id, problem_id } = req.params;

  try {
    // Get submissions for this user, problem, and contest
    const { data: contestSubmissions, error } = await supabase
      .from("contest_submission")
      .select(`
        *,
        submission!inner (
          submission_id,
          user_id,
          problem_id,
          language,
          status,
          exec_time,
          submitted_at,
          verdict_detail,
          solution_code
        )
      `)
      .eq("contest_id", contest_id)
      .eq("problem_id", problem_id)
      .eq("submission.user_id", user_id)
      .order("submission(submitted_at)", { ascending: false });

    if (error) {
      console.error("Contest submissions fetch error:", error);
      return res.status(500).json({ error: "Failed to fetch contest submissions." });
    }

    // Transform the data to match the expected format
    const submissions = (contestSubmissions || []).map(cs => {
      const submission = cs.submission;
      if (!submission) return null;

      let verdictDetail = {};
      try {
        verdictDetail = submission.verdict_detail ? JSON.parse(submission.verdict_detail) : {};
      } catch (e) {
        console.error("Error parsing verdict_detail:", e);
      }

      return {
        submissionId: submission.submission_id,
        userId: submission.user_id,
        problemId: submission.problem_id,
        language: submission.language,
        status: verdictDetail.verdict || submission.status,
        executionTime: submission.exec_time,
        memoryUsed: verdictDetail.memoryUsed || 0,
        submittedAt: submission.submitted_at,
        verdictDetail: verdictDetail,
        solutionCode: submission.solution_code
      };
    }).filter(Boolean);

    res.json({ submissions });

  } catch (err) {
    console.error("Error fetching contest submissions:", err);
    res.status(500).json({ error: err.message || "Internal server error." });
  }
});

// Get contest participants
router.get("/:contest_id/participants", async (req, res) => {
  const supabase = req.supabase;
  const { contest_id } = req.params;
  
  try {
    // Fetch participants with their usernames
    const { data: participants, error } = await supabase
      .from("user_participant")
      .select(`
        user_id,
        profiles!inner(username)
      `)
      .eq("contest_id", contest_id)
      .order("profiles(username)", { ascending: true });
    
    if (error) {
      console.error("Error fetching contest participants:", error);
      return res.status(500).json({ error: "Failed to fetch participants" });
    }
    
    // Transform the data
    const formattedParticipants = (participants || []).map(p => ({
      user_id: p.user_id,
      username: p.profiles?.username || "Unknown User"
    }));
    
    res.json({ 
      participants: formattedParticipants,
      total: formattedParticipants.length
    });
    
  } catch (err) {
    console.error("Error in participants endpoint:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

module.exports = router;
