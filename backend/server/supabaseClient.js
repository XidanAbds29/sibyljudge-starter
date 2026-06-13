// backend/server/supabaseClient.js
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config(); // Load environment variables from .env file

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;

let supabase = null;
let supabaseError = null;

if (!supabaseUrl || !supabaseKey) {
  supabaseError = new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables are missing.");
  console.warn("[WARN] Supabase client not initialized:", supabaseError.message);
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseKey.trim());
  } catch (err) {
    supabaseError = err;
    console.error("[ERROR] Failed to create Supabase client:", err.message);
  }
}

module.exports = supabase;
module.exports.supabaseError = supabaseError;

