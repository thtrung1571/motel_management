import { useState, useEffect } from "react";
import { rentalService } from "../services/rentalService";
import { useSnackbar } from "../contexts/SnackbarContext";

export const useRentals = () => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showSnackbar } = useSnackbar();

  const fetchRentals = async () => {
    try {
      setLoading(true);
      const data = await rentalService.getActiveRentals();
      setRentals(data);
      setError(null);
    } catch (err) {
      setError("Không thể tải danh sách thuê phòng");
      showSnackbar("error", "Có lỗi xảy ra khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (id) => {
    try {
      await rentalService.checkout(id);
      showSnackbar("success", "Check-out thành công");
      await fetchRentals();
    } catch (err) {
      showSnackbar("error", "Không thể check-out. Vui lòng thử lại");
    }
  };

  useEffect(() => {
    fetchRentals();
  }, []);

  return {
    rentals,
    loading,
    error,
    handleCheckout,
    refreshRentals: fetchRentals,
  };
};
