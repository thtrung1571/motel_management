import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { customerService } from "../../services/customerService";
import api from "../../api";

// Cấu hình axios base URL

// Fetch all customers with pagination, search and sort
export const fetchCustomers = createAsyncThunk(
  "customers/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const response = await customerService.getAllCustomers(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể tải danh sách khách hàng",
      );
    }
  },
);

// Get customer by ID
export const getCustomerById = createAsyncThunk(
  "customers/getById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await customerService.getCustomerById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể tải thông tin khách hàng",
      );
    }
  },
);

// Create new customer
export const createCustomer = createAsyncThunk(
  "customers/create",
  async (customerData, { rejectWithValue }) => {
    try {
      const response = await customerService.createCustomer(customerData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể tạo khách hàng mới",
      );
    }
  },
);

// Update customer
export const updateCustomer = createAsyncThunk(
  "customers/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await customerService.updateCustomer(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể cập nhật khách hàng",
      );
    }
  },
);

// Delete customer
export const deleteCustomer = createAsyncThunk(
  "customers/delete",
  async (id, { rejectWithValue }) => {
    try {
      await customerService.deleteCustomer(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể xóa khách hàng",
      );
    }
  },
);

// Import customers
export const importCustomers = createAsyncThunk(
  "customers/import",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await customerService.importCustomers(formData);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể import danh sách khách hàng"
      );
    }
  }
);

export const searchCustomers = createAsyncThunk(
  "customers/search",
  async ({ carNumber }) => {
    try {
      const response = await api.get(
        `/api/customers?search=${carNumber}&limit=5`,
      );
      console.log("API response:", response.data);

      // Chuyển đổi format dữ liệu từ response
      const customers = response.data.customers.map((customer) => ({
        carNumber: customer.carNumber,
        customerName: customer.fullName,
        phoneNumber: customer.phone || "",
        identityCard: customer.cccd,
      }));

      return customers;
    } catch (error) {
      console.error("API error:", error);
      throw error;
    }
  },
);

const customerSlice = createSlice({
  name: "customers",
  initialState: {
    customers: [],
    selectedCustomer: null,
    loading: false,
    error: null,
    total: 0,
    currentPage: 1,
    totalPages: 1,
    importResult: null,
    recentCustomers: [],
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearImportResult: (state) => {
      state.importResult = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch customers
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload.customers;
        state.total = action.payload.total;
        state.currentPage = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get customer by ID
      .addCase(getCustomerById.fulfilled, (state, action) => {
        state.selectedCustomer = action.payload;
      })

      // Create customer
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.customers.unshift(action.payload);
        if (state.total) state.total += 1;
      })

      // Update customer
      .addCase(updateCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.customers.findIndex(
          (c) => c.id === action.payload.id
        );
        if (index !== -1) {
          state.customers[index] = action.payload;
        }
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete customer
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.customers = state.customers.filter(
          (c) => c._id !== action.payload,
        );
        if (state.total) state.total -= 1;
      })

      // Import customers
      .addCase(importCustomers.pending, (state) => {
        state.loading = true;
        state.importResult = null;
        state.error = null;
      })
      .addCase(importCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.importResult = action.payload;
        // Cập nhật danh sách khách hàng nếu cần
        if (action.payload.data?.success > 0) {
          // Có thể dispatch fetchCustomers để làm mới danh sách
        }
      })
      .addCase(importCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.importResult = null;
      })

      // Search customers
      .addCase(searchCustomers.pending, (state) => {
        state.loading = true;
      })
      .addCase(searchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.recentCustomers = action.payload;
      })
      .addCase(searchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { clearError, clearImportResult } = customerSlice.actions;
export default customerSlice.reducer;
