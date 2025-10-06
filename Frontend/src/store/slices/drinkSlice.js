import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import api from "../../api";
import drinkService from "../../services/drinkService";

// Thunk actions
export const fetchDrinks = createAsyncThunk(
  "drinks/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/drinks", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể tải danh sách đồ uống",
      );
    }
  },
);

export const createDrink = createAsyncThunk(
  "drinks/create",
  async (drinkData, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/drinks", drinkData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể tạo đồ uống",
      );
    }
  },
);

export const updateDrink = createAsyncThunk(
  "drinks/update",
  async ({ id, ...drinkData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/drinks/${id}`, drinkData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể cập nhật đồ uống",
      );
    }
  },
);

export const deleteDrink = createAsyncThunk(
  "drinks/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/api/drinks/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể xóa đồ uống",
      );
    }
  },
);

export const fetchActiveDrinks = createAsyncThunk(
  "drinks/fetchActive",
  async (_, { rejectWithValue }) => {
    try {
      const response = await drinkService.getActiveDrinks();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Không thể lấy danh sách đồ uống");
    }
  }
);

// Thêm selector được memoized
export const selectActiveDrinks = createSelector(
  state => state.drinks.drinks?.data,
  drinks => drinks || []
);

const drinkSlice = createSlice({
  name: "drinks",
  initialState: {
    drinks: [],
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
      // Fetch Drinks
      .addCase(fetchDrinks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDrinks.fulfilled, (state, action) => {
        state.loading = false;
        state.drinks = action.payload.data;
      })
      .addCase(fetchDrinks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Drink
      .addCase(createDrink.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDrink.fulfilled, (state, action) => {
        state.loading = false;
        state.drinks.push(action.payload.data);
      })
      .addCase(createDrink.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Drink
      .addCase(updateDrink.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDrink.fulfilled, (state, action) => {
        state.loading = false;
        const updatedDrink = action.payload.data;
        const index = state.drinks.findIndex(
          (drink) => drink._id === updatedDrink._id,
        );
        if (index !== -1) {
          state.drinks[index] = updatedDrink;
        }
      })
      .addCase(updateDrink.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Drink
      .addCase(deleteDrink.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDrink.fulfilled, (state, action) => {
        state.loading = false;
        state.drinks = state.drinks.filter(
          (drink) => drink._id !== action.payload,
        );
      })
      .addCase(deleteDrink.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Thêm reducers cho fetchActiveDrinks
      .addCase(fetchActiveDrinks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveDrinks.fulfilled, (state, action) => {
        state.loading = false;
        state.drinks = action.payload;
      })
      .addCase(fetchActiveDrinks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = drinkSlice.actions;
export default drinkSlice.reducer;
