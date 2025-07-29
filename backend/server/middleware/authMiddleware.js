const jwt = require("jsonwebtoken");

// Ensure this matches your JWT_SECRET in authRoutes.js
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const COOKIE_NAME = "token"; // Ensure this matches your COOKIE_NAME in authRoutes.js

const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentication required: Bearer token required",
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' from header
    if (!token) {
      return res.status(401).json({
        error: "Authentication required: No token provided",
      });
    }

    // Verify the token using Supabase service client
    const {
      data: { user },
      error,
    } = await req.supabase.auth.getUser(token);

    if (error || !user) {
      console.error("Auth error:", error);
      return res.status(401).json({
        error: "Authentication failed: Invalid token",
      });
    }

    // Set the auth context with the token
    req.supabase.auth.setSession({
      access_token: token,
      refresh_token: null,
    });

    if (error || !user) {
      console.error("Auth error:", error);
      return res.status(401).json({
        error: "Authentication failed: Invalid token",
      });
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await req.supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("Profile fetch error:", profileError);
      return res.status(401).json({
        error: "Authentication failed: Profile not found",
      });
    }

    // Attach both auth user and profile to request
    req.user = { ...user, ...profile };
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(500).json({
      error: "Authentication failed: Server error",
    });
  }
};

module.exports = authenticateToken;
