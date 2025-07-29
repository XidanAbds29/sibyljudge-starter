// src/services/problemService.js
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const problemService = {
  async getProblems({ page = 1, filters = {}, sorting = {} }) {
    const queryParams = new URLSearchParams({
      page,
      ...filters,
      ...sorting,
    });

    const response = await fetch(`${API_URL}/api/problems?${queryParams}`, {
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch problems");
    }

    return response.json();
  },

  async getProblem(problemId) {
    const response = await fetch(`${API_URL}/api/problems/${problemId}`, {
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch problem");
    }

    return response.json();
  },

  async getProblemTestCases(problemId) {
    const response = await fetch(
      `${API_URL}/api/problems/${problemId}/testcases`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch test cases");
    }

    return response.json();
  },

  async getFavoriteProblems(userId) {
    const response = await fetch(
      `${API_URL}/api/problems/favorites?userId=${userId}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch favorite problems");
    }

    return response.json();
  },

  async toggleFavorite(problemId) {
    const response = await fetch(
      `${API_URL}/api/problems/${problemId}/favorite`,
      {
        method: "POST",
        credentials: "include",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to toggle favorite");
    }

    return response.json();
  },

  async getSubmissionHistory(problemId, userId) {
    const response = await fetch(
      `${API_URL}/api/problems/${problemId}/submissions?userId=${userId}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch submission history");
    }

    return response.json();
  },
};
