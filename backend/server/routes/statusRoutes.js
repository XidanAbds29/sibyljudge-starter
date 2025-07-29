const express = require("express");
const router = express.Router();

// GET /api/status/:contest_id - Get all submissions for a specific contest
router.get("/:contest_id", async (req, res) => {
  const supabase = req.supabase;
  const { contest_id } = req.params;
  const limit = req.query.limit ? parseInt(req.query.limit) : 50;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  try {
    // First get all submission IDs for this contest
    const { data: contestSubmissions, error: contestError } = await supabase
      .from("contest_submission")
      .select("submission_id, problem_id")
      .eq("contest_id", contest_id)
      .order("submission_id", { ascending: false })
      .range(from, to);
    
    if (contestError) {
      console.error("[ContestStatus] Contest submissions error:", contestError);
      return res.status(500).json({ error: contestError.message });
    }
    
    if (!contestSubmissions || contestSubmissions.length === 0) {
      return res.json({ submissions: [], total: 0 });
    }
    
    // Get submission IDs
    const submissionIds = contestSubmissions.map(cs => cs.submission_id);
    
    // Fetch submission details with user and problem information
    const { data: submissions, error: submissionError } = await supabase
      .from("submission")
      .select(`
        submission_id,
        user_id,
        problem_id,
        language,
        status,
        exec_time,
        submitted_at
      `)
      .in("submission_id", submissionIds)
      .order("submitted_at", { ascending: false });
    
    if (submissionError) {
      console.error("[ContestStatus] Submissions error:", submissionError);
      return res.status(500).json({ error: submissionError.message });
    }
    
    if (!submissions || submissions.length === 0) {
      return res.json({ submissions: [], total: 0 });
    }
    
    // Get unique user IDs and problem IDs
    const userIds = [...new Set(submissions.map(s => s.user_id))];
    const problemIds = [...new Set(submissions.map(s => s.problem_id))];
    
    // Fetch user information
    const { data: users, error: userError } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", userIds);
      
    // Fetch problem information  
    const { data: problems, error: problemError } = await supabase
      .from("Problem")
      .select("problem_id, title, external_id")
      .in("problem_id", problemIds);
    
    if (userError) {
      console.error("[ContestStatus] Users error:", userError);
    }
    
    if (problemError) {
      console.error("[ContestStatus] Problems error:", problemError);
    }
    
    // Transform the data to include contest problem mapping
    const transformedSubmissions = submissions.map(submission => {
      const contestSubmission = contestSubmissions.find(cs => cs.submission_id === submission.submission_id);
      const user = users?.find(u => u.id === submission.user_id);
      const problem = problems?.find(p => p.problem_id === submission.problem_id);
      
      return {
        submissionId: submission.submission_id,
        userId: submission.user_id,
        username: user?.username || "Unknown",
        problemId: submission.problem_id,
        problemTitle: problem?.title || "Unknown Problem",
        problemExternalId: problem?.external_id || "",
        language: submission.language,
        status: submission.status,
        executionTime: submission.exec_time,
        memoryUsed: 0, // Default since we don't have verdict_detail
        submittedAt: submission.submitted_at,
        verdictDetail: {} // Empty object since we don't have verdict_detail
      };
    });
    
    // Get total count for pagination
    const { count } = await supabase
      .from("contest_submission")
      .select("submission_id", { count: 'exact', head: true })
      .eq("contest_id", contest_id);
    
    res.json({ 
      submissions: transformedSubmissions, 
      total: count || 0,
      page,
      limit
    });
    
  } catch (err) {
    console.error("[ContestStatus] Route error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/status/:contest_id/user/:user_id - Get submissions for a specific user in a contest
router.get("/:contest_id/user/:user_id", async (req, res) => {
  const supabase = req.supabase;
  const { contest_id, user_id } = req.params;
  const limit = req.query.limit ? parseInt(req.query.limit) : 50;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  try {
    // Get contest submissions for this user
    const { data: contestSubmissions, error: contestError } = await supabase
      .from("contest_submission")
      .select(`
        submission_id,
        problem_id,
        submission!inner (
          submission_id,
          user_id,
          problem_id,
          language,
          status,
          exec_time,
          submitted_at
        )
      `)
      .eq("contest_id", contest_id)
      .eq("submission.user_id", user_id)
      .order("submission(submitted_at)", { ascending: false })
      .range(from, to);
    
    if (contestError) {
      console.error("[ContestStatus] User contest submissions error:", contestError);
      return res.status(500).json({ error: contestError.message });
    }
    
    if (!contestSubmissions || contestSubmissions.length === 0) {
      return res.json({ submissions: [], total: 0 });
    }
    
    // Get problem information
    const problemIds = [...new Set(contestSubmissions.map(cs => cs.problem_id))];
    const { data: problems, error: problemError } = await supabase
      .from("Problem")
      .select("problem_id, title, external_id")
      .in("problem_id", problemIds);
    
    if (problemError) {
      console.error("[ContestStatus] Problems error:", problemError);
    }
    
    // Transform the data
    const transformedSubmissions = contestSubmissions.map(cs => {
      const submission = cs.submission;
      const problem = problems?.find(p => p.problem_id === cs.problem_id);
      
      return {
        submissionId: submission.submission_id,
        userId: submission.user_id,
        problemId: cs.problem_id,
        problemTitle: problem?.title || "Unknown Problem",
        problemExternalId: problem?.external_id || "",
        language: submission.language,
        status: submission.status,
        executionTime: submission.exec_time,
        memoryUsed: 0, // Default since we don't have verdict_detail
        submittedAt: submission.submitted_at,
        verdictDetail: {} // Empty object since we don't have verdict_detail
      };
    });
    
    // Get total count for pagination
    const { count } = await supabase
      .from("contest_submission")
      .select("submission_id", { count: 'exact', head: true })
      .eq("contest_id", contest_id)
      .eq("submission.user_id", user_id);
    
    res.json({ 
      submissions: transformedSubmissions, 
      total: count || 0,
      page,
      limit
    });
    
  } catch (err) {
    console.error("[ContestStatus] User route error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
