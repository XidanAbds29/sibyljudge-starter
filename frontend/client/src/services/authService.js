// src/services/authService.js
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error || data.message || "An error occurred");
    error.status = response.status;
    error.details = data.details;
    throw error;
  }
  return data;
};

export const authService = {
  async signUp({ email, password, username }) {
    const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, username }),
      credentials: "include",
    });

    return handleResponse(response);
  },

  async signIn({ email, password }) {
    const response = await fetch(`${API_URL}/api/auth/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });

    const data = await handleResponse(response);

    if (data.session?.access_token) {
      localStorage.setItem("sb-access-token", data.session.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
    }

    return data;
  },

  async signOut() {
    const response = await fetch(`${API_URL}/api/auth/signout`, {
      method: "POST",
      credentials: "include",
    });

    return handleResponse(response);
  },

  async getSession() {
    try {
      const response = await fetch(`${API_URL}/api/auth/session`, {
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      return handleResponse(response);
    } catch (error) {
      // Special handling for network errors during session check
      console.error("Session check failed:", error);
      return null;
    }
  },

  async updateProfile({ username, institution, bio }) {
    const response = await fetch(`${API_URL}/api/auth/profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ username, institution, bio }),
    });

    return handleResponse(response);
  },

  // Helper method to check if a user is authenticated
  async isAuthenticated() {
    try {
      const session = await this.getSession();
      return !!session?.user;
    } catch {
      return false;
    }
  },

  // Method to get auth header for other API calls
  getAuthHeader() {
    const token = localStorage.getItem("sb-access-token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
};
