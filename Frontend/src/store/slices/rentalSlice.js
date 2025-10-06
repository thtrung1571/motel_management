import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { rentalService } from "../../services/rentalService";

export const fetchActiveRentals = createAsyncThunk(
  "rentals/fetchActive",
  async (_, { rejectWithValue }) => {
    try {
      const response = await rentalService.getActiveRentals();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể tải danh sách thuê phòng",
      );
    }
  },
);

export const fetchRentalHistory = createAsyncThunk(
  "rentals/fetchHistory",
  async (_, { rejectWithValue }) => {
    try {
      const response = await rentalService.getRentalHistory();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể tải lịch sử thuê phòng",
      );
    }
  },
);

export const createRental = createAsyncThunk(
  "rentals/create",
  async (rentalData, { rejectWithValue }) => {
    try {
      const response = await rentalService.createRental(rentalData);
      if (response.status === 'success') {
        return response.data;
      } else {
        throw new Error(response.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể tạo phiếu thuê",
      );
    }
  },
);

export const calculateCheckout = createAsyncThunk(
  "rentals/calculateCheckout",
  async ({
    rentalId, 
    additionalCharges = 0, 
    checkoutTime,
    discount = 0,
    payment = {}
  }, { rejectWithValue }) => {
    try {
      const response = await rentalService.calculateCheckout(
        rentalId, 
        additionalCharges,
        checkoutTime,
        discount,
        payment
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Không thể tính tiền");
    }
  }
);

export const checkoutRental = createAsyncThunk(
  "rentals/checkout",
  async ({rentalId, checkoutData}, { rejectWithValue }) => {
    try {
      console.log('Checkout with data:', {
        rentalId,
        checkoutTime: checkoutData.checkoutTime,
        additionalCharges: checkoutData.additionalCharges,
        discount: checkoutData.discount,
        payment_method: checkoutData.payment_method,
        customerPayment: checkoutData.customerPayment
      });
      
      const response = await rentalService.checkout(rentalId, {
        ...checkoutData,
        checkoutTime: checkoutData.checkoutTime
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Không thể checkout");
    }
  }
);

export const deleteDrink = createAsyncThunk(
  "rentals/deleteDrink",
  async ({rentalId, drinkId}, { rejectWithValue }) => {
    try {
      const response = await rentalService.deleteDrink(rentalId, drinkId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Không thể xóa đồ uống");
    }
  }
);

const rentalSlice = createSlice({
  name: "rentals",
  initialState: {
    activeRentals: [],
    history: [],
    loading: false,
    error: null,
    checkoutData: null
  },
  reducers: {
    clearCheckoutData: (state) => {
      state.checkoutData = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Active Rentals
      .addCase(fetchActiveRentals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveRentals.fulfilled, (state, action) => {
        state.loading = false;
        state.activeRentals = action.payload;
      })
      .addCase(fetchActiveRentals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch History
      .addCase(fetchRentalHistory.fulfilled, (state, action) => {
        state.history = action.payload;
      })
      // Create Rental
      .addCase(createRental.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRental.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.rental) {
          state.activeRentals.push(action.payload.rental);
        }
      })
      .addCase(createRental.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Calculate Checkout
      .addCase(calculateCheckout.fulfilled, (state, action) => {
        state.checkoutData = action.payload;
      })
      // Checkout
      .addCase(checkoutRental.fulfilled, (state, action) => {
        state.activeRentals = state.activeRentals.filter(
          (rental) => rental.id !== action.payload.id
        );
        state.checkoutData = null;
      })
      .addCase(deleteDrink.fulfilled, (state, action) => {
        const rentalIndex = state.activeRentals.findIndex(r => r.id === action.payload.id);
        if (rentalIndex !== -1) {
          state.activeRentals[rentalIndex] = action.payload;
        }
      });
  },
});

export const { clearCheckoutData } = rentalSlice.actions;
export default rentalSlice.reducer;
