const express = require('express');
const supabase = require('../supabaseClient');
const router = express.Router();

console.log('[STANDINGS] Route file loaded');

// Test route
router.get('/test', (req, res) => {
  console.log('[STANDINGS] Test route hit');
  res.json({ message: 'Standings route is working' });
});

// GET /api/standings/:contestId - Get contest standings
router.get('/:contestId', async (req, res) => {
  const { contestId } = req.params;
  console.log(`[STANDINGS] Request for contestId: ${contestId}`);
  
  try {
    console.log(`[STANDINGS] Starting queries for contestId: ${contestId}`);
    
    // Get contest details
    console.log('[STANDINGS] About to query contest table...');
    const { data: contestData, error: contestError } = await supabase
      .from('contest')
      .select('contest_id, name, start_time, end_time')
      .eq('contest_id', contestId)
      .single();
    
    console.log('[STANDINGS] Contest query result:', { contestData, contestError });
    
    if (contestError) {
      console.error('[STANDINGS] Contest query error:', contestError);
      return res.status(500).json({ error: 'Database error fetching contest', details: contestError.message });
    }
    
    if (!contestData) {
      console.log('[STANDINGS] Contest not found');
      return res.status(404).json({ error: 'Contest not found' });
    }
    
    console.log('[STANDINGS] Contest found:', contestData.name);
    const contest = contestData;
    const contestStartTime = new Date(contest.start_time);
    const contestEndTime = new Date(contest.end_time);
    
    console.log(`[STANDINGS] Contest time window: ${contestStartTime.toISOString()} to ${contestEndTime.toISOString()}`);
    
    // Get contest problems
    const { data: contestProblemsData, error: contestProblemsError } = await supabase
      .from('contest_problem')
      .select('problem_id')
      .eq('contest_id', contestId);
    
    if (contestProblemsError) {
      console.error('[STANDINGS] Contest problems query error:', contestProblemsError);
      return res.status(500).json({ error: 'Database error fetching contest problems' });
    }
    
    const problems = contestProblemsData?.map(cp => ({ problem_id: cp.problem_id })) || [];
    console.log(`[STANDINGS] Found ${problems.length} problems in contest`);
    
    // Get all participants
    const { data: participantsData, error: participantsError } = await supabase
      .from('user_participant')
      .select(`
        user_id,
        profiles!inner(username)
      `)
      .eq('contest_id', contestId);
    
    if (participantsError) {
      console.error('[STANDINGS] Participants query error:', participantsError);
      return res.status(500).json({ error: 'Database error fetching participants' });
    }
    
    if (!participantsData || participantsData.length === 0) {
      console.log('[STANDINGS] No participants found');
      return res.json({ standings: [], problems: problems });
    }
    
    console.log(`[STANDINGS] Found ${participantsData.length} participants`);
    const participants = participantsData.map(p => ({
      user_id: p.user_id,
      username: p.profiles.username
    }));
    
    // Get all contest submissions for this contest
    const { data: contestSubmissionsData, error: contestSubmissionsError } = await supabase
      .from('contest_submission')
      .select('submission_id')
      .eq('contest_id', contestId);
    
    if (contestSubmissionsError) {
      console.error('[STANDINGS] Contest submissions query error:', contestSubmissionsError);
      return res.status(500).json({ error: 'Database error fetching contest submissions' });
    }
    
    const contestSubmissionIds = contestSubmissionsData?.map(row => row.submission_id) || [];
    console.log(`[STANDINGS] Found ${contestSubmissionIds.length} contest submissions`);
    
    if (contestSubmissionIds.length === 0) {
      // No submissions for this contest
      const standingsWithNoSubmissions = participants.map((participant, index) => ({
        user_id: participant.user_id,
        username: participant.username,
        rank: index + 1,
        score: 0,
        penalty: 0,
        problems: problems.reduce((acc, problem) => {
          acc[problem.problem_id] = {
            solved: false,
            attempts: 0,
            wrong_attempts: 0,
            solve_time: null,
            solve_time_formatted: null,
            penalty: 0,
            status: 'unsolved',
            first_solver: false
          };
          return acc;
        }, {})
      }));
      
      return res.json({
        standings: standingsWithNoSubmissions,
        problems,
        contest_info: {
          name: contest.name,
          start_time: contest.start_time,
          end_time: contest.end_time
        }
      });
    }
    
    // Get participant user IDs
    const participantUserIds = participants.map(p => p.user_id);
    
    // Get submissions that are both in contest_submission and from contest participants
    const { data: submissionsData, error: submissionsError } = await supabase
      .from('submission')
      .select('user_id, problem_id, status, submitted_at')
      .in('submission_id', contestSubmissionIds)
      .in('user_id', participantUserIds)
      .order('submitted_at', { ascending: true });
    
    if (submissionsError) {
      console.error('[STANDINGS] Submissions query error:', submissionsError);
      return res.status(500).json({ error: 'Database error fetching submissions' });
    }
    
    const submissions = submissionsData || [];
    console.log(`[STANDINGS] Found ${submissions.length} relevant submissions`);
    
    // Find first solvers for each problem
    const firstSolvers = {};
    problems.forEach(problem => {
      const problemSubmissions = submissions
        .filter(s => s.problem_id === problem.problem_id && s.status === 'AC')
        .filter(s => {
          const submissionTime = new Date(s.submitted_at);
          return submissionTime >= contestStartTime && submissionTime <= contestEndTime;
        })
        .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
      
      if (problemSubmissions.length > 0) {
        firstSolvers[problem.problem_id] = problemSubmissions[0].user_id;
        console.log(`[STANDINGS] First solver for problem ${problem.problem_id}: user ${problemSubmissions[0].user_id}`);
      }
    });
    
    // Process standings for each participant
    const standings = participants.map(participant => {
      const userId = participant.user_id;
      const username = participant.username;
      
      // Initialize participant data
      const participantData = {
        user_id: userId,
        username: username,
        score: 0,
        penalty: 0,
        problems: {}
      };
      
      // Initialize all problems
      problems.forEach(problem => {
        participantData.problems[problem.problem_id] = {
          solved: false,
          attempts: 0,
          wrong_attempts: 0,
          solve_time: null,
          solve_time_formatted: null,
          penalty: 0,
          status: 'unsolved', // 'solved', 'wrong', 'unsolved'
          first_solver: false
        };
      });
      
      // Process submissions for this participant
      const userSubmissions = submissions.filter(s => s.user_id === userId);
      
      userSubmissions.forEach(submission => {
        const problemId = submission.problem_id;
        const status = submission.status;
        const submissionTime = new Date(submission.submitted_at);
        
        // Only count submissions within contest time window
        if (submissionTime < contestStartTime || submissionTime > contestEndTime) {
          console.log(`[STANDINGS] Skipping submission outside contest time: ${submissionTime.toISOString()}`);
          return;
        }
        
        if (participantData.problems[problemId]) {
          const problemData = participantData.problems[problemId];
          
          // Skip if already solved
          if (problemData.solved) return;
          
          problemData.attempts++;
          
          if (status === 'AC') {
            // Problem solved!
            problemData.solved = true;
            problemData.status = 'solved';
            
            // Check if this user was the first solver
            if (firstSolvers[problemId] === userId) {
              problemData.first_solver = true;
            }
            
            // Calculate solve time in minutes
            const solveTimeMs = submissionTime - contestStartTime;
            const solveTimeMinutes = Math.floor(solveTimeMs / (1000 * 60));
            problemData.solve_time = solveTimeMinutes;
            
            // Format solve time as [day:]hour:min:sec
            const totalSeconds = Math.floor(solveTimeMs / 1000);
            const days = Math.floor(totalSeconds / (24 * 3600));
            const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            
            if (days > 0) {
              problemData.solve_time_formatted = `${days}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            } else {
              problemData.solve_time_formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
            
            // Calculate penalty: solve time + 20 minutes for each wrong attempt
            problemData.penalty = solveTimeMinutes + (problemData.wrong_attempts * 20);
            
            // Add to participant totals
            participantData.score++;
            participantData.penalty += problemData.penalty;
            
          } else if (status !== 'CE') {
            // Wrong submission (not compilation error)
            problemData.wrong_attempts++;
            problemData.status = 'wrong';
          }
        }
      });
      
      return participantData;
    });
    
    // Sort standings: descending by score, then ascending by penalty
    standings.sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score; // Higher score first
      }
      return a.penalty - b.penalty; // Lower penalty first
    });
    
    // Add ranks
    standings.forEach((participant, index) => {
      participant.rank = index + 1;
    });
    
    res.json({
      standings,
      problems,
      contest_info: {
        name: contest.name,
        start_time: contest.start_time,
        end_time: contest.end_time
      }
    });
    
  } catch (error) {
    console.error('Error fetching standings:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch standings' });
  }
});

module.exports = router;
