import api from "../api";

export const authService = {
  login: async (credentials) => {
    const response = await api.post("/api/auth/login", credentials);
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post("/api/auth/register", userData);
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await api.put("/api/auth/profile", userData);
    return response.data;
  },

  changePassword: async (passwords) => {
    const response = await api.put("/api/auth/change-password", passwords);
    return response.data;
  },
};
