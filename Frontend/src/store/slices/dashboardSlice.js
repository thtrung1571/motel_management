import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { dashboardService } from "../../services/dashboardService";

export const fetchDashboardData = createAsyncThunk(
  "dashboard/fetchData",
  async (_, { rejectWithValue }) => {
    try {
      const [dashboardData, dailyRevenue, customerStats] = await Promise.all([
        dashboardService.getDashboardData(),
        dashboardService.getDailyRevenue(),
        dashboardService.getCustomerStats(),
      ]);
      return {
        ...dashboardData.data,
        dailyRevenue: dailyRevenue.data,
        ...customerStats.data,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể tải dữ liệu dashboard",
      );
    }
  },
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: {
    data: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default dashboardSlice.reducer;
