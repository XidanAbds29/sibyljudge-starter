// backend/server/routes/syncRoutes.js
const express = require("express");
const router = express.Router();

// POST /api/sync
router.post("/", async (req, res) => {
  res.json({ message: "Sync endpoint should be implemented to use Supabase." });
});

module.exports = router;
