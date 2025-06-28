const jwt = require("jsonwebtoken");

// Ensure this matches your JWT_SECRET in authRoutes.js
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const COOKIE_NAME = "token"; // Ensure this matches your COOKIE_NAME in authRoutes.js

const authenticateToken = (req, res, next) => {
  const token = req.cookies[COOKIE_NAME];
  if (!token) {
    return res
      .status(401)
      .json({ error: "Authentication required: No token provided" });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user; // Attach user payload (user_id, email) to the request
    next(); // Proceed to the next route handler
  } catch (err) {
    return res
      .status(403)
      .json({ error: "Authentication failed: Invalid token" });
  }
};

module.exports = authenticateToken;
