import api from "../api";

export const publicService = {
  lookup: async (query) => {
    const response = await api.get(`/api/public/lookup`, { params: { query } });
    return response.data;
  },
  details: async (id) => {
    const response = await api.get(`/api/public/lookup/${id}`);
    return response.data;
  }
};

