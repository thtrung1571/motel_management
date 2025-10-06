import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, Typography } from "@mui/material";
import DataTable from "../../common/DataTable/DataTable";
import { fetchRentalHistory } from "../../../store/slices/rentalSlice";
import { formatDateTime, formatPrice } from "../../../utils/formatters";
import LoadingSpinner from "../../common/LoadingSpinner/LoadingSpinner";
import ErrorAlert from "../../common/ErrorAlert/ErrorAlert";

const RentalHistory = () => {
  const dispatch = useDispatch();
  const { history, loading, error } = useSelector((state) => state.rentals);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    dispatch(fetchRentalHistory());
  }, [dispatch]);

  const columns = [
    {
      id: "roomNumber",
      label: "Phòng",
      render: (row) => row.roomNumber?.roomNumber,
    },
    { id: "carNumber", label: "Biển số xe" },
    { id: "rentType", label: "Loại thuê" },
    {
      id: "checkInTime",
      label: "Giờ vào",
      render: (row) => formatDateTime(row.checkInTime),
    },
    {
      id: "checkOutTime",
      label: "Giờ ra",
      render: (row) => formatDateTime(row.checkOutTime),
    },
    {
      id: "totalPrice",
      label: "Tổng tiền",
      render: (row) => formatPrice(row.totalPrice),
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Lịch sử thuê phòng
      </Typography>

      <DataTable
        columns={columns}
        data={history}
        page={page}
        rowsPerPage={rowsPerPage}
        totalRows={history.length}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
      />
    </Box>
  );
};

export default RentalHistory;
