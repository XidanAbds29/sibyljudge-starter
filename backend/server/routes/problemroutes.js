const express = require("express");
const pool = require("../db");
const router = express.Router();

// GET /api/problems?judgeId=&limit=&page= — with pagination + total count
router.get("/", async (req, res) => {
  const judgeId = req.query.judgeId ? parseInt(req.query.judgeId) : null;
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const offset = (page - 1) * limit;

  try {
    // 1) total count
    const countSQL = judgeId
      ? `SELECT COUNT(*) AS total FROM problem WHERE source_oj_id = $1`
      : `SELECT COUNT(*) AS total FROM problem`;
    const countParams = judgeId ? [judgeId] : [];
    const countRes = await pool.query(countSQL, countParams);
    const total = parseInt(countRes.rows[0].total, 10);

    // 2) fetch page of problems + source_name
    const fields = [
      "p.problem_id",
      "p.external_id",
      "p.title",
      "p.url",
      "p.difficulty",
      "p.time_limit",
      "p.mem_limit",
      "p.statement_html",
      "p.input_spec",
      "p.output_spec",
      "p.samples",
      "o.name AS source_name",
      `(SELECT JSONB_AGG(t.name) FROM problem_tag pt JOIN tag t ON t.tag_id = pt.tag_id WHERE pt.problem_id = p.problem_id) as tags`,
    ].join(",");

    const where = judgeId ? "WHERE p.source_oj_id = $1" : "";
    // param order: [judgeId?, limit, offset]
    const params = judgeId ? [judgeId, limit, offset] : [limit, offset];

    const sql = `
      SELECT ${fields}
        FROM problem p
        JOIN online_judge o ON o.judge_id = p.source_oj_id
        ${where}
    ORDER BY p.fetched_at DESC
       LIMIT $${judgeId ? 2 : 1}
      OFFSET $${judgeId ? 3 : 2}
    `;

    const dataRes = await pool.query(sql, params);
    res.json({
      problems: dataRes.rows,
      total,
    });
  } catch (err) {
    console.error("Error fetching problems:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/problems/:external_id — Single problem
router.get("/:external_id", async (req, res) => {
  const { external_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT p.*, oj.name as source_name,
       JSONB_BUILD_OBJECT(
         'statement', p.statement_html,
         'input', p.input_spec,
         'output', p.output_spec,
         'samples', p.samples
       ) as sections
       FROM problem p
       JOIN online_judge oj ON oj.judge_id = p.source_oj_id
       WHERE p.external_id = $1`,
      [external_id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: "Problem not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching problem:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
