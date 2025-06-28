// backend/server/routes/submissionsRoutes.js
const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");

module.exports = (supabase) => {
  // Accept supabase client as an argument
  router.use(authenticateToken);

  // Route for general problem submissions (no contest_id)
  router.post("/", async (req, res) => {
    const { problem_id, language, solution_code } = req.body;
    const authenticated_user_id = req.user.user_id; // Get user_id from authenticated token

    if (!problem_id || !language || !solution_code) {
      return res
        .status(400)
        .json({ error: "Missing required submission fields." });
    }

    try {
      const { data, error } = await supabase.rpc("create_submission", {
        p_user_id: authenticated_user_id,
        p_problem_id: problem_id,
        p_language: language,
        p_solution_code: solution_code,
        p_contest_id: null, // Not a contest submission
      });

      if (error) {
        console.error("Error creating general submission:", error);
        return res
          .status(500)
          .json({
            error: "Failed to create submission",
            details: error.message,
          });
      }
      res.status(201).json(data);
    } catch (err) {
      console.error("Unhandled error in general submission route:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Route for contest problem submissions
  router.post("/contest/:contest_id", async (req, res) => {
    const { contest_id } = req.params;
    const { problem_id, language, solution_code } = req.body;
    const authenticated_user_id = req.user.user_id; // Get user_id from authenticated token

    if (!problem_id || !language || !solution_code || !contest_id) {
      return res
        .status(400)
        .json({ error: "Missing required contest submission fields." });
    }

    try {
      const { data, error } = await supabase.rpc("create_submission", {
        p_user_id: authenticated_user_id,
        p_problem_id: problem_id,
        p_language: language,
        p_solution_code: solution_code,
        p_contest_id: parseInt(contest_id), // Ensure contest_id is an integer
      });

      if (error) {
        console.error("Error creating contest submission:", error);
        return res
          .status(500)
          .json({
            error: "Failed to create contest submission",
            details: error.message,
          });
      }
      res.status(201).json(data);
    } catch (err) {
      console.error("Unhandled error in contest submission route:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
};
