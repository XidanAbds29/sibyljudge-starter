// src/services/contestService.js
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const contestService = {
  async getContests({ page = 1, filters = {} }) {
    const queryParams = new URLSearchParams({
      page,
      ...filters,
    });

    const response = await fetch(`${API_URL}/api/contests?${queryParams}`, {
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch contests");
    }

    return response.json();
  },

  async getContest(contestId) {
    const response = await fetch(`${API_URL}/api/contests/${contestId}`, {
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch contest");
    }

    return response.json();
  },

  async createContest(contestData) {
    const response = await fetch(`${API_URL}/api/contests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(contestData),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create contest");
    }

    return response.json();
  },

  async updateContest(contestId, contestData) {
    const response = await fetch(`${API_URL}/api/contests/${contestId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(contestData),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update contest");
    }

    return response.json();
  },

  async joinContest(contestId, password = null) {
    const response = await fetch(`${API_URL}/api/contests/${contestId}/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to join contest");
    }

    return response.json();
  },

  async getContestProblems(contestId) {
    const response = await fetch(
      `${API_URL}/api/contests/${contestId}/problems`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch contest problems");
    }

    return response.json();
  },
};
