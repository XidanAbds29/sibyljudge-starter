const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.PUBLIC_SUPABASE_ANON_KEY
).trim();
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const authenticateToken = async (req, res, next) => {
  // Try to get token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Authentication required: No token provided" });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    // Verify the token with Supabase
    const { data: user, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res
        .status(403)
        .json({ error: "Authentication failed: Invalid token" });
    }

    // Attach user info to request
    req.user = { user_id: user.user.id, email: user.user.email };
    next();
  } catch (err) {
    return res
      .status(403)
      .json({ error: "Authentication failed: Invalid token" });
  }
};

module.exports = authenticateToken;
