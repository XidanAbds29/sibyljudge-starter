import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export function WebSocketStatus() {
  const [status, setStatus] = useState("initializing");
  const [lastError, setLastError] = useState(null);
  const [reconnectCount, setReconnectCount] = useState(0);

  useEffect(() => {
    let channel;
    let timeoutId;

    const initChannel = async () => {
      try {
        console.log("Initializing WebSocket channel...");
        
        // Set a timeout to detect if initialization takes too long
        timeoutId = setTimeout(() => {
          if (status === "initializing") {
            setStatus("error");
            setLastError("Connection timeout");
            setReconnectCount((prev) => prev + 1);
          }
        }, 10000); // 10 seconds timeout

        // Create a status monitoring channel
        channel = supabase.channel("status_monitor", {
          config: {
            presence: {
              key: "status",
            },
          },
        });

        channel.subscribe(async (status) => {
          console.log("Channel status:", status);
          clearTimeout(timeoutId);
          
          if (status === "SUBSCRIBED") {
            setStatus("connected");
            setLastError(null);
          } else if (status === "CLOSED") {
            setStatus("disconnected");
            setReconnectCount((prev) => prev + 1);
          } else if (status === "CHANNEL_ERROR") {
            setStatus("error");
            setLastError("Channel connection failed");
            setReconnectCount((prev) => prev + 1);
          }
        });
      } catch (error) {
        console.error("Error initializing status channel:", error);
        clearTimeout(timeoutId);
        setStatus("error");
        setLastError(error.message || "Failed to initialize channel");
      }
    };

    initChannel();

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, []);

  // Only show in development
  if (import.meta.env.MODE !== "development") return null;

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-gray-800 rounded-lg shadow-lg text-sm z-50">
      <h3 className="font-semibold mb-2 text-cyan-400">WebSocket Status</h3>
      <div className="space-y-1">
        <p>
          Status:{" "}
          <span
            className={
              status === "connected"
                ? "text-green-400"
                : status === "disconnected"
                ? "text-red-400"
                : "text-yellow-400"
            }
          >
            {status}
          </span>
        </p>
        <p>
          Reconnect attempts:{" "}
          <span className="text-cyan-400">{reconnectCount}</span>
        </p>
        {lastError && <p className="text-red-400">Last error: {lastError}</p>}
      </div>
    </div>
  );
}
