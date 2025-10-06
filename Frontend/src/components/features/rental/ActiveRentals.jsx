import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks/useAppDispatch";
import {
  fetchActiveRentals,
  checkoutRental,
} from "../../../store/slices/rentalSlice";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
} from "@mui/material";
import { formatDateTime, formatPrice } from "../../../utils/formatters";
import { RentalStatus } from "../../../constants/rentalStatus";
import LoadingSpinner from "../../common/LoadingSpinner";
import ErrorAlert from "../../common/ErrorAlert";

const ActiveRentals = () => {
  const dispatch = useAppDispatch();
  const { activeRentals, loading, error } = useAppSelector(
    (state) => state.rentals,
  );

  useEffect(() => {
    dispatch(fetchActiveRentals());
  }, [dispatch]);

  const handleCheckout = async (id) => {
    await dispatch(checkoutRental(id));
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Danh sách đang thuê
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Phòng</TableCell>
              <TableCell>Biển số xe</TableCell>
              <TableCell>Loại thuê</TableCell>
              <TableCell>Giờ vào</TableCell>
              <TableCell>Giá</TableCell>
              <TableCell>Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activeRentals.map((rental) => (
              <RentalRow
                key={rental._id}
                rental={rental}
                onCheckout={handleCheckout}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

const RentalRow = ({ rental, onCheckout }) => (
  <TableRow>
    <TableCell>{rental.roomNumber?.roomNumber}</TableCell>
    <TableCell>{rental.carNumber}</TableCell>
    <TableCell>{rental.rentType}</TableCell>
    <TableCell>{formatDateTime(rental.checkInTime)}</TableCell>
    <TableCell>{formatPrice(rental.price)}</TableCell>
    <TableCell>
      <Button
        variant="contained"
        color="primary"
        onClick={() => onCheckout(rental._id)}
      >
        Check-out
      </Button>
    </TableCell>
  </TableRow>
);

export default ActiveRentals;
