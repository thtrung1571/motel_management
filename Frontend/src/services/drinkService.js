import api from "../api";

const drinkService = {
  // Lấy danh sách đồ uống
  getAllDrinks: async () => {
    const response = await api.get("/api/drinks");
    return response.data;
  },

  // Lấy danh sách đồ uống sắp hết
  getLowStock: async () => {
    const response = await api.get("/api/drinks/low-stock");
    return response.data;
  },

  // Lấy thông tin một đồ uống
  getDrinkById: async (id) => {
    const response = await api.get(`/api/drinks/${id}`);
    return response.data;
  },

  // Tạo đồ uống mới
  createDrink: async (drinkData) => {
    const response = await api.post("/api/drinks", drinkData);
    return response.data;
  },

  // Cập nhật đồ uống
  updateDrink: async (id, drinkData) => {
    const response = await api.put(`/api/drinks/${id}`, drinkData);
    return response.data;
  },

  // Xóa đồ uống
  deleteDrink: async (id) => {
    const response = await api.delete(`/api/drinks/${id}`);
    return response.data;
  },

  // Cập nhật tồn kho
  updateStock: async (id, stockData) => {
    const response = await api.patch(`/api/drinks/${id}/stock`, stockData);
    return response.data;
  },

  // Thêm method mới
  getActiveDrinks: async () => {
    const response = await api.get('/api/drinks', {
      params: {
        status: 'ACTIVE',
        inStock: true
      }
    });
    return response.data;
  },
};
export default drinkService;

