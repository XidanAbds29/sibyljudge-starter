// frontend/client/src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth-token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auth-token");
      window.location.replace("/login");
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authApi = {
  signUp: async (email, password, username) => {
    const response = await api.post("/auth/signup", {
      email,
      password,
      username,
    });
    return response.data;
  },

  signIn: async (email, password) => {
    const response = await api.post("/auth/login", {
      email,
      password,
    });
    return response.data;
  },

  signOut: async () => {
    const response = await api.post("/auth/logout");
    localStorage.removeItem("auth-token");
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
};

export default api;
