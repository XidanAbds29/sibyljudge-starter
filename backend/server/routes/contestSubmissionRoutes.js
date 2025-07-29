// backend/server/routes/contestSubmissionRoutes.js
const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

// Create Supabase client
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// POST /api/contest-submissions - Link a submission to a contest
router.post("/", async (req, res) => {
  console.log("=== CONTEST SUBMISSION LINK REQUEST START ===");
  console.log("Request body:", req.body);
  
  const { 
    submission_id, 
    contest_id, 
    problem_id
  } = req.body;
  
  console.log("Extracted values:", {
    submission_id,
    contest_id,
    problem_id
  });
  
  if (!submission_id || !contest_id || !problem_id) {
    console.log("Missing required fields validation failed");
    return res.status(400).json({ error: "submission_id, contest_id, and problem_id are required." });
  }

  try {
    console.log("Attempting to link submission to contest...");
    
    // Insert into contest_submission table
    const { data: contestSubmissionData, error: contestSubmissionError } = await supabase
      .from("contest_submission")
      .insert({
        contest_id: parseInt(contest_id),
        submission_id: parseInt(submission_id),
        problem_id: parseInt(problem_id)
      })
      .select()
      .single();

    console.log("Contest submission insert result:", { contestSubmissionData, contestSubmissionError });

    if (contestSubmissionError) {
      console.error("Contest submission insert error:", contestSubmissionError);
      console.error("Contest submission data:", {
        contest_id: parseInt(contest_id),
        submission_id: parseInt(submission_id),
        problem_id: parseInt(problem_id)
      });
      return res.status(500).json({ 
        error: "Failed to link submission to contest.", 
        details: contestSubmissionError.message 
      });
    }

    console.log("Contest submission linked successfully:", contestSubmissionData.con_sub_id);

    // Return response
    const response = {
      success: true,
      contestSubmissionId: contestSubmissionData.con_sub_id,
      message: "Submission successfully linked to contest."
    };
    
    console.log("Sending response:", response);
    console.log("=== CONTEST SUBMISSION LINK REQUEST END ===");
    
    return res.json(response);

  } catch (err) {
    console.error("=== CONTEST SUBMISSION LINK ERROR ===");
    console.error("Error details:", err);
    console.error("Error stack:", err.stack);
    console.error("=== END ERROR ===");
    return res.status(500).json({ 
      error: "Failed to link submission to contest.", 
      details: err.message 
    });
  }
});

// GET /api/contest-submissions/contest/:contest_id/user/:user_id - Get all user's submissions for a contest
router.get("/contest/:contest_id/user/:user_id", async (req, res) => {
  console.log("=== FETCH ALL CONTEST SUBMISSIONS REQUEST START ===");
  
  const { contest_id, user_id } = req.params;
  console.log("Request params:", { contest_id, user_id });
  
  try {
    console.log("Step 1: Fetching submission IDs from contest_submission table...");
    
    // Step 1: Get all submission_ids for this contest (without problem filtering)
    const { data: contestSubmissions, error: contestError } = await supabase
      .from("contest_submission")
      .select("submission_id, problem_id")
      .eq("contest_id", parseInt(contest_id));

    console.log("Contest submissions fetch result:", { 
      contestSubmissions: contestSubmissions?.length || 0, 
      contestError: contestError?.message || "No error" 
    });

    if (contestError) {
      console.error("Contest submissions fetch error:", contestError);
      return res.status(500).json({ 
        error: "Failed to fetch contest submissions.", 
        details: contestError.message 
      });
    }

    if (!contestSubmissions || contestSubmissions.length === 0) {
      console.log("No contest submissions found");
      return res.json({
        submissions: []
      });
    }

    // Extract submission IDs
    const submissionIds = contestSubmissions.map(cs => cs.submission_id);
    console.log("Found submission IDs:", submissionIds);

    console.log("Step 2: Fetching submissions from submission table...");
    
    // Step 2: Fetch actual submissions using those IDs, filtered by user
    const { data: submissions, error: submissionError } = await supabase
      .from("submission")
      .select(`
        submission_id,
        user_id,
        problem_id,
        language,
        code,
        status,
        execution_time,
        memory_usage,
        submitted_at,
        Problem!inner(id, title)
      `)
      .in("submission_id", submissionIds)
      .eq("user_id", user_id)
      .order("submitted_at", { ascending: false }); // Most recent first

    console.log("Submissions fetch result:", { 
      submissions: submissions?.length || 0, 
      submissionError: submissionError?.message || "No error" 
    });

    if (submissionError) {
      console.error("Submissions fetch error:", submissionError);
      return res.status(500).json({ 
        error: "Failed to fetch submissions.", 
        details: submissionError.message 
      });
    }

    // Format submissions for frontend with problem titles
    const formattedSubmissions = submissions.map(submission => {
      return {
        submission_id: submission.submission_id,
        problem_id: submission.problem_id,
        problem_title: submission.Problem?.title || "Unknown Problem",
        language: submission.language,
        status: submission.status,
        execution_time: submission.execution_time,
        memory_usage: submission.memory_usage,
        submitted_at: submission.submitted_at,
        code: submission.code
      };
    });

    console.log("Returning", formattedSubmissions.length, "formatted submissions");
    console.log("=== FETCH ALL CONTEST SUBMISSIONS REQUEST END ===");
    
    return res.json({
      submissions: formattedSubmissions
    });
  } catch (error) {
    console.error("Unexpected error in contest submissions fetch:", error);
    res.status(500).json({ 
      error: "Failed to fetch contest submissions",
      details: error.message 
    });
  }
});

