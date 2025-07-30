const express = require("express");
const router = express.Router();
const { authenticateToken, supabase } = require("../middleware/authMiddleware");

console.log("[NOTIFICATIONS] Route file loaded");

// GET /api/notifications - Get user notifications
router.get("/", authenticateToken, async (req, res) => {
  console.log(
    "[NOTIFICATIONS] GET / - Fetching notifications for user:",
    req.user?.id
  );
  try {
    const { data, error } = await supabase
      .from("notification")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      error: "Failed to fetch notifications",
      details: error.message,
    });
  }
});

// POST /api/notifications/:notificationId/read - Mark a notification as read
router.post("/:notificationId/read", authenticateToken, async (req, res) => {
  try {
    const { notificationId } = req.params;

    // Verify the notification belongs to the user
    const { data: notification, error: checkError } = await supabase
      .from("notification")
      .select("user_id")
      .eq("notification_id", notificationId)
      .single();

    if (checkError) throw checkError;
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    if (notification.user_id !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Update the notification
    const { error } = await supabase
      .from("notification")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("notification_id", notificationId);

    if (error) throw error;

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      error: "Failed to mark notification as read",
      details: error.message,
    });
  }
});

// POST /api/notifications/read-all - Mark all notifications as read
router.post("/read-all", authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from("notification")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("user_id", req.user.id)
      .eq("is_read", false);

    if (error) throw error;

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      error: "Failed to mark all notifications as read",
      details: error.message,
    });
  }
});

module.exports = router;
