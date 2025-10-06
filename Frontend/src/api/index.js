import axios from "axios";
import { TOKEN_KEY } from "../constants/index";

const api = axios.create({
  //baseURL: "http://localhost:5000/",
  baseURL: "https://saovangmotel.site/",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Tách logic xử lý lỗi ra riêng
const handleError = (error) => {
  if (error.response?.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = '/login';
  }
  return Promise.reject(error);
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Kiểm tra nếu đang ở trang login thì không cần refresh token
    if (window.location.pathname === '/login') {
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    
    // Thêm flag để tránh vòng lặp vô hạn
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(baseURL + "/api/auth/refresh", { refreshToken });
        localStorage.setItem("token", response.data.token);
        
        originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
        return api(originalRequest);
      } catch (err) {
        // Xóa token và chuyển hướng về trang login
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
