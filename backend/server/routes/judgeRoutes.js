const express = require("express");
const router = express.Router();

// GET /api/judges
router.get("/", async (req, res) => {
  const supabase = req.supabase;
  const { data, error } = await supabase
    .from("online_judge")
    .select("judge_id, name");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
