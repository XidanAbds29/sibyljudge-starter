
// backend/server/routes/submissionRoutes.js
const express = require("express");
const router = express.Router();
const { runCode } = require("../runners/testRunner");
const { createClient } = require("@supabase/supabase-js");

// Create Supabase client
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// POST /api/submissions
router.post("/", async (req, res) => {
  console.log("=== SUBMISSION REQUEST START ===");
  console.log("Request body:", req.body);
  
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
    source_code: source_code ? `${source_code.length} characters` : 'undefined',
    language,
    problem_id,
    user_id,
    time_limit,
    memory_limit,
    samples_count: all_samples ? all_samples.length : 0
  });
  
  if (!source_code || !language || !problem_id || !user_id) {
    console.log("Missing required fields validation failed");
    return res.status(400).json({ error: "Missing required fields." });
  }

  // Reject guest submissions
  if (user_id === "guest" || !user_id) {
    console.log("Authentication check failed - guest user");
    return res.status(401).json({ error: "Authentication required. Please log in to submit." });
  }

  try {
    // Test Supabase connection and check available tables
    console.log("Testing Supabase connection...");
    
    // Test the correct table name: submission (singular, lowercase)
    const { data: testData, error: testError } = await supabase
      .from("submission")
      .select("*")
      .limit(1);
    console.log("Supabase 'submission' table test:", { testError: testError?.message || "No error", hasData: !!testData });

    // Use samples provided by frontend (either single sample or all samples)
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
    let actualOutput = ""; // Capture the actual output from code execution

    for (let i = 0; i < samples.length; i++) {
      console.log(`Testing sample ${i + 1}/${samples.length}`);
      const sample = samples[i];
      const input = sample.input || "";
      const expectedOutput = (sample.output || "").trim();

      // Run the code with sample input using provided limits
      console.log("Calling runCode with:", { language, time_limit, memory_limit });
      const result = await runCode(language, source_code, input, {
        timeLimitMs: time_limit || 2000,
        memoryLimitKb: memory_limit || 262144
      });
      console.log("runCode result:", result);

      const currentOutput = result.output.trim();
      const passed = currentOutput === expectedOutput;
      
      // Store the actual output from the first test case (or last successful one)
      if (i === 0 || !result.compilationError) {
        actualOutput = result.output; // Keep raw output with newlines
      }
      
      if (!passed) allPassed = false;
      
      // Track execution metrics
      totalExecTime = Math.max(totalExecTime, result.exec_time || 0);
      maxMemoryUsed = Math.max(maxMemoryUsed, result.memory_used || 0);

      // Determine verdict for this test case
      let testVerdict = "AC";
      if (result.compilationError) {
        testVerdict = "CE"; // Compilation Error
        verdict = "CE";
      } else if (result.timeLimitExceeded) {
        testVerdict = "TLE"; // Time Limit Exceeded
        if (verdict === "AC") verdict = "TLE";
      } else if (result.memoryLimitExceeded) {
        testVerdict = "MLE"; // Memory Limit Exceeded
        if (verdict === "AC") verdict = "MLE";
      } else if (result.runtimeError) {
        testVerdict = "RE"; // Runtime Error
        if (verdict === "AC") verdict = "RE";
      } else if (!passed) {
        testVerdict = "WA"; // Wrong Answer
        if (verdict === "AC") verdict = "WA";
      }

      testResults.push({
        testCase: i + 1,
        input,
        expectedOutput,
        actualOutput: currentOutput, // Use the trimmed output for comparison
        passed,
        verdict: testVerdict,
        executionTime: result.compilationError ? null : result.exec_time, // No exec time for CE
        memoryUsed: result.compilationError ? null : result.memory_used, // No memory for CE
        error: result.error
      });

      // Stop testing on first failure for efficiency
      if (!passed || result.compilationError || result.timeLimitExceeded || result.memoryLimitExceeded || result.runtimeError) {
        break;
      }
    }

    console.log("Preparing submission data for database...");
    
    // Save submission to database with your specified schema
    const submissionData = {
      user_id: user_id,
      problem_id: problem_id,
      language: language,
      status: verdict, // verdict as status
      solution_code: source_code,
      output: actualOutput, // Add the actual output from code execution
      submitted_at: new Date().toISOString()
    };

    // Only add execution time and memory if it's not a compilation error
    if (verdict !== "CE") {
      submissionData.exec_time = totalExecTime; // execution time in ms
      
      // Only add mem_taken if we have memory usage data
      if (maxMemoryUsed > 0) {
        submissionData.mem_taken = maxMemoryUsed;
      }
    }

    console.log("Submission data:", submissionData);

    // Use the correct table name: submission
    console.log("Attempting database insert with table: submission");
    
    const { data: submission, error: submissionError } = await supabase
      .from("submission")
      .insert(submissionData)
      .select()
      .single();

    console.log("Database insert result:", { submission, submissionError });

    if (submissionError) {
      console.error("Error saving submission:", submissionError);
      console.error("Submission data:", submissionData);
      return res.status(500).json({ 
        error: "Failed to save submission to database.", 
        details: submissionError.message,
        verdict: verdict,
        message: allPassed ? "All sample test cases passed!" : "Some test cases failed.",
        testResults: testResults
      });
    }

    console.log("Submission saved successfully:", submission?.submission_id);

    // Return response
    const response = {
      verdict: verdict,
      message: allPassed ? "All sample test cases passed!" : "Some test cases failed.",
      testResults: testResults,
      submissionId: submission?.submission_id || null
    };
    
    console.log("Sending response:", response);
    console.log("=== SUBMISSION REQUEST END ===");
    
    return res.json(response);

  } catch (err) {
    console.error("=== SUBMISSION ERROR ===");
    console.error("Error details:", err);
    console.error("Error stack:", err.stack);
    console.error("=== END ERROR ===");
    return res.status(500).json({ error: "Submission failed.", details: err.message });
  }
});

