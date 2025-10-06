import api from "../api";

export const roomService = {
  getAllRooms: async () => {
    const response = await api.get("/api/rooms");
    return response.data;
  },

  getRoomById: async (id) => {
    const response = await api.get(`/api/rooms/${id}`);
    return response.data;
  },

  updateRoom: async (id, data) => {
    const response = await api.put(`/api/rooms/${id}`, data);
    return response.data;
  },

  getRoomTypes: async () => {
    const response = await api.get("/api/rooms/types");
    return response.data;
  },
};
