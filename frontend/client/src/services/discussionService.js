// src/services/discussionService.js
import { authHeader } from "./sessionService";

export const discussionService = {
  // Fetch threads with pagination, filtering, and sorting
  async getThreads({
    page = 1,
    limit = 20,
    type = "all",
    search = "",
    sort = "latest",
    tab = "all",
    userId = null,
  } = {}) {
    try {
      const queryParams = new URLSearchParams({
        page,
        limit,
        type,
        sort,
        ...(search && { search }),
        ...(tab !== "all" && { tab }),
        ...(userId && { userId }),
      });

      const response = await fetch(`/api/discussions?${queryParams}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || error.message || "Failed to fetch discussions",
          { cause: error }
        );
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching discussions:", error);
      throw error;
    }
  },
  // Fetch threads with pagination and filters - this is handled by the first getThreads method

  // Get a single thread with its posts
  async getThread(threadId) {
    try {
      const response = await fetch(`/api/discussions/${threadId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch discussion");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching discussion:", error);
      throw error;
    }
  },

  // Create a new discussion thread
  async createThread({ title, content, thread_type, reference_id = null }) {
    try {
      const token = localStorage.getItem("sb-access-token");
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`/api/discussions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          thread_type,
          reference_id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.error || data.message || "Failed to create discussion"
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating discussion:", error);
      throw error;
    }
  },

  // Add a new post to a discussion
  async createPost(threadId, { content }) {
    try {
      const token = localStorage.getItem("sb-access-token");
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_URL}/api/discussions/${threadId}/posts`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: content.trim(),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || error.message || "Failed to create post"
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating post:", error);
      throw error;
    }
  },

  // Like or unlike a post
  async togglePostLike(postId) {
    try {
      const response = await fetch(`/api/discussions/posts/${postId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to toggle like");
      }
      return await response.json();
    } catch (error) {
      console.error("Error toggling like:", error);
      throw error;
    }
  },

  // Edit an existing post
  async updatePost(postId, { content }) {
    try {
      const response = await fetch(`/api/discussions/posts/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content.trim(),
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update post");
      }
      return await response.json();
    } catch (error) {
      console.error("Error updating post:", error);
      throw error;
    }
  },

  // Update a discussion thread
  async updateThread(threadId, { title, thread_type }) {
    try {
      const response = await fetch(`/api/discussions/${threadId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          thread_type,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update discussion");
      }
      return await response.json();
    } catch (error) {
      console.error("Error updating discussion:", error);
      throw error;
    }
  },

  // Delete a discussion thread
  async deleteThread(threadId) {
    try {
      const response = await fetch(`/api/discussions/${threadId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete discussion");
      }
      return await response.json();
    } catch (error) {
      console.error("Error deleting discussion:", error);
      throw error;
    }
  },

  // Delete a post
  async deletePost(postId) {
    try {
      const response = await fetch(`/api/discussions/posts/${postId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete post");
      }
      return await response.json();
    } catch (error) {
      console.error("Error deleting post:", error);
      throw error;
    }
  },
};
