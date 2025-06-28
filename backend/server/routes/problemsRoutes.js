const express = require("express");
const authenticateToken = require("../middleware/authMiddleware"); // Import the middleware

module.exports = (supabase) => {
  const router = express.Router();

  // Apply the authentication middleware to all routes defined in this router.
  router.use(authenticateToken);

  // Route to fetch all problems
  router.get("/problems", async (req, res) => {
    try {
      const { data, error } = await supabase.from("Problem").select("*").order("problem_id", { ascending: true });
      if (error) throw error;
      res.json(data);
    } catch (err) {
      console.error("Error fetching problems:", err);
      res.status(500).json({ error: "Failed to fetch problems" });
    }
  });

  // Route to fetch all online judges
  router.get("/judges", async (req, res) => {
    try {
      const { data, error } = await supabase.from("online_judge").select("judge_id, name");
      if (error) {
        console.error("Error fetching judges:", error);
        return res.status(500).json({ error: "Failed to fetch judges" });
      }
      res.json(data);
    } catch (err) {
      console.error("Error fetching judges:", err);
      res.status(500).json({ error: "Failed to fetch judges" });
    }
  });

  return router;
};
