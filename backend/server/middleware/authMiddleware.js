const supabase = require("../supabaseClient");
const { supabaseError } = require("../supabaseClient");


const authenticateToken = async (req, res, next) => {
  if (!supabase) {
    return res.status(500).json({
      error: "Authentication service not initialized.",
      details: supabaseError ? supabaseError.message : "Supabase client is null"
    });
  }
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

authenticateToken.authenticateToken = authenticateToken;
authenticateToken.supabase = supabase;

module.exports = authenticateToken;
