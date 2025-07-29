// src/services/submissionService.js
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const submissionService = {
  async submitSolution({ problemId, code, language, contestId = null }) {
    const response = await fetch(`${API_URL}/api/submissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        problemId,
        code,
        language,
        contestId,
      }),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to submit solution");
    }

    return response.json();
  },

  async getSubmission(submissionId) {
    const response = await fetch(`${API_URL}/api/submissions/${submissionId}`, {
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch submission");
    }

    return response.json();
  },

  async getSubmissions({ page = 1, filters = {} }) {
    const queryParams = new URLSearchParams({
      page,
      ...filters,
    });

    const response = await fetch(`${API_URL}/api/submissions?${queryParams}`, {
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch submissions");
    }

    return response.json();
  },

  async getSubmissionResult(submissionId) {
    const response = await fetch(
      `${API_URL}/api/submissions/${submissionId}/result`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch submission result");
    }

    return response.json();
  },

  // For polling submission status
  async checkSubmissionStatus(submissionId) {
    const response = await fetch(
      `${API_URL}/api/submissions/${submissionId}/status`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to check submission status");
    }

    return response.json();
  },

  async getContestSubmissions(contestId, { page = 1, filters = {} }) {
    const queryParams = new URLSearchParams({
      page,
      ...filters,
    });

    const response = await fetch(
      `${API_URL}/api/contests/${contestId}/submissions?${queryParams}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch contest submissions");
    }

    return response.json();
  },
};
