// src/lib/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

// Remove any trailing slashes from the URL
const cleanUrl = (url) => url?.replace(/\/+$/, "") || "";

const supabaseUrl = cleanUrl(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be defined"
  );
}

// Log configuration in development
if (import.meta.env.DEV) {
  console.log("Initializing Supabase with URL:", supabaseUrl);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storage: window.localStorage,
    storageKey: "sb-auth-token",
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: "public",
  },
  global: {
    headers: {
      "x-application-name": "sibyljudge",
    },
  },
  realtime: {
    enabled: true,
    endpoint: `${supabaseUrl}/realtime/v1`.replace("https://", "wss://"),
    timeout: 60000,
    params: {
      eventsPerSecond: 1,
    },
    logger: (msg) => console.log("Realtime:", msg),
    retryAttempts: 3,
    retryBackoff: (attempt) => Math.min(1000 * Math.pow(2, attempt), 10000),
  },
});

// Initialize realtime connection when needed
const initializeRealtime = async () => {
  try {
    console.log("Initializing realtime connection...");

    // Create a simple broadcast channel
    const channel = supabase.channel("system_monitor", {
      config: {
        broadcast: { self: true },
      },
    });

    // Set up channel event handlers
    channel
      .on("broadcast", { event: "ping" }, () => {
        console.log("Received ping");
      })
      .on("system", { event: "status" }, (payload) => {
        console.log("System status:", payload);
      });

    // Subscribe to the channel
    const subscription = await channel.subscribe((status, err) => {
      console.log("Subscription status:", status);
      if (err) {
        console.error("Subscription error:", err);
      }
      if (status === "SUBSCRIBED") {
        console.log("Successfully connected to realtime");
        // Send a test broadcast
        channel.send({
          type: "broadcast",
          event: "ping",
          payload: { timestamp: new Date().toISOString() },
        });
      }
    });

    return channel;
  } catch (error) {
    console.error("Error initializing realtime:", error);
    return null;
  }
};

// Export the realtime initialization function
export const connectToRealtime = async () => {
  return await initializeRealtime();
};
