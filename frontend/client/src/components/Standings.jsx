import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const Standings = ({ contestId }) => {
  const [standings, setStandings] = useState([]);
  const [problems, setProblems] = useState([]);
  const [contestInfo, setContestInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStandings = async () => {
    const isRefresh = !loading;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      const response = await fetch(`/api/standings/${contestId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch standings');
      }
      
      const data = await response.json();
      setStandings(data.standings || []);
      setProblems(data.problems || []);
      setContestInfo(data.contest_info);
    } catch (err) {
      console.error('Error fetching standings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!contestId) return;
    fetchStandings();
  }, [contestId]);

  const getProblemCellStyle = (problemData) => {
    if (problemData.solved) {
      return "bg-green-900/40 text-green-300 border-green-500/50";
    } else if (problemData.status === 'wrong') {
      return "bg-red-900/40 text-red-300 border-red-500/50";
    } else {
      return "bg-gray-800/40 text-gray-400 border-gray-600/50";
    }
  };

  const formatPenalty = (penalty) => {
    if (penalty === 0) return "-";
    return penalty.toString();
  };

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-400"></div>
        <p className="mt-4 text-gray-400">Loading standings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <div className="text-red-400 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Error loading standings: {error}
        </div>
      </div>
    );
  }

  if (standings.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          No participants found for this contest.
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center mb-6 pb-2 border-b-2 border-pink-700/50">
        <h2 className="text-2xl font-bold text-pink-400"
            style={{ textShadow: "0 0 8px rgba(236, 72, 153, 0.5)" }}>
          Contest Standings ({standings.length} participants)
        </h2>
        
        <button
          onClick={fetchStandings}
          disabled={refreshing}
          className="px-4 py-2 bg-pink-600/20 border border-pink-500/50 text-pink-300 rounded-lg 
                     hover:bg-pink-600/30 transition-all duration-200 disabled:opacity-50 
                     disabled:cursor-not-allowed flex items-center gap-2 text-sm"
        >
          <svg 
            className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {refreshing ? 'Refreshing...' : 'Refresh Standings'}
        </button>
      </div>

      {/* Standings Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-pink-600/50">
              {/* Rank Column */}
              <th className="text-left py-4 px-3 text-pink-300 font-semibold bg-gray-800/30 border-r border-gray-600/50 min-w-[60px]">
                Rank
              </th>
              
              {/* Username Column */}
              <th className="text-left py-4 px-4 text-pink-300 font-semibold bg-gray-800/30 border-r border-gray-600/50 min-w-[140px]">
                Username
              </th>
              
              {/* Score Column */}
              <th className="text-center py-4 px-3 text-pink-300 font-semibold bg-gray-800/30 border-r border-gray-600/50 min-w-[70px]">
                Score
              </th>
              
              {/* Penalty Column */}
              <th className="text-center py-4 px-3 text-pink-300 font-semibold bg-gray-800/30 border-r border-gray-600/50 min-w-[80px]">
                Penalty
              </th>
              
              {/* Problem Columns */}
              {problems.map((problem, index) => (
                <th key={problem.problem_id} 
                    className="text-center py-4 px-2 text-pink-300 font-semibold bg-gray-800/30 border-r border-gray-600/50 min-w-[100px] text-xs">
                  <span className="font-bold">Problem {index + 1}</span>
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody>
            {standings.map((participant, index) => (
              <motion.tr 
                key={participant.user_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-gray-700/50 hover:bg-gray-800/20 transition-colors duration-200"
              >
                {/* Rank */}
                <td className="py-3 px-3 text-center font-bold text-yellow-400 border-r border-gray-600/30">
                  {participant.rank}
                </td>
                
                {/* Username */}
                <td className="py-3 px-4 text-cyan-300 font-medium border-r border-gray-600/30">
                  {participant.username}
                </td>
                
                {/* Score */}
                <td className="py-3 px-3 text-center font-bold text-green-400 border-r border-gray-600/30">
                  {participant.score}
                </td>
                
                {/* Penalty */}
                <td className="py-3 px-3 text-center text-gray-300 border-r border-gray-600/30">
                  {formatPenalty(participant.penalty)}
                </td>
                
                {/* Problem Cells */}
                {problems.map((problem) => {
                  const problemData = participant.problems[problem.problem_id];
                  return (
                    <td key={problem.problem_id} 
                        className={`py-3 px-2 text-center text-xs border-r border-gray-600/30 ${getProblemCellStyle(problemData)}`}>
                      <div className="min-h-[40px] flex flex-col justify-center">
                        {problemData.solved ? (
                          <>
                            <div className="text-xs text-green-300">
                              {problemData.solve_time_formatted}
                            </div>
                            {problemData.wrong_attempts > 0 && (
                              <div className="text-xs text-green-400 mt-1">
                                (-{problemData.wrong_attempts})
                              </div>
                            )}
                          </>
                        ) : problemData.status === 'wrong' ? (
                          <div className="text-xs text-red-300">
                            (-{problemData.wrong_attempts})
                          </div>
                        ) : (
                          <div className="text-gray-500">-</div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Standings;
