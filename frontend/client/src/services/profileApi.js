// frontend/client/src/services/profileApi.js
import api from "./api";

export const profileApi = {
  updateProfile: async (profileData) => {
    const response = await api.put("/profile", profileData);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get("/profile");
    return response.data;
  },
};

export default profileApi;
