import api from "../api";

export const settingsService = {
  getRoomTypes: async () => {
    const response = await api.get("/api/settings/room-types");
    return response.data;
  },

  addRoomType: async (data) => {
    const response = await api.post("/api/settings/room-types", data);
    return response.data;
  },

  updateRoomType: async (id, data) => {
    const response = await api.put(`/api/settings/room-types/${id}`, data);
    return response.data;
  },

  deleteRoomType: async (id) => {
    const response = await api.delete(`/api/settings/room-types/${id}`);
    return response.data;
  },

  getPriceSettings: async () => {
    const response = await api.get("/api/settings/prices");
    return response.data;
  },

  updatePriceSettings: async (data) => {
    const response = await api.put("/api/settings/prices", data);
    return response.data;
  },
};