// GET /api/contest-submissions/:contest_id/problem/:problem_id/user/:user_id - Get user's submissions for a specific problem in a contest
router.get("/:contest_id/problem/:problem_id/user/:user_id", async (req, res) => {
  console.log("=== FETCH CONTEST SUBMISSIONS REQUEST START ===");
  
  const { contest_id, problem_id, user_id } = req.params;
  const { limit = 50, offset = 0 } = req.query;
  
  console.log("Request params:", { contest_id, problem_id, user_id, limit, offset });
  
  if (!contest_id || !problem_id || !user_id) {
    console.log("Missing required parameters");
    return res.status(400).json({ error: "Contest ID, Problem ID, and User ID are required." });
  }

  try {
    console.log("Step 1: Fetching submission IDs from contest_submission table...");
    
    // Step 1: Get submission_ids for this contest and problem
    const { data: contestSubmissions, error: contestError } = await supabase
      .from("contest_submission")
      .select("submission_id")
      .eq("contest_id", parseInt(contest_id))
      .eq("problem_id", parseInt(problem_id));
    
    console.log("Contest submissions fetch result:", { 
      contestSubmissions: contestSubmissions?.length || 0, 
      contestError: contestError?.message || "No error" 
    });

    if (contestError) {
      console.error("Contest submissions fetch error:", contestError);
      return res.status(500).json({ 
        error: "Failed to fetch contest submissions.", 
        details: contestError.message 
      });
    }

    if (!contestSubmissions || contestSubmissions.length === 0) {
      console.log("No contest submissions found");
      return res.json({
        submissions: [],
        total: 0
      });
    }

    // Extract submission IDs
    const submissionIds = contestSubmissions.map(cs => cs.submission_id);
    console.log("Found submission IDs:", submissionIds);

    console.log("Step 2: Fetching submissions from submission table...");
    
    // Step 2: Fetch actual submissions using those IDs, filtered by user
    const { data: submissions, error: submissionError } = await supabase
      .from("submission")
      .select("*")
      .in("submission_id", submissionIds)
      .eq("user_id", user_id)
      .order("submitted_at", { ascending: false }) // Most recent first
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    console.log("Submissions fetch result:", { 
      submissions: submissions?.length || 0, 
      submissionError: submissionError?.message || "No error" 
    });

    if (submissionError) {
      console.error("Submissions fetch error:", submissionError);
      return res.status(500).json({ 
        error: "Failed to fetch submissions.", 
        details: submissionError.message 
      });
    }

    // Format submissions for frontend (same as ProblemPage)
    const formattedSubmissions = submissions.map(submission => {
      return {
        submissionId: submission.submission_id,
        language: submission.language,
        status: submission.status,
        executionTime: submission.exec_time,
        memoryUsed: submission.mem_taken,
        submittedAt: submission.submitted_at,
        solutionCode: submission.solution_code,
        output: submission.output
      };
    });

    console.log("Returning", formattedSubmissions.length, "formatted contest submissions");
    console.log("=== FETCH CONTEST SUBMISSIONS REQUEST END ===");
    
    return res.json({
      submissions: formattedSubmissions,
      total: formattedSubmissions.length
    });

  } catch (err) {
    console.error("=== FETCH CONTEST SUBMISSIONS ERROR ===");
    console.error("Error details:", err);
    console.error("=== END ERROR ===");
    return res.status(500).json({ 
      error: "Failed to fetch contest submissions.", 
      details: err.message 
    });
  }
});

module.exports = router;
