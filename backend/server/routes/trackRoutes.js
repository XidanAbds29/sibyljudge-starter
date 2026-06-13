const express = require("express");
const router = express.Router();

// GET /api/tracks - Get all tracks with their problem counts and optional user progress
router.get("/", async (req, res) => {
  const supabase = req.supabase;
  
  // Optional auth token from header to get user progress
  const authHeader = req.headers.authorization;
  let userId = null;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const { data: user } = await supabase.auth.getUser(token);
      if (user && user.user) {
        userId = user.user.id;
      }
    } catch (e) {
      // Ignore auth failure for public details view
    }
  }

  try {
    const { data: tracks, error: tErr } = await supabase
      .from("track")
      .select("*, track_problem(problem_id)");

    if (tErr) throw tErr;

    let progressMap = {};
    if (userId) {
      const { data: progressList } = await supabase
        .from("user_track_progress")
        .select("track_id, status")
        .eq("user_id", userId);
        
      if (progressList) {
        progressList.forEach(item => {
          progressMap[item.track_id] = item.status;
        });
      }
    }

    // Map to include problem count and progress
    const result = tracks.map(track => ({
      track_id: track.track_id,
      name: track.name,
      description: track.description,
      problem_count: track.track_problem ? track.track_problem.length : 0,
      progress: progressMap[track.track_id] || "not_started"
    }));

    res.json(result);
  } catch (error) {
    console.error("Error fetching tracks:", error);
    res.status(500).json({ error: "Failed to fetch tracks", details: error.message });
  }
});

// GET /api/tracks/:trackId - Get details of a single track, including all problems and completion status
router.get("/:trackId", async (req, res) => {
  const supabase = req.supabase;
  const { trackId } = req.params;
  
  // Optional auth token from header to get user progress
  const authHeader = req.headers.authorization;
  let userId = null;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const { data: user } = await supabase.auth.getUser(token);
      if (user && user.user) {
        userId = user.user.id;
      }
    } catch (e) {
      // Ignore auth failure for public details view
    }
  }

  try {
    // Get track metadata and associated problems
    const { data: track, error: tErr } = await supabase
      .from("track")
      .select(`
        *,
        track_problem (
          ordinal,
          problem (
            problem_id,
            title,
            difficulty,
            time_limit,
            mem_limit
          )
        )
      `)
      .eq("track_id", parseInt(trackId))
      .single();

    if (tErr) throw tErr;
    if (!track) return res.status(404).json({ error: "Track not found" });

    // Sort problems by ordinal
    const problems = (track.track_problem || [])
      .sort((a, b) => (a.ordinal || 0) - (b.ordinal || 0))
      .map(tp => tp.problem)
      .filter(p => p !== null); // Filter out any orphan references

    let progress = "not_started";
    let solvedProblemIds = [];

    if (userId) {
      // Get track progress status
      const { data: progressData } = await supabase
        .from("user_track_progress")
        .select("status")
        .eq("track_id", parseInt(trackId))
        .eq("user_id", userId)
        .single();
        
      if (progressData) {
        progress = progressData.status;
      }

      // Get user's solved problems among this track's problems
      const problemIds = problems.map(p => p.problem_id);
      if (problemIds.length > 0) {
        const { data: solvedRecords } = await supabase
          .from("personal_record")
          .select("problem_id")
          .eq("user_id", userId)
          .eq("status", "solved")
          .in("problem_id", problemIds);
          
        if (solvedRecords) {
          solvedProblemIds = solvedRecords.map(r => r.problem_id);
        }
      }
    }

    res.json({
      track_id: track.track_id,
      name: track.name,
      description: track.description,
      problems: problems.map(p => ({
        ...p,
        is_solved: solvedProblemIds.includes(p.problem_id)
      })),
      progress: progress
    });
  } catch (error) {
    console.error("Error fetching track details:", error);
    res.status(500).json({ error: "Failed to fetch track details", details: error.message });
  }
});

module.exports = router;
