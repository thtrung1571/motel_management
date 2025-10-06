import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import theme from "./theme";
import { getCurrentUser } from "./store/slices/authSlice";
import AppRoutes from "./routes";
import 'dayjs/locale/vi';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getCurrentUser());
  }, [dispatch]);

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider 
        dateAdapter={AdapterDayjs}
        adapterLocale="vi"
      >
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <ToastContainer />
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
