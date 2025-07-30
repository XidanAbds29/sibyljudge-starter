// src/lib/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
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
});
