// Lấy token từ localStorage
export const getToken = () => {
  return localStorage.getItem("token");
};

// Lưu token vào localStorage
export const setToken = (token) => {
  localStorage.setItem("token", token);
};

// Xóa token khỏi localStorage
export const removeToken = () => {
  localStorage.removeItem("token");
};

// Kiểm tra xem có token hay không
export const hasToken = () => {
  return !!getToken();
};
