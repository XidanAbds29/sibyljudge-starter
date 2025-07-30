import React, { useState, useRef, useEffect } from "react";
import { useNotifications } from "./NotificationContext";
import { format } from "date-fns";
import { Link } from "react-router-dom";

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.notification_id);
    }

    // Handle navigation based on notification type
    switch (notification.type) {
      case "contest_start":
      case "contest_end":
        window.location.href = `/contest/${notification.contest_id}`;
        break;
      case "thread_reply":
        window.location.href = `/discussion/thread/${notification.thread_id}`;
        break;
      case "editorial_update":
        window.location.href = `/problem/${notification.problem_id}/editorial`;
        break;
      case "group_invite":
      case "group_join":
        window.location.href = `/group/${notification.group_id}`;
        break;
      case "track_completed":
        window.location.href = `/track/${notification.track_id}`;
        break;
      default:
        break;
    }
    setIsOpen(false);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "contest_start":
      case "contest_end":
        return "🏆";
      case "thread_reply":
        return "💬";
      case "editorial_update":
        return "📝";
      case "group_invite":
      case "group_join":
        return "👥";
      case "badge_earned":
        return "🏅";
      case "track_completed":
        return "🎯";
      default:
        return "📢";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white focus:outline-none"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-gray-800 rounded-lg shadow-lg overflow-hidden z-50">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-cyan-400 hover:text-cyan-300"
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-gray-400 text-center">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.notification_id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors ${
                    !notification.is_read ? "bg-gray-750" : ""
                  }`}
                >
                  <div className="flex items-start">
                    <span className="text-xl mr-3">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1">
                      <h4
                        className={`font-medium ${
                          notification.is_read ? "text-gray-300" : "text-white"
                        }`}
                      >
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-400 mt-1">
                        {notification.message}
                      </p>
                      <span className="text-xs text-gray-500 mt-2 block">
                        {format(
                          new Date(notification.created_at),
                          "MMM d, yyyy h:mm a"
                        )}
                      </span>
                    </div>
                    {!notification.is_read && (
                      <span className="w-2 h-2 bg-cyan-400 rounded-full mt-2"></span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
