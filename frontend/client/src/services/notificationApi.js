import { apiClient } from "./apiClient";

export const notificationApi = {
  // Get all notifications for the current user
  getNotifications: async () => {
    const response = await apiClient.get("/notifications");
    return response.data;
  },

  // Mark a notification as read
  markAsRead: async (notificationId) => {
    const response = await apiClient.put(
      `/notifications/${notificationId}/read`
    );
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await apiClient.put("/notifications/read-all");
    return response.data;
  },

  // Delete a notification
  deleteNotification: async (notificationId) => {
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return response.data;
  },
};
