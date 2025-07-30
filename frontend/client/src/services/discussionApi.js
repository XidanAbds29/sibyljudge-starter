import { apiClient } from "./apiClient";

export const discussionApi = {
  // Get discussions with pagination and filters
  getDiscussions: async (params) => {
    const response = await apiClient.get("/discussions", { params });
    return response.data;
  },

  // Get a single discussion thread with its posts
  getDiscussion: async (threadId) => {
    const response = await apiClient.get(`/discussions/${threadId}`);
    return response.data;
  },

  // Create a new discussion thread
  createDiscussion: async (data) => {
    const response = await apiClient.post("/discussions", data);
    return response.data;
  },

  // Update a discussion thread
  updateDiscussion: async (threadId, data) => {
    const response = await apiClient.put(`/discussions/${threadId}`, data);
    return response.data;
  },

  // Delete a discussion thread
  deleteDiscussion: async (threadId) => {
    const response = await apiClient.delete(`/discussions/${threadId}`);
    return response.data;
  },

  // Add a post to a thread
  createPost: async (threadId, data) => {
    const response = await apiClient.post(
      `/discussions/${threadId}/posts`,
      data
    );
    return response.data;
  },

  // Update a post
  updatePost: async (postId, data) => {
    const response = await apiClient.put(`/discussions/posts/${postId}`, data);
    return response.data;
  },

  // Delete a post
  deletePost: async (postId) => {
    const response = await apiClient.delete(`/discussions/posts/${postId}`);
    return response.data;
  },

  // Like or unlike a post
  togglePostLike: async (postId) => {
    const response = await apiClient.post(`/discussions/posts/${postId}/like`);
    return response.data;
  },
};
