import api from "../api";

export const customerService = {
  getAllCustomers: async (params) => {
    try {
      // Xử lý params trước khi gửi request
      const searchParams = new URLSearchParams();
      
      if (params.page) searchParams.append('page', params.page);
      if (params.limit) searchParams.append('limit', params.limit);
      if (params.search && params.search.trim()) {
        searchParams.append('search', params.search.trim());
      }
      
      const queryString = searchParams.toString();
      const response = await api.get(`/api/customers${queryString ? `?${queryString}` : ''}`);
      return response;
    } catch (error) {
      console.error('Error in getAllCustomers:', error);
      throw error;
    }
  },

  getCustomerById: async (id) => {
    const response = await api.get(`/api/customers/${id}`);
    return response;
  },

  createCustomer: async (data) => {
    const response = await api.post("/api/customers", data);
    return response;
  },

  updateCustomer: async (id, data) => {
    try {
      const response = await api.put(`/api/customers/${id}`, data);
      console.log('Update response:', response);
      return response;
    } catch (error) {
      console.error("Error updating customer:", error.response || error);
      throw error;
    }
  },

  deleteCustomer: async (id) => {
    const response = await api.delete(`/api/customers/${id}`);
    return response;
  },

  importCustomers: async (formData) => {
    try {
      const response = await api.post("/api/customers/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error in importCustomers:', error);
      throw error;
    }
  },
};
