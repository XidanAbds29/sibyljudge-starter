import { apiClient } from "./apiClient";

export const authApi = {
  signUp: async (credentials) => {
    const response = await apiClient.post("/auth/signup", credentials);
    return response.data;
  },

  signIn: async (credentials) => {
    const response = await apiClient.post("/auth/signin", credentials);
    return response.data;
  },

  signOut: async () => {
    const response = await apiClient.post("/auth/signout");
    return response.data;
  },

  getSession: async () => {
    const response = await apiClient.get("/auth/session");
    return response.data;
  },

  getUser: async () => {
    const response = await apiClient.get("/auth/user");
    return response.data;
  },

  resetPassword: async (email) => {
    const response = await apiClient.post("/auth/reset-password", { email });
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await apiClient.put("/profile", profileData);
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get("/profile");
    return response.data;
  },
};
