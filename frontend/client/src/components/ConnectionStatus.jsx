import React, { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [lastCheck, setLastCheck] = useState(new Date());

  // Check connection status periodically
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Check backend health endpoint
        const response = await fetch(`${API_URL}/`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        setIsOnline(response.ok);
        setLastCheck(new Date());
      } catch (error) {
        setIsOnline(false);
        setLastCheck(new Date());
      }
    };

    // Check immediately
    checkConnection();

    // Then check every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  if (isOnline) return null; // Don't show anything when connection is good

  return (
    <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
        <span>Connection Lost</span>
      </div>
      <div className="text-xs mt-1">
        Last checked: {lastCheck.toLocaleTimeString()}
      </div>
    </div>
  );
}
