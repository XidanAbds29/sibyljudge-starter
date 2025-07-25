const express = require("express");
const router = express.Router();

// GET /api/judges
router.get("/", async (req, res) => {
  const supabase = req.supabase;
  const { data, error } = await supabase
    .from("online_judge")
    .select("judge_id, name");
  if (error) {
    console.error("[DEBUG] /api/judges error:", error, error.code, error.details, error.hint);
    return res.status(error.status || 500).json({
      error: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      status: error.status
    });
  }
  res.json(data);
});


module.exports = router;
