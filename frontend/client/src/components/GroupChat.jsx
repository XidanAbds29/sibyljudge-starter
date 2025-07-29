import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function GroupChat({ groupId, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editing, setEditing] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Fetch messages when component mounts
  useEffect(() => {
    if (groupId && currentUser?.id) {
      fetchMessages(false); // Initial load
      
      // Set up automatic refresh every 5 seconds
      const interval = setInterval(() => {
        console.log("Auto-refreshing chat messages...");
        fetchMessages(true); // Background refresh
      }, 5000); // 5 seconds
      
      // Cleanup interval on component unmount
      return () => {
        console.log("Cleaning up chat auto-refresh interval");
        clearInterval(interval);
      };
    }
  }, [groupId, currentUser?.id]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");
      
      if (!currentUser?.id) {
        throw new Error("User not authenticated");
      }
      
      const response = await fetch(`/api/group-chat/${groupId}?limit=100&user_id=${currentUser.id}`);
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("You must be a group member to view chat");
        }
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }
      
      const data = await response.json();
      setMessages(data.messages || []);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Error fetching messages:", err);
      if (!isRefresh) { // Only show error for initial load, not for background refreshes
        setError(err.message || "Failed to load messages");
      }
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending) {
      return;
    }

    if (!currentUser?.id) {
      setError("User not authenticated");
      return;
    }

    try {
      setSending(true);
      setError("");
      
      const response = await fetch(`/api/group-chat/${groupId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: newMessage.trim(),
          user_id: currentUser.id
        }),
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("You must be a group member to send messages");
        }
        throw new Error(`Failed to send message: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add the new message to the messages list
      setMessages(prev => [...prev, data.message]);
      setNewMessage("");
      
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const editMessage = async (e) => {
    e.preventDefault();
    
    if (!editContent.trim() || editing) return;
    
    try {
      setEditing(true);
      setError("");
      
      const response = await fetch(`/api/group-chat/${groupId}/${editingMessage.chatId}?user_id=${currentUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: editContent.trim(),
          user_id: currentUser.id
        }),
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("You can only edit your own messages");
        }
        throw new Error(`Failed to edit message: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update the message in the messages list
      setMessages(prev => prev.map(msg => 
        msg.chatId === editingMessage.chatId 
          ? { ...msg, content: data.message.content, editedAt: data.message.editedAt }
          : msg
      ));
      
      // Clear edit state
      setEditingMessage(null);
      setEditContent("");
      
    } catch (err) {
      console.error("Error editing message:", err);
      setError(err.message || "Failed to edit message");
    } finally {
      setEditing(false);
    }
  };

  const startEditMessage = (message) => {
    setEditingMessage(message);
    setEditContent(message.content);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setEditContent("");
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400"></div>
        <span className="ml-3 text-gray-400">Loading chat...</span>
      </div>
    );
  }

  if (error && messages.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-4">
          <svg className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
        <button
          onClick={() => fetchMessages(false)}
          className="px-4 py-2 bg-cyan-600 text-gray-950 rounded-lg hover:bg-cyan-500 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      {/* Chat Header */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-cyan-400/30">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <h3 className="text-lg font-semibold text-cyan-200">Group Chat</h3>
          <span className="text-sm text-gray-400">({messages.length} messages)</span>
          {lastRefresh && (
            <span className="text-xs text-gray-500">
              Updated {formatTime(lastRefresh.toISOString())}
            </span>
          )}
        </div>
        
        <button
          onClick={() => fetchMessages(true)}
          disabled={refreshing}
          className="px-4 py-2 bg-cyan-600/20 border border-cyan-500/50 text-cyan-300 rounded-lg 
                     hover:bg-cyan-600/30 transition-all duration-200 disabled:opacity-50 
                     disabled:cursor-not-allowed flex items-center gap-2 text-sm"
        >
          <svg 
            className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {refreshing ? 'Refreshing...' : 'Refresh Chat'}
        </button>
      </div>

      {/* Messages Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto mb-4 pr-2 scrollbar-thin scrollbar-thumb-cyan-600 scrollbar-track-gray-700"
        style={{ maxHeight: '400px' }}
      >
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <svg className="h-12 w-12 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-lg mb-2">No messages yet</p>
            <p className="text-sm">Be the first to start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {messages.map((message, index) => {
                const isOwnMessage = message.userId === currentUser?.id;
                const showAvatar = index === 0 || messages[index - 1].userId !== message.userId;
                
                return (
                  <motion.div
                    key={message.chatId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    <div className={`flex-shrink-0 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                        isOwnMessage 
                          ? 'bg-cyan-600 text-gray-950' 
                          : 'bg-gray-600 text-gray-200'
                      }`}>
                        {message.username.charAt(0).toUpperCase()}
                      </div>
                    </div>

                    {/* Message Content */}
                    <div className={`flex-1 max-w-[70%] ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                      {showAvatar && (
                        <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                          <span className={`text-sm font-medium ${isOwnMessage ? 'text-cyan-300' : 'text-gray-300'}`}>
                            {message.username}
                          </span>
                        </div>
                      )}
                      
                      {/* Always show timestamp for each message */}
                      <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-xs text-gray-500">
                          {formatTime(message.sentAt)}
                          {message.editedAt && (
                            <span className="ml-2 text-xs text-gray-400 italic">
                              (edited at {formatTime(message.editedAt)})
                            </span>
                          )}
                        </span>
                      </div>
                      
                      {/* Edit Mode */}
                      {editingMessage?.chatId === message.chatId ? (
                        <form onSubmit={editMessage} className="w-full">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:border-cyan-400 focus:outline-none resize-none text-sm"
                            rows="2"
                            maxLength="1000"
                            autoFocus
                          />
                          <div className="flex justify-end gap-2 mt-2">
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="px-3 py-1 text-xs bg-gray-600 text-gray-200 rounded hover:bg-gray-500 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={!editContent.trim() || editing}
                              className="px-3 py-1 text-xs bg-cyan-600 text-gray-950 rounded hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {editing ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        </form>
                      ) : (
                        /* Normal Message Display */
                        <div className="relative">
                          <div className={`relative inline-block max-w-full px-4 py-2 rounded-2xl break-words ${
                            isOwnMessage
                              ? 'bg-cyan-600 text-gray-950 rounded-br-md'
                              : 'bg-gray-700 text-gray-100 rounded-bl-md'
                          }`}>
                            <p className="whitespace-pre-wrap pr-2">{message.content}</p>
                            
                            {/* Tail */}
                            <div className={`absolute top-0 w-0 h-0 ${
                              isOwnMessage
                                ? 'right-0 border-l-8 border-l-cyan-600 border-t-8 border-t-transparent'
                                : 'left-0 border-r-8 border-r-gray-700 border-t-8 border-t-transparent'
                            }`} />
                          </div>
                          
                          {/* Edit Badge - Only for own messages */}
                          {isOwnMessage && (
                            <button
                              onClick={() => startEditMessage(message)}
                              className={`ml-2 px-2 py-1 text-xs rounded-full transition-all duration-200 hover:scale-105 ${
                                isOwnMessage
                                  ? 'bg-cyan-500/80 text-gray-950 hover:bg-cyan-400'
                                  : 'bg-gray-600/80 text-gray-200 hover:bg-gray-500'
                              }`}
                              title="Edit message"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/60 text-red-200 rounded-lg border border-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={sendMessage} className="flex gap-2">
        <div className="flex-1 relative">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message... (Press Enter to send, Shift+Enter for new line)"
            disabled={sending}
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-gray-200 placeholder-gray-400 focus:border-cyan-400 focus:outline-none resize-none scrollbar-thin scrollbar-thumb-cyan-600 scrollbar-track-gray-700"
            rows="2"
            maxLength="1000"
          />
          <div className="absolute bottom-2 right-2 text-xs text-gray-500">
            {newMessage.length}/1000
          </div>
        </div>
        
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
            !newMessage.trim() || sending
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-cyan-600 text-gray-950 hover:bg-cyan-500 shadow hover:shadow-md hover:shadow-cyan-500/30'
          }`}
        >
          {sending ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Sending...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span>Send</span>
            </div>
          )}
        </button>
      </form>
    </div>
  );
}
