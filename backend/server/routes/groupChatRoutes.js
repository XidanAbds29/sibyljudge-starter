const express = require("express");
const router = express.Router();

// GET /api/group-chat/:group_id - Get all chat messages for a specific group
router.get("/:group_id", async (req, res) => {
  const supabase = req.supabase;
  const { group_id } = req.params;
  const userId = req.query.user_id; // Get user_id from query parameter
  const limit = req.query.limit ? parseInt(req.query.limit) : 50;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  try {
    // Check if user_id is provided
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // First check if user is a member of the group
    const { data: membership, error: membershipError } = await supabase
      .from("group_member")
      .select("*")
      .eq("group_id", group_id)
      .eq("user_id", userId)
      .single();

    if (membershipError || !membership) {
      return res.status(403).json({ error: "You must be a group member to view chat" });
    }

    // Fetch chat messages with user information
    const { data: chatMessages, error: chatError } = await supabase
      .from("group_chat")
      .select(`
        chat_id,
        group_id,
        user_id,
        chat_content,
        sent_at,
        edited_at,
        profiles!inner (
          username
        )
      `)
      .eq("group_id", group_id)
      .order("sent_at", { ascending: true })
      .range(from, to);
    
    if (chatError) {
      console.error("[GroupChat] Error fetching messages:", chatError);
      return res.status(500).json({ error: chatError.message });
    }

    // Transform the data
    const transformedMessages = (chatMessages || []).map(msg => ({
      chatId: msg.chat_id,
      groupId: msg.group_id,
      userId: msg.user_id,
      username: msg.profiles?.username || "Unknown User",
      content: msg.chat_content,
      sentAt: msg.sent_at,
      editedAt: msg.edited_at,
      isOwnMessage: msg.user_id === userId
    }));

    // Get total count for pagination
    const { count } = await supabase
      .from("group_chat")
      .select("chat_id", { count: 'exact', head: true })
      .eq("group_id", group_id);
    
    res.json({ 
      messages: transformedMessages, 
      total: count || 0,
      page,
      limit
    });
    
  } catch (err) {
    console.error("[GroupChat] Route error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/group-chat/:group_id - Send a new chat message
router.post("/:group_id", async (req, res) => {
  const supabase = req.supabase;
  const { group_id } = req.params;
  const { message, user_id } = req.body; // Get user_id from request body
  
  try {
    // Validate input
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: "Message content is required" });
    }

    if (message.trim().length > 1000) {
      return res.status(400).json({ error: "Message is too long (max 1000 characters)" });
    }

    if (!user_id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Check if user is a member of the group
    const { data: membership, error: membershipError } = await supabase
      .from("group_member")
      .select("*")
      .eq("group_id", group_id)
      .eq("user_id", user_id)
      .single();

    if (membershipError || !membership) {
      return res.status(403).json({ error: "You must be a group member to send messages" });
    }

    // Insert the new message
    const { data: newMessage, error: insertError } = await supabase
      .from("group_chat")
      .insert({
        group_id: group_id,
        user_id: user_id,
        chat_content: message.trim(),
        sent_at: new Date().toISOString()
      })
      .select(`
        chat_id,
        group_id,
        user_id,
        chat_content,
        sent_at,
        profiles!inner (
          username
        )
      `)
      .single();
    
    if (insertError) {
      console.error("[GroupChat] Error inserting message:", insertError);
      return res.status(500).json({ error: insertError.message });
    }

    // Transform the response
    const transformedMessage = {
      chatId: newMessage.chat_id,
      groupId: newMessage.group_id,
      userId: newMessage.user_id,
      username: newMessage.profiles?.username || "Unknown User",
      content: newMessage.chat_content,
      sentAt: newMessage.sent_at,
      isOwnMessage: true
    };

    res.status(201).json({ message: transformedMessage });
    
  } catch (err) {
    console.error("[GroupChat] Send message error:", err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/group-chat/:group_id/:chat_id - Edit a chat message (only own messages)
router.put("/:group_id/:chat_id", async (req, res) => {
  const supabase = req.supabase;
  const { group_id, chat_id } = req.params;
  const { message, user_id } = req.body;
  
  try {
    // Validate input
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: "Message content is required" });
    }

    if (message.trim().length > 1000) {
      return res.status(400).json({ error: "Message is too long (max 1000 characters)" });
    }

    if (!user_id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Check if user owns the message
    const { data: existingMessage, error: messageError } = await supabase
      .from("group_chat")
      .select("*")
      .eq("chat_id", chat_id)
      .eq("group_id", group_id)
      .eq("user_id", user_id)
      .single();

    if (messageError || !existingMessage) {
      return res.status(403).json({ error: "You can only edit your own messages" });
    }

    // Update the message
    const { data: updatedMessage, error: updateError } = await supabase
      .from("group_chat")
      .update({
        chat_content: message.trim(),
        edited_at: new Date().toISOString()
      })
      .eq("chat_id", chat_id)
      .select(`
        chat_id,
        group_id,
        user_id,
        chat_content,
        sent_at,
        edited_at,
        profiles!inner (
          username
        )
      `)
      .single();
    
    if (updateError) {
      console.error("[GroupChat] Error updating message:", updateError);
      return res.status(500).json({ error: updateError.message });
    }

    // Transform the response
    const transformedMessage = {
      chatId: updatedMessage.chat_id,
      groupId: updatedMessage.group_id,
      userId: updatedMessage.user_id,
      username: updatedMessage.profiles?.username || "Unknown User",
      content: updatedMessage.chat_content,
      sentAt: updatedMessage.sent_at,
      editedAt: updatedMessage.edited_at,
      isOwnMessage: true
    };

    res.json({ message: transformedMessage });
    
  } catch (err) {
    console.error("[GroupChat] Edit message error:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/group-chat/:group_id/:chat_id - Delete a chat message (only own messages)
router.delete("/:group_id/:chat_id", async (req, res) => {
  const supabase = req.supabase;
  const { group_id, chat_id } = req.params;
  const { user_id } = req.query; // Get user_id from query parameter
  
  try {
    if (!user_id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Check if user is a member of the group and owns the message
    const { data: message, error: messageError } = await supabase
      .from("group_chat")
      .select("*")
      .eq("chat_id", chat_id)
      .eq("group_id", group_id)
      .eq("user_id", user_id)
      .single();

    if (messageError || !message) {
      return res.status(403).json({ error: "You can only delete your own messages" });
    }

    // Delete the message
    const { error: deleteError } = await supabase
      .from("group_chat")
      .delete()
      .eq("chat_id", chat_id);
    
    if (deleteError) {
      console.error("[GroupChat] Error deleting message:", deleteError);
      return res.status(500).json({ error: deleteError.message });
    }

    res.json({ success: true });
    
  } catch (err) {
    console.error("[GroupChat] Delete message error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
