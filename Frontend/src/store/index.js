import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import rentalReducer from "./slices/rentalSlice";
import roomReducer from "./slices/roomSlice";
import customerReducer from "./slices/customerSlice";
import settingsReducer from "./slices/settingsSlice";
import drinkReducer from "./slices/drinkSlice";
import dashboardReducer from "./slices/dashboardSlice";
import userReducer from "./slices/userSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    rentals: rentalReducer,
    rooms: roomReducer,
    customers: customerReducer,
    settings: settingsReducer,
    drinks: drinkReducer,
    dashboard: dashboardReducer,
    users: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
