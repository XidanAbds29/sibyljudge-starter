// src/services/notificationService.js
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const notificationService = {
  async getNotifications(userId) {
    const response = await fetch(
      `${API_URL}/api/notifications?userId=${userId}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch notifications");
    }

    return response.json();
  },

  async markAsRead(notificationId) {
    const response = await fetch(
      `${API_URL}/api/notifications/${notificationId}/read`,
      {
        method: "POST",
        credentials: "include",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to mark notification as read");
    }

    return response.json();
  },

  async markAllAsRead(userId) {
    const response = await fetch(`${API_URL}/api/notifications/read-all`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message || "Failed to mark all notifications as read"
      );
    }

    return response.json();
  },
};
