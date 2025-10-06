import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api";

// Thêm helper function
const getAuthHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

// Thunk actions for room types
export const fetchRoomTypes = createAsyncThunk(
  "settings/fetchRoomTypes",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(
        "/api/settings/room-types",
        getAuthHeader(),
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  },
);

export const addRoomType = createAsyncThunk(
  "settings/addRoomType",
  async (roomTypeData, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "/api/settings/room-types",
        roomTypeData,
        getAuthHeader(),
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  },
);

export const updateRoomType = createAsyncThunk(
  "settings/updateRoomType",
  async ({ id, ...roomTypeData }, { rejectWithValue }) => {
    try {
      const response = await api.put(
        `/api/settings/room-types/${id}`,
        roomTypeData,
        getAuthHeader(),
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  },
);

export const deleteRoomType = createAsyncThunk(
  "settings/deleteRoomType",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/api/settings/room-types/${id}`, getAuthHeader());
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  },
);

// Thunk actions for price logic
export const fetchPriceSettings = createAsyncThunk(
  "settings/fetchPriceSettings",
  async () => {
    const response = await api.get(
      "/api/settings/price-logic",
      getAuthHeader(),
    );
    return response.data.data;
  },
);

export const updatePriceSettings = createAsyncThunk(
  "settings/updatePriceSettings",
  async (settings) => {
    const response = await api.put(
      "/api/settings/price-logic",
      settings,
      getAuthHeader(),
    );
    return response.data.data;
  },
);

export const fetchRoomTypesWithPrices = createAsyncThunk(
  "settings/fetchRoomTypesWithPrices",
  async () => {
    const response = await api.get(
      "/api/settings/room-types-prices",
      getAuthHeader(),
    );
    return response.data.data;
  },
);

const settingsSlice = createSlice({
  name: "settings",
  initialState: {
    roomTypes: [],
    roomTypesWithPrices: [],
    priceLogic: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Room Types
      .addCase(fetchRoomTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoomTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.roomTypes = action.payload.data;
      })
      .addCase(fetchRoomTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add Room Type
      .addCase(addRoomType.fulfilled, (state, action) => {
        state.roomTypes.push(action.payload.data);
      })
      // Update Room Type
      .addCase(updateRoomType.fulfilled, (state, action) => {
        const updatedType = action.payload.data;
        const index = state.roomTypes.findIndex(
          (type) => type._id === updatedType._id,
        );
        if (index !== -1) {
          state.roomTypes[index] = updatedType;
        }
      })
      // Delete Room Type
      .addCase(deleteRoomType.fulfilled, (state, action) => {
        state.roomTypes = state.roomTypes.filter(
          (type) => type._id !== action.payload,
        );
      })
      // Fetch price settings
      .addCase(fetchPriceSettings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPriceSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.priceLogic = action.payload;
        state.error = null;
      })
      .addCase(fetchPriceSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Update price settings
      .addCase(updatePriceSettings.pending, (state) => {
        state.loading = true;
      })
      .addCase(updatePriceSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.priceLogic = action.payload;
        state.error = null;
      })
      .addCase(updatePriceSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchRoomTypesWithPrices.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRoomTypesWithPrices.fulfilled, (state, action) => {
        state.loading = false;
        state.roomTypesWithPrices = action.payload;
        state.error = null;
      })
      .addCase(fetchRoomTypesWithPrices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { clearError } = settingsSlice.actions;
export default settingsSlice.reducer;
