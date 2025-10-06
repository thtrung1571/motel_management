import api from "../api";

export const dashboardService = {
  getDashboardData: async () => {
    const response = await api.get("/api/dashboard");
    return response.data;
  },
  getDailyRevenue: async () => {
    const response = await api.get("/api/dashboard/daily-revenue");
    return response.data;
  },
  getCustomerStats: async () => {
    const response = await api.get("/api/dashboard/customer-stats");
    return response.data;
  },
};
