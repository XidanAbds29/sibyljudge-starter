// backend/server/supabaseClient.js
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config(); // Load environment variables from .env file

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for backend operations

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set in environment variables."
  );
  process.exit(1); // Exit if critical environment variables are missing
}

const supabase = createClient(supabaseUrl, supabaseKey);
module.exports = supabase;
