const express = require("express");
const router = express.Router();

// GET /api/problems?judgeId=&limit=&page=&tags[]=&difficulty=
router.get("/", async (req, res) => {
  const supabase = req.supabase;
  const judgeId = req.query.judgeId ? parseInt(req.query.judgeId) : null;
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  // Accept tags as array: tags[]=dfs&tags[]=greedy
  let tags = req.query.tags || [];
  if (typeof tags === "string") tags = [tags];
  const difficulty = req.query.difficulty;

  let query = supabase
    .from("Problem")
    .select("*, Problem_tag:Problem_tag!inner(Tag:Tag!inner(name))", {
      count: "exact",
    })
    .order("problem_id", { ascending: false })
    .range(from, to);

  if (judgeId) query = query.eq("source_oj_id", judgeId);
  if (difficulty) query = query.eq("difficulty", difficulty);
  // For tags, fetch problems that have ANY of the tags, then filter for ALL in JS
  if (tags.length > 0) {
    query = query.in("Problem_tag.Tag.name", tags);
  }

  const { data, count, error } = await query;
  if (error) {
    console.error("[DEBUG] /api/problems error:", error, error.code, error.details, error.hint);
    return res.status(error.status || 500).json({
      error: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      status: error.status
    });
  }

  let filtered = data;
  if (tags.length > 0) {
    filtered = data.filter((p) => {
      const problemTags = (p.Problem_tag || [])
        .map((pt) => pt.Tag?.name)
        .filter(Boolean);
      return tags.every((tag) => problemTags.includes(tag));
    });
  }

  // Return the total count from Supabase (before pagination/filtering)
  res.json({ problems: filtered, total: count });
});

// GET /api/problems/tags — all tags
router.get("/tags", async (req, res) => {
  const supabase = req.supabase;
  const { data, error } = await supabase.from("Tag").select("name");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data.map((t) => t.name));
});

// GET /api/problems/:problem_id — Single problem by problem_id
router.get("/:problem_id", async (req, res) => {
  const supabase = req.supabase;
  const { problem_id } = req.params;
  const { data, error } = await supabase
    .from("Problem")
    .select("*")
    .eq("problem_id", problem_id)
    .single();
  if (error) return res.status(404).json({ error: error.message });
  
  // Parse samples JSON string into array
  if (data.samples) {
    try {
      data.samples = JSON.parse(data.samples);
    } catch (e) {
      console.error('Error parsing samples JSON:', e);
      data.samples = [];
    }
  }
  
  res.json(data);
});

module.exports = router;
