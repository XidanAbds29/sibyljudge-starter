import React, { useState, useEffect } from "react";

const ContestTimer = ({ contest }) => {
  const [elapsed, setElapsed] = useState("");
  const [remaining, setRemaining] = useState("");
  const [contestState, setContestState] = useState("upcoming");

  useEffect(() => {
    if (!contest) return;

    const updateTimer = () => {
      const now = new Date();
      const startTime = new Date(contest.start_time);
      const endTime = new Date(contest.end_time);

      if (now < startTime) {
        // Contest hasn't started yet
        setContestState("upcoming");
        setElapsed("0:00:00");
        const diff = startTime - now;
        setRemaining(formatTime(diff));
      } else if (now >= startTime && now <= endTime) {
        // Contest is ongoing
        setContestState("running");
        const elapsedDiff = now - startTime;
        setElapsed(formatTime(elapsedDiff));
        const remainingDiff = endTime - now;
        setRemaining(formatTime(remainingDiff));
      } else {
        // Contest has ended
        setContestState("ended");
        const elapsedDiff = endTime - startTime;
        setElapsed(formatTime(elapsedDiff));
        setRemaining("0:00:00");
      }
    };

    // Update immediately
    updateTimer();

    // Only update every second if contest is running
    let interval;
    const now = new Date();
    const startTime = new Date(contest.start_time);
    const endTime = new Date(contest.end_time);
    
    if (now >= startTime && now <= endTime) {
      // Contest is running, update every second
      interval = setInterval(updateTimer, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [contest]);

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    
    if (totalSeconds <= 0) {
      return "0:00:00";
    }

    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
      return `${days}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  const getStatusText = () => {
    switch (contestState) {
      case "upcoming":
        return "Upcoming";
      case "running":
        return "Running";
      case "ended":
        return "Finished";
      default:
        return "Unknown";
    }
  };

  const getStatusColor = () => {
    switch (contestState) {
      case "upcoming":
        return "text-blue-400";
      case "running":
        return "text-red-400";
      case "ended":
        return "text-gray-400";
      default:
        return "text-gray-400";
    }
  };

  if (!contest) return null;

  return (
    <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-lg px-6 py-3 flex items-center justify-between min-w-[600px] font-mono text-sm">
      {/* Elapsed */}
      <div className="flex items-center gap-2">
        <span className="text-gray-300">Elapsed :</span>
        <span className="text-white font-semibold">{elapsed}</span>
      </div>

      {/* Status */}
      <div className={`font-semibold ${getStatusColor()}`}>
        {getStatusText()}
      </div>

      {/* Remaining */}
      <div className="flex items-center gap-2">
        <span className="text-gray-300">Remaining :</span>
        <span className="text-white font-semibold">{remaining}</span>
      </div>
    </div>
  );
};

export default ContestTimer;