// GET /api/submissions/user/:userId/problem/:problemId
router.get("/user/:userId/problem/:problemId", async (req, res) => {
  console.log("=== FETCH USER SUBMISSIONS REQUEST ===");
  
  const { userId, problemId } = req.params;
  const { limit = 50, offset = 0 } = req.query;
  
  console.log("Request params:", { userId, problemId, limit, offset });
  
  if (!userId || !problemId) {
    console.log("Missing required parameters");
    return res.status(400).json({ error: "User ID and Problem ID are required." });
  }

  try {
    console.log("Fetching submissions from database...");
    
    // Fetch submissions for the specific user and problem
    const { data: submissions, error: fetchError } = await supabase
      .from("submission")
      .select("*")
      .eq("user_id", userId)
      .eq("problem_id", problemId)
      .order("submitted_at", { ascending: false }) // Most recent first
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    console.log("Database fetch result:", { 
      submissions: submissions?.length || 0, 
      fetchError: fetchError?.message || "No error" 
    });

    if (fetchError) {
      console.error("Database fetch error:", fetchError);
      return res.status(500).json({ 
        error: "Failed to fetch submissions.", 
        details: fetchError.message 
      });
    }

    // Format submissions for frontend
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

    console.log("Returning", formattedSubmissions.length, "formatted submissions");
    console.log("=== FETCH REQUEST END ===");
    
    return res.json({
      submissions: formattedSubmissions,
      total: formattedSubmissions.length
    });

  } catch (err) {
    console.error("=== FETCH SUBMISSIONS ERROR ===");
    console.error("Error details:", err);
    console.error("=== END ERROR ===");
    return res.status(500).json({ 
      error: "Failed to fetch submissions.", 
      details: err.message 
    });
  }
});

// POST /api/submissions/test - Test runner endpoint (no database save)
router.post("/test", async (req, res) => {
  console.log("=== TEST RUNNER REQUEST START ===");
  
  const { language, code, input } = req.body;
  
  console.log("Test runner request:", {
    language,
    code: code ? `${code.length} characters` : 'undefined',
    input: input ? `${input.length} characters` : 'empty'
  });
  
  if (!language || !code) {
    console.log("Missing required fields for test runner");
    return res.status(400).json({ error: "Language and code are required." });
  }

  try {
    console.log("Running code test...");
    
    // Run the code with provided input using default limits
    const result = await runCode(language, code, input || "", {
      timeLimitMs: 5000, // 5 second limit for test runner
      memoryLimitKb: 262144 // 256 MB limit
    });
    
    console.log("Test run result:", result);
    
    // Return result without saving to database
    const response = {
      output: result.output || "",
      error: result.error || null,
      executionTime: result.exec_time || null,
      memoryUsed: result.memory_used || null,
      compilationError: result.compilationError || false,
      timeLimitExceeded: result.timeLimitExceeded || false,
      memoryLimitExceeded: result.memoryLimitExceeded || false,
      runtimeError: result.runtimeError || false
    };
    
    console.log("Sending test response:", response);
    console.log("=== TEST RUNNER REQUEST END ===");
    
    return res.json(response);

  } catch (err) {
    console.error("=== TEST RUNNER ERROR ===");
    console.error("Error details:", err);
    console.error("=== END ERROR ===");
    return res.status(500).json({ 
      error: "Test execution failed.", 
      details: err.message 
    });
  }
});

module.exports = router;
