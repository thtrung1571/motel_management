import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api";

export const fetchRooms = createAsyncThunk(
  "rooms/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/rooms");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể tải danh sách phòng",
      );
    }
  },
);

export const addRoom = createAsyncThunk(
  "rooms/add",
  async (roomData, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/rooms", {
        number: roomData.number,
        roomTypeId: roomData.type,
        floor: roomData.floor,
        hasLoveChair: roomData.hasLoveChair || false
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể thêm phòng",
      );
    }
  },
);

export const updateRoom = createAsyncThunk(
  "rooms/update",
  async ({ id, ...roomData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/rooms/${id}`, {
        number: roomData.number,
        roomTypeId: roomData.type,
        floor: roomData.floor,
        status: roomData.status,
        hasLoveChair: roomData.hasLoveChair
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể cập nhật phòng",
      );
    }
  },
);

export const deleteRoom = createAsyncThunk(
  "rooms/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/api/rooms/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể xóa phòng",
      );
    }
  },
);

export const fetchRoomDetails = createAsyncThunk(
  "rooms/fetchRoomDetails",
  async (roomId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/rooms/${roomId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Có lỗi xảy ra");
    }
  },
);

export const checkInRoom = createAsyncThunk(
  "rooms/checkIn",
  async (formData, { dispatch, rejectWithValue }) => {
    try {
      // Validate input
      if (!formData.roomId) {
        throw new Error('Thiếu thông tin phòng');
      }

      // Prepare payload
      const payload = {
        roomId: formData.roomId,
        carNumber: formData.carNumber,
        numberOfGuests: parseInt(formData.numberOfGuests) || 1,
        checkInTime: formData.checkInTime,
        rentType: formData.rentType || "hourly",
        drinks: formData.drinks || [],
        isWalkIn: Boolean(formData.isWalkIn),
        customerId: formData.customerId,
        timeWarning: formData.timeWarning
      };

      const response = await api.post("/api/rentals", payload);

      if (response.data.status === 'success') {
        await dispatch(fetchRooms());
        return response.data;
      } else {
        throw new Error(response.data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error("API Error:", error);
      return rejectWithValue(
        error.response?.data || { 
          status: 'error',
          message: error.message || "Có lỗi xảy ra khi nhận phòng"
        }
      );
    }
  }
);

export const checkoutRoom = createAsyncThunk(
  "rooms/checkout",
  async ({ rentalId, checkoutData }, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.post(`/api/rentals/checkout`, {
        rentalId,
        additionalCharges: checkoutData.additionalCharges || 0,
        payment_method: checkoutData.payment_method || 'cash',
        note: checkoutData.note || ''
      });

      if (response.data.status === 'success') {
        await dispatch(fetchRooms());
        return response.data;
      }
      
      throw new Error(response.data.message || 'Có lỗi xảy ra');
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Có lỗi xảy ra khi trả phòng"
      );
    }
  }
);

export const estimatePrice = createAsyncThunk(
  "rooms/estimatePrice",
  async ({ rentType, roomTypeId }, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/rentals/estimate-price', {
        params: { rentType, roomTypeId }
      });

      if (response.data.status === 'success') {
        return response.data;
      }
      throw new Error(response.data.message || 'Có lỗi xảy ra');
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể tính giá ước tính"
      );
    }
  }
);

const roomSlice = createSlice({
  name: "rooms",
  initialState: {
    rooms: [],
    loading: false,
    error: null,
    priceEstimate: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRooms.fulfilled, (state, action) => {
        state.loading = false;
        state.rooms = action.payload.data;
      })
      .addCase(fetchRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addRoom.fulfilled, (state, action) => {
        state.rooms.push(action.payload.data);
      })
      .addCase(updateRoom.fulfilled, (state, action) => {
        const index = state.rooms.findIndex(
          (room) => room._id === action.payload.data._id,
        );
        if (index !== -1) {
          state.rooms[index] = action.payload.data;
        }
      })
      .addCase(deleteRoom.fulfilled, (state, action) => {
        state.rooms = state.rooms.filter((room) => room._id !== action.payload);
      })
      .addCase(fetchRoomDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoomDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRoom = action.payload;
      })
      .addCase(fetchRoomDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(checkInRoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkInRoom.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(checkInRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(checkoutRoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkoutRoom.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(checkoutRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(estimatePrice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(estimatePrice.fulfilled, (state, action) => {
        state.loading = false;
        state.priceEstimate = action.payload.data;
      })
      .addCase(estimatePrice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.priceEstimate = null;
      });
  },
});

export const { clearError } = roomSlice.actions;
export default roomSlice.reducer;
